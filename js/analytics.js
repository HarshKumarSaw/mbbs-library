/**
 * Harsh's MBBS Library - Unified Analytics Client
 * Connects PostHog (behavioral & session insights) and Google Analytics.
 */

(function () {
  "use strict";

  // PostHog Configuration with User Project Key
  const ANALYTICS_CONFIG = {
    apiKey: "phc_A9g4GsLWQAhmvi27AxfGEHyKv2hCthLdkWot7L5CMMvB",
    host: "https://us.i.posthog.com",
    defaults: "2026-05-30",
    personProfiles: "identified_only",
    maskInputs: true
  };

  let searchDebounce = null;
  let isPostHogLoaded = false;
  const eventQueue = [];

  // Flush queued events once PostHog finishes loading
  function flushEventQueue() {
    if (!window.posthog || typeof window.posthog.capture !== "function") return;
    while (eventQueue.length > 0) {
      const item = eventQueue.shift();
      try {
        window.posthog.capture(item.name, item.props);
      } catch (e) {
        console.warn("[Analytics] Queue flush issue:", e);
      }
    }
  }

  // Configure PostHog once SDK is ready
  function configurePostHog() {
    if (window.posthog && typeof window.posthog.init === "function" && !isPostHogLoaded) {
      window.posthog.init(ANALYTICS_CONFIG.apiKey, {
        api_host: ANALYTICS_CONFIG.host,
        defaults: ANALYTICS_CONFIG.defaults,
        person_profiles: ANALYTICS_CONFIG.personProfiles,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
          maskAllInputs: ANALYTICS_CONFIG.maskInputs,
          maskInputOptions: { password: true }
        }
      });
      isPostHogLoaded = true;
      flushEventQueue();
    }
  }

  // Dynamically load PostHog official client
  function loadPostHogSDK() {
    if (window.posthog && typeof window.posthog.init === "function") {
      configurePostHog();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = "https://us-assets.i.posthog.com/static/array.js";
    script.onload = () => configurePostHog();
    script.onerror = () => {
      console.warn("[Analytics] PostHog asset script failed to load (possible adblocker).");
    };
    document.head.appendChild(script);
  }

  // Unified Analytics API
  const Analytics = {
    track: function (eventName, properties) {
      const payload = Object.assign(
        {
          timestamp: new Date().toISOString(),
          page_path: window.location.pathname,
          page_title: document.title
        },
        properties || {}
      );

      // PostHog event dispatch (or queue until SDK loads)
      if (isPostHogLoaded && window.posthog && typeof window.posthog.capture === "function") {
        try {
          window.posthog.capture(eventName, payload);
        } catch (e) {
          console.warn("[Analytics] PostHog dispatch issue:", e);
        }
      } else {
        eventQueue.push({ name: eventName, props: payload });
      }

      // Google Analytics (GA4) / GTM event dispatch
      try {
        if (typeof window.gtag === "function") {
          window.gtag("event", eventName, payload);
        } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
          window.dataLayer.push({ event: eventName, ...payload });
        }
      } catch (e) {
        console.warn("[Analytics] GA dispatch issue:", e);
      }
    },

    trackResourceView: function (item) {
      if (!item) return;
      this.track("resource_viewed", {
        resource_id: item.id,
        resource_title: item.title,
        subject: item.subject,
        sub_subject: item.subSubject || "general",
        category: item.category,
        file_size: item.fileSize,
        storage: item.storage || "local"
      });
    },

    trackDownload: function (item) {
      if (!item) return;
      this.track("resource_downloaded", {
        resource_id: item.id,
        resource_title: item.title,
        subject: item.subject,
        sub_subject: item.subSubject || "general",
        category: item.category,
        file_size: item.fileSize
      });
    },

    trackSearchDebounced: function (query, count, delayMs) {
      const term = (query || "").trim();
      if (!term || term.length < 2) return;

      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.track("search_performed", {
          query: term,
          results_count: count !== undefined ? count : 0,
          zero_results: (count || 0) === 0
        });
      }, delayMs || 700);
    },

    trackFilter: function (filterName, filterValue) {
      this.track("filter_applied", {
        filter_name: filterName,
        filter_value: filterValue
      });
    },

    trackRequestSubmit: function (topic, subject, category) {
      this.track("resource_requested", {
        topic: (topic || "").trim(),
        subject: subject || "general",
        category: category || "general"
      });
    },

    trackPwa: function (action) {
      this.track("pwa_action", { action: action });
    },

    trackPush: function (status) {
      this.track("push_action", { status: status });
    },

    trackTimetable: function (action, extra) {
      this.track("timetable_action", Object.assign({ action: action }, extra || {}));
    }
  };

  window.Analytics = Analytics;
  loadPostHogSDK();
})();
