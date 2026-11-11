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

  const path = window.location.pathname;
  const isRepo = path.startsWith("/mbbs-library");
  const swPath = isRepo ? "mbbs-library/OneSignalSDKWorker.js" : "OneSignalSDKWorker.js";
  const swScope = isRepo ? "/mbbs-library/" : "./";

  let oneSignalInstance = null;
  let activeTab = "all"; // 'all' or 'unread'
  let isNotifCenterOpen = false;
  let isPushInfoExpanded = false;

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
    const stored = getStoredStatus();

    // Explicit opt-out / paused
    if (stored === "unsubscribed") {
      return false;
    }

    // Explicitly subscribed in cookie/storage
    if (stored === "subscribed") {
      return true;
    }

    // Browser permission check
    if ("Notification" in window && Notification.permission === "granted") {
      setStoredStatus("subscribed");
      return true;
    }

    // OneSignal state
    if (
      oneSignalInstance &&
      oneSignalInstance.User &&
      oneSignalInstance.User.PushSubscription &&
      oneSignalInstance.User.PushSubscription.optedIn
    ) {
      setStoredStatus("subscribed");
      return true;
    }

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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
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
        "1. Tap the lock/tune icon beside the URL in the address bar.\n" +
        "2. Choose Site Settings -> Notifications -> Allow.\n" +
        "3. Reload the page."
      );
      return;
    }

    // 4. Request browser permission
    let perm = Notification.permission;
    if (perm !== "granted") {
      try {
        perm = await Notification.requestPermission();
      } catch (_) {
        perm = await new Promise((res) => Notification.requestPermission(res));
      }
    }

    if (perm !== "granted") return;

    // 5. Save subscribed state
    setStoredStatus("subscribed");
    updateBellUI();
    renderPushBanner();

    // 6. Sync with OneSignal
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optIn();
      } else if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } catch (_) {}
        });
      }
    } catch (e) {
      console.warn("[Push] OneSignal optIn notice:", e);
    }
  }

  async function unsubscribeFromPush() {
    setStoredStatus("unsubscribed");
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optOut();
      }
    } catch (e) {
      console.warn("[Push] OneSignal optOut notice:", e);
    }
    updateBellUI();
    renderPushBanner();
  }

  async function resumePush() {
    setStoredStatus("subscribed");
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optIn();
      }
    } catch (e) {
      console.warn("[Push] OneSignal resume notice:", e);
    }
    updateBellUI();
    renderPushBanner();
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

      // Ensure unread badge element exists
      let badge = btn.querySelector(".bell-unread-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "bell-unread-badge";
        badge.setAttribute("aria-hidden", "true");
        btn.appendChild(badge);
      }

      const statusDot = btn.querySelector(".bell-status-dot");

      if (unreadCount > 0) {
        badge.style.display = "flex";
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        if (statusDot) statusDot.style.display = "none";
      } else {
        badge.style.display = "none";
        if (statusDot) {
          statusDot.style.display = isSubscribed ? "block" : "none";
        }
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
      btn.setAttribute("aria-label", "Notifications");
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

  // --- Push Banner in Notification Center (Compact Secondary Row) ---
  function renderPushBanner() {
    const banner = document.getElementById("notif-push-banner");
    if (!banner) return;

    const isSubscribed = isCurrentlySubscribed();
    const stored = getStoredStatus();

    let statusText = "Push alerts off";
    let statusClass = "is-muted";
    let actionText = "Turn On";
    let actionHandler = subscribeToPush;
    let isCta = true;
    let infoText = "Receive instant alerts on this device whenever new MBBS notes, question banks, or textbooks are added.";

    if (isSubscribed) {
      statusText = "Push alerts active";
      statusClass = "is-active";
      actionText = "Turn Off";
      actionHandler = unsubscribeFromPush;
      isCta = false;
      infoText = "Instant notifications are active for this browser. Tap Turn Off to pause alerts.";
    } else if (stored === "unsubscribed") {
      statusText = "Push alerts paused";
      statusClass = "is-paused";
      actionText = "Resume";
      actionHandler = resumePush;
      isCta = true;
      infoText = "Alerts are currently paused for this browser. Tap Resume to re-enable alerts.";
    }

    banner.innerHTML = `
      <div class="notif-push-row">
        <div class="notif-push-summary" id="notif-push-summary-toggle" role="button" tabindex="0" title="Toggle alerts info">
          <span class="notif-push-status-dot ${statusClass}"></span>
          <span class="notif-push-status-text">${statusText}</span>
          <span class="notif-push-chevron ${isPushInfoExpanded ? "is-expanded" : ""}">›</span>
        </div>
        <div class="notif-push-actions">
          <button type="button" class="notif-push-compact-btn ${isCta ? "is-cta" : "is-active"}" id="notif-push-toggle-btn">
            ${actionText}
          </button>
        </div>
      </div>
      <div class="notif-push-expand-panel" id="notif-push-expand-panel" style="display: ${isPushInfoExpanded ? "block" : "none"};">
        <p class="notif-push-info-text">${infoText}</p>
      </div>
    `;

    const toggleBtn = document.getElementById("notif-push-toggle-btn");
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        actionHandler();
      };
    }

    const summaryToggle = document.getElementById("notif-push-summary-toggle");
    if (summaryToggle) {
      summaryToggle.onclick = () => {
        isPushInfoExpanded = !isPushInfoExpanded;
        const panel = document.getElementById("notif-push-expand-panel");
        const chevron = banner.querySelector(".notif-push-chevron");
        if (panel) panel.style.display = isPushInfoExpanded ? "block" : "none";
        if (chevron) {
          if (isPushInfoExpanded) chevron.classList.add("is-expanded");
          else chevron.classList.remove("is-expanded");
        }
      };
    }
  }

  // --- Notification Center Feed Rendering with Date Grouping ---
  function renderNotificationCenterContent() {
    const container = document.getElementById("notif-feed-container");
    const emptyState = document.getElementById("notif-empty-state");
    if (!container) return;

    renderPushBanner();

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
        <div class="notif-drag-bar" aria-hidden="true"></div>

        <!-- Compact Header -->
        <div class="notif-header">
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

        <!-- Push Alerts Settings (Low Profile Secondary Row) -->
        <div class="notif-push-banner" id="notif-push-banner"></div>

        <!-- Slim Segmented Control (All / Unread) -->
        <div class="notif-segmented-wrap">
          <div class="notif-segmented" role="tablist">
            <button type="button" class="notif-seg-btn is-active" data-tab="all" id="notif-tab-all" role="tab" aria-selected="true">
              <span>All</span>
              <span class="notif-seg-count" id="notif-tab-all-count">0</span>
            </button>
            <button type="button" class="notif-seg-btn" data-tab="unread" id="notif-tab-unread" role="tab" aria-selected="false">
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
      tabAll.addEventListener("click", () => {
        activeTab = "all";
        tabAll.classList.add("is-active");
        tabAll.setAttribute("aria-selected", "true");
        if (tabUnread) {
          tabUnread.classList.remove("is-active");
          tabUnread.setAttribute("aria-selected", "false");
        }
        renderNotificationCenterContent();
      });
    }

    if (tabUnread) {
      tabUnread.addEventListener("click", () => {
        activeTab = "unread";
        tabUnread.classList.add("is-active");
        tabUnread.setAttribute("aria-selected", "true");
        if (tabAll) {
          tabAll.classList.remove("is-active");
          tabAll.setAttribute("aria-selected", "false");
        }
        renderNotificationCenterContent();
      });
    }

    // Keyboard navigation: Escape key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isNotifCenterOpen) {
        closeNotificationCenter();
      }
    });
  }

  // --- Open / Close / Toggle Notification Center ---
  function openNotificationCenter() {
    ensureNotificationCenterDOM();
    const modal = document.getElementById("mbbs-notif-center");
    if (!modal) return;

    isNotifCenterOpen = true;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("notif-center-open");

    updateBellUI();
    renderNotificationCenterContent();
  }

  function closeNotificationCenter() {
    const modal = document.getElementById("mbbs-notif-center");
    if (!modal) return;

    isNotifCenterOpen = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("notif-center-open");

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
        serviceWorkerPath: swPath,
        serviceWorkerParam: { scope: swScope },
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false
        }
      });

      // If user already subscribed, ensure OneSignal registers them
      if (isCurrentlySubscribed() && OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.optIn().catch((err) => {
          console.warn("[Push] OneSignal auto-optIn notice:", err);
        });
      }

      updateBellUI();
      if (isNotifCenterOpen) renderPushBanner();

      if (OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          updateBellUI();
          if (isNotifCenterOpen) renderPushBanner();
        });
      }
    } catch (err) {
      console.warn("[Push] OneSignal initialization notice:", err);
    }
  });

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