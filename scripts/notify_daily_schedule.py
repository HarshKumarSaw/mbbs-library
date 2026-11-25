#!/usr/bin/env python3
"""
MBBS Resource Library - Daily Timetable Notification Dispatcher
Schedules and dispatches professional push notifications at exact IST times:
- Morning at 08:00:00 IST: Today's academic timetable summary
- Evening at 17:00:00 IST: Tomorrow's academic timetable summary

Uses OneSignal native `send_after` scheduling so notifications arrive at the
exact second in Indian Standard Time (UTC+05:30), immune to GitHub Actions cron
queue delays, and automatically refreshes queued notifications if the calendar
updates before delivery.

Usage:
  python3 scripts/notify_daily_schedule.py --mode upcoming     # Ensure next 48h IST slots are queued (recommended)
  python3 scripts/notify_daily_schedule.py --mode morning      # Schedule/send today's 8:00 AM IST alert
  python3 scripts/notify_daily_schedule.py --mode evening      # Schedule/send today's 5:00 PM IST alert
  python3 scripts/notify_daily_schedule.py --mode auto         # Pick next or current slot based on IST time
  python3 scripts/notify_daily_schedule.py --dry-run           # Preview without calling OneSignal POST/DELETE
  python3 scripts/notify_daily_schedule.py --immediate --force # Dispatch immediately for testing
  python3 scripts/notify_daily_schedule.py --date YYYY-MM-DD   # Preview/send for a specific schedule date
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
SENT_MORNING_LOG = os.path.join(REPO_DIR, "assets", "data", ".last_morning_notification")
SENT_EVENING_LOG = os.path.join(REPO_DIR, "assets", "data", ".last_evening_notification")

APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe"
DEFAULT_URL = "https://harshkumarsaw.github.io/mbbs-library/timetable.html"
ICON_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/logo-256x256.png"
BADGE_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/favicon-48x48.png"

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
MORNING_HOUR = 8
MORNING_MINUTE = 0
EVENING_HOUR = 17
EVENING_MINUTE = 0
PAST_GRACE_SECONDS = 300  # Do not send stale schedule alerts >5 min after scheduled IST slot


def get_api_key():
    """Resolves OneSignal REST API Key from environment or local secret files."""
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
    """Returns current timezone-aware datetime in Indian Standard Time (IST, UTC+05:30)."""
    return datetime.datetime.now(IST)


def clean_text(raw):
    """Unescapes iCal formatting and normalizes whitespace."""
    if not raw:
        return ""
    text = raw.replace("\\,", ",").replace("\\;", ";").replace("\\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def format_aligned_time(t_str):
    """Converts '09:00' -> '09:00 AM' and '14:30' -> '02:30 PM' for crisp alignment."""
    try:
        hour = int(t_str[:2])
        minute = int(t_str[3:5])
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour % 12
        if display_hour == 0:
            display_hour = 12
        return f"{display_hour:02d}:{minute:02d} {am_pm}"
    except Exception:
        return t_str


def format_compact_time(t_str):
    """Converts '09:00' -> '9:00 AM' and '17:00' -> '5:00 PM' for prose summaries."""
    try:
        hour = int(t_str[:2])
        minute = int(t_str[3:5])
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour % 12
        if display_hour == 0:
            display_hour = 12
        return f"{display_hour}:{minute:02d} {am_pm}"
    except Exception:
        return t_str


def truncate_clean(text, max_len=48):
    """Truncates text cleanly at a word boundary without trailing stop words."""
    if len(text) <= max_len:
        return text
    cut = text[: max_len - 1].rsplit(" ", 1)[0].rstrip(" -–,:")
    # Avoid awkward dangling prepositions/conjunctions like "Abnormal Constituents of…"
    while cut and cut.rsplit(" ", 1)[-1].lower() in {"of", "for", "and", "&", "in", "to", "the", "a", "an", "with", "on"}:
        if " " not in cut:
            break
        cut = cut.rsplit(" ", 1)[0].rstrip(" -–,:")
    if len(cut) < max_len // 2:
        cut = text[: max_len - 1].rstrip()
    return f"{cut}…"


def is_non_academic_noise(event):
    """Filters out breaks, lunch, and any stray personal/travel entries."""
    title_low = clean_text(event.get("title", "")).lower()
    subj = (event.get("subject") or "").lower()
    stype = (event.get("session_type") or "").lower()
    if subj == "break" or stype == "break" or "lunch" in title_low or "recess" in title_low:
        return True
    if subj == "general" and "travel" in title_low:
        return True
    return False


def is_exam_event(event):
    """Identifies actual exams, PCTs, and class assessments (excluding lab diagnostic tests)."""
    if event.get("session_type") == "test_exam":
        return True
    title_low = clean_text(event.get("title", "")).lower()
    if re.search(r"\b(function test|test for|tests for)\b", title_low):
        return False
    return bool(re.search(r"\b(pct|class\s*test|terminal\s*exam|assessment|ospe|osce)\b", title_low))


def format_session_line_label(event):
    """
    Formats an academic session into a clean, professional label:
    e.g., 'Biochemistry — Vitamins B7 & B9', 'Anatomy — Histo (Grp A) / DH (Grp B)'
    """
    stype = (event.get("session_type") or "").lower()
    subj_raw = (event.get("subject") or "").strip().lower()
    subj_map = {
        "anatomy": "Anatomy",
        "physiology": "Physiology",
        "biochemistry": "Biochemistry",
        "community": "Community Medicine",
        "sports": "Sports & ECA",
        "general": "General",
    }
    subj = subj_map.get(subj_raw, subj_raw.title() if subj_raw else "Academic")

    title = clean_text(event.get("title", ""))
    # Strip trailing competency/faculty codes like "(AN 65.1-65.2)" or "(BC 6.2)" or "(AN 13.3 HBS)"
    title = re.sub(r"\s*\((?:AN|PY|BC|CM)\s*[0-9.,\-\sA-Za-z]*\)\s*$", "", title).strip()
    # Normalize group labels for readability in mobile notifications
    title = re.sub(r"Histo\s+Gr(?:ou)?p\s*A\s*\([^)]+\)\s*/\s*DH\s+Gr(?:ou)?p\s*B\s*\([^)]+\)", "Histo (Grp A) / DH (Grp B)", title, flags=re.I)
    title = re.sub(r"Histo\s+Gr(?:ou)?p\s*B\s*\([^)]+\)\s*/\s*DH\s+Gr(?:ou)?p\s*A\s*\([^)]+\)", "Histo (Grp B) / DH (Grp A)", title, flags=re.I)

    if stype == "sports":
        return "Sports & ECA"

    if ":" in title:
        left, right = title.split(":", 1)
        left_clean = re.sub(r"\s*\((?:L|DH)\)\s*", "", left, flags=re.I).strip()
        right_clean = right.strip()

        # Standardize common left prefixes
        if left_clean.lower() in ("anatomy", "physiology", "biochemistry", "community medicine"):
            left_clean = subj_map.get(left_clean.lower(), left_clean)
        elif left_clean.lower() == "sdl":
            return f"{subj} — SDL"
        elif left_clean.lower() == "doap":
            return f"{subj} DOAP — {truncate_clean(right_clean, 30)}"

        if not right_clean or right_clean.lower() == left_clean.lower():
            return truncate_clean(left_clean, 44)

        if right_clean.lower() in ("sdl", "aetcom", "ece", "dissection hall (dh)"):
            right_clean = "Dissection Hall" if "dissection" in right_clean.lower() else right_clean
            return f"{left_clean} — {right_clean}"

        # Keep concise topic length so the full notification fits cleanly
        max_topic = max(30, 58 - len(left_clean) - 3)
        return f"{left_clean} — {truncate_clean(right_clean, max_topic)}"

    # Titles without ":"
    if re.fullmatch(r"(anatomy|physiology|biochemistry)\s*\(L\)", title, flags=re.I):
        return f"{subj} — Lecture"
    if "dissection" in title.lower():
        if "group a" in title.lower():
            return "Anatomy — Dissection (Group A)"
        if "group b" in title.lower():
            return "Anatomy — Dissection (Group B)"
        return "Anatomy — Dissection Hall"
    if "histology practical" in title.lower():
        return truncate_clean(title.replace("Histology Practical", "Anatomy — Histology"), 44)
    if re.search(r"\bsgt\s*/\s*tutorial\s*/\s*practical\b", title, flags=re.I):
        return f"{subj} — SGT / Practical"
    if re.search(r"\(practical\)", title, flags=re.I):
        return f"{subj} — Practical"
    if re.search(r"\(sdl\)", title, flags=re.I):
        return f"{subj} — SDL"
    if "aetcom" in title.lower():
        return f"AETCOM — {subj}" if subj != "Anatomy" else "AETCOM — Interdepartmental"
    if title.lower().startswith("ece "):
        return f"ECE — {subj}" if subj != "Anatomy" else "ECE — Interdepartmental"

    return truncate_clean(title or subj, 44)


def generate_daily_schedule_content(target_date_str, events, is_tomorrow=False):
    """
    Constructs a polished, professional notification title and structured message
    for the target date ('YYYY-MM-DD').
    """
    dt = datetime.datetime.strptime(target_date_str, "%Y-%m-%d")
    day_name = dt.strftime("%A")
    day_short = dt.strftime("%a")
    date_short = dt.strftime("%-d %b")

    day_events = [e for e in events if e.get("start", "").startswith(target_date_str)]
    day_events.sort(key=lambda x: x.get("start", ""))

    # 1. College Holiday
    holidays = [
        e for e in day_events
        if e.get("subject") == "holiday"
        or e.get("session_type") == "holiday"
        or "holiday" in clean_text(e.get("title", "")).lower()
    ]
    if holidays:
        raw_hol = clean_text(holidays[0].get("title", "College Holiday"))
        h_name = re.sub(r"^(?:holiday\s*:\s*|local\s+holiday\s*[–-]\s*)", "", raw_hol, flags=re.I).strip() or "a scheduled holiday"
        if is_tomorrow:
            title = f"Tomorrow: College Holiday • {day_short}, {date_short}"
            msg = f"Academic sessions remain closed tomorrow ({day_name}, {date_short}) on account of {h_name}."
        else:
            title = f"College Holiday Notice • {day_short}, {date_short}"
            msg = f"Academic sessions are closed today ({day_name}, {date_short}) on account of {h_name}."
        return title, msg

    # 2. Filter academic classes
    classes = [e for e in day_events if not is_non_academic_noise(e)]

    # 3. Sunday / Zero Classes
    if not classes:
        if is_tomorrow:
            title = f"Tomorrow's Academic Timetable • {day_short}, {date_short}"
            if dt.weekday() == 6:
                msg = f"No academic sessions are scheduled for tomorrow (Sunday, {date_short})."
            else:
                msg = f"No academic sessions are scheduled for tomorrow ({day_name}, {date_short})."
        else:
            title = f"Today's Academic Timetable • {day_short}, {date_short}"
            if dt.weekday() == 6:
                msg = f"No academic sessions are scheduled for today (Sunday, {date_short})."
            else:
                msg = f"No academic sessions are scheduled for today ({day_name}, {date_short})."
        return title, msg

    # 4. Exams / Assessments
    exams = [e for e in classes if is_exam_event(e)]
    first_start = format_compact_time(classes[0].get("start", "")[11:16])
    last_end = format_compact_time(classes[-1].get("end", "")[11:16] or classes[-1].get("start", "")[11:16])
    count_word = "session" if len(classes) == 1 else "sessions"

    if exams:
        exam_time = format_compact_time(exams[0].get("start", "")[11:16])
        exam_label = format_session_line_label(exams[0])
        if is_tomorrow:
            title = f"Tomorrow's Exam & Schedule • {day_short}, {date_short}"
            header_line = f"Assessment Tomorrow: {exam_label} at {exam_time}"
        else:
            title = f"Exam & Schedule Alert • {day_short}, {date_short}"
            header_line = f"Assessment Today: {exam_label} at {exam_time}"
    else:
        if is_tomorrow:
            title = f"Tomorrow's Academic Timetable • {day_short}, {date_short}"
            header_line = f"{len(classes)} {count_word} tomorrow ({first_start} – {last_end})"
        else:
            title = f"Today's Academic Timetable • {day_short}, {date_short}"
            header_line = f"{len(classes)} {count_word} today ({first_start} – {last_end})"

    # 5. Structured multi-line chronological schedule
    max_lines = 5
    lines = [header_line]
    for c in classes[:max_lines]:
        t_lbl = format_aligned_time(c.get("start", "")[11:16])
        label = format_session_line_label(c)
        lines.append(f"{t_lbl}  •  {label}")

    if len(classes) > max_lines:
        extra = len(classes) - max_lines
        lines.append(f"+ {extra} more session{'s' if extra > 1 else ''} in full timetable")

    msg = "\n".join(lines)
    return title, msg


def get_active_player_ids(api_key):
    """Fetches active OneSignal subscriber player IDs as fallback for immediate sends."""
    try:
        req = urllib.request.Request(
            f"https://api.onesignal.com/players?app_id={APP_ID}&limit=300",
            headers={"Authorization": f"Basic {api_key}"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            players = data.get("players", [])
            return [p["id"] for p in players if not p.get("invalid_identifier")]
    except Exception as e:
        print(f"⚠️ Warning querying OneSignal players: {e}")
        return []


def fetch_recent_notifications(api_key, limit=50):
    """Fetches recent/scheduled OneSignal notifications to prevent duplicates and sync updates."""
    try:
        req = urllib.request.Request(
            f"https://api.onesignal.com/notifications?app_id={APP_ID}&limit={limit}",
            headers={"Authorization": f"Basic {api_key}"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8")).get("notifications", [])
    except Exception as e:
        print(f"⚠️ Warning querying OneSignal notifications: {e}")
        return []


def cancel_notification(api_key, notif_id):
    """Cancels an outdated scheduled OneSignal notification."""
    req = urllib.request.Request(
        f"https://api.onesignal.com/notifications/{notif_id}?app_id={APP_ID}",
        headers={"Authorization": f"Basic {api_key}"},
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def find_existing_slot_notifications(notifications, slot_name, slot_unix_ts):
    """
    Finds matching pending or completed OneSignal notifications for a given IST slot.
    Returns (pending_matches, completed_matches).
    """
    pending = []
    completed = []
    for n in notifications:
        if n.get("canceled"):
            continue
        n_name = n.get("name") or ""
        n_send_after = n.get("send_after")
        name_matches = (n_name == slot_name)
        time_matches = isinstance(n_send_after, (int, float)) and abs(n_send_after - slot_unix_ts) <= 90
        if not (name_matches or time_matches):
            continue
        if n.get("completed_at"):
            completed.append(n)
        else:
            pending.append(n)
    return pending, completed


def build_payload(title, message, mode, target_date_str, slot_name, send_after_dt=None, api_key=None):
    """Builds the OneSignal notification payload with professional metadata and exact IST timing."""
    ttl = 43200 if mode == "evening" else 36000
    payload = {
        "app_id": APP_ID,
        "name": slot_name,
        "priority": 10,
        "ttl": ttl,
        "headings": {"en": title},
        "contents": {"en": message},
        "url": DEFAULT_URL,
        "chrome_web_icon": ICON_URL,
        "chrome_web_badge": BADGE_URL,
        "firefox_icon": ICON_URL,
        "android_accent_color": "1E3A8A",
        "web_push_topic": slot_name,
        "web_buttons": [
            {
                "id": "open-timetable",
                "text": "View Timetable",
                "url": DEFAULT_URL,
            }
        ],
        "data": {
            "type": "daily_timetable",
            "mode": mode,
            "schedule_date": target_date_str,
        },
    }

    if send_after_dt is not None:
        # Format explicitly in IST (+0530) so OneSignal delivers at exact 08:00:00 / 17:00:00 IST
        payload["send_after"] = send_after_dt.strftime("%Y-%m-%d %H:%M:%S GMT+0530")
        # Use dynamic segment evaluation at send time so new subscribers are included
        payload["included_segments"] = ["Total Subscriptions"]
    else:
        active_ids = get_active_player_ids(api_key) if api_key else []
        if active_ids:
            payload["include_player_ids"] = active_ids
        else:
            payload["included_segments"] = ["Total Subscriptions"]

    return payload


def dispatch_payload(api_key, payload):
    """Posts a notification payload to OneSignal REST API."""
    req = urllib.request.Request(
        "https://api.onesignal.com/notifications",
        headers={
            "Authorization": f"Basic {api_key}",
            "Content-Type": "application/json; charset=utf-8",
        },
        data=json.dumps(payload).encode("utf-8"),
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.loads(resp.read().decode("utf-8"))


def process_slot(events, mode, slot_date_str, target_date_str, slot_dt, ist_now, api_key, recent_notifs, dry_run=False, force=False, immediate=False):
    """Processes one morning (8 AM IST) or evening (5 PM IST) notification slot."""
    slot_name = f"mbbs-timetable-{mode}-{slot_date_str}"
    is_tomorrow = (mode == "evening")
    title, message = generate_daily_schedule_content(target_date_str, events, is_tomorrow=is_tomorrow)

    banner = (
        f"🌆 EVENING TIMETABLE SLOT (17:00:00 IST on {slot_date_str} -> Schedule for {target_date_str})"
        if is_tomorrow
        else f"🌅 MORNING TIMETABLE SLOT (08:00:00 IST on {slot_date_str} -> Schedule for {target_date_str})"
    )
    print("═" * 74)
    print(banner)
    print("═" * 74)
    print(f"📢 Title:   {title}")
    print("📝 Message:")
    for line in message.splitlines():
        print(f"   {line}")
    print(f"🕒 Target:  {slot_dt.strftime('%Y-%m-%d %H:%M:%S IST (%z)')}")
    print("═" * 74)

    delta_sec = (slot_dt - ist_now).total_seconds()
    send_after_dt = None

    if immediate:
        send_after_dt = None
        print("⚡ Immediate mode enabled: dispatching right now.")
    elif delta_sec > 30:
        send_after_dt = slot_dt
        print(f"⏰ Scheduling via OneSignal send_after for exact IST time: {slot_dt.strftime('%Y-%m-%d %H:%M:%S IST')}")
    elif delta_sec >= -PAST_GRACE_SECONDS:
        send_after_dt = None
        print("⚡ Within exact IST dispatch window: sending immediately.")
    else:
        if not force:
            mins_late = int(abs(delta_sec) // 60)
            print(f"⏭️ Skipping past slot ({mins_late} min past {slot_dt.strftime('%H:%M IST')}). Use --immediate --force to override.")
            return True
        send_after_dt = None
        print("⚠️ Slot is in the past, proceeding because --force was specified.")

    if dry_run:
        payload = build_payload(title, message, mode, target_date_str, slot_name, send_after_dt=send_after_dt)
        print("🧪 [DRY RUN] Validated payload:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return True

    if not api_key:
        print("⚠️ OneSignal API key not found (.onesignal_key or ONESIGNAL_API_KEY). Skipping.")
        return False

    slot_unix = int(slot_dt.timestamp())
    pending, completed = find_existing_slot_notifications(recent_notifs, slot_name, slot_unix)

    if completed and not force:
        print(f"ℹ️ Slot '{slot_name}' was already delivered (ID: {completed[0].get('id')}). Skipping duplicate.")
        return True

    # Inspect already-queued notifications for this exact slot
    if pending:
        existing = pending[0]
        existing_title = (existing.get("headings") or {}).get("en")
        existing_msg = (existing.get("contents") or {}).get("en")
        existing_url = existing.get("url")
        existing_ts = existing.get("send_after")
        time_ok = isinstance(existing_ts, (int, float)) and abs(existing_ts - slot_unix) <= 5

        if existing_title == title and existing_msg == message and existing_url == DEFAULT_URL and time_ok and not force:
            print(f"✅ Already queued in OneSignal with identical up-to-date schedule (ID: {existing.get('id')}).")
            # Cancel any stray extra duplicates if more than one existed
            for extra in pending[1:]:
                try:
                    cancel_notification(api_key, extra.get("id"))
                    print(f"🧹 Canceled duplicate queued notification {extra.get('id')}.")
                except Exception:
                    pass
            return True

        # Content changed (calendar updated!) or time misaligned -> replace queued notification
        for old in pending:
            old_id = old.get("id")
            try:
                cancel_notification(api_key, old_id)
                print(f"🔄 Replaced outdated queued notification {old_id} (timetable/format updated).")
            except Exception as e:
                print(f"⚠️ Could not cancel outdated notification {old_id}: {e}")

    payload = build_payload(title, message, mode, target_date_str, slot_name, send_after_dt=send_after_dt, api_key=api_key)
    try:
        res = dispatch_payload(api_key, payload)
        notif_id = res.get("id")
        recipients = res.get("recipients")
        if res.get("errors"):
            print(f"❌ OneSignal API returned errors: {res.get('errors')}")
            return False
        status_verb = "Scheduled" if send_after_dt else "Dispatched"
        print(f"✅ {status_verb} successfully! (ID: {notif_id}, Recipients: {recipients})")
        return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        print(f"❌ OneSignal API HTTP Error ({e.code}): {err_msg}")
        return False
    except Exception as e:
        print(f"❌ Failed to dispatch notification: {e}")
        return False


def collect_upcoming_slots(ist_now, days_ahead=2):
    """Collects all future 08:00 IST and 17:00 IST slots within the next `days_ahead` days."""
    slots = []
    base_date = ist_now.date()
    for day_offset in range(days_ahead + 1):
        slot_date = base_date + datetime.timedelta(days=day_offset)
        slot_date_str = slot_date.strftime("%Y-%m-%d")

        morning_dt = datetime.datetime(slot_date.year, slot_date.month, slot_date.day, MORNING_HOUR, MORNING_MINUTE, 0, tzinfo=IST)
        if morning_dt > ist_now - datetime.timedelta(seconds=PAST_GRACE_SECONDS):
            slots.append(("morning", slot_date_str, slot_date_str, morning_dt))

        evening_dt = datetime.datetime(slot_date.year, slot_date.month, slot_date.day, EVENING_HOUR, EVENING_MINUTE, 0, tzinfo=IST)
        if evening_dt > ist_now - datetime.timedelta(seconds=PAST_GRACE_SECONDS):
            tomorrow_str = (slot_date + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            slots.append(("evening", slot_date_str, tomorrow_str, evening_dt))

    # Keep only slots within the next `days_ahead * 24` hours (so we stay crisp & timely)
    cutoff = ist_now + datetime.timedelta(hours=days_ahead * 24)
    return [s for s in slots if s[3] <= cutoff]


def main():
    parser = argparse.ArgumentParser(description="Schedule/send daily timetable push notifications at exact 8:00 AM & 5:00 PM IST")
    parser.add_argument(
        "--mode",
        choices=["upcoming", "morning", "evening", "auto"],
        default="upcoming",
        help="upcoming = queue all upcoming 8 AM & 5 PM IST slots (default); morning/evening = single slot; auto = next/current slot",
    )
    parser.add_argument("--tomorrow", action="store_true", help="Shortcut for --mode evening")
    parser.add_argument("--days", type=int, default=2, help="Lookahead days for --mode upcoming (default: 2)")
    parser.add_argument("--dry-run", action="store_true", help="Preview formatted notifications without making POST/DELETE calls")
    parser.add_argument("--force", action="store_true", help="Force re-send/re-schedule even if already sent or past slot")
    parser.add_argument("--immediate", action="store_true", help="Send immediately instead of scheduling via send_after")
    parser.add_argument("--date", help="Custom target schedule date in YYYY-MM-DD format")
    args = parser.parse_args()

    if not os.path.isfile(TIMETABLE_JSON):
        print(f"❌ Error: Timetable cache file not found at {TIMETABLE_JSON}")
        sys.exit(1)

    with open(TIMETABLE_JSON, "r", encoding="utf-8") as f:
        events = json.load(f).get("events", [])

    ist_now = get_current_ist_datetime()
    api_key = get_api_key()
    recent_notifs = [] if args.dry_run or not api_key else fetch_recent_notifications(api_key, limit=50)

    mode = "evening" if args.tomorrow else args.mode

    if mode == "upcoming" and not args.date:
        slots = collect_upcoming_slots(ist_now, days_ahead=args.days)
        if not slots:
            print("ℹ️ No upcoming slots in window.")
            sys.exit(0)
        all_ok = True
        for s_mode, slot_date_str, target_date_str, slot_dt in slots:
            ok = process_slot(
                events,
                s_mode,
                slot_date_str,
                target_date_str,
                slot_dt,
                ist_now,
                api_key,
                recent_notifs,
                dry_run=args.dry_run,
                force=args.force,
                immediate=args.immediate,
            )
            all_ok = all_ok and ok
        sys.exit(0 if all_ok else 1)

    if mode == "auto":
        mode = "evening" if ist_now.hour >= 12 else "morning"

    if args.date:
        target_date_str = args.date
        target_dt = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        if mode == "evening":
            slot_date = target_dt - datetime.timedelta(days=1)
            slot_dt = datetime.datetime(slot_date.year, slot_date.month, slot_date.day, EVENING_HOUR, EVENING_MINUTE, 0, tzinfo=IST)
            slot_date_str = slot_date.strftime("%Y-%m-%d")
        else:
            slot_date_str = target_date_str
            slot_dt = datetime.datetime(target_dt.year, target_dt.month, target_dt.day, MORNING_HOUR, MORNING_MINUTE, 0, tzinfo=IST)
    else:
        today = ist_now.date()
        if mode == "evening":
            slot_date_str = today.strftime("%Y-%m-%d")
            target_date_str = (today + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            slot_dt = datetime.datetime(today.year, today.month, today.day, EVENING_HOUR, EVENING_MINUTE, 0, tzinfo=IST)
        else:
            slot_date_str = today.strftime("%Y-%m-%d")
            target_date_str = slot_date_str
            slot_dt = datetime.datetime(today.year, today.month, today.day, MORNING_HOUR, MORNING_MINUTE, 0, tzinfo=IST)

    ok = process_slot(
        events,
        mode,
        slot_date_str,
        target_date_str,
        slot_dt,
        ist_now,
        api_key,
        recent_notifs,
        dry_run=args.dry_run,
        force=args.force,
        immediate=args.immediate,
    )
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
