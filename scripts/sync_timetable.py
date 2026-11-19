#!/usr/bin/env python3
"""
MBBS Resource Library - Timetable College Pre-Sync & Sanitizer
Extracts ONLY college-related events from the private iCal feed,
filters out all personal events, expands recurrences, and generates
a sanitized, privacy-safe JSON cache for static GitHub Pages fallback.
"""

import os
import sys
import re
import json
import datetime
import urllib.request

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_DIR)
import scripts.timetable_proxy as tp

OUTPUT_JSON = os.path.join(REPO_DIR, "assets", "data", "timetable_college.json")

EXCLUDE_KEYWORDS = [
    "birthday", "anniversary", "marriage", "sleep", "routine", "dinner", "reading", "exercise",
    "water plants", "journaling", "brush", "freshen up", "meditation", "planning", "eat something",
    "study session", "power hour", "revise", "revision", "canva", "times prime", "vehicle registration",
    "shopping", "demon slayer", "spider", "animal", "stree 2", "crowdsource", "aptitude test",
    "botany |", "chemistry |", "physics |", "zoology |", "aiats", "cst", "nbts", "pst",
    "project phoenix", "pre-neet", "test darwin", "test :", "test-", "bus trip"
]

COLLEGE_SUBJECTS = [
    "anatomy", "physiology", "biochemistry", "aetcom", "ece", "psm", "community medicine",
    "forensic", "pathology", "pharmacology", "microbiology", "sports & eca", "college"
]

def is_college_event(summary, description="", location=""):
    s_low = summary.lower().strip()
    d_low = description.lower()
    l_low = location.lower()
    full_text = f"{s_low} {d_low} {l_low}"

    for exc in EXCLUDE_KEYWORDS:
        if exc in s_low:
            return False

    for subj in COLLEGE_SUBJECTS:
        if subj in s_low or subj in l_low or (f"department of {subj}" in d_low):
            return True

    if ("medical college" in full_text or "jagdalpur" in full_text or
        "dissection" in full_text or "doap" in full_text or "sgt" in full_text or
        "histology" in full_text or "sdl" in full_text):
        return True

    return False

def parse_iso_date(dt_str):
    is_utc = dt_str.endswith("Z")
    clean = dt_str.rstrip("Z")
    if "T" in clean:
        dt = datetime.datetime.strptime(clean, "%Y%m%dT%H%M%S")
    else:
        dt = datetime.datetime.strptime(clean, "%Y%m%d")
    if is_utc:
        dt = dt + datetime.timedelta(hours=5, minutes=30)
    return dt

def detect_subject(summary, desc, loc):
    s = f"{summary} {desc} {loc}".lower()
    if "anatomy" in s or "dissection" in s or "histology" in s or "an " in s:
        return "anatomy"
    if "physiology" in s or "py " in s or "ecg" in s:
        return "physiology"
    if "biochemistry" in s or "bc " in s or "urine sample" in s or "lipid" in s or "protein" in s:
        return "biochemistry"
    if "aetcom" in s:
        return "aetcom"
    if "ece" in s:
        return "ece"
    if "sports" in s or "eca" in s:
        return "sports"
    if "holiday" in s or "dussehra" in s or "diwali" in s:
        return "holiday"
    if "lunch" in s:
        return "break"
    return "general"

def detect_session_type(summary, desc):
    s = f"{summary} {desc}".lower()
    if "(l)" in s or "lecture" in s or "(l):" in s or "l:" in s:
        return "lecture"
    if "(dh)" in s or "dissection" in s:
        return "dissection"
    if "practical" in s:
        return "practical"
    if "(sgt)" in s or "doap" in s or "tutorial" in s:
        return "sgt_doap"
    if "sdl" in s:
        return "sdl"
    if "pct" in s or "class test" in s or "test" in s or "exam" in s:
        return "test_exam"
    if "aetcom" in s:
        return "aetcom"
    if "ece" in s:
        return "ece"
    if "holiday" in s:
        return "holiday"
    if "lunch" in s:
        return "break"
    return "other"

