/**
 * Harsh's Library - Notification Center & Web Push Engine
 * Refined, Information-Dense In-App Notification Feed with Read/Unread State,
 * Date Grouping, and Low-Profile Push Notification Controls.
 * 
 * Free • Zero-Backend • Dual Cookie + LocalStorage Persistence
 */

(() => {
  "use strict";

  const ONESIGNAL_APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe";
  const COOKIE_NAME = "mbbs_push_status";
  const STORAGE_READ_IDS = "mbbs_read_notif_ids";
  const STORAGE_MARK_ALL = "mbbs_notif_mark_all_ts";
  const STORAGE_INIT = "mbbs_notif_init_v2";

  const PUSH_RESET_KEY = "mbbs_push_clean_v5_20261112";
  const path = (typeof window !== "undefined" && window.location && window.location.pathname) || "/";
  const isRepo = path.startsWith("/mbbs-library");
  const repoBase = isRepo ? "/mbbs-library/" : "/";
  const swPath = "OneSignalSDKWorker.js";
  const swScope = repoBase;

  // Immediate clean-slate purge of legacy subscription cache
  try {
    if (localStorage.getItem(PUSH_RESET_KEY) !== "true") {
      localStorage.removeItem(COOKIE_NAME);
      localStorage.removeItem("mbbs_push_opted_out");
      localStorage.removeItem("mbbs_bell_prompt_shown");
      setCookie(COOKIE_NAME, "", -1);
      localStorage.setItem(PUSH_RESET_KEY, "true");
    }
  } catch (_) {}

  let oneSignalInstance = null;
  let activeTab = "unread"; // 'unread' or 'all' (defaults to 'unread')
  let isNotifCenterOpen = false;

  // Pinned Welcome Notification
  const WELCOME_ANNOUNCEMENT = {
    id: "system-welcome-library",
    title: "Welcome to Harsh's Library! 🎉",
    subject: "general",
    category: "announcement",
    code: "Harsh's Library",
    description: "All 1st Year MBBS study materials, Johari notes, histology workbooks, and university PYQs are 100% free with offline PWA support.",
    date: "11 Nov 2026",
    updatedAt: 1794200000,
    fileSize: "Offline Ready",
    pages: "50+ Resources",
    isAnnouncement: true
  };

  // --- Cookie Helpers ---
  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
      return match ? decodeURIComponent(match[2]) : null;
    } catch (_) {
      return null;
    }
  }

  function setCookie(name, value, days = 365) {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
    } catch (_) {}
  }

  // --- Dual Storage Status (Cookie + LocalStorage) ---
  function getStoredStatus() {
    const fromCookie = getCookie(COOKIE_NAME);
    if (fromCookie) return fromCookie;
    try {
      return localStorage.getItem(COOKIE_NAME);
    } catch (_) {
      return null;
    }
  }

  function setStoredStatus(status) {
    setCookie(COOKIE_NAME, status);
    try {
      localStorage.setItem(COOKIE_NAME, status);
    } catch (_) {}
  }

  /**
   * Determine push subscription state reliably across all devices & browsers.
   */
  function isCurrentlySubscribed() {
    // If browser doesn't support notifications or permission is not granted, device cannot receive push
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return false;
    }

    if (localStorage.getItem("mbbs_push_opted_out") === "true") {
      return false;
    }

    // Rely strictly on OneSignal SDK state when available
    if (
      oneSignalInstance &&
      oneSignalInstance.User &&
      oneSignalInstance.User.PushSubscription &&
      typeof oneSignalInstance.User.PushSubscription.optedIn === "boolean"
    ) {
      return oneSignalInstance.User.PushSubscription.optedIn;
    }

    // Do NOT return true prior to OneSignal confirmation
    return false;
  }

  // --- Read / Unread Storage & Logic ---
  function getReadIds() {
    try {
      const raw = localStorage.getItem(STORAGE_READ_IDS);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveReadIds(set) {
    try {
      localStorage.setItem(STORAGE_READ_IDS, JSON.stringify([...set]));
    } catch (_) {}
  }

  function getMarkAllTimestamp() {
    try {
      return parseInt(localStorage.getItem(STORAGE_MARK_ALL) || "0", 10);
    } catch (_) {
      return 0;
    }
  }

  /**
   * Constructs the full notification feed from MBBS_RESOURCES + Welcome Announcement.
   */
  function getNotificationFeed() {
    let rawList = [];
    if (typeof MBBS_RESOURCES !== "undefined" && Array.isArray(MBBS_RESOURCES)) {
      rawList = MBBS_RESOURCES.slice();
    } else if (typeof window !== "undefined" && Array.isArray(window.MBBS_RESOURCES)) {
      rawList = window.MBBS_RESOURCES.slice();
    }

    // Sort by updatedAt descending (newest first)
    rawList.sort((a, b) => {
      const tA = Number(a.updatedAt) || 0;
      const tB = Number(b.updatedAt) || 0;
      return tB - tA;
    });

    const feed = [WELCOME_ANNOUNCEMENT, ...rawList];

    // First-visit initialization: seed older items as read so new user sees top 3 as unread
    if (!localStorage.getItem(STORAGE_INIT)) {
      try {
        localStorage.setItem(STORAGE_INIT, "1");
        if (rawList.length >= 4 && rawList[3].updatedAt) {
          localStorage.setItem(STORAGE_MARK_ALL, String(rawList[3].updatedAt));
        }
      } catch (_) {}
    }

    return feed;
  }

  function isItemUnread(item) {
    const readIds = getReadIds();
    if (readIds.has(item.id)) return false;

    const markAllTs = getMarkAllTimestamp();
    if (item.updatedAt && item.updatedAt <= markAllTs) return false;

    return true;
  }

  function getUnreadCount() {
    const feed = getNotificationFeed();
    return feed.filter(isItemUnread).length;
  }

  function markItemRead(id) {
    const readIds = getReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    updateBellUI();
    renderNotificationCenterContent();
  }

  function markAllRead() {
    try {
      localStorage.setItem(STORAGE_MARK_ALL, String(Math.floor(Date.now() / 1000)));
      const readIds = getReadIds();
      readIds.add(WELCOME_ANNOUNCEMENT.id);
      saveReadIds(readIds);
    } catch (_) {}
    updateBellUI();
    renderNotificationCenterContent();
  }

  // --- Push Subscription Actions ---
  async function subscribeToPush() {
    // 1. Check iOS Safari standalone constraint
    const userAgent = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(typeof window !== "undefined" && window.MSStream);
    const isStandalone = Boolean(
      (typeof window !== "undefined" && window.navigator && window.navigator.standalone) ||
      (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
    );
    if (isIOS && !isStandalone) {
      alert(
        "📱 iPhone / iPad Setup:\n\n" +
        "Apple requires web apps to be added to your Home Screen before notifications can work:\n\n" +
        "1. Tap Share in Safari.\n" +
        "2. Tap 'Add to Home Screen'.\n" +
        "3. Open Harsh's Library from your Home Screen to activate alerts!"
      );
      return;
    }

    // 2. Check browser support
    if (!("Notification" in window)) {
      alert("Push notifications are not supported by this browser.");
      return;
    }

    // 3. Check blocked permissions
    if (Notification.permission === "denied") {
      alert(
        "⚠️ Notifications are blocked in your browser settings.\n\n" +
        "To enable alerts:\n" +
        "1. Tap the lock/tune/settings icon beside the URL in the address bar.\n" +
        "2. Choose Site Settings -> Notifications -> Allow.\n" +
        "3. Reload the page."
      );
      return;
    }

    // 4. Request browser permission
    let perm = Notification.permission;
    if (perm !== "granted") {
      try {
        if (oneSignalInstance && oneSignalInstance.Notifications && typeof oneSignalInstance.Notifications.requestPermission === "function") {
          const accepted = await oneSignalInstance.Notifications.requestPermission();
          perm = accepted ? "granted" : Notification.permission;
        } else {
          perm = await Notification.requestPermission();
        }
      } catch (_) {
        perm = await new Promise((res) => Notification.requestPermission(res));
      }
    }

    if (perm !== "granted") {
      updateBellUI();
      renderPushBar();
      return;
    }

    // 5. Provide active feedback & clear opt-out flag
    const toggleBtn = document.getElementById("notif-push-toggle-btn");
    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Connecting...";
    }
    try { localStorage.removeItem("mbbs_push_opted_out"); } catch (_) {}

    // 6. Complete registration via OneSignal SDK
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optIn();
      } else if (window.OneSignalDeferred) {
        await new Promise((resolve) => {
          window.OneSignalDeferred.push(async function (OneSignal) {
            try {
              if (OneSignal.User && OneSignal.User.PushSubscription) {
                await OneSignal.User.PushSubscription.optIn();
              }
            } catch (_) {}
            resolve();
          });
        });
      }
      setStoredStatus("subscribed");
    } catch (e) {
      console.warn("[Push] OneSignal optIn notice:", e);
    }

    updateBellUI();
    renderPushBar();
  }

  async function unsubscribeFromPush() {
    try { localStorage.setItem("mbbs_push_opted_out", "true"); } catch (_) {}
    setStoredStatus("unsubscribed");
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optOut();
      }
    } catch (e) {
      console.warn("[Push] OneSignal optOut notice:", e);
    }
    updateBellUI();
    renderPushBar();
  }

  async function resumePush() {
    try { localStorage.removeItem("mbbs_push_opted_out"); } catch (_) {}
    setStoredStatus("subscribed");
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optIn();
      }
    } catch (e) {
      console.warn("[Push] OneSignal resume notice:", e);
    }
    updateBellUI();
    renderPushBar();
  }

  // --- Push Alerts Bar in Notification Center ---
  function renderPushBar() {
    const bar = document.getElementById("notif-push-bar");
    if (!bar) return;

    const isSubscribed = isCurrentlySubscribed();
    const isDenied = "Notification" in window && Notification.permission === "denied";

    if (isDenied) {
      bar.innerHTML = `
        <div class="notif-push-left">
          <span class="notif-push-icon">⚠️</span>
          <div class="notif-push-text-wrap">
            <span class="notif-push-label">Alerts Blocked</span>
            <span class="notif-push-desc">Enable in browser site settings</span>
          </div>
        </div>
        <button type="button" class="notif-push-action-btn btn-blocked" id="notif-push-toggle-btn">
          How to Fix
        </button>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) {
        btn.onclick = () => {
          alert(
            "⚠️ Notifications are blocked in your browser settings.\n\n" +
            "To enable alerts:\n" +
            "1. Tap the lock/tune/settings icon beside the URL in your browser address bar.\n" +
            "2. Select 'Site settings' -> 'Notifications' -> 'Allow'.\n" +
            "3. Refresh the page to activate instant study notifications!"
          );
        };
      }
      return;
    }

    if (isSubscribed) {
      bar.innerHTML = `
        <div class="notif-push-left">
          <span class="notif-push-icon" style="color: #059669; font-size: 0.85rem;">●</span>
          <div class="notif-push-text-wrap">
            <span class="notif-push-label">Device Alerts Active</span>
            <span class="notif-push-desc">Receiving instant study notifications</span>
          </div>
        </div>
        <button type="button" class="notif-push-action-btn btn-disable" id="notif-push-toggle-btn">
          Turn Off
        </button>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) btn.onclick = () => unsubscribeFromPush();
    } else {
      bar.innerHTML = `
        <div class="notif-push-left">
          <span class="notif-push-icon">🔔</span>
          <div class="notif-push-text-wrap">
            <span class="notif-push-label">Device Push Alerts</span>
            <span class="notif-push-desc">Get notified when new notes or books are uploaded</span>
          </div>
        </div>
        <button type="button" class="notif-push-action-btn btn-enable" id="notif-push-toggle-btn">
          Turn On
        </button>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) btn.onclick = () => subscribeToPush();
    }
  }

  // --- Date Grouping Helper ---
  function getItemDateGroup(item) {
    if (item.isAnnouncement) {
      return "Notice";
    }

    const itemDateStr = String(item.date || "").trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toLowerCase();
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toLowerCase();

    const cleanItem = itemDateStr.replace(/^0+/, "");
    const cleanToday = todayStr.replace(/^0+/, "");
    const cleanYesterday = yesterdayStr.replace(/^0+/, "");

    if (itemDateStr.includes("today") || cleanItem === cleanToday || itemDateStr.includes("11 nov 2026")) {
      return "Today";
    }
    if (itemDateStr.includes("yesterday") || cleanItem === cleanYesterday || itemDateStr.includes("10 nov 2026")) {
      return "Yesterday";
    }

    // Check timestamps if available
    if (item.updatedAt) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
      const yesterdayStart = todayStart - 86400;
      if (item.updatedAt >= todayStart) return "Today";
      if (item.updatedAt >= yesterdayStart) return "Yesterday";
    }

    return "Earlier";
  }

  // --- Bell & Header UI Updates ---
  function updateBellUI() {
    const isSubscribed = isCurrentlySubscribed();
    const unreadCount = getUnreadCount();

    // Top Header Quick Bell
    const bellBtns = document.querySelectorAll(".push-top-bell-btn");
    bellBtns.forEach((btn) => {
      btn.style.display = "inline-flex";

      // Small emerald unread dot positioned at top-right corner
      let statusDot = btn.querySelector(".bell-status-dot");
      if (!statusDot) {
        statusDot = document.createElement("span");
        statusDot.className = "bell-status-dot";
        statusDot.setAttribute("aria-hidden", "true");
        btn.appendChild(statusDot);
      }

      // Hide legacy/unused badge pill if present so dot remains clean
      const badge = btn.querySelector(".bell-unread-badge");
      if (badge) {
        badge.style.display = "none";
      }

      // Display emerald unread dot whenever there are unread notifications
      if (unreadCount > 0) {
        statusDot.style.display = "block";
      } else {
        statusDot.style.display = "none";
      }

      if (isSubscribed) {
        btn.classList.add("is-subscribed");
      } else {
        btn.classList.remove("is-subscribed");
      }

      btn.setAttribute(
        "title",
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
          : isSubscribed
          ? "Notifications (Alerts Active)"
          : "Notifications"
      );
      btn.setAttribute(
        "aria-label",
        unreadCount > 0
          ? `Notifications (${unreadCount} unread)`
          : "Notifications"
      );
      btn.setAttribute("aria-expanded", String(isNotifCenterOpen));
    });

    // Footer notification button
    const footerButtons = document.querySelectorAll(".push-footer-btn");
    footerButtons.forEach((btn) => {
      btn.style.display = "inline-flex";
      const countSuffix = unreadCount > 0 ? ` (${unreadCount})` : "";
      btn.textContent = `🔔 Notifications${countSuffix}`;
      if (isSubscribed) {
        btn.classList.add("is-subscribed");
      } else {
        btn.classList.remove("is-subscribed");
      }
    });

    // Update modal header pill
    const modalPill = document.getElementById("notif-unread-count-pill");
    if (modalPill) {
      if (unreadCount > 0) {
        modalPill.textContent = `${unreadCount} new`;
        modalPill.classList.remove("is-zero");
      } else {
        modalPill.textContent = "All read";
        modalPill.classList.add("is-zero");
      }
    }

    // Update Mark All Read button state
    const markAllBtn = document.getElementById("notif-mark-all-read");
    if (markAllBtn) {
      if (unreadCount > 0) {
        markAllBtn.disabled = false;
        markAllBtn.classList.remove("is-disabled");
        markAllBtn.removeAttribute("aria-disabled");
      } else {
        markAllBtn.disabled = true;
        markAllBtn.classList.add("is-disabled");
        markAllBtn.setAttribute("aria-disabled", "true");
      }
    }

    // Update segmented control tab counts
    const allTabCount = document.getElementById("notif-tab-all-count");
    const unreadTabCount = document.getElementById("notif-tab-unread-count");
    const feed = getNotificationFeed();
    if (allTabCount) allTabCount.textContent = String(feed.length);
    if (unreadTabCount) {
      unreadTabCount.textContent = String(unreadCount);
      if (unreadCount > 0) {
        unreadTabCount.classList.add("has-unread");
      } else {
        unreadTabCount.classList.remove("has-unread");
      }
    }
  }

  // --- Switch Segmented Tab (Unread / All) ---
  function switchTab(tabName) {
    activeTab = tabName === "all" ? "all" : "unread";
    const tabAll = document.getElementById("notif-tab-all");
    const tabUnread = document.getElementById("notif-tab-unread");
    if (activeTab === "unread") {
      if (tabUnread) {
        tabUnread.classList.add("is-active");
        tabUnread.setAttribute("aria-selected", "true");
      }
      if (tabAll) {
        tabAll.classList.remove("is-active");
        tabAll.setAttribute("aria-selected", "false");
      }
    } else {
      if (tabAll) {
        tabAll.classList.add("is-active");
        tabAll.setAttribute("aria-selected", "true");
      }
      if (tabUnread) {
        tabUnread.classList.remove("is-active");
        tabUnread.setAttribute("aria-selected", "false");
      }
    }
    renderNotificationCenterContent();
  }

  // --- Notification Center Feed Rendering with Date Grouping ---
  function renderNotificationCenterContent() {
    renderPushBar();
    const container = document.getElementById("notif-feed-container");
    const emptyState = document.getElementById("notif-empty-state");
    if (!container) return;

    const feed = getNotificationFeed();
    const filtered = activeTab === "unread" ? feed.filter(isItemUnread) : feed;

    if (filtered.length === 0) {
      container.innerHTML = "";
      if (emptyState) {
        emptyState.style.display = "flex";
        const emptyTitle = emptyState.querySelector(".notif-empty-title");
        const emptyDesc = emptyState.querySelector(".notif-empty-desc");
        if (activeTab === "unread") {
          if (emptyTitle) emptyTitle.textContent = "All caught up! 🎉";
          if (emptyDesc) emptyDesc.textContent = "No unread notifications right now. Check back when new materials are added.";
        } else {
          if (emptyTitle) emptyTitle.textContent = "No notifications";
          if (emptyDesc) emptyDesc.textContent = "Study resources and updates will appear here.";
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    // Date grouping: Notice, Today, Yesterday, Earlier
    const groupOrder = ["Notice", "Today", "Yesterday", "Earlier"];
    const grouped = {
      Notice: [],
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    filtered.forEach((item) => {
      const g = getItemDateGroup(item);
      if (grouped[g]) {
        grouped[g].push(item);
      } else {
        grouped.Earlier.push(item);
      }
    });

    let html = "";

    groupOrder.forEach((groupName) => {
      const itemsInGroup = grouped[groupName];
      if (!itemsInGroup || itemsInGroup.length === 0) return;

      const groupLabel = groupName === "Notice" ? "Pinned Notice" : groupName;
      html += `<div class="notif-group-header">${escapeHtml(groupLabel)}</div>`;

      itemsInGroup.forEach((item) => {
        const unread = isItemUnread(item);
        let subKey = "general";
        let subjectIcon = "🩺";
        let subjectLabel = "Library";

        const sub = (item.subject || "").toLowerCase();
        if (sub === "anatomy") {
          subKey = "anatomy";
          subjectIcon = "🦴";
          subjectLabel = "Anatomy";
        } else if (sub === "physiology") {
          subKey = "physiology";
          subjectIcon = "🫀";
          subjectLabel = "Physiology";
        } else if (sub === "biochemistry") {
          subKey = "biochemistry";
          subjectIcon = "🧪";
          subjectLabel = "Biochemistry";
        } else if (item.isAnnouncement) {
          subKey = "general";
          subjectIcon = "📢";
          subjectLabel = "Notice";
        }

        let categoryLabel = item.category ? item.category.toUpperCase() : "Resource";
        if (item.category === "notes") categoryLabel = "Notes";
        else if (item.category === "practicals") categoryLabel = "Practical";
        else if (item.category === "assignments") categoryLabel = "Assignment";
        else if (item.category === "sdls" || item.category === "sdl") categoryLabel = "SDL";
        else if (item.category === "other") categoryLabel = "PYQ / Extra";
        else if (item.isAnnouncement) categoryLabel = "Update";

        // Build lightweight inline metadata string (e.g. "41 pages · 220 KB")
        const metaParts = [];
        if (item.pages) {
          metaParts.push(item.pages.toLowerCase().replace("pages", "p."));
        }
        if (item.fileSize) {
          metaParts.push(item.fileSize);
        }
        const inlineMeta = metaParts.length > 0 ? `· ${metaParts.join(" · ")}` : "";

        // Subtle relative date for Earlier group
        const dateTag = (groupName === "Earlier" && item.date) ? `· ${item.date}` : "";

        html += `
          <div class="notif-item ${unread ? "is-unread" : "is-read"}" data-id="${escapeHtml(item.id)}" role="button" tabindex="0">
            <div class="notif-item-icon notif-accent-${escapeHtml(subKey)}" aria-hidden="true">
              <span>${subjectIcon}</span>
            </div>
            <div class="notif-item-content">
              <div class="notif-item-header">
                <h4 class="notif-item-title">${escapeHtml(item.title)}</h4>
                ${unread ? '<span class="notif-dot-unread" title="Unread" aria-label="Unread"></span>' : ""}
              </div>
              <div class="notif-item-sub">
                <span class="notif-dept-tag notif-dept-${escapeHtml(subKey)}">${escapeHtml(subjectLabel)} · ${escapeHtml(categoryLabel)}</span>
                ${inlineMeta ? `<span class="notif-meta-inline">${escapeHtml(inlineMeta)}</span>` : ""}
                ${dateTag ? `<span class="notif-date-inline">${escapeHtml(dateTag)}</span>` : ""}
              </div>
            </div>
          </div>
        `;
      });
    });

    container.innerHTML = html;

    // Attach click listeners to cards
    const cards = container.querySelectorAll(".notif-item");
    cards.forEach((card) => {
      const clickHandler = (e) => {
        e.preventDefault();
        const id = card.dataset.id;
        if (!id) return;

        // Mark as read immediately
        markItemRead(id);

        // Find resource
        const feedItem = feed.find((r) => r.id === id);
        if (!feedItem) {
          closeNotificationCenter();
          return;
        }

        if (feedItem.isAnnouncement) {
          closeNotificationCenter();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Open in modal viewer if available on current page
        if (typeof window.openPdfModal === "function" && document.getElementById("pdf-modal")) {
          closeNotificationCenter();
          window.openPdfModal(id);
        } else {
          // If on a page without the modal, navigate with ?view=
          closeNotificationCenter();
          if (isRepo) {
            window.location.href = `/mbbs-library/index.html?view=${encodeURIComponent(id)}`;
          } else {
            window.location.href = `index.html?view=${encodeURIComponent(id)}`;
          }
        }
      };

      card.addEventListener("click", clickHandler);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          clickHandler(e);
        }
      });
    });
  }

  // --- Ensure DOM Elements ---
  function ensureNotificationCenterDOM() {
    if (document.getElementById("mbbs-notif-center")) return;

    const modal = document.createElement("div");
    modal.id = "mbbs-notif-center";
    modal.className = "notif-center-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "notif-center-title");

    modal.innerHTML = `
      <div class="notif-backdrop" id="notif-backdrop"></div>
      <div class="notif-panel" id="notif-panel">
        <div class="notif-drag-zone" id="notif-drag-zone" role="button" tabindex="0" aria-label="Slide down to close">
          <div class="notif-drag-bar" id="notif-drag-bar" aria-hidden="true"></div>
        </div>

        <!-- Compact Header -->
        <div class="notif-header" id="notif-header">
          <div class="notif-header-title-wrap">
            <h3 id="notif-center-title" class="notif-title">Notifications</h3>
            <span class="notif-pill-badge" id="notif-unread-count-pill">0 new</span>
          </div>
          <div class="notif-header-actions">
            <button type="button" class="notif-action-btn" id="notif-mark-all-read" title="Mark all notifications as read">
              Mark all read
            </button>
            <button type="button" class="notif-close-btn" id="notif-close-btn" aria-label="Close notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Slim Segmented Control (All / Unread) -->
        <div class="notif-segmented-wrap">
          <div class="notif-segmented" role="tablist">
            <button type="button" class="notif-seg-btn" data-tab="all" id="notif-tab-all" role="tab" aria-selected="false">
              <span>All</span>
              <span class="notif-seg-count" id="notif-tab-all-count">0</span>
            </button>
            <button type="button" class="notif-seg-btn is-active" data-tab="unread" id="notif-tab-unread" role="tab" aria-selected="true">
              <span>Unread</span>
              <span class="notif-seg-count" id="notif-tab-unread-count">0</span>
            </button>
          </div>
        </div>

        <!-- Feed List Container -->
        <div class="notif-feed-container" id="notif-feed-container" tabindex="0"></div>

        <!-- Empty State -->
        <div class="notif-empty-state" id="notif-empty-state" style="display: none;">
          <div class="notif-empty-icon">🎉</div>
          <h4 class="notif-empty-title">All caught up!</h4>
          <p class="notif-empty-desc">No unread notifications right now. Check back when new medical resources are uploaded.</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    const backdrop = document.getElementById("notif-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeNotificationCenter);

    const closeBtn = document.getElementById("notif-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeNotificationCenter);

    const markAllBtn = document.getElementById("notif-mark-all-read");
    if (markAllBtn) markAllBtn.addEventListener("click", markAllRead);

    // Segmented tab buttons
    const tabAll = document.getElementById("notif-tab-all");
    const tabUnread = document.getElementById("notif-tab-unread");

    if (tabAll) {
      tabAll.addEventListener("click", () => switchTab("all"));
    }

    if (tabUnread) {
      tabUnread.addEventListener("click", () => switchTab("unread"));
    }

    // Initialize swipe-down to close drawer gesture on the drag bar / handle
    initDrawerSwipeGesture();

    // Keyboard navigation: Escape key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isNotifCenterOpen) {
        closeNotificationCenter();
      }
    });
  }

  // --- Notification Drawer Swipe-Down Gesture Controller ---
  function initDrawerSwipeGesture() {
    const dragZone = document.getElementById("notif-drag-zone");
    const header = document.getElementById("notif-header");
    const panel = document.getElementById("notif-panel");
    const backdrop = document.getElementById("notif-backdrop");
    if (!dragZone || !panel) return;

    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    let dragRaf = null;

    function handleStart(clientY) {
      if (window.innerWidth >= 768) return;
      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = null;
      }
      isDragging = true;
      startY = clientY;
      currentY = clientY;
      startTime = Date.now();
      panel.style.transition = "none";
      if (backdrop) backdrop.style.transition = "none";
      dragZone.classList.add("is-dragging");
    }

    function handleMove(clientY) {
      if (!isDragging) return;
      currentY = clientY;
      if (!dragRaf) {
        dragRaf = requestAnimationFrame(() => {
          dragRaf = null;
          if (!isDragging) return;
          const deltaY = currentY - startY;
          if (deltaY > 0) {
            // Dragging downward: track finger with panel
            panel.style.transform = `translateY(${deltaY}px)`;
            if (backdrop) {
              const opacity = Math.max(0.08, 1 - (deltaY / 380));
              backdrop.style.opacity = String(opacity);
            }
          } else {
            // Dragging upward: apply heavy rubber-band resistance
            panel.style.transform = `translateY(${deltaY * 0.16}px)`;
          }
        });
      }
    }

    function handleEnd() {
      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = null;
      }
      if (!isDragging) return;
      isDragging = false;
      dragZone.classList.remove("is-dragging");

      const deltaY = currentY - startY;
      const elapsed = Math.max(1, Date.now() - startTime);
      const velocityY = deltaY / elapsed;

      // Restore transitions
      panel.style.transition = "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)";
      if (backdrop) backdrop.style.transition = "opacity 0.22s ease";

      // Dismiss if dragged down > 65px or quick downward flick (> 0.35 px/ms with > 20px drag)
      if (deltaY > 65 || (velocityY > 0.35 && deltaY > 20)) {
        panel.style.transform = "translateY(100%)";
        if (backdrop) backdrop.style.opacity = "0";
        setTimeout(() => {
          closeNotificationCenter();
          panel.style.transform = "";
          panel.style.transition = "";
          if (backdrop) {
            backdrop.style.opacity = "";
            backdrop.style.transition = "";
          }
        }, 220);
      } else {
        // Snap back
        panel.style.transform = "translateY(0)";
        if (backdrop) backdrop.style.opacity = "";
        setTimeout(() => {
          panel.style.transform = "";
          panel.style.transition = "";
          if (backdrop) {
            backdrop.style.opacity = "";
            backdrop.style.transition = "";
          }
        }, 240);
      }
    }

    // Bind to drag handle bar and header
    const touchZones = [dragZone, header].filter(Boolean);
    touchZones.forEach((zone) => {
      if (window.PointerEvent) {
        zone.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          if (e.target && e.target.closest("button, a, input, select, [role='button']")) {
            if (e.target !== dragZone && !dragZone.contains(e.target)) return;
          }
          handleStart(e.clientY);
          try {
            zone.setPointerCapture(e.pointerId);
          } catch (_) {}
        }, { passive: true });

        zone.addEventListener("pointermove", (e) => {
          handleMove(e.clientY);
        }, { passive: true });

        zone.addEventListener("pointerup", (e) => {
          try {
            zone.releasePointerCapture(e.pointerId);
          } catch (_) {}
          handleEnd();
        }, { passive: true });

        zone.addEventListener("pointercancel", (e) => {
          try {
            zone.releasePointerCapture(e.pointerId);
          } catch (_) {}
          handleEnd();
        }, { passive: true });
      } else {
        zone.addEventListener("touchstart", (e) => {
          if (e.target && e.target.closest("button, a, input, select, [role='button']")) {
            if (e.target !== dragZone && !dragZone.contains(e.target)) return;
          }
          if (e.touches && e.touches.length === 1) handleStart(e.touches[0].clientY);
        }, { passive: true });

        zone.addEventListener("touchmove", (e) => {
          if (e.touches && e.touches.length === 1) handleMove(e.touches[0].clientY);
        }, { passive: true });

        zone.addEventListener("touchend", () => {
          handleEnd();
        }, { passive: true });

        zone.addEventListener("touchcancel", () => {
          handleEnd();
        }, { passive: true });
      }
    });

    // Keyboard support on drag zone
    dragZone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        closeNotificationCenter();
      }
    });
  }

  // --- Robust Page Scroll Locking Engine ---
  let savedScrollY = 0;
  let savedScrollX = 0;
  let isScrollLocked = false;
  let touchStartY = 0;
  let lastTouchY = 0;
  let touchStartX = 0;

  function handleModalTouchStart(e) {
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      lastTouchY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }

  function handleModalTouchMove(e) {
    if (!isNotifCenterOpen) return;
    const feedContainer = document.getElementById("notif-feed-container");
    const target = e.target;

    // 1. If touch is on non-scrollable areas (backdrop, header, drag bar, tabs, empty state)
    if (!feedContainer || !feedContainer.contains(target)) {
      if (e.cancelable) {
        e.preventDefault();
      }
      return;
    }

    // 2. If touch is inside the feed container, contain scroll & prevent background bleed
    if (e.touches && e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const stepDeltaY = currentY - lastTouchY; // Positive = pulling downward, Negative = dragging upward
      const deltaX = currentX - touchStartX;
      lastTouchY = currentY;

      // Disallow horizontal gestures from chaining outward
      if (Math.abs(deltaX) > Math.abs(currentY - touchStartY) && Math.abs(deltaX) > 12) {
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      const scrollTop = feedContainer.scrollTop;
      const maxScroll = feedContainer.scrollHeight - feedContainer.clientHeight;

      // If feed list does not have overflow/scrollable height
      if (maxScroll <= 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      // At top boundary: pulling downward would trigger pull-to-refresh or background bleed
      if (scrollTop <= 0 && stepDeltaY > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      // At bottom boundary: dragging upward would bleed into background page scroll
      if (scrollTop >= maxScroll - 1 && stepDeltaY < 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }
    }
  }

  function handleModalWheel(e) {
    if (!isNotifCenterOpen) return;
    const feedContainer = document.getElementById("notif-feed-container");
    const target = e.target;

    // Non-feed areas: completely block wheel scroll chaining
    if (!feedContainer || !feedContainer.contains(target)) {
      if (e.cancelable) e.preventDefault();
      return;
    }

    const deltaY = e.deltaY;
    const scrollTop = feedContainer.scrollTop;
    const maxScroll = feedContainer.scrollHeight - feedContainer.clientHeight;

    if (maxScroll <= 0) {
      if (e.cancelable) e.preventDefault();
      return;
    }

    // Top boundary scrolling up
    if (scrollTop <= 0 && deltaY < 0) {
      if (e.cancelable) e.preventDefault();
      return;
    }

    // Bottom boundary scrolling down
    if (scrollTop >= maxScroll - 1 && deltaY > 0) {
      if (e.cancelable) e.preventDefault();
      return;
    }
  }

  function lockPageScroll() {
    if (isScrollLocked) return;

    // Capture exact scroll position before any DOM or style adjustments
    savedScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    savedScrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;

    // Measure scrollbar width to prevent horizontal layout shift on desktop
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    isScrollLocked = true;
    document.documentElement.classList.add("notif-center-open");
    document.body.classList.add("notif-center-open");

    const modal = document.getElementById("mbbs-notif-center");
    if (modal) {
      modal.addEventListener("touchstart", handleModalTouchStart, { passive: true });
      modal.addEventListener("touchmove", handleModalTouchMove, { passive: false });
      modal.addEventListener("wheel", handleModalWheel, { passive: false });
    }
  }

  function unlockPageScroll() {
    if (!isScrollLocked) return;

    const modal = document.getElementById("mbbs-notif-center");
    if (modal) {
      modal.removeEventListener("touchstart", handleModalTouchStart);
      modal.removeEventListener("touchmove", handleModalTouchMove);
      modal.removeEventListener("wheel", handleModalWheel);
    }

    document.documentElement.classList.remove("notif-center-open");
    document.body.classList.remove("notif-center-open");
    document.body.style.paddingRight = "";

    isScrollLocked = false;

    // Restore original scroll position cleanly without jitter
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(savedScrollX, savedScrollY);
    html.style.scrollBehavior = prevScrollBehavior;
  }

  // --- First-Time Bell Notification Prompt ---
  function triggerBellNotificationPrompt() {
    // 1. Only prompt if browser supports notifications and user has not yet decided
    if (!("Notification" in window) || Notification.permission !== "default") {
      return;
    }
    // 2. Do not prompt if user explicitly opted out previously
    if (localStorage.getItem("mbbs_push_opted_out") === "true") {
      return;
    }
    // 3. Only show on the very first time the bell icon is pressed
    if (localStorage.getItem("mbbs_bell_prompt_shown") === "true") {
      return;
    }

    try {
      localStorage.setItem("mbbs_bell_prompt_shown", "true");
    } catch (_) {}

    const showPrompt = (OneSignal) => {
      try {
        if (OneSignal && OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === "function") {
          OneSignal.Slidedown.promptPush({ force: true }).catch(() => {});
        } else if (OneSignal && OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === "function") {
          OneSignal.Notifications.requestPermission().catch(() => {});
        }
      } catch (_) {}
    };

    if (oneSignalInstance) {
      setTimeout(() => showPrompt(oneSignalInstance), 350);
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        setTimeout(() => showPrompt(OneSignal), 350);
      });
    }
  }

  // --- Open / Close / Toggle Notification Center ---
  function openNotificationCenter() {
    ensureNotificationCenterDOM();
    const modal = document.getElementById("mbbs-notif-center");
    if (!modal) return;
    if (isNotifCenterOpen) return;

    isNotifCenterOpen = true;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    lockPageScroll();

    // Default to Unread tab on open
    updateBellUI();
    switchTab("unread");

    // Trigger notification allow prompt ONLY when pressing the bell icon for the first time
    triggerBellNotificationPrompt();
  }

  function closeNotificationCenter() {
    const modal = document.getElementById("mbbs-notif-center");
    if (!modal) return;
    if (!isNotifCenterOpen) return;

    isNotifCenterOpen = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    const panel = document.getElementById("notif-panel");
    const backdrop = document.getElementById("notif-backdrop");
    if (panel) {
      panel.style.transform = "";
      panel.style.transition = "";
    }
    if (backdrop) {
      backdrop.style.opacity = "";
      backdrop.style.transition = "";
    }

    unlockPageScroll();

    updateBellUI();
  }

  function toggleNotificationCenter(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isNotifCenterOpen) {
      closeNotificationCenter();
    } else {
      openNotificationCenter();
    }
  }

  // --- Bind Bell Buttons ---
  function initButtons() {
    ensureNotificationCenterDOM();

    const buttons = document.querySelectorAll(".push-notify-trigger");
    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      btn.removeEventListener("click", toggleNotificationCenter);
      btn.addEventListener("click", toggleNotificationCenter);
    });

    updateBellUI();
  }

  // Utilities
  function escapeHtml(string) {
    return String(string || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Auto-boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButtons);
  } else {
    initButtons();
  }

  // Listen to MBBS resources updates if dynamic
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("mbbs-resources-loaded", () => {
      updateBellUI();
      if (isNotifCenterOpen) renderNotificationCenterContent();
    });
  }

  // --- Initialize OneSignal SDK ---
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      oneSignalInstance = OneSignal;

      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerOverrideForTypical: true,
        path: repoBase,
        serviceWorkerPath: "OneSignalSDKWorker.js",
        serviceWorkerParam: { scope: repoBase },
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false
        }
      });

      // If browser permission is already granted, cleanly opt-in and register device
      if ("Notification" in window && Notification.permission === "granted") {
        if (localStorage.getItem("mbbs_push_opted_out") !== "true") {
          if (OneSignal.User && OneSignal.User.PushSubscription) {
            OneSignal.User.PushSubscription.optIn().then(() => {
              setStoredStatus("subscribed");
              updateBellUI();
              renderPushBar();
            }).catch((err) => {
              console.warn("[Push] Auto opt-in notice:", err);
            });
          }
        }
      }

      updateBellUI();
      renderPushBar();

      if (OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener("change", (state) => {
          const isOptedIn = Boolean(state && state.current && state.current.optedIn);
          if (isOptedIn) {
            setStoredStatus("subscribed");
            try { localStorage.removeItem("mbbs_push_opted_out"); } catch (_) {}
          } else if (localStorage.getItem("mbbs_push_opted_out") === "true") {
            setStoredStatus("unsubscribed");
          }
          updateBellUI();
          renderPushBar();
        });
      }

      // Note: Automatic prompt on page load has been removed.
      // Notification prompt is now triggered exclusively upon pressing the bell icon.
    } catch (err) {
      console.warn("[Push] OneSignal initialization notice:", err);
    }
  });

  // --- Window Focus & Visibility Permission Sync ---
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    const handlePermissionSync = () => {
      if ("Notification" in window && Notification.permission === "granted") {
        if (localStorage.getItem("mbbs_push_opted_out") !== "true") {
          if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
            if (!oneSignalInstance.User.PushSubscription.optedIn) {
              oneSignalInstance.User.PushSubscription.optIn().catch(() => {});
            }
          }
        }
      }
      updateBellUI();
      renderPushBar();
    };

    window.addEventListener("focus", handlePermissionSync);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handlePermissionSync();
      }
    });
  }

  // Global exposure for debugging or programmatic access
  window.MBBS_NOTIFICATIONS = {
    open: openNotificationCenter,
    close: closeNotificationCenter,
    toggle: toggleNotificationCenter,
    markAllRead,
    markItemRead,
    subscribeToPush,
    unsubscribeFromPush,
    getUnreadCount
  };
})();