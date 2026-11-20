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
    # Habits & routines
    "birthday", "anniversary", "marriage", "sleep", "routine", "dinner", "reading", "exercise",
    "water plants", "journaling", "brush", "freshen up", "meditation", "meditate", "planning", "eat something",
    "study session", "power hour", "revise", "revision", "canva", "times prime", "vehicle registration",
    "shopping", "groceries", "haircut", "workout", "gym", "make bed", "listen articles", "drop school",
    "growth 365", "study psychology", "study time",
    # Entertainment & movies
    "demon slayer", "spider", "animal (a)", "animal", "stree 2", "shaitan", "movie", "netflix", "youtube", "cinema",
    # Personal finance / misc
    "crowdsource", "aptitude test", "contrarian investing", "harsh और",
    # Old NEET prep / Coaching keywords
    "coaching", "🧑🏻‍🏫 coaching",
    "botany |", "chemistry |", "physics |", "zoology |",
    "aiats", "cst", "nbts", "pst", "fts", "ft-", "project phoenix", "pre-neet", "pre neet", "test darwin", "test :", "test-", "mock", "neet form",
    "bus trip", "train trip", "flight"
]

COLLEGE_SUBJECTS = [
    "anatomy", "physiology", "biochemistry", "aetcom", "ece", "psm", "community medicine",
    "forensic", "pathology", "pharmacology", "microbiology", "sports & eca", "college"
]

def is_college_event(summary, description="", location="", start_dt=None, end_dt=None):
    s_low = summary.lower().strip()
    d_low = description.lower()
    l_low = location.lower()
    full_text = f"{s_low} {d_low} {l_low}"

    # 1. Personal exclusion check
    for exc in EXCLUDE_KEYWORDS:
        if exc in s_low:
            return False

    # 2. Skip broad 8h umbrella block
    if summary in ["🏫 College", "College"]:
        if start_dt and end_dt:
            duration = (end_dt - start_dt).total_seconds()
            if duration >= 21600 or (start_dt.hour <= 9 and end_dt.hour >= 17):
                return False
        elif "college" == s_low:
            return False

    # 3. Explicit college/holiday keyword check (also covers holidays on any day)
    for subj in ["anatomy", "physiology", "biochemistry", "pathology", "pharmacology", "microbiology",
                 "community medicine", "psm", "forensic", "aetcom", "ece", "sports & eca", "holiday",
                 "medical college", "dissection", "doap", "sgt", "histology", "sdl", "recess", "lunch"]:
        if subj in full_text:
            return True

    # 4. Mon-Sat 9:00 AM - 5:00 PM college timing check (future-proof inclusion)
    if start_dt and start_dt.weekday() < 6:
        # College timing: starts between 08:30 and 16:59
        if 8 <= start_dt.hour < 17:
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

def is_actual_exam(title, desc=""):
    t = (title or "").strip()
    d = (desc or "").strip()
    lower_t = t.lower()
    full_text = f"{t} {d}".lower()

    # Exclude routine patient diagnostics and biochemical practical tests:
    if re.search(r"\b(function test|test for|tests for|benedict|molisch|heat coagulation|examination of|physical examination|clinical examination|microscopic examination)\b", lower_t, re.I):
        return False

    # Positive matches for student tests/exams
    # PCT (Part Completion Test)
    if re.search(r"\b(pct|part completion test)\b", lower_t, re.I):
        return True
    # Class Test
    if re.search(r"\bclass\s*test\b", lower_t, re.I):
        return True
    # Internal Assessment / Term Exams / OSPE / OSCE
    if re.search(r"\b(internal assessment|term exam|terminal exam|semester exam|preliminary exam|send-up exam|ospe|osce|spotting exam|theory exam|practical exam)\b", lower_t, re.I):
        return True

    return False

def detect_subject(summary, desc="", loc=""):
    t = (summary or "").strip()
    d = (desc or "").strip()
    l = (loc or "").strip()
    title_low = t.lower()
    full_text = f"{t} {d} {l}".lower()

    # 1. Break / Lunch
    if any(k in title_low for k in ["lunch", "break", "recess"]):
        return "break"

    # 2. Holiday
    if any(k in title_low for k in ["holiday", "vacation", "dussehra", "diwali", "closed"]):
        return "holiday"

    # 3. Sports & ECA
    if "sports" in title_low or "eca" in title_low:
        return "sports"

    # 4. Community Medicine
    if "community medicine" in title_low or re.search(r"\b(psm|cm\s*\d)\b", full_text):
        return "community"

    # 5. Core Departments by Title or Competency Code
    # Anatomy (AN xx.x, dissection, histology, osteo, vertebra, ribs, etc.)
    if re.search(r"\b(anatomy|dissection|histology|osteo|embryology)\b", title_low) or re.search(r"\ban\s*\d", full_text):
        return "anatomy"
    # Physiology (PY xx.x, hematology, etc.)
    if re.search(r"\b(physiology|hematology|haematology)\b", title_low) or re.search(r"\bpy\s*\d", full_text):
        return "physiology"
    # Biochemistry (BC xx.x, etc.)
    if re.search(r"\b(biochemistry)\b", title_low) or re.search(r"\bbc\s*\d", full_text):
        return "biochemistry"

    # 6. Specific Anatomical structures in osteology/DOAP
    if re.search(r"\b(vertebra|rib|sternum|joint|fossa|muscle|nerve|artery|bone|skull|thorax|upper limb|lower limb|abdomen|pelvis)\b", full_text):
        return "anatomy"

    # 7. Heuristic keywords in full text
    if re.search(r"\b(biochemistry|urine sample|lipid|protein|carbohydrate|vitamins|minerals|enzymes)\b", full_text):
        return "biochemistry"
    if re.search(r"\b(physiology|ecg|blood pressure|cranial nerve|git disorders|salivary|pancreas|colon)\b", full_text):
        return "physiology"
    if re.search(r"\b(anatomy|dissection|histology|pericardium|mediastinum|heart|lungs|atrium)\b", full_text):
        return "anatomy"

    return "general"