def extract_faculty_and_competency(title, desc, subject):
    text = f"{title}\n{desc}"
    text = text.replace("\\n", "\n").replace("\\,", ",").replace("\\;", ";")

    faculty = ""
    competency = ""

    # 1. Search for Faculty: <name>
    m = re.search(r"Faculty\s*:\s*([^\n\r|;]+)", text, re.IGNORECASE)
    if m:
        fac = m.group(1).strip()
        fac = re.split(r"department:|special class:|practical preparation:", fac, flags=re.IGNORECASE)[0].strip()
        faculty = fac.rstrip(") ").lstrip("( ")

    # 2. Search for Competency: <code...>
    comp_m = re.search(r"Competency\s*:\s*([^\n\r|;]+)", text, re.IGNORECASE)
    if comp_m:
        competency = comp_m.group(1).strip()
    elif title:
        comp_title = re.search(r"\b(AN|BC|PY)\s*\d+(\.\d+)?(-\d+(\.\d+)?)?\b", title, re.IGNORECASE)
        if comp_title:
            competency = comp_title.group(0).upper()

    # 3. Check teacher initials in title
    if not faculty and title:
        initials_map = {
            "BNK": "Dr. Bakhshilal Kumar (BNK)",
            "HBS": "Dr. Hemlata B. Sheik (HBS)",
            "SD": "Dr. Shreya Dhurandher (SD)",
            "R": "Dr. Ritika (R)",
            "AR": "Dr. Anantika Rai (AR)",
            "FKK": "Dr. Firoj Kumar Khare (FKK)",
            "FK": "Dr. Firoj Kumar Khare (FK)"
        }
        for init, name in initials_map.items():
            if re.search(r"\b" + init + r"\b", title):
                faculty = name
                break

    # 4. Department fallback if no specific teacher name
    if not faculty:
        if subject == "anatomy":
            faculty = "Anatomy Faculty"
        elif subject == "physiology":
            faculty = "Physiology Faculty"
        elif subject == "biochemistry":
            faculty = "Biochemistry Faculty"
        elif subject == "aetcom":
            faculty = "AETCOM Faculty"
        elif subject == "ece":
            faculty = "ECE Faculty"
        elif subject == "break":
            faculty = "Lunch Break"
        elif subject == "holiday":
            faculty = "College Holiday"
        else:
            faculty = "Department Faculty"

    return faculty, competency

