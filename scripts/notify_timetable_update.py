#!/usr/bin/env python3
"""
MBBS Resource Library - Timetable Update Push Notification Dispatcher
Broadcasts instant OneSignal push notifications to all subscribers whenever
the college academic schedule (Google Calendar timetable) is updated.

Usage:
  python3 scripts/notify_timetable_update.py             # Automatic diff-driven notify
  python3 scripts/notify_timetable_update.py --dry-run   # Test without sending API request
  python3 scripts/notify_timetable_update.py --force     # Force dispatch fallback notification
  python3 scripts/notify_timetable_update.py --title "..." --message "..."
"""

import os
import sys
import json
import re
import argparse
import datetime
import urllib.request
import urllib.error
import subprocess

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_DIR)

DIFF_FILE = os.path.join(REPO_DIR, "assets", "data", ".timetable_diff.json")
TIMETABLE_JSON = os.path.join(REPO_DIR, "assets", "data", "timetable_college.json")

APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe"
DEFAULT_URL = "https://harshkumarsaw.github.io/mbbs-library/timetable.html"
ICON_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/logo-256x256.png"
BADGE_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/favicon-48x48.png"
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

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

def format_event_date(dt_str):
    """Formats event datetime in IST into friendly display string (e.g., 'Today (9:00 AM)', 'Wed, 25 Nov')."""
    try:
        dt = datetime.datetime.strptime(dt_str[:19], "%Y-%m-%d %H:%M:%S")
        today = datetime.datetime.now(IST).date()
        ev_date = dt.date()
        if ev_date == today:
            return f"Today ({dt.strftime('%-I:%M %p')})"
        elif ev_date == today + datetime.timedelta(days=1):
            return f"Tomorrow ({dt.strftime('%-I:%M %p')})"
        elif ev_date == today + datetime.timedelta(days=2):
            return f"Day after tomorrow ({dt.strftime('%a')})"
        else:
            return dt.strftime("%a, %-d %b")
    except Exception:
        return dt_str[:10]

def clean_event_title(title):
    """Cleans iCal escaping and extra whitespace from titles."""
    if not title:
        return ""
    clean = title.replace("\\,", ",").replace("\\;", ";").replace("\\n", " ").strip()
    return clean

def is_exam_session(event):
    """Identifies test/exam sessions."""
    if event.get("session_type") == "test_exam":
        return True
    title = event.get("title", "").lower()
    return bool(re.search(r"\b(pct|exam|terminal|assessment|class\s*test|ospe|osce)\b", title, re.I))

def is_holiday_session(event):
    """Identifies holiday or vacation sessions."""
    if event.get("session_type") == "holiday" or event.get("subject") == "holiday":
        return True
    title = event.get("title", "").lower()
    return bool(re.search(r"\b(holiday|vacation|closed|jayanti|diwali|dussehra)\b", title, re.I))

def analyze_events_diff(old_events, new_events):
    """
    Compares previous and updated timetable sessions to generate
    meaningful push notification titles and messages.
    """
    old_by_key = {(e.get("uid"), e.get("start")): e for e in old_events if e.get("start")}
    new_by_key = {(e.get("uid"), e.get("start")): e for e in new_events if e.get("start")}

    added = [e for k, e in new_by_key.items() if k not in old_by_key]
    removed = [e for k, e in old_by_key.items() if k not in new_by_key]

    modified = []
    for k in new_by_key:
        if k in old_by_key:
            old_e = old_by_key[k]
            new_e = new_by_key[k]
            # Check title, faculty, end time, session type differences
            if (old_e.get("title") != new_e.get("title") or
                old_e.get("faculty") != new_e.get("faculty") or
                old_e.get("end") != new_e.get("end") or
                old_e.get("session_type") != new_e.get("session_type")):
                modified.append({"old": old_e, "new": new_e})

    # Filter for relevant upcoming or current sessions (from today IST onwards)
    cutoff = (datetime.datetime.now(IST) - datetime.timedelta(hours=14)).strftime("%Y-%m-%d %H:%M:%S")
    rel_added = [e for e in added if e.get("start", "") >= cutoff]
    rel_modified = [m["new"] for m in modified if m["new"].get("start", "") >= cutoff]
    rel_removed = [e for e in removed if e.get("start", "") >= cutoff]

    # Prioritize:
    # 1. Upcoming Exams / Tests
    exam_candidates = [e for e in rel_added + rel_modified if is_exam_session(e)]
    if exam_candidates:
        cand = exam_candidates[0]
        title = "Academic Exam Schedule Updated"
        date_str = format_event_date(cand.get("start", ""))
        msg = f"Assessment Notice: {clean_event_title(cand.get('title'))} scheduled for {date_str}."
        return title, msg, {"type": "exam", "event": cand, "added": len(added), "modified": len(modified), "removed": len(removed)}

    # 2. Upcoming Holidays
    holiday_candidates = [e for e in rel_added + rel_modified if is_holiday_session(e)]
    if holiday_candidates:
        cand = holiday_candidates[0]
        title = "College Holiday Notice"
        date_str = format_event_date(cand.get("start", ""))
        msg = f"{clean_event_title(cand.get('title'))} on {date_str}."
        return title, msg, {"type": "holiday", "event": cand, "added": len(added), "modified": len(modified), "removed": len(removed)}

    # 3. Single Specific Class Update
    if len(rel_added) == 1 and not rel_modified:
        cand = rel_added[0]
        title = "Academic Timetable Updated"
        date_str = format_event_date(cand.get("start", ""))
        msg = f"Added: {clean_event_title(cand.get('title'))} on {date_str}."
        return title, msg, {"type": "single_class_add", "event": cand, "added": 1, "modified": 0, "removed": len(removed)}

    if len(rel_modified) == 1 and not rel_added:
        cand = rel_modified[0]
        title = "Academic Timetable Updated"
        date_str = format_event_date(cand.get("start", ""))
        msg = f"Updated: {clean_event_title(cand.get('title'))} on {date_str}."
        return title, msg, {"type": "single_class_mod", "event": cand, "added": 0, "modified": 1, "removed": len(removed)}

    # 4. Multiple Relevant Updates
    total_rel = len(rel_added) + len(rel_modified) + len(rel_removed)
    if total_rel > 0:
        first_ev = sorted(rel_added + rel_modified + rel_removed, key=lambda x: x.get("start", ""))[0]
        date_str = format_event_date(first_ev.get("start", ""))
        title = "Academic Timetable Updated"
        msg = f"{total_rel} schedule change(s) published starting {date_str}."
        return title, msg, {"type": "multiple", "total_relevant": total_rel, "added": len(added), "modified": len(modified), "removed": len(removed)}

    # 5. General Fallback
    title = "Academic Timetable Updated"
    msg = "The college academic timetable has been synchronized with the latest calendar updates."
    return title, msg, {"type": "general", "added": len(added), "modified": len(modified), "removed": len(removed)}

