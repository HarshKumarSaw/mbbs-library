/**
 * Harsh's Library - Push Notification Engine (OneSignal Web Push)
 * Handles instant alerts for new study materials & notes.
 * Free • Zero-Backend • Automatic sync integration
 */

(() => {
  "use strict";

  const ONESIGNAL_APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe";

  const isRepo = window.location.pathname.startsWith("/mbbs-library/");
  const swPath = isRepo ? "/mbbs-library/sw.js" : "sw.js";
  const swScope = isRepo ? "/mbbs-library/" : "./";

  let oneSignalInstance = null;
  let pendingOptIn = false;

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  function updateUIState() {
    const isSubscribed = Boolean(
      oneSignalInstance &&
      oneSignalInstance.User &&
      oneSignalInstance.User.PushSubscription &&
      oneSignalInstance.User.PushSubscription.optedIn
    );

    const buttons = document.querySelectorAll(".push-notify-trigger");
    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      if (isSubscribed) {
        btn.classList.add("is-subscribed");
        btn.setAttribute("title", "You are subscribed to MBBS library updates. Click to manage.");
        btn.setAttribute("aria-label", "Notifications active. Click to manage.");
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

  async function triggerSubscriptionFlow() {
    if (!oneSignalInstance) {
      pendingOptIn = true;
      return;
    }

    const isSubscribed = Boolean(
      oneSignalInstance.User &&
      oneSignalInstance.User.PushSubscription &&
      oneSignalInstance.User.PushSubscription.optedIn
    );

    if (isSubscribed) {
      const confirmDisable = confirm(
        "You are currently subscribed to alerts for new MBBS notes and books.\n\nWould you like to turn off notifications?"
      );
      if (confirmDisable) {
        try {
          await oneSignalInstance.User.PushSubscription.optOut();
          updateUIState();
        } catch (e) {
          console.warn("[Push] Error opting out:", e);
        }
      }
    } else {
      try {
        if (oneSignalInstance.Slidedown && typeof oneSignalInstance.Slidedown.promptPush === "function") {
          await oneSignalInstance.Slidedown.promptPush();
        } else if (oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
          await oneSignalInstance.User.PushSubscription.optIn();
        }
      } catch (err) {
        try {
          if (oneSignalInstance.User && oneSignalInstance.User.PushSubscription) {
            await oneSignalInstance.User.PushSubscription.optIn();
          }
        } catch (e) {
          console.warn("[Push] Permission request error:", e);
        }
      }
    }
  }

  // Bind click handlers immediately upon DOM ready
  function initButtons() {
    const buttons = document.querySelectorAll(".push-notify-trigger");
    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        triggerSubscriptionFlow();
      });
    });
    updateUIState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initButtons);
  } else {
    initButtons();
  }

  // Initialize OneSignal
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      oneSignalInstance = OneSignal;

      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: swPath,
        serviceWorkerParam: { scope: swScope },
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false // Use custom floating bell for pixel-perfect site integration
        },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: true,
                text: {
                  actionMessage:
                    "Get instant notifications on your phone when new MBBS notes, books, and practical guides are uploaded.",
                  acceptButton: "Allow Alerts",
                  cancelButton: "Maybe Later"
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 3
                }
              }
            ]
          }
        }
      });

      updateUIState();

      if (pendingOptIn) {
        pendingOptIn = false;
        triggerSubscriptionFlow();
      }

      // Listen for subscription changes
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
