/**
 * Harsh's Library PWA Controller
 * - Service Worker registration & lifecycle
 * - Cross-platform installation prompt (Android / Desktop Chrome / iOS)
 * - Seamless offline & standalone app mode detection
 */
(() => {
  'use strict';

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          // Check for worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available; silently activated via skipWaiting()
                  console.log('[PWA] New version ready & cached.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. DOM & Installation Management
  function setupPWAUI() {
    // If already running inside standalone app, do not prompt
    if (isStandalone) {
      return;
    }

    const installBtns = document.querySelectorAll('.pwa-install-trigger');
    const installBanner = document.getElementById('pwa-install-banner');
    const dismissBtn = document.getElementById('pwa-banner-dismiss');
    const actionBtn = document.getElementById('pwa-banner-action');

    function showAllTriggers() {
      installBtns.forEach((btn) => {
        btn.style.display = 'inline-flex';
      });
      // Show bottom banner if not dismissed this session
      if (installBanner && !sessionStorage.getItem('pwa_banner_dismissed')) {
        installBanner.classList.add('visible');
      }
    }

    function hideAllTriggers() {
      installBtns.forEach((btn) => {
        btn.style.display = 'none';
      });
      if (installBanner) {
        installBanner.classList.remove('visible');
      }
    }

    // Android & Chromium BeforeInstallPrompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showAllTriggers();
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hideAllTriggers();
      console.log('[PWA] Installed successfully!');
    });

    // Handle Install Click
    async function triggerInstallFlow() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          hideAllTriggers();
        }
        deferredPrompt = null;
      } else if (isIOS) {
        showIOSInstallDialog();
      } else {
        alert("To install Harsh's Library:\nTap your browser menu (⋮ or Share) and select 'Add to Home Screen' or 'Install App'.");
      }
    }

    // Attach click handlers
    installBtns.forEach((btn) => {
      btn.addEventListener('click', triggerInstallFlow);
    });

    if (actionBtn) {
      actionBtn.addEventListener('click', triggerInstallFlow);
    }

    if (dismissBtn && installBanner) {
      dismissBtn.addEventListener('click', () => {
        installBanner.classList.remove('visible');
        sessionStorage.setItem('pwa_banner_dismissed', '1');
      });
    }

    // On iOS, if not standalone, show install button in header/drawer
    if (isIOS && !isStandalone) {
      showAllTriggers();
    }
  }

  function showIOSInstallDialog() {
    const existing = document.getElementById('ios-pwa-modal');
    if (existing) {
      existing.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'ios-pwa-modal';
    modal.className = 'pwa-ios-modal';
    modal.innerHTML = `
      <div class="pwa-ios-modal-card">
        <button type="button" class="pwa-ios-modal-close" aria-label="Close dialog">&times;</button>
        <div class="pwa-ios-icon">📲</div>
        <h3 class="pwa-ios-title">Install Harsh's Library</h3>
        <p class="pwa-ios-desc">Install this app on your iPhone or iPad for 1-tap offline access without browser address bars:</p>
        <ol class="pwa-ios-steps">
          <li>Tap the <strong>Share</strong> button <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> in Safari.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> in the top-right corner.</li>
        </ol>
        <button type="button" class="modal-btn modal-btn-primary pwa-ios-done-btn">Got it!</button>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('.pwa-ios-modal-close').addEventListener('click', close);
    modal.querySelector('.pwa-ios-done-btn').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPWAUI);
  } else {
    setupPWAUI();
  }
})();
