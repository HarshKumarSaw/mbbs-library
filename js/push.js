/**
 * Harsh's Library - Notification Center & Web Push Engine
 * Complete Professional In-App Notification Center with Read/Unread State
 * & OneSignal Web Push Integration.
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

    // First-visit initialization: mark older items as read so new user sees top 3 as unread
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
        "1. Tap Share (square with arrow) in Safari.\n" +
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
        "2. Choose Permissions / Site Settings -> Notifications -> Allow.\n" +
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
      if (isSubscribed) {
        btn.classList.add("is-subscribed");
        btn.textContent = `🔔 Notifications${countSuffix}`;
      } else {
        btn.classList.remove("is-subscribed");
        btn.textContent = `🔔 Notifications${countSuffix}`;
      }
    });

    // Update modal header pill if modal is open
    const modalPill = document.getElementById("notif-unread-count-pill");
    if (modalPill) {
      if (unreadCount > 0) {
        modalPill.textContent = `${unreadCount} new`;
        modalPill.style.display = "inline-block";
      } else {
        modalPill.textContent = "All caught up";
        modalPill.style.display = "inline-block";
      }
    }

    // Update tab counts
    const allTabCount = document.getElementById("notif-tab-all-count");
    const unreadTabCount = document.getElementById("notif-tab-unread-count");
    const feed = getNotificationFeed();
    if (allTabCount) allTabCount.textContent = String(feed.length);
    if (unreadTabCount) unreadTabCount.textContent = String(unreadCount);
  }

  // --- Push Banner in Notification Center ---
  function renderPushBanner() {
    const banner = document.getElementById("notif-push-banner");
    if (!banner) return;

    const isSubscribed = isCurrentlySubscribed();
    const stored = getStoredStatus();

    if (isSubscribed) {
      banner.innerHTML = `
        <div class="notif-push-card notif-push-active">
          <div class="notif-push-icon notif-push-icon-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="notif-push-info">
            <div class="notif-push-heading">Push Alerts Active</div>
            <div class="notif-push-sub">You receive instant notifications on this device.</div>
          </div>
          <button type="button" class="notif-push-link-btn" id="notif-push-toggle-btn">Turn Off</button>
        </div>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) btn.onclick = () => unsubscribeFromPush();
    } else if (stored === "unsubscribed") {
      banner.innerHTML = `
        <div class="notif-push-card notif-push-paused">
          <div class="notif-push-icon notif-push-icon-muted">🔕</div>
          <div class="notif-push-info">
            <div class="notif-push-heading">Push Alerts Paused</div>
            <div class="notif-push-sub">Notifications are turned off for this browser.</div>
          </div>
          <button type="button" class="notif-push-cta-btn" id="notif-push-toggle-btn">Resume</button>
        </div>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) btn.onclick = () => resumePush();
    } else {
      banner.innerHTML = `
        <div class="notif-push-card notif-push-prompt">
          <div class="notif-push-icon notif-push-icon-blue">🔔</div>
          <div class="notif-push-info">
            <div class="notif-push-heading">Get Study Alerts</div>
            <div class="notif-push-sub">Never miss new notes, question banks, or textbooks.</div>
          </div>
          <button type="button" class="notif-push-cta-btn" id="notif-push-toggle-btn">Turn On</button>
        </div>
      `;
      const btn = document.getElementById("notif-push-toggle-btn");
      if (btn) btn.onclick = () => subscribeToPush();
    }
  }

  // --- Notification Center Feed Rendering ---
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
          if (emptyDesc) emptyDesc.textContent = "No unread notifications. Check back when new medical study materials are uploaded.";
        } else {
          if (emptyTitle) emptyTitle.textContent = "No notifications yet";
          if (emptyDesc) emptyDesc.textContent = "Study materials and announcements will appear here.";
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    let html = "";
    filtered.forEach((item) => {
      const unread = isItemUnread(item);
      let subjectClass = "notif-accent-general";
      let subjectIcon = "🩺";
      let subjectLabel = "General";

      const sub = (item.subject || "").toLowerCase();
      if (sub === "anatomy") {
        subjectClass = "notif-accent-anatomy";
        subjectIcon = "🦴";
        subjectLabel = "Anatomy";
      } else if (sub === "physiology") {
        subjectClass = "notif-accent-physiology";
        subjectIcon = "🫀";
        subjectLabel = "Physiology";
      } else if (sub === "biochemistry") {
        subjectClass = "notif-accent-biochem";
        subjectIcon = "🧪";
        subjectLabel = "Biochemistry";
      } else if (item.isAnnouncement) {
        subjectClass = "notif-accent-announcement";
        subjectIcon = "📢";
        subjectLabel = "Announcement";
      }

      let categoryLabel = item.category ? item.category.toUpperCase() : "RESOURCE";
      if (item.category === "notes") categoryLabel = "Notes";
      else if (item.category === "practicals") categoryLabel = "Practical";
      else if (item.category === "assignments") categoryLabel = "Assignment";
      else if (item.category === "sdls" || item.category === "sdl") categoryLabel = "SDL";
      else if (item.category === "other") categoryLabel = "PYQ / Extra";
      else if (item.isAnnouncement) categoryLabel = "Library Notice";

      html += `
        <div class="notif-item ${unread ? "is-unread" : "is-read"}" data-id="${escapeHtml(item.id)}" role="button" tabindex="0">
          <div class="notif-item-icon ${subjectClass}">
            <span>${subjectIcon}</span>
          </div>
          <div class="notif-item-content">
            <div class="notif-item-top">
              <span class="notif-item-badge ${escapeHtml(sub)}">${escapeHtml(subjectLabel)} • ${escapeHtml(categoryLabel)}</span>
              <span class="notif-item-date">${escapeHtml(item.date || "Recent")}</span>
              ${unread ? '<span class="notif-item-unread-dot" title="Unread notification"></span>' : ""}
            </div>
            <h4 class="notif-item-title">${escapeHtml(item.title)}</h4>
            <div class="notif-item-meta">
              ${item.pages ? `<span class="notif-meta-pill">📄 ${escapeHtml(item.pages)}</span>` : ""}
              ${item.fileSize ? `<span class="notif-meta-pill">📦 ${escapeHtml(item.fileSize)}</span>` : ""}
              <span class="notif-item-open-hint">Open ↗</span>
            </div>
          </div>
        </div>
      `;
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

        <!-- Header -->
        <div class="notif-header">
          <div class="notif-header-title-wrap">
            <div class="notif-header-icon-wrap">
              <svg class="notif-header-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h3 id="notif-center-title" class="notif-title">Notifications</h3>
              <span class="notif-pill-badge" id="notif-unread-count-pill">0 new</span>
            </div>
          </div>
          <div class="notif-header-actions">
            <button type="button" class="notif-action-btn" id="notif-mark-all-read" title="Mark all notifications as read">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Mark all read</span>
            </button>
            <button type="button" class="notif-close-btn" id="notif-close-btn" aria-label="Close notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="18" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <!-- Push Alerts Settings Banner -->
        <div class="notif-push-banner" id="notif-push-banner"></div>

        <!-- Filter Tabs -->
        <div class="notif-tabs" role="tablist">
          <button type="button" class="notif-tab is-active" data-tab="all" id="notif-tab-all" role="tab" aria-selected="true">
            All <span class="notif-tab-count" id="notif-tab-all-count">0</span>
          </button>
          <button type="button" class="notif-tab" data-tab="unread" id="notif-tab-unread" role="tab" aria-selected="false">
            Unread <span class="notif-tab-count notif-tab-unread-count" id="notif-tab-unread-count">0</span>
          </button>
        </div>

        <!-- Feed List -->
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

    // Tab buttons
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