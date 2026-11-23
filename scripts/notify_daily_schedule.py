#!/usr/bin/env python3
"""
MBBS Resource Library - Daily Morning Timetable Notification Dispatcher
Sends a push notification to all subscribers every morning at 8:00 AM IST
summarizing the day's college schedule, classes, practicals, exams, or holidays.

Usage:
  python3 scripts/notify_daily_schedule.py             # Send today's schedule
  python3 scripts/notify_daily_schedule.py --dry-run   # Test without sending API request
  python3 scripts/notify_daily_schedule.py --force     # Force re-send even if already sent today
  python3 scripts/notify_daily_schedule.py --date YYYY-MM-DD
"""

import os
import sys
import json
import re
import argparse
import datetime
import urllib.request
import urllib.error

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_DIR)

TIMETABLE_JSON = os.path.join(REPO_DIR, "assets", "data", "timetable_college.json")
SENT_LOG = os.path.join(REPO_DIR, "assets", "data", ".last_daily_notification")

APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe"
DEFAULT_URL = "https://harshkumarsaw.github.io/mbbs-library/timetable.html"
ICON_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/logo-256x256.png"

def get_api_key():
    """Resolves OneSignal REST API Key from env or local secret files."""
    key = os.environ.get("ONESIGNAL_API_KEY", "").strip()
    if key:
        return key
    for path in [os.path.join(REPO_DIR, ".onesignal_key"), os.path.expanduser("~/.onesignal_key")]:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                if content:
                    return content
            except Exception:
                pass
    return None

def get_current_ist_datetime():
    """Returns current datetime in Indian Standard Time (IST, UTC+5:30)."""
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    return datetime.datetime.now(ist)

def format_12h_time(t_str):
    """Converts '09:00' to '9 AM' and '14:30' to '2:30 PM'."""
    try:
        hour = int(t_str[:2])
        minute = t_str[3:5]
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        return f"{display_hour} {am_pm}" if minute == "00" else f"{display_hour}:{minute} {am_pm}"
    except Exception:
        return t_str

def format_session_short_name(event):
    """Generates a concise, readable subject/topic label for notification text."""
    stype = event.get("session_type", "")
    subj = event.get("subject", "").title()
    raw_title = event.get("title", "").replace("\\,", ",").replace("\\;", ";").strip()

    if stype == "dissection":
        return "Dissection"
    if stype == "practical":
        return f"{subj} Practical".replace("Biochemistry", "Biochem").replace("Physiology", "Physio")
    if stype == "sports":
        return "Sports & ECA"

    # Extract topic or clean department prefix
    if ":" in raw_title:
        prefix = raw_title.split(":")[0].strip()
        # If prefix is generic e.g. 'Biochemistry (L)' or 'Anatomy'
        name = prefix
    else:
        name = raw_title

    name = name.replace("Biochemistry", "Biochem").replace("Physiology", "Physio")
    # Remove extra tags like (L) or (DH)
    name = re.sub(r"\s*\([A-Z0-9\s]+\)", "", name).strip()
    return name or subj or "Class"

def generate_daily_schedule_content(target_date_str, events):
    """
    Constructs the notification title and message for a specific date.
    target_date_str: 'YYYY-MM-DD'
    """
    dt = datetime.datetime.strptime(target_date_str, "%Y-%m-%d")
    day_name = dt.strftime("%A")
    date_display = dt.strftime("%-d %b")

    day_events = [e for e in events if e.get("start", "").startswith(target_date_str)]
    # Sort chronologically by start time
    day_events.sort(key=lambda x: x.get("start", ""))

    # 1. Check for College Holiday
    holidays = [
        e for e in day_events
        if e.get("subject") == "holiday" or e.get("session_type") == "holiday" or "holiday" in e.get("title", "").lower()
    ]
    if holidays:
        h_name = holidays[0].get("title", "Holiday").replace("\\,", ",").replace("Holiday:", "").strip()
        title = f"Today's Schedule: Holiday 🏖️ • {day_name}"
        msg = f"College is closed today for {h_name}. Enjoy your holiday!"
        return title, msg

    # Filter out Lunch / Breaks
    classes = [
        e for e in day_events
        if e.get("subject") != "break" and "lunch" not in e.get("title", "").lower()
    ]

    # 2. Check for Sunday / Zero classes
    if not classes:
        if dt.weekday() == 6:
            title = f"Today's Schedule: Sunday ☀️ • {date_display}"
            msg = "No college classes today. Have a restful and energizing Sunday!"
        else:
            title = f"Today's Schedule: {day_name} • {date_display} 🩺"
            msg = "No college classes scheduled for today. Tap to check your timetable."
        return title, msg

    # 3. Check for Exams / Tests
    exams = [
        e for e in classes
        if e.get("session_type") == "test_exam" or any(k in e.get("title", "").lower() for k in ["pct", "exam", "test", "terminal"])
    ]
    exam_prefix = "📝 Exam Today! " if exams else ""

    # 4. Build timeline items
    items = []
    for c in classes:
        t_start = c.get("start", "")[11:16]
        time_lbl = format_12h_time(t_start)
        short_name = format_session_short_name(c)
        items.append(f"{time_lbl}: {short_name}")

    title = f"Today's Schedule: {day_name} • {date_display} 🩺"

    # Keep message length optimal for push notification display
    timeline_str = " • ".join(items)
    if len(timeline_str) > 140:
        # If too long, abbreviate trailing items
        compact_items = items[:4]
        remaining = len(items) - 4
        timeline_str = " • ".join(compact_items) + f" (+{remaining} more)"

    msg = f"{exam_prefix}{timeline_str}. Tap to view full timetable."
    return title, msg

