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

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  function updateUIState(OneSignal) {
    const isSubscribed = Boolean(
      OneSignal &&
      OneSignal.User &&
      OneSignal.User.PushSubscription &&
      OneSignal.User.PushSubscription.optedIn
    );

    const buttons = document.querySelectorAll(".push-notify-trigger");
    buttons.forEach((btn) => {
      btn.style.display = "inline-flex";
      if (isSubscribed) {
        btn.classList.add("is-subscribed");
        btn.innerHTML = `<span class="push-btn-icon" aria-hidden="true">🔔</span><span class="push-btn-label">Alerts Active</span>`;
        btn.setAttribute("title", "You are subscribed to MBBS updates. Click to manage.");
        btn.setAttribute("aria-label", "Notifications active. Click to manage.");
      } else {
        btn.classList.remove("is-subscribed");
        btn.innerHTML = `<span class="push-btn-icon" aria-hidden="true">🔔</span><span class="push-btn-label">Get Alerts</span>`;
        btn.setAttribute("title", "Get instant alerts on your phone when new notes are added.");
        btn.setAttribute("aria-label", "Subscribe to notifications for new study materials");
      }
    });
  }

  async function handleButtonClick(OneSignal) {
    if (!OneSignal || !OneSignal.User || !OneSignal.User.PushSubscription) {
      return;
    }

    const isSubscribed = OneSignal.User.PushSubscription.optedIn;

    if (isSubscribed) {
      const confirmDisable = confirm(
        "You are currently subscribed to alerts for new MBBS notes and books.\n\nWould you like to turn off notifications?"
      );
      if (confirmDisable) {
        try {
          await OneSignal.User.PushSubscription.optOut();
          updateUIState(OneSignal);
        } catch (e) {
          console.warn("[Push] Error opting out:", e);
        }
      }
    } else {
      try {
        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === "function") {
          await OneSignal.Slidedown.promptPush();
        } else {
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (err) {
        try {
          await OneSignal.User.PushSubscription.optIn();
        } catch (e) {
          console.warn("[Push] Permission request error:", e);
        }
      }
    }
  }

  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: swPath,
        serviceWorkerParam: { scope: swScope },
        allowLocalhostAsSecureOrigin: true,
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

      // Bind button events
      const buttons = document.querySelectorAll(".push-notify-trigger");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => handleButtonClick(OneSignal));
      });

      // Set initial button state
      updateUIState(OneSignal);

      // Listen for subscription changes
      if (OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          updateUIState(OneSignal);
        });
      }
    } catch (err) {
      console.warn("[Push] OneSignal initialization notice:", err);
    }
  });
})();