def extract_diff_from_git():
    """Extracts old and new events by comparing Git HEAD against working tree or HEAD~1."""
    try:
        # Check staged or uncommitted diff first
        res_current = subprocess.run(["git", "show", "HEAD:assets/data/timetable_college.json"], cwd=REPO_DIR, capture_output=True, text=True)
        res_prev = subprocess.run(["git", "show", "HEAD~1:assets/data/timetable_college.json"], cwd=REPO_DIR, capture_output=True, text=True)

        if res_current.returncode == 0 and res_prev.returncode == 0:
            curr_data = json.loads(res_current.stdout).get("events", [])
            prev_data = json.loads(res_prev.stdout).get("events", [])
            return analyze_events_diff(prev_data, curr_data)
    except Exception as e:
        print(f"ℹ️ Git diff inspection note: {e}")

    return None

def resolve_notification_content(custom_title=None, custom_message=None):
    """Determines title and message from diff file, git, or defaults."""
    if custom_title and custom_message:
        return custom_title, custom_message

    # 1. Check .timetable_diff.json file
    if os.path.isfile(DIFF_FILE):
        try:
            with open(DIFF_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            t = custom_title or data.get("title")
            m = custom_message or data.get("message")
            if t and m:
                return t, m
        except Exception as e:
            print(f"⚠️ Warning reading diff file: {e}")

    # 2. Try git diff
    git_diff_result = extract_diff_from_git()
    if git_diff_result:
        t, m, _ = git_diff_result
        return custom_title or t, custom_message or m

    # 3. Default fallback
    t = custom_title or "Harsh's Library: Academic Schedule Updated 📅"
    m = custom_message or "The college timetable has been synchronized with latest Google Calendar changes. Tap to view your latest schedule."
    return t, m

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

def send_timetable_notification(title, message, target_url=None, dry_run=False):
    """Sends the push notification to all subscribers via OneSignal."""
    api_key = get_api_key()
    url = target_url or DEFAULT_URL

    print("═" * 70)
    print("🔔 HARSH'S LIBRARY: TIMETABLE UPDATE PUSH DISPATCHER")
    print("═" * 70)
    print(f"📢 Title:   {title}")
    print(f"📝 Message: {message}")
    print(f"🌐 URL:     {url}")
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
        "url": url,
        "chrome_web_icon": ICON_URL,
        "chrome_web_badge": BADGE_URL,
        "firefox_icon": ICON_URL,
        "android_accent_color": "1E3A8A",
        "web_buttons": [
            {
                "id": "open-timetable",
                "text": "View Timetable",
                "url": url,
            }
        ],
    }

    if active_ids:
        payload["include_player_ids"] = active_ids
        target_desc = f"{len(active_ids)} active device(s)"
    else:
        payload["included_segments"] = ["Total Subscriptions", "Subscribed Users"]
        target_desc = "all subscribers (Total Subscriptions segment)"

    if dry_run:
        print(f"🧪 [DRY RUN] Notification validated. Target: {target_desc}.")
        print("Payload:", json.dumps(payload, indent=2))
        return True

    print(f"🚀 Dispatching push notification to {target_desc}...")
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
            print(f"✅ Timetable notification sent successfully! (ID: {notif_id}, Recipients: {recipients})")
            
            # Clean up temporary diff file
            if os.path.isfile(DIFF_FILE):
                try:
                    os.remove(DIFF_FILE)
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
    parser = argparse.ArgumentParser(description="Send push notification for academic schedule updates")
    parser.add_argument("--dry-run", action="store_true", help="Format and print notification without making network request")
    parser.add_argument("--force", action="store_true", help="Force send even if no diff file is detected")
    parser.add_argument("--title", help="Custom notification title override")
    parser.add_argument("--message", help="Custom notification message override")
    parser.add_argument("--url", default=DEFAULT_URL, help="Custom target URL override")
    args = parser.parse_args()

    # If neither force nor diff file exists nor dry-run, check if git diff has changes in timetable
    has_diff_file = os.path.isfile(DIFF_FILE)
    if not has_diff_file and not args.force and not args.dry_run:
        # Check if git shows recent timetable commit
        res = subprocess.run(["git", "diff", "--name-only", "HEAD~1", "HEAD"], cwd=REPO_DIR, capture_output=True, text=True)
        if "timetable_college.json" not in res.stdout:
            print("ℹ️ No pending timetable diff detected. Skipping push notification.")
            sys.exit(0)

    title, message = resolve_notification_content(args.title, args.message)
    success = send_timetable_notification(title, message, target_url=args.url, dry_run=args.dry_run)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