def detect_session_type(summary, desc):
    title = (summary or "").strip()
    d = (desc or "").strip()
    lower_t = title.lower()
    full_text = f"{title} {d}".lower()

    if "lunch" in lower_t or "break" in lower_t or "recess" in lower_t:
        return "break"
    if "holiday" in lower_t or "vacation" in lower_t:
        return "holiday"
    if is_actual_exam(title, desc):
        return "test_exam"
    if "(dh)" in lower_t or "dissection" in lower_t:
        return "dissection"
    if "practical" in lower_t or "(practical)" in full_text:
        return "practical"
    if "(l)" in lower_t or "lecture" in lower_t or "(l):" in lower_t or lower_t.startswith("l:"):
        return "lecture"
    if "(sgt)" in lower_t or "doap" in lower_t or "tutorial" in lower_t:
        return "sgt_doap"
    if "sdl" in lower_t or "self-directed" in lower_t:
        return "sdl"
    if "aetcom" in lower_t:
        return "aetcom"
    if "ece" in lower_t or "early clinical exposure" in lower_t:
        return "ece"
    if "sports" in lower_t or "eca" in lower_t:
        return "sports"

    # Context in description if title didn't specify
    if "(dh)" in full_text or "dissection" in full_text:
        return "dissection"
    if "practical" in full_text:
        return "practical"
    if "(sgt)" in full_text or "doap" in full_text or "tutorial" in full_text:
        return "sgt_doap"
    if "sdl" in full_text:
        return "sdl"
    if "(l)" in full_text or "lecture" in full_text:
        return "lecture"

    return "lecture"

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

DAY_CODE_MAP = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}

def parse_until_date(until_str):
    clean = until_str.rstrip("Z")
    if "T" in clean:
        dt = datetime.datetime.strptime(clean, "%Y%m%dT%H%M%S")
    else:
        dt = datetime.datetime.strptime(clean, "%Y%m%d")
    if until_str.endswith("Z"):
        dt += datetime.timedelta(hours=5, minutes=30)
    return dt