def get_active_player_ids(api_key):
    """Fetches active OneSignal subscriber player IDs, filtering out invalid devices."""
    try:
        req = urllib.request.Request(
            f"https://api.onesignal.com/players?app_id={APP_ID}&limit=300",
            headers={"Authorization": f"Basic {api_key}"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            players = data.get("players", [])
            active_ids = [p["id"] for p in players if not p.get("invalid_identifier")]
            return active_ids
    except Exception as e:
        print(f"⚠️ Warning querying OneSignal players: {e}")
        return []

def send_daily_push(title, message, dry_run=False, target_date_str=None):
    """Dispatches the daily schedule push notification via OneSignal REST API."""
    api_key = get_api_key()

    print("═" * 70)
    print("🌅 HARSH'S LIBRARY: DAILY MORNING SCHEDULE NOTIFICATION (8:00 AM)")
    print("═" * 70)
    print(f"📢 Title:   {title}")
    print(f"📝 Message: {message}")
    print(f"🌐 URL:     {DEFAULT_URL}")
    print(f"🖼️  Icon:    {ICON_URL}")
    print("═" * 70)

    if not api_key:
        print("⚠️ OneSignal API key not found (.onesignal_key or ONESIGNAL_API_KEY). Skipping push notification.")
        return False

    active_ids = get_active_player_ids(api_key)

    payload = {
        "app_id": APP_ID,
        "priority": 10,
        "headings": {"en": title},
        "contents": {"en": message},
        "url": DEFAULT_URL,
        "chrome_web_icon": ICON_URL,
        "firefox_icon": ICON_URL
    }

    if active_ids:
        payload["include_player_ids"] = active_ids
        target_desc = f"{len(active_ids)} active device(s)"
    else:
        payload["included_segments"] = ["Total Subscriptions", "Subscribed Users"]
        target_desc = "all subscribers (Total Subscriptions)"

    if dry_run:
        print(f"🧪 [DRY RUN] Daily schedule notification validated. Target: {target_desc}.")
        print("Payload:", json.dumps(payload, indent=2))
        return True

    print(f"🚀 Dispatching daily schedule push to {target_desc}...")
    try:
        req = urllib.request.Request(
            "https://api.onesignal.com/notifications",
            headers={
                "Authorization": f"Basic {api_key}",
                "Content-Type": "application/json; charset=utf-8"
            },
            data=json.dumps(payload).encode("utf-8")
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            notif_id = res.get("id")
            recipients = res.get("recipients", len(active_ids))
            print(f"✅ Daily notification dispatched successfully! (ID: {notif_id}, Recipients: {recipients})")

            # Record send date to prevent duplicates
            if target_date_str:
                try:
                    with open(SENT_LOG, "w", encoding="utf-8") as f:
                        f.write(f"{target_date_str}\n")
                except Exception:
                    pass
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        print(f"❌ OneSignal API HTTP Error ({e.code}): {err_msg}")
        return False
    except Exception as e:
        print(f"❌ Failed to dispatch push notification: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Send 8:00 AM daily schedule push notification")
    parser.add_argument("--dry-run", action="store_true", help="Format and print notification without making network request")
    parser.add_argument("--force", action="store_true", help="Force send even if already sent today")
    parser.add_argument("--date", help="Custom target date in YYYY-MM-DD format (defaults to current date in IST)")
    args = parser.parse_args()

    # Determine target date in IST
    ist_now = get_current_ist_datetime()
    target_date_str = args.date or ist_now.strftime("%Y-%m-%d")

    # Check if already sent today
    if not args.force and not args.dry_run and os.path.isfile(SENT_LOG):
        try:
            with open(SENT_LOG, "r", encoding="utf-8") as f:
                last_sent = f.read().strip()
            if last_sent == target_date_str:
                print(f"ℹ️ Today's schedule notification was already sent on {target_date_str}. Use --force to re-send.")
                sys.exit(0)
        except Exception:
            pass

    # Load timetable events
    if not os.path.isfile(TIMETABLE_JSON):
        print(f"❌ Error: Timetable cache file not found at {TIMETABLE_JSON}")
        sys.exit(1)

    with open(TIMETABLE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    events = data.get("events", [])

    title, message = generate_daily_schedule_content(target_date_str, events)
    success = send_daily_push(title, message, dry_run=args.dry_run, target_date_str=target_date_str)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
