/**
 * Harsh's Library - Push Notification Engine (OneSignal Web Push)
 * Handles instant alerts for new study materials & notes.
 * Free • Zero-Backend • Dual Cookie + LocalStorage Persistence
 */

(() => {
  "use strict";

  const ONESIGNAL_APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe";
  const COOKIE_NAME = "mbbs_push_status";

  const path = window.location.pathname;
  const isRepo = path.startsWith("/mbbs-library");
  const swPath = isRepo ? "mbbs-library/OneSignalSDKWorker.js" : "OneSignalSDKWorker.js";
  const swScope = isRepo ? "/mbbs-library/" : "./";

  let oneSignalInstance = null;

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
   * Determine subscription state reliably across all devices & browsers.
   * Priority:
   * 1. Explicit user choice in Cookie / LocalStorage ("subscribed" vs "unsubscribed")
   * 2. Browser native permission state (granted -> subscribed)
   * 3. OneSignal active subscription state
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

  function updateUIState() {
    const isSubscribed = isCurrentlySubscribed();
    const buttons = document.querySelectorAll(".push-notify-trigger");

    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      if (isSubscribed) {
        btn.classList.add("is-subscribed");
        btn.setAttribute("title", "Study alerts active. Tap to turn off.");
        btn.setAttribute("aria-label", "Notifications active. Tap to turn off.");
        const label = btn.querySelector(".push-btn-label");
        if (label) label.textContent = "Alerts Active";
      } else {
        btn.classList.remove("is-subscribed");
        btn.setAttribute("title", "Get instant alerts on your phone when new notes are added.");
        btn.setAttribute("aria-label", "Subscribe to notifications for new study materials");
        const label = btn.querySelector(".push-btn-label");
        if (label) label.textContent = "Get Alerts";
      }
    });
  }

  async function handleNotificationClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Scenario 1: Already Subscribed -> Prompt to Turn Off / Pause
    if (isCurrentlySubscribed()) {
      const confirmDisable = confirm(
        "You are currently subscribed to alerts for new MBBS notes and books!\n\nWould you like to turn off notifications?"
      );
      if (confirmDisable) {
        setStoredStatus("unsubscribed");
        try {
          if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
            await oneSignalInstance.User.PushSubscription.optOut();
          }
        } catch (e) {
          console.warn("[Push] Opt-out notice:", e);
        }
        updateUIState();
        alert("Push notifications have been turned off.");
      }
      return;
    }

    // Scenario 2: Unsubscribed / Paused -> Subscribe or Resume
    const stored = getStoredStatus();
    if (stored === "unsubscribed" && "Notification" in window && Notification.permission === "granted") {
      const resume = confirm("Study alerts are currently turned off.\n\nWould you like to turn alerts back ON?");
      if (!resume) return;
      setStoredStatus("subscribed");
      try {
        if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
          await oneSignalInstance.User.PushSubscription.optIn();
        }
      } catch (e) {
        console.warn("[Push] Opt-in resume notice:", e);
      }
      updateUIState();
      alert("🎉 Study alerts turned back ON! You will receive notifications for new MBBS notes and books.");
      return;
    }

    // Scenario 3: First-Time Subscription Flow
    // 1. Check iOS Safari standalone constraint
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) {
      alert(
        "📱 iPhone / iPad Setup:\n\n" +
        "Apple requires web apps to be added to your Home Screen before notifications can work:\n\n" +
        "1. Tap the Share button (square with arrow) at the bottom of Safari.\n" +
        "2. Tap 'Add to Home Screen'.\n" +
        "3. Open Harsh's Library from your Home Screen, then tap this bell to activate alerts!"
      );
      return;
    }

    // 2. Check general browser notification support
    if (!("Notification" in window)) {
      alert("Push notifications are not supported by this browser.");
      return;
    }

    // 3. If notifications are permanently blocked by browser site settings
    if (Notification.permission === "denied") {
      alert(
        "⚠️ Notifications are currently blocked in your browser settings.\n\n" +
        "To allow alerts:\n" +
        "1. Tap the lock or tune icon beside the URL in your browser's address bar.\n" +
        "2. Select Permissions or Site Settings -> Notifications -> Allow.\n" +
        "3. Reload this page and tap the bell icon again."
      );
      return;
    }

    // 4. Request native browser notification permission
    let perm = Notification.permission;
    if (perm !== "granted") {
      try {
        perm = await Notification.requestPermission();
      } catch (err) {
        perm = await new Promise((res) => Notification.requestPermission(res));
      }
    }

    if (perm !== "granted") {
      if (perm === "denied") {
        alert(
          "Notifications were blocked. If you change your mind, you can enable them anytime from your browser site settings."
        );
      }
      return;
    }

    // 5. Permission granted: Save status in Cookie & LocalStorage and update UI
    setStoredStatus("subscribed");
    updateUIState();

    // 6. Register subscription token with OneSignal
    try {
      if (oneSignalInstance && oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
        await oneSignalInstance.User.PushSubscription.optIn();
      } else if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } catch (e) {
            console.warn("[Push] Deferred optIn notice:", e);
          }
        });
      }
    } catch (err) {
      console.warn("[Push] OneSignal registration notice:", err);
    }

    alert("🎉 You are now subscribed! You will receive instant notifications when new MBBS notes, books, and practical materials are added.");
  }

  // Bind click handlers immediately upon DOM ready
  function initButtons() {
    const buttons = document.querySelectorAll(".push-notify-trigger");
    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      btn.removeEventListener("click", handleNotificationClick);
      btn.addEventListener("click", handleNotificationClick);
    });
    updateUIState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButtons);
  } else {
    initButtons();
  }

  // Initialize OneSignal SDK
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

      // If user already subscribed, ensure OneSignal registers them as subscriber
      if (isCurrentlySubscribed() && OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.optIn().catch((err) => {
          console.warn("[Push] OneSignal auto-optIn notice:", err);
        });
      }

      updateUIState();

      if (OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          updateUIState();
        });
      }
    } catch (err) {
      console.warn("[Push] OneSignal initialization notice:", err);
    }
  });
})();