def sync_timetable():
    print("📥 Fetching iCal feed via proxy resolver...")
    raw_data, url_type, _ = tp.fetch_feed(force_refresh=True)
    raw_text = raw_data.decode("utf-8", errors="ignore")

    unfolded = re.sub(r"\r?\n[ \t]", "", raw_text)
    events_raw = unfolded.split("BEGIN:VEVENT")

    base_recurring = []
    overrides = {}
    exdates = {}
    standalone = []

    for ev in events_raw[1:]:
        uid_m = re.search(r"UID:(.*)", ev)
        sum_m = re.search(r"SUMMARY:(.*)", ev)
        desc_m = re.search(r"DESCRIPTION:(.*)", ev)
        loc_m = re.search(r"LOCATION:(.*)", ev)
        start_m = re.search(r"DTSTART(?:;[^:]+)?:([0-9TZ]+)", ev)
        end_m = re.search(r"DTEND(?:;[^:]+)?:([0-9TZ]+)", ev)
        rrule_m = re.search(r"RRULE:(.*)", ev)
        recid_m = re.search(r"RECURRENCE-ID(?:;[^:]+)?:([0-9TZ]+)", ev)
        status_m = re.search(r"STATUS:(.*)", ev)

        if not uid_m or not sum_m or not start_m:
            continue

        uid = uid_m.group(1).strip()
        summary = sum_m.group(1).strip()
        desc = desc_m.group(1).strip() if desc_m else ""
        loc = loc_m.group(1).strip() if loc_m else ""
        status = status_m.group(1).strip() if status_m else "CONFIRMED"

        if status.upper() == "CANCELLED" or not is_college_event(summary, desc, loc):
            continue

        start_dt = parse_iso_date(start_m.group(1).strip())
        end_dt = parse_iso_date(end_m.group(1).strip()) if end_m else (start_dt + datetime.timedelta(hours=1))

        # Check exdate
        for ex_match in re.finditer(r"EXDATE(?:;[^:]+)?:([0-9TZ,]+)", ev):
            for single_ex in ex_match.group(1).split(","):
                ex_dt = parse_iso_date(single_ex.strip())
                exdates.setdefault(uid, set()).add(ex_dt.strftime("%Y%m%d"))

        sub = detect_subject(summary, desc, loc)
        fac, comp = extract_faculty_and_competency(summary, desc, sub)

        event_obj = {
            "uid": uid,
            "title": summary,
            "description": desc,
            "location": loc,
            "faculty": fac,
            "competency": comp,
            "start": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "end": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "start_iso": start_dt.isoformat(),
            "end_iso": end_dt.isoformat(),
            "subject": sub,
            "session_type": detect_session_type(summary, desc),
            "raw_rrule": rrule_m.group(1).strip() if rrule_m else None
        }

        if recid_m:
            rec_dt = parse_iso_date(recid_m.group(1).strip())
            rec_key = rec_dt.strftime("%Y%m%d_%H%M")
            overrides[(uid, rec_key)] = event_obj
        elif rrule_m:
            base_recurring.append((event_obj, start_dt, end_dt))
        else:
            standalone.append((event_obj, start_dt, end_dt))

    # Expand window: 30 days back to 90 days forward
    now = datetime.datetime.now()
    start_window = now - datetime.timedelta(days=30)
    end_window = now + datetime.timedelta(days=90)

    expanded_events = []
    for ev_tuple in standalone:
        ev, s_dt, _ = ev_tuple
        if start_window <= s_dt < end_window:
            expanded_events.append(ev)

    for rev_tuple in base_recurring:
        rev, s_dt, e_dt = rev_tuple
        rule_str = rev["raw_rrule"]
        freq = "WEEKLY" if "FREQ=WEEKLY" in rule_str else "DAILY"
        cur = s_dt
        duration = e_dt - s_dt

        while cur < end_window:
            if cur >= start_window:
                d_key = cur.strftime("%Y%m%d")
                dt_key = cur.strftime("%Y%m%d_%H%M")
                if rev["uid"] in exdates and d_key in exdates[rev["uid"]]:
                    pass
                elif (rev["uid"], dt_key) in overrides:
                    expanded_events.append(overrides[(rev["uid"], dt_key)])
                else:
                    inst = dict(rev)
                    inst["start"] = cur.strftime("%Y-%m-%d %H:%M:%S")
                    inst["end"] = (cur + duration).strftime("%Y-%m-%d %H:%M:%S")
                    inst["start_iso"] = cur.isoformat()
                    inst["end_iso"] = (cur + duration).isoformat()
                    expanded_events.append(inst)

            if freq == "WEEKLY":
                cur += datetime.timedelta(days=7)
            else:
                cur += datetime.timedelta(days=1)

    # Sort chronologically
    expanded_events.sort(key=lambda x: x["start"])

    # Deduplicate overlapping generic sessions
    cleaned_events = []
    by_time = {}
    for ev in expanded_events:
        # Ignore full-day 9AM-5PM College umbrella block from card list (it is kept as metadata)
        if ev["title"] == "🏫 College" and "09:00:00" in ev["start"] and "17:00:00" in ev["end"]:
            continue
        key = (ev["start"][:10], ev["start"][11:16], ev["subject"])
        if key in by_time:
            existing = by_time[key]
            # If current has specific topic (e.g. colon or hyphen) and existing is generic (e.g. Anatomy (L))
            if (":" in ev["title"] or "–" in ev["title"]) and not (":" in existing["title"]):
                by_time[key] = ev
        else:
            by_time[key] = ev

    cleaned_events = list(by_time.values())
    cleaned_events.sort(key=lambda x: x["start"])

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    payload = {
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "timezone": "Asia/Kolkata",
        "total_college_sessions": len(cleaned_events),
        "events": cleaned_events
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {OUTPUT_JSON} with {len(cleaned_events)} verified college sessions.")
    return len(cleaned_events)

if __name__ == "__main__":
    sync_timetable()