def expand_recurring_event(rev, s_dt, e_dt, start_window, end_window, exdates, overrides):
    rule_str = rev.get("raw_rrule", "") or ""
    duration = e_dt - s_dt
    parts = dict(p.split("=", 1) for p in rule_str.split(";") if "=" in p)

    freq = parts.get("FREQ", "WEEKLY").upper()
    try:
        interval = int(parts.get("INTERVAL", "1"))
    except ValueError:
        interval = 1
    try:
        count = int(parts.get("COUNT", "999999"))
    except ValueError:
        count = 999999

    until_dt = None
    if "UNTIL" in parts:
        try:
            until_dt = parse_until_date(parts["UNTIL"])
        except Exception:
            pass

    bydays_raw = parts.get("BYDAY", "")
    bydays = [DAY_CODE_MAP[d.strip()[:2]] for d in bydays_raw.split(",") if d.strip()[:2] in DAY_CODE_MAP]

    results = []
    generated = 0
    uid = rev["uid"]

    def add_instance(dt_start):
        d_key = dt_start.strftime("%Y%m%d")
        dt_key = dt_start.strftime("%Y%m%d_%H%M")
        if uid in exdates and d_key in exdates[uid]:
            return
        if (uid, dt_key) in overrides:
            results.append(overrides[(uid, dt_key)])
            return
        inst = dict(rev)
        inst["start"] = dt_start.strftime("%Y-%m-%d %H:%M:%S")
        inst["end"] = (dt_start + duration).strftime("%Y-%m-%d %H:%M:%S")
        inst["start_iso"] = dt_start.isoformat()
        inst["end_iso"] = (dt_start + duration).isoformat()
        results.append(inst)

    if bydays and freq == "WEEKLY":
        start_monday = s_dt - datetime.timedelta(days=s_dt.weekday())
        cur_week = start_monday
        while cur_week < end_window and generated < count:
            for day_offset in range(7):
                day_dt = cur_week + datetime.timedelta(days=day_offset)
                cur_occ = day_dt.replace(hour=s_dt.hour, minute=s_dt.minute, second=s_dt.second)
                if cur_occ < s_dt:
                    continue
                if until_dt and cur_occ > until_dt:
                    return results
                if cur_occ.weekday() in bydays:
                    if cur_occ >= start_window and cur_occ < end_window:
                        add_instance(cur_occ)
                    generated += 1
                    if generated >= count:
                        break
            cur_week += datetime.timedelta(weeks=interval)
    else:
        cur = s_dt
        while cur < end_window and generated < count:
            if until_dt and cur > until_dt:
                break
            if cur >= start_window:
                add_instance(cur)
            generated += 1
            if freq == "WEEKLY":
                cur += datetime.timedelta(weeks=interval)
            elif freq == "DAILY":
                cur += datetime.timedelta(days=interval)
            else:
                cur += datetime.timedelta(days=interval)

    return results

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

        if status.upper() == "CANCELLED":
            continue

        start_dt = parse_iso_date(start_m.group(1).strip())
        end_dt = parse_iso_date(end_m.group(1).strip()) if end_m else (start_dt + datetime.timedelta(hours=1))

        if not is_college_event(summary, desc, loc, start_dt, end_dt):
            continue

        # Check exdate
        for ex_match in re.finditer(r"EXDATE(?:;[^:]+)?:([0-9TZ,]+)", ev):
            for single_ex in ex_match.group(1).split(","):
                ex_dt = parse_iso_date(single_ex.strip())
                exdates.setdefault(uid, set()).add(ex_dt.strftime("%Y%m%d"))

        sub = detect_subject(summary, desc, loc)
        fac, comp = extract_faculty_and_competency(summary, desc, sub)

        if sub == "break":
            summary = "Lunch Break"
            fac = "Recess / Lunch"

        is_all_day = ("T" not in start_m.group(1).strip()) or (start_dt.hour == 0 and start_dt.minute == 0 and end_dt.hour == 0 and end_dt.minute == 0 and (end_dt - start_dt).total_seconds() >= 86400)

        event_obj = {
            "uid": uid,
            "title": summary,
            "description": desc,
            "location": loc or "Lt. BRKM Govt. Medical College, Jagdalpur",
            "faculty": fac,
            "competency": comp,
            "start": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "end": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "start_iso": start_dt.isoformat(),
            "end_iso": end_dt.isoformat(),
            "all_day": is_all_day,
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

    # Expand window: 30 days back to 180 days forward (full semester coverage)
    now = datetime.datetime.now()
    start_window = now - datetime.timedelta(days=30)
    end_window = now + datetime.timedelta(days=180)

    expanded_events = []
    for ev_tuple in standalone:
        ev, s_dt, _ = ev_tuple
        if start_window <= s_dt < end_window:
            expanded_events.append(ev)

    for rev_tuple in base_recurring:
        rev, s_dt, e_dt = rev_tuple
        recurring_instances = expand_recurring_event(rev, s_dt, e_dt, start_window, end_window, exdates, overrides)
        expanded_events.extend(recurring_instances)

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

    # Auto-inject standard Lunch Break (01:00 PM – 02:00 PM) for college days lacking lunch break
    by_date = {}
    for ev in cleaned_events:
        d = ev["start"][:10]
        by_date.setdefault(d, []).append(ev)

    injected_lunches = []
    for d, day_evs in by_date.items():
        dt = datetime.datetime.strptime(d, "%Y-%m-%d")
        if dt.weekday() == 6:  # Skip Sunday
            continue
        # Skip days that have a holiday
        if any(e["subject"] == "holiday" for e in day_evs):
            continue
        # Ensure it is an active college day with classes
        college_classes = [e for e in day_evs if e["subject"] != "break"]
        if not college_classes:
            continue

        # Check if lunch break already exists (start hour is 13)
        has_lunch = any(e["start"][11:13] == "13" for e in day_evs)
        if not has_lunch:
            lunch_ev = {
                "uid": f"college_lunch_{d}",
                "title": "Lunch Break",
                "description": "Daily college lunch recess (01:00 PM – 02:00 PM).",
                "location": "College Campus / Cafeteria",
                "faculty": "Recess / Lunch",
                "competency": "",
                "start": f"{d} 13:00:00",
                "end": f"{d} 14:00:00",
                "start_iso": f"{d}T13:00:00+05:30",
                "end_iso": f"{d}T14:00:00+05:30",
                "all_day": False,
                "subject": "break",
                "session_type": "break",
                "raw_rrule": None
            }
            injected_lunches.append(lunch_ev)

    cleaned_events.extend(injected_lunches)

    # If any day has a holiday, remove any recurring break events on that holiday
    holiday_dates = {e["start"][:10] for e in cleaned_events if e["subject"] == "holiday"}
    cleaned_events = [e for e in cleaned_events if not (e["start"][:10] in holiday_dates and e["subject"] == "break")]

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
