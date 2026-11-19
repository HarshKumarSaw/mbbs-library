/**
 * MBBS Resource Library - College Timetable Engine
 * Vanilla JavaScript • Zero Dependencies • Asia/Kolkata Timezone (IST)
 * 
 * Sources:
 *  1. /api/timetable (Local/Server-side secure proxy)
 *  2. assets/data/timetable_college.json (Sanitized build/phone-sync cache)
 *  3. Google Calendar Public Feed via CORS proxy (fallback)
 *  4. LocalStorage offline cache (instant 0ms launch)
 */

(function () {
  "use strict";

  const PUBLIC_ICAL_URL = "https://calendar.google.com/calendar/ical/harshsaw01%40gmail.com/public/basic.ics";
  const CACHE_STORAGE_KEY = "mbbs_timetable_cache_v2";
  const SETTINGS_STORAGE_KEY = "mbbs_timetable_settings_v2";
  const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes auto-refresh

  // Default filtering keywords
  const DEFAULT_EXCLUDE_KEYWORDS = [
    "birthday", "anniversary", "marriage", "sleep", "routine", "dinner", "reading", "exercise",
    "water plants", "journaling", "brush", "freshen up", "meditation", "planning", "eat something",
    "study session", "power hour", "revise", "revision", "canva", "times prime", "vehicle registration",
    "shopping", "demon slayer", "spider", "animal", "stree 2", "crowdsource", "aptitude test",
    "botany |", "chemistry |", "physics |", "zoology |", "aiats", "cst", "nbts", "pst",
    "project phoenix", "pre-neet", "test darwin", "test :", "test-", "bus trip"
  ];

  const DEFAULT_COLLEGE_SUBJECTS = [
    "anatomy", "physiology", "biochemistry", "aetcom", "ece", "psm", "community medicine",
    "forensic", "pathology", "pharmacology", "microbiology", "sports & eca", "college"
  ];

  // Application State
  const state = {
    activeView: "today",       // 'today', 'weekly', 'upcoming'
    selectedDayIndex: 1,       // 1 = Monday ... 6 = Saturday (0 = Sunday)
    selectedSubject: "all",
    selectedSessionType: "all",
    searchQuery: "",
    allCollegeSessions: [],
    lastSyncTime: null,
    isLoading: false,
    errorMessage: null,
    manualExcludedUids: new Set(),
    customIncludeWords: [],
    customExcludeWords: [],
    strictCollegeFilter: true
  };

  // DOM Elements cache
  let DOM = {};

  function initDOM() {
    DOM = {
      currentTimeBadge: document.getElementById("current-time-badge"),
      lastSyncedText: document.getElementById("last-synced-text"),
      refreshBtn: document.getElementById("btn-refresh-timetable"),
      filterSettingsBtn: document.getElementById("btn-filter-settings"),
      viewTabs: document.querySelectorAll(".timetable-nav-tabs .tab-btn"),
      tabTodayCount: document.getElementById("tab-count-today"),
      tabWeeklyCount: document.getElementById("tab-count-weekly"),
      tabUpcomingCount: document.getElementById("tab-count-upcoming"),
      daysNavWrapper: document.getElementById("days-nav-wrapper"),
      daysNav: document.getElementById("days-nav"),
      subjectPills: document.querySelectorAll(".filter-pills-scroll .sub-pill"),
      typeSelect: document.getElementById("session-type-select"),
      searchInput: document.getElementById("timetable-search-input"),
      searchClear: document.getElementById("timetable-search-clear"),
      timelineContainer: document.getElementById("timetable-timeline-container"),
      nowBannerContainer: document.getElementById("now-banner-container"),
      loadingState: document.getElementById("timetable-loading-state"),
      emptyState: document.getElementById("timetable-empty-state"),
      errorState: document.getElementById("timetable-error-state"),
      errorDetailsText: document.getElementById("error-details-text"),
      retryBtn: document.getElementById("btn-retry-fetch"),
      // Modals
      detailsModal: document.getElementById("session-details-modal"),
      detailsCloseBtn: document.getElementById("session-details-close"),
      detailsTitle: document.getElementById("modal-session-title"),
      detailsTime: document.getElementById("modal-session-time"),
      detailsSubjectBadge: document.getElementById("modal-subject-badge"),
      detailsTypeBadge: document.getElementById("modal-type-badge"),
      detailsFaculty: document.getElementById("modal-session-faculty"),
      detailsCompetency: document.getElementById("modal-session-competency"),
      detailsLocation: document.getElementById("modal-session-location"),
      detailsDescription: document.getElementById("modal-session-description"),
      detailsExportIcsBtn: document.getElementById("modal-export-ics-btn"),
      // Settings Modal
      settingsModal: document.getElementById("timetable-settings-modal"),
      settingsCloseBtn: document.getElementById("settings-modal-close"),
      strictFilterToggle: document.getElementById("toggle-strict-filter"),
      customIncludeInput: document.getElementById("settings-custom-include"),
      customExcludeInput: document.getElementById("settings-custom-exclude"),
      settingsSaveBtn: document.getElementById("btn-save-settings"),
      settingsResetBtn: document.getElementById("btn-reset-settings")
    };
  }

  // --- Date & Timezone Helpers (Strict Asia/Kolkata IST) ---
  function getNowInKolkata() {
    // Current time shifted to Asia/Kolkata
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kolkataOffsetMs = 5.5 * 3600000; // UTC +5:30
    return new Date(utcTime + kolkataOffsetMs);
  }

  function formatTimeAMPM(dateObj) {
    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    const strHours = hours < 10 ? "0" + hours : hours;
    return `${strHours}:${strMinutes} ${ampm}`;
  }

  function formatDateHuman(dateObj) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }

  function formatRelativeDay(targetDate, todayDate) {
    const targetMid = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const todayMid = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const diffDays = Math.round((targetMid - todayMid) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 6) return `In ${diffDays} days`;
    return "";
  }

  function parseIcsDate(dtStr) {
    if (!dtStr) return null;
    const isUtc = dtStr.endsWith("Z");
    const clean = dtStr.replace("Z", "");
    let year, month, day, hour = 0, minute = 0, second = 0;

    if (clean.includes("T")) {
      const parts = clean.split("T");
      year = parseInt(parts[0].substr(0, 4), 10);
      month = parseInt(parts[0].substr(4, 2), 10) - 1;
      day = parseInt(parts[0].substr(6, 2), 10);
      hour = parseInt(parts[1].substr(0, 2), 10);
      minute = parseInt(parts[1].substr(2, 2), 10);
      second = parseInt(parts[1].substr(4, 2), 10);
    } else {
      year = parseInt(clean.substr(0, 4), 10);
      month = parseInt(clean.substr(4, 2), 10) - 1;
      day = parseInt(clean.substr(6, 2), 10);
    }

    if (isUtc) {
      // Add 5h 30m to convert UTC to IST
      const d = new Date(Date.UTC(year, month, day, hour, minute, second));
      d.setUTCMinutes(d.getUTCMinutes() + 330);
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    } else {
      // Already floating/IST
      return new Date(year, month, day, hour, minute, second);
    }
  }

  // --- Filtering & Heuristics ---
  function isCollegeEvent(summary, desc, loc) {
    if (!summary) return false;
    const sLow = summary.toLowerCase().trim();
    const dLow = (desc || "").toLowerCase();
    const lLow = (loc || "").toLowerCase();
    const fullText = `${sLow} ${dLow} ${lLow}`;

    // Custom include override
    for (const inc of state.customIncludeWords) {
      if (inc && sLow.includes(inc)) return true;
    }

    // Custom exclude override
    for (const exc of state.customExcludeWords) {
      if (exc && sLow.includes(exc)) return false;
    }

    if (state.strictCollegeFilter) {
      // Check default exclusion keywords
      for (const exc of DEFAULT_EXCLUDE_KEYWORDS) {
        if (sLow.includes(exc)) return false;
      }

      // Check positive subject indicators
      for (const subj of DEFAULT_COLLEGE_SUBJECTS) {
        if (sLow.includes(subj) || lLow.includes(subj) || dLow.includes("department of " + subj)) {
          return true;
        }
      }

      // Check college location and session keywords
      if (fullText.includes("medical college") || fullText.includes("jagdalpur") ||
          sLow.includes("dissection") || sLow.includes("doap") || sLow.includes("sgt") ||
          sLow.includes("histology") || sLow.includes("sdl")) {
        return true;
      }

      return false;
    }

    return true;
  }

  function detectSubject(summary, desc, loc) {
    const s = `${summary} ${desc} ${loc}`.toLowerCase();
    if (s.includes("anatomy") || s.includes("dissection") || s.includes("histology") || s.includes("an ")) {
      return "anatomy";
    }
    if (s.includes("physiology") || s.includes("py ") || s.includes("ecg")) {
      return "physiology";
    }
    if (s.includes("biochemistry") || s.includes("bc ") || s.includes("urine sample") || s.includes("lipid") || s.includes("protein")) {
      return "biochemistry";
    }
    if (s.includes("aetcom")) {
      return "aetcom";
    }
    if (s.includes("ece")) {
      return "ece";
    }
    if (s.includes("sports") || s.includes("eca")) {
      return "sports";
    }
    if (s.includes("holiday") || s.includes("dussehra") || s.includes("diwali")) {
      return "holiday";
    }
    if (s.includes("lunch")) {
      return "break";
    }
    return "general";
  }

  function detectSessionType(summary, desc) {
    const s = `${summary} ${desc}`.toLowerCase();
    if (s.includes("(l)") || s.includes("lecture") || s.includes("(l):") || s.includes("l:")) {
      return "lecture";
    }
    if (s.includes("(dh)") || s.includes("dissection")) {
      return "dissection";
    }
    if (s.includes("practical")) {
      return "practical";
    }
    if (s.includes("(sgt)") || s.includes("doap") || s.includes("tutorial")) {
      return "sgt_doap";
    }
    if (s.includes("sdl")) {
      return "sdl";
    }
    if (s.includes("pct") || s.includes("class test") || s.includes("test") || s.includes("exam")) {
      return "test_exam";
    }
    if (s.includes("aetcom")) {
      return "aetcom";
    }
    if (s.includes("ece")) {
      return "ece";
    }
    if (s.includes("holiday")) {
      return "holiday";
    }
    if (s.includes("lunch")) {
      return "break";
    }
    return "other";
  }

  function extractMetadata(title, desc, subject) {
    let faculty = "";
    let competency = "";
    const cleanLines = [];

    const normalizedDesc = (desc || "")
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";");

    const lines = normalizedDesc.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lower = line.toLowerCase();
      if (lower.startsWith("faculty:") || lower.includes("| faculty:")) {
        const parts = line.split(/faculty:/i);
        faculty = parts[parts.length - 1].trim();
        faculty = faculty.split(/department:|special class:|practical preparation:/i)[0].trim().replace(/^\(|\)$/g, "").trim();
      } else if (lower.startsWith("competency:")) {
        competency = line.substring(11).trim();
      } else {
        cleanLines.push(line);
      }
    }

    // Check competency in title if not in description, e.g. (AN 13.3) or (BC 5.1)
    if (!competency && title) {
      const compMatch = title.match(/\b(AN|BC|PY)\s*\d+(\.\d+)?(-\d+(\.\d+)?)?\b/i);
      if (compMatch) {
        competency = compMatch[0].toUpperCase();
      }
    }

    // Check teacher initials in title
    if (!faculty && title) {
      const initialsMap = {
        BNK: "Dr. Bakhshilal Kumar (BNK)",
        HBS: "Dr. Hemlata B. Sheik (HBS)",
        SD: "Dr. Shreya Dhurandher (SD)",
        R: "Dr. Ritika (R)",
        AR: "Dr. Anantika Rai (AR)",
        FKK: "Dr. Firoj Kumar Khare (FKK)",
        FK: "Dr. Firoj Kumar Khare (FK)"
      };
      for (const [init, name] of Object.entries(initialsMap)) {
        if (new RegExp(`\\b${init}\\b`).test(title)) {
          faculty = name;
          break;
        }
      }
    }

    // Fallback if no specific teacher name
    if (!faculty) {
      if (subject === "anatomy") faculty = "Anatomy Faculty";
      else if (subject === "physiology") faculty = "Physiology Faculty";
      else if (subject === "biochemistry") faculty = "Biochemistry Faculty";
      else if (subject === "aetcom") faculty = "AETCOM Faculty";
      else if (subject === "ece") faculty = "ECE Faculty";
      else if (subject === "break") faculty = "Lunch Break";
      else if (subject === "holiday") faculty = "College Holiday";
      else faculty = "Department Faculty";
    }

    return {
      faculty,
      competency,
      cleanDesc: cleanLines.filter(Boolean).join("\n")
    };
  }

  // --- iCal Feed Parser & Recurrence Engine ---
  function parseIcalString(rawIcs) {
    // Unfold lines
    const unfolded = rawIcs.replace(/\r?\n[ \t]/g, "");
    const rawEvents = unfolded.split("BEGIN:VEVENT");

    const baseRecurring = [];
    const overrides = {};
    const exdates = {};
    const standalone = [];

    for (let i = 1; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      const uidMatch = ev.match(/UID:(.*)/);
      const sumMatch = ev.match(/SUMMARY:(.*)/);
      const startMatch = ev.match(/DTSTART(?:;[^:]+)?:([0-9TZ]+)/);

      if (!uidMatch || !sumMatch || !startMatch) continue;

      const uid = uidMatch[1].trim();
      const summary = sumMatch[1].replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
      const descMatch = ev.match(/DESCRIPTION:(.*)/);
      const desc = descMatch ? descMatch[1].replace(/\\n/g, "\n").replace(/\\,/g, ",").trim() : "";
      const locMatch = ev.match(/LOCATION:(.*)/);
      const loc = locMatch ? locMatch[1].replace(/\\,/g, ",").trim() : "";
      const statusMatch = ev.match(/STATUS:(.*)/);
      const status = statusMatch ? statusMatch[1].trim() : "CONFIRMED";

      if (status.toUpperCase() === "CANCELLED") continue;
      if (state.manualExcludedUids.has(uid)) continue;
      if (!isCollegeEvent(summary, desc, loc)) continue;

      const startDt = parseIcsDate(startMatch[1].trim());
      if (!startDt) continue;

      const endMatch = ev.match(/DTEND(?:;[^:]+)?:([0-9TZ]+)/);
      let endDt = endMatch ? parseIcsDate(endMatch[1].trim()) : new Date(startDt.getTime() + 60 * 60 * 1000);

      // Parse EXDATE
      const exRegex = /EXDATE(?:;[^:]+)?:([0-9TZ,]+)/g;
      let exMatch;
      while ((exMatch = exRegex.exec(ev)) !== null) {
        const parts = exMatch[1].split(",");
        for (const p of parts) {
          const exDt = parseIcsDate(p.trim());
          if (exDt) {
            const exKey = `${exDt.getFullYear()}${String(exDt.getMonth() + 1).padStart(2, "0")}${String(exDt.getDate()).padStart(2, "0")}`;
            if (!exdates[uid]) exdates[uid] = new Set();
            exdates[uid].add(exKey);
          }
        }
      }

      const rruleMatch = ev.match(/RRULE:(.*)/);
      const recidMatch = ev.match(/RECURRENCE-ID(?:;[^:]+)?:([0-9TZ]+)/);
      const subject = detectSubject(summary, desc, loc);
      const meta = extractMetadata(summary, desc, subject);

      const eventObj = {
        uid,
        title: summary,
        description: desc,
        cleanDesc: meta.cleanDesc,
        faculty: meta.faculty,
        competency: meta.competency,
        location: loc || "Lt. BRKM Govt. Medical College, Jagdalpur",
        startDate: startDt,
        endDate: endDt,
        startIso: startDt.toISOString(),
        endIso: endDt.toISOString(),
        subject: subject,
        sessionType: detectSessionType(summary, desc),
        rawRrule: rruleMatch ? rruleMatch[1].trim() : null
      };

      if (recidMatch) {
        const recDt = parseIcsDate(recidMatch[1].trim());
        if (recDt) {
          const recKey = `${recDt.getFullYear()}${String(recDt.getMonth() + 1).padStart(2, "0")}${String(recDt.getDate()).padStart(2, "0")}_${String(recDt.getHours()).padStart(2, "0")}${String(recDt.getMinutes()).padStart(2, "0")}`;
          overrides[`${uid}_${recKey}`] = eventObj;
        }
      } else if (rruleMatch) {
        baseRecurring.push(eventObj);
      } else {
        standalone.push(eventObj);
      }
    }

    // Expand recurrence for semester window (4 weeks past to 12 weeks future)
    const now = getNowInKolkata();
    const windowStart = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const windowEnd = new Date(now.getTime() + (84 * 24 * 60 * 60 * 1000));

    const expandedList = [];

    // Add standalone
    for (const ev of standalone) {
      if (ev.startDate >= windowStart && ev.startDate < windowEnd) {
        expandedList.push(ev);
      }
    }

    // Expand recurring
    for (const rev of baseRecurring) {
      const rule = rev.rawRrule || "";
      const isWeekly = rule.includes("FREQ=WEEKLY");
      const durationMs = rev.endDate.getTime() - rev.startDate.getTime();
      let cur = new Date(rev.startDate.getTime());

      while (cur < windowEnd) {
        if (cur >= windowStart) {
          const dKey = `${cur.getFullYear()}${String(cur.getMonth() + 1).padStart(2, "0")}${String(cur.getDate()).padStart(2, "0")}`;
          const dtKey = `${dKey}_${String(cur.getHours()).padStart(2, "0")}${String(cur.getMinutes()).padStart(2, "0")}`;

          if (exdates[rev.uid] && exdates[rev.uid].has(dKey)) {
            // Excluded occurrence (holiday or cancelled)
          } else if (overrides[`${rev.uid}_${dtKey}`]) {
            expandedList.push(overrides[`${rev.uid}_${dtKey}`]);
          } else {
            const inst = Object.assign({}, rev);
            inst.startDate = new Date(cur.getTime());
            inst.endDate = new Date(cur.getTime() + durationMs);
            inst.startIso = inst.startDate.toISOString();
            inst.endIso = inst.endDate.toISOString();
            expandedList.push(inst);
          }
        }

        if (isWeekly) {
          cur.setDate(cur.getDate() + 7);
        } else {
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    // Sort chronologically
    expandedList.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Deduplicate overlapping generic sessions
    const deduplicated = [];
    const timeSlotMap = new Map();

    for (const ev of expandedList) {
      // Exclude umbrella full-day 9AM-5PM College block
      if (ev.title === "🏫 College" && ev.startDate.getHours() === 9 && ev.endDate.getHours() === 17) {
        continue;
      }

      const slotKey = `${ev.startDate.toDateString()}_${ev.startDate.getHours()}:${ev.startDate.getMinutes()}_${ev.subject}`;
      if (timeSlotMap.has(slotKey)) {
        const existing = timeSlotMap.get(slotKey);
        // If current has specific topic (colon or dash) and existing is generic (e.g. Anatomy (L))
        if ((ev.title.includes(":") || ev.title.includes("–")) && !existing.title.includes(":")) {
          timeSlotMap.set(slotKey, ev);
        }
      } else {
        timeSlotMap.set(slotKey, ev);
      }
    }

    timeSlotMap.forEach((ev) => deduplicated.push(ev));
    deduplicated.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return deduplicated;
  }

  // --- Network Fetch Pipeline ---
  async function fetchTimetableData(forceRefresh = false) {
    setLoading(true);
    state.errorMessage = null;

    // 1. Try local / server-side proxy endpoint first
    try {
      const proxyUrl = forceRefresh ? "/api/timetable?refresh=1" : "/api/timetable";
      const resp = await fetch(proxyUrl, { cache: forceRefresh ? "reload" : "default" });
      if (resp.ok) {
        const icsText = await resp.text();
        if (icsText && icsText.includes("BEGIN:VCALENDAR")) {
          const sessions = parseIcalString(icsText);
          onFetchSuccess(sessions, "proxy");
          return;
        }
      }
    } catch (_) {
      // Proxy not running (e.g. running statically on GitHub Pages)
    }

    // 2. Try pre-synced college JSON cache
    try {
      const jsonUrl = `assets/data/timetable_college.json?t=${Date.now()}`;
      const jsonResp = await fetch(jsonUrl);
      if (jsonResp.ok) {
        const data = await jsonResp.json();
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          const parsed = data.events.map((e) => {
            const startDt = new Date(e.start.replace(" ", "T"));
            const endDt = new Date(e.end.replace(" ", "T"));
            const sub = e.subject || detectSubject(e.title, e.description, e.location);
            const meta = extractMetadata(e.title, e.description, sub);
            return {
              uid: e.uid,
              title: e.title,
              description: e.description,
              cleanDesc: meta.cleanDesc,
              faculty: e.faculty || meta.faculty,
              competency: e.competency || meta.competency,
              location: e.location || "Lt. BRKM Govt. Medical College, Jagdalpur",
              startDate: startDt,
              endDate: endDt,
              startIso: startDt.toISOString(),
              endIso: endDt.toISOString(),
              subject: sub,
              sessionType: e.session_type || detectSessionType(e.title, e.description)
            };
          });
          onFetchSuccess(parsed, "pre_synced");
          return;
        }
      }
    } catch (_) {}

    // 3. Fallback: Public feed via CORS Proxy (Only uses public URL; never leaks private token)
    try {
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(PUBLIC_ICAL_URL)}`;
      const pubResp = await fetch(corsProxyUrl);
      if (pubResp.ok) {
        const icsText = await pubResp.text();
        if (icsText && icsText.includes("BEGIN:VCALENDAR")) {
          const sessions = parseIcalString(icsText);
          onFetchSuccess(sessions, "cors_public");
          return;
        }
      }
    } catch (_) {}

    // 4. Fallback to localStorage offline cache
    const cached = loadFromLocalStorage();
    if (cached && cached.length > 0) {
      onFetchSuccess(cached, "offline_cache");
      return;
    }

    // All failed
    setLoading(false);
    showError("Could not load timetable feed. Please check your internet connection or verify the proxy server is running.");
  }

  function onFetchSuccess(sessions, sourceMode) {
    state.allCollegeSessions = sessions;
    state.lastSyncTime = new Date();
    setLoading(false);
    saveToLocalStorage(sessions);
    updateLastSyncedDisplay();
    renderAll();
  }

  function saveToLocalStorage(sessions) {
    try {
      const lightweight = sessions.slice(0, 400).map((s) => ({
        uid: s.uid,
        title: s.title,
        description: s.description,
        cleanDesc: s.cleanDesc,
        faculty: s.faculty,
        competency: s.competency,
        location: s.location,
        startIso: s.startIso,
        endIso: s.endIso,
        subject: s.subject,
        sessionType: s.sessionType
      }));
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        sessions: lightweight
      }));
    } catch (_) {}
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.sessions)) {
        return data.sessions.map((s) => ({
          uid: s.uid,
          title: s.title,
          description: s.description,
          cleanDesc: s.cleanDesc,
          faculty: s.faculty,
          competency: s.competency,
          location: s.location,
          startDate: new Date(s.startIso),
          endDate: new Date(s.endIso),
          startIso: s.startIso,
          endIso: s.endIso,
          subject: s.subject,
          sessionType: s.sessionType
        }));
      }
    } catch (_) {}
    return null;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        state.strictCollegeFilter = obj.strictCollegeFilter !== false;
        state.customIncludeWords = Array.isArray(obj.customIncludeWords) ? obj.customIncludeWords : [];
        state.customExcludeWords = Array.isArray(obj.customExcludeWords) ? obj.customExcludeWords : [];
        state.manualExcludedUids = new Set(Array.isArray(obj.manualExcludedUids) ? obj.manualExcludedUids : []);
      }
    } catch (_) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        strictCollegeFilter: state.strictCollegeFilter,
        customIncludeWords: state.customIncludeWords,
        customExcludeWords: state.customExcludeWords,
        manualExcludedUids: Array.from(state.manualExcludedUids)
      }));
    } catch (_) {}
  }

  // --- UI Renderers ---
  function renderAll() {
    updateCounts();
    renderHappeningNowBanner();
    renderTimeline();
  }

  function getFilteredSessions() {
    let list = state.allCollegeSessions.slice();

    // Subject Filter
    if (state.selectedSubject !== "all") {
      list = list.filter((s) => s.subject === state.selectedSubject);
    }

    // Session Type Filter
    if (state.selectedSessionType !== "all") {
      list = list.filter((s) => s.sessionType === state.selectedSessionType);
    }

    // Search Query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        return (
          s.title.toLowerCase().includes(q) ||
          (s.faculty && s.faculty.toLowerCase().includes(q)) ||
          (s.competency && s.competency.toLowerCase().includes(q)) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }

  function updateCounts() {
    const now = getNowInKolkata();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const todaySessions = state.allCollegeSessions.filter((s) => {
      const d = s.startDate;
      return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
    });

    if (DOM.tabTodayCount) DOM.tabTodayCount.textContent = todaySessions.length;

    // Upcoming sessions (next 14 days)
    const upcomingEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    const upcomingSessions = state.allCollegeSessions.filter((s) => {
      return s.startDate >= now && s.startDate < upcomingEnd;
    });
    if (DOM.tabUpcomingCount) DOM.tabUpcomingCount.textContent = upcomingSessions.length;

    // Weekly day buttons count
    renderDaysNavButtons();
  }

  function renderDaysNavButtons() {
    if (!DOM.daysNav) return;
    const now = getNowInKolkata();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    // Calculate dates for current week (Mon to Sat)
    const monOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset);

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let html = "";

    for (let i = 0; i < 6; i++) {
      const dayIndex = i + 1; // 1 to 6
      const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
      const isToday = d.toDateString() === now.toDateString();
      const isActive = state.selectedDayIndex === dayIndex;

      // Count sessions for this day
      const count = state.allCollegeSessions.filter((s) => {
        const sd = s.startDate;
        return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate();
      }).length;

      html += `
        <button type="button" class="day-pill-btn ${isActive ? "active" : ""} ${isToday ? "is-today" : ""}" data-day-index="${dayIndex}">
          <span class="day-label">${dayNames[i]}</span>
          <span class="day-num">${d.getDate()}</span>
          <span class="day-count">${count} classes</span>
        </button>
      `;
    }

    DOM.daysNav.innerHTML = html;

    // Attach click listeners to day pills
    const pillButtons = DOM.daysNav.querySelectorAll(".day-pill-btn");
    pillButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedDayIndex = parseInt(btn.getAttribute("data-day-index"), 10);
        renderDaysNavButtons();
        renderTimeline();
      });
    });
  }

  function renderHappeningNowBanner() {
    if (!DOM.nowBannerContainer) return;
    const now = getNowInKolkata();

    // Find session currently active
    const activeSession = state.allCollegeSessions.find((s) => {
      return now >= s.startDate && now < s.endDate;
    });

    if (!activeSession) {
      // Find next session today
      const todayNext = state.allCollegeSessions.find((s) => {
        const isToday = s.startDate.toDateString() === now.toDateString();
        return isToday && s.startDate > now;
      });

      if (todayNext) {
        DOM.nowBannerContainer.innerHTML = `
          <div class="now-banner-card">
            <div class="now-banner-top">
              <span class="now-live-tag" style="background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); color: #93C5FD;">⏳ UP NEXT TODAY</span>
              <span class="now-time-range">${formatTimeAMPM(todayNext.startDate)} – ${formatTimeAMPM(todayNext.endDate)}</span>
            </div>
            <h3 class="now-title">${escapeHtml(todayNext.title)}</h3>
            <div class="now-meta-row">
              <span>👨‍🏫 ${escapeHtml(todayNext.faculty || "Department Faculty")}</span>
              ${todayNext.competency ? `<span>📋 Competency: ${escapeHtml(todayNext.competency)}</span>` : ""}
            </div>
          </div>
        `;
        DOM.nowBannerContainer.style.display = "block";
      } else {
        DOM.nowBannerContainer.innerHTML = "";
        DOM.nowBannerContainer.style.display = "none";
      }
      return;
    }

    const totalDuration = activeSession.endDate.getTime() - activeSession.startDate.getTime();
    const elapsed = now.getTime() - activeSession.startDate.getTime();
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    DOM.nowBannerContainer.innerHTML = `
      <div class="now-banner-card">
        <div class="now-banner-top">
          <span class="now-live-tag">🟢 HAPPENING NOW</span>
          <span class="now-time-range">${formatTimeAMPM(activeSession.startDate)} – ${formatTimeAMPM(activeSession.endDate)}</span>
        </div>
        <h3 class="now-title">${escapeHtml(activeSession.title)}</h3>
        <div class="now-meta-row">
          <span>👨‍🏫 ${escapeHtml(activeSession.faculty || "Department Faculty")}</span>
          ${activeSession.competency ? `<span>📋 Competency: ${escapeHtml(activeSession.competency)}</span>` : ""}
        </div>
        <div class="now-progress-track">
          <div class="now-progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
    DOM.nowBannerContainer.style.display = "block";
  }

  function renderTimeline() {
    if (!DOM.timelineContainer) return;
    const now = getNowInKolkata();
    const filtered = getFilteredSessions();

    let sessionsToRender = [];

    if (state.activeView === "today") {
      if (DOM.daysNavWrapper) DOM.daysNavWrapper.style.display = "none";
      const todayStr = now.toDateString();
      sessionsToRender = filtered.filter((s) => s.startDate.toDateString() === todayStr);

      if (sessionsToRender.length === 0) {
        const isSunday = now.getDay() === 0;
        showEmpty(isSunday ? "Sunday • College Closed • Rest & Revision Day 🎉" : "No college classes scheduled for today.");
        return;
      }
      hideEmpty();
      DOM.timelineContainer.innerHTML = `
        <div class="date-divider-header">
          <h2 class="date-divider-title">${formatDateHuman(now)}</h2>
          <span class="date-divider-badge is-today">Today (${sessionsToRender.length} classes)</span>
        </div>
        ${sessionsToRender.map((s) => createSessionCardHtml(s, now)).join("")}
      `;
    } else if (state.activeView === "weekly") {
      if (DOM.daysNavWrapper) DOM.daysNavWrapper.style.display = "block";
      const currentDayOfWeek = now.getDay();
      const monOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset);
      const targetDate = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + (state.selectedDayIndex - 1));

      const targetStr = targetDate.toDateString();
      sessionsToRender = filtered.filter((s) => s.startDate.toDateString() === targetStr);

      if (sessionsToRender.length === 0) {
        showEmpty(`No college classes scheduled for ${formatDateHuman(targetDate)}.`);
        return;
      }
      hideEmpty();
      const isToday = targetDate.toDateString() === now.toDateString();
      DOM.timelineContainer.innerHTML = `
        <div class="date-divider-header">
          <h2 class="date-divider-title">${formatDateHuman(targetDate)}</h2>
          <span class="date-divider-badge ${isToday ? "is-today" : ""}">${isToday ? "Today • " : ""}${sessionsToRender.length} classes</span>
        </div>
        ${sessionsToRender.map((s) => createSessionCardHtml(s, now)).join("")}
      `;
    } else if (state.activeView === "upcoming") {
      if (DOM.daysNavWrapper) DOM.daysNavWrapper.style.display = "none";
      const upcomingEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
      sessionsToRender = filtered.filter((s) => s.startDate >= now && s.startDate < upcomingEnd);

      if (sessionsToRender.length === 0) {
        showEmpty("No upcoming classes scheduled in the next 14 days.");
        return;
      }
      hideEmpty();

      // Group by date
      const grouped = new Map();
      for (const s of sessionsToRender) {
        const dStr = s.startDate.toDateString();
        if (!grouped.has(dStr)) grouped.set(dStr, []);
        grouped.get(dStr).push(s);
      }

      let html = "";
      grouped.forEach((groupSessions, dStr) => {
        const first = groupSessions[0].startDate;
        const rel = formatRelativeDay(first, now);
        html += `
          <div class="date-divider-header">
            <h2 class="date-divider-title">${formatDateHuman(first)}</h2>
            <span class="date-divider-badge ${rel === "Today" ? "is-today" : ""}">${rel ? rel + " • " : ""}${groupSessions.length} classes</span>
          </div>
          ${groupSessions.map((s) => createSessionCardHtml(s, now)).join("")}
        `;
      });

      DOM.timelineContainer.innerHTML = html;
    }

    // Attach click listeners to session cards for details modal
    const cards = DOM.timelineContainer.querySelectorAll(".session-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const uid = card.getAttribute("data-session-uid");
        const startIso = card.getAttribute("data-session-start");
        const session = state.allCollegeSessions.find((s) => s.uid === uid && s.startIso === startIso);
        if (session) openDetailsModal(session);
      });
    });
  }

  function createSessionCardHtml(s, now) {
    const isOngoing = now >= s.startDate && now < s.endDate;
    const timeFormatted = `${formatTimeAMPM(s.startDate)} – ${formatTimeAMPM(s.endDate)}`;
    const durationMinutes = Math.round((s.endDate.getTime() - s.startDate.getTime()) / 60000);
    const durationLabel = durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 ? durationMinutes % 60 + "m" : ""}` : `${durationMinutes}m`;

    return `
      <article class="session-card subject-${s.subject} ${isOngoing ? "is-active-session" : ""}" data-session-uid="${escapeHtml(s.uid)}" data-session-start="${escapeHtml(s.startIso)}">
        <div class="session-color-strip"></div>
        <div class="session-card-body">
          <div class="session-card-top">
            <span class="session-time-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${timeFormatted} <span style="font-weight: 500; color: #94A3B8;">(${durationLabel})</span>
            </span>
            <div class="session-badges-group">
              <span class="badge-subject">${escapeHtml(s.subject)}</span>
              <span class="badge-type">${escapeHtml(formatSessionTypeName(s.sessionType))}</span>
              ${isOngoing ? '<span class="now-live-tag" style="padding: 1px 6px; font-size: 0.65rem;">Live</span>' : ""}
            </div>
          </div>
          <h3 class="session-title">${escapeHtml(s.title)}</h3>
          <div class="session-metadata-row">
            ${s.competency ? `<span class="session-competency-pill">${escapeHtml(s.competency)}</span>` : ""}
            <span class="meta-item faculty-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>${escapeHtml(s.faculty || "Department Faculty")}</span>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function formatSessionTypeName(type) {
    const map = {
      lecture: "Lecture",
      dissection: "Dissection",
      practical: "Practical",
      sgt_doap: "SGT / DOAP",
      sdl: "SDL",
      test_exam: "Test / Exam",
      aetcom: "AETCOM",
      ece: "ECE",
      holiday: "Holiday",
      break: "Break",
      other: "Session"
    };
    return map[type] || "Session";
  }

  // --- Modals ---
  function openDetailsModal(s) {
    if (!DOM.detailsModal) return;
    DOM.detailsTitle.textContent = s.title;
    DOM.detailsTime.textContent = `${formatDateHuman(s.startDate)} • ${formatTimeAMPM(s.startDate)} – ${formatTimeAMPM(s.endDate)}`;

    DOM.detailsSubjectBadge.textContent = s.subject.toUpperCase();
    DOM.detailsSubjectBadge.className = `badge-subject subject-${s.subject}`;

    DOM.detailsTypeBadge.textContent = formatSessionTypeName(s.sessionType);

    if (s.faculty && DOM.detailsFaculty) {
      DOM.detailsFaculty.textContent = `Faculty: ${s.faculty}`;
      DOM.detailsFaculty.style.display = "block";
    } else if (DOM.detailsFaculty) {
      DOM.detailsFaculty.style.display = "none";
    }

    if (s.competency && DOM.detailsCompetency) {
      DOM.detailsCompetency.textContent = `Competency: ${s.competency}`;
      DOM.detailsCompetency.style.display = "block";
    } else if (DOM.detailsCompetency) {
      DOM.detailsCompetency.style.display = "none";
    }

    if (DOM.detailsLocation) DOM.detailsLocation.textContent = s.location;
    if (DOM.detailsDescription) DOM.detailsDescription.textContent = s.cleanDesc || s.description || "Official college academic session.";

    if (DOM.detailsExportIcsBtn) {
      DOM.detailsExportIcsBtn.onclick = () => exportSingleEventIcs(s);
    }

    DOM.detailsModal.classList.add("active");
  }

  function closeDetailsModal() {
    if (DOM.detailsModal) DOM.detailsModal.classList.remove("active");
  }

  function openSettingsModal() {
    if (!DOM.settingsModal) return;
    if (DOM.strictFilterToggle) DOM.strictFilterToggle.checked = state.strictCollegeFilter;
    if (DOM.customIncludeInput) DOM.customIncludeInput.value = state.customIncludeWords.join(", ");
    if (DOM.customExcludeInput) DOM.customExcludeInput.value = state.customExcludeWords.join(", ");
    DOM.settingsModal.classList.add("active");
  }

  function closeSettingsModal() {
    if (DOM.settingsModal) DOM.settingsModal.classList.remove("active");
  }

  function exportSingleEventIcs(s) {
    const formatIcsDt = (d) => {
      return d.getUTCFullYear() +
        String(d.getUTCMonth() + 1).padStart(2, "0") +
        String(d.getUTCDate()).padStart(2, "0") + "T" +
        String(d.getUTCHours()).padStart(2, "0") +
        String(d.getUTCMinutes()).padStart(2, "0") +
        String(d.getUTCSeconds()).padStart(2, "0") + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Harsh's Library//MBBS College Timetable//EN",
      "BEGIN:VEVENT",
      `UID:${s.uid}`,
      `DTSTAMP:${formatIcsDt(new Date())}`,
      `DTSTART:${formatIcsDt(s.startDate)}`,
      `DTEND:${formatIcsDt(s.endDate)}`,
      `SUMMARY:${s.title.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${(s.cleanDesc || s.title).replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
      `LOCATION:${s.location.replace(/,/g, "\\,")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- UI State Toggles ---
  function setLoading(loading) {
    state.isLoading = loading;
    if (DOM.loadingState) DOM.loadingState.style.display = loading ? "block" : "none";
    if (DOM.refreshBtn) {
      if (loading) DOM.refreshBtn.classList.add("spinning");
      else DOM.refreshBtn.classList.remove("spinning");
    }
  }

  function showEmpty(msg) {
    if (DOM.emptyState) {
      const descEl = DOM.emptyState.querySelector(".timetable-state-desc");
      if (descEl) descEl.textContent = msg;
      DOM.emptyState.style.display = "block";
    }
    if (DOM.timelineContainer) DOM.timelineContainer.innerHTML = "";
  }

  function hideEmpty() {
    if (DOM.emptyState) DOM.emptyState.style.display = "none";
  }

  function showError(msg) {
    if (DOM.errorState) {
      if (DOM.errorDetailsText) DOM.errorDetailsText.textContent = msg;
      DOM.errorState.style.display = "block";
    }
    if (DOM.timelineContainer) DOM.timelineContainer.innerHTML = "";
  }

  function hideError() {
    if (DOM.errorState) DOM.errorState.style.display = "none";
  }

  function updateClockDisplay() {
    if (!DOM.currentTimeBadge) return;
    const now = getNowInKolkata();
    DOM.currentTimeBadge.textContent = `${formatTimeAMPM(now)} IST`;
  }

  function updateLastSyncedDisplay() {
    if (!DOM.lastSyncedText || !state.lastSyncTime) return;
    DOM.lastSyncedText.textContent = `Synced: ${formatTimeAMPM(state.lastSyncTime)}`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Refresh button
    if (DOM.refreshBtn) {
      DOM.refreshBtn.addEventListener("click", () => {
        fetchTimetableData(true);
      });
    }

    // Retry button
    if (DOM.retryBtn) {
      DOM.retryBtn.addEventListener("click", () => {
        hideError();
        fetchTimetableData(true);
      });
    }

    // Filter Settings Button
    if (DOM.filterSettingsBtn) {
      DOM.filterSettingsBtn.addEventListener("click", openSettingsModal);
    }
    if (DOM.settingsCloseBtn) {
      DOM.settingsCloseBtn.addEventListener("click", closeSettingsModal);
    }
    if (DOM.settingsModal) {
      DOM.settingsModal.addEventListener("click", (e) => {
        if (e.target === DOM.settingsModal) closeSettingsModal();
      });
    }

    // Save Settings
    if (DOM.settingsSaveBtn) {
      DOM.settingsSaveBtn.addEventListener("click", () => {
        state.strictCollegeFilter = DOM.strictFilterToggle ? DOM.strictFilterToggle.checked : true;
        state.customIncludeWords = DOM.customIncludeInput ? DOM.customIncludeInput.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
        state.customExcludeWords = DOM.customExcludeInput ? DOM.customExcludeInput.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
        saveSettings();
        closeSettingsModal();
        fetchTimetableData(false);
      });
    }

    // Reset Settings
    if (DOM.settingsResetBtn) {
      DOM.settingsResetBtn.addEventListener("click", () => {
        state.strictCollegeFilter = true;
        state.customIncludeWords = [];
        state.customExcludeWords = [];
        state.manualExcludedUids.clear();
        saveSettings();
        closeSettingsModal();
        fetchTimetableData(false);
      });
    }

    // View tabs
    if (DOM.viewTabs) {
      DOM.viewTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          DOM.viewTabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          state.activeView = tab.getAttribute("data-view");
          renderTimeline();
        });
      });
    }

    // Subject Pills
    if (DOM.subjectPills) {
      DOM.subjectPills.forEach((pill) => {
        pill.addEventListener("click", () => {
          DOM.subjectPills.forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");
          state.selectedSubject = pill.getAttribute("data-subject");
          renderTimeline();
        });
      });
    }

    // Session Type Select
    if (DOM.typeSelect) {
      DOM.typeSelect.addEventListener("change", (e) => {
        state.selectedSessionType = e.target.value;
        renderTimeline();
      });
    }

    // Search input
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        if (DOM.searchClear) DOM.searchClear.style.display = state.searchQuery ? "block" : "none";
        renderTimeline();
      });
    }
    if (DOM.searchClear) {
      DOM.searchClear.addEventListener("click", () => {
        state.searchQuery = "";
        DOM.searchInput.value = "";
        DOM.searchClear.style.display = "none";
        renderTimeline();
      });
    }

    // Details Modal Close
    if (DOM.detailsCloseBtn) {
      DOM.detailsCloseBtn.addEventListener("click", closeDetailsModal);
    }
    if (DOM.detailsModal) {
      DOM.detailsModal.addEventListener("click", (e) => {
        if (e.target === DOM.detailsModal) closeDetailsModal();
      });
    }

    // Global Keybindings (ESC to close modals)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDetailsModal();
        closeSettingsModal();
      }
    });

    // Mobile slide-out nav drawer
    const mobileToggle = document.getElementById("mobile-toggle");
    const navLinks = document.getElementById("nav-links");
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        const expanded = navLinks.classList.contains("open");
        mobileToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      });
    }
  }

  // --- Initializer ---
  function init() {
    initDOM();
    loadSettings();
    setupEventListeners();

    // Set initial selected day to today (if Mon-Sat)
    const now = getNowInKolkata();
    const dayOfWeek = now.getDay();
    state.selectedDayIndex = dayOfWeek === 0 ? 1 : dayOfWeek; // Default to Mon if Sun

    // Update live clock every second
    updateClockDisplay();
    setInterval(updateClockDisplay, 1000);

    // Update Happening Now banner every 30 seconds
    setInterval(renderHappeningNowBanner, 30000);

    // Initial load: render cached data first if present, then fetch fresh
    const cached = loadFromLocalStorage();
    if (cached && cached.length > 0) {
      onFetchSuccess(cached, "init_cache");
    }

    // Background fetch fresh data
    fetchTimetableData(false);

    // Auto-refresh every 15 minutes
    setInterval(() => {
      fetchTimetableData(false);
    }, REFRESH_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
