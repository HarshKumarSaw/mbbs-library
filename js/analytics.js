/**
 * Harsh's MBBS Library - Unified Analytics Client
 * Connects PostHog (behavioral & session insights) and Google Analytics.
 */

(function () {
  "use strict";

  // PostHog Configuration Defaults
  const ANALYTICS_CONFIG = {
    apiKey: (typeof window !== "undefined" && (window.POSTHOG_API_KEY || localStorage.getItem("mbbs_posthog_key"))) || "YOUR_POSTHOG_API_KEY",
    host: (typeof window !== "undefined" && window.POSTHOG_HOST) || "https://us.i.posthog.com",
    maskInputs: true
  };

  let searchDebounce = null;
  let isPostHogLoaded = false;

  // Initialize PostHog via dynamic script loader
  function loadPostHogSDK() {
    if (!ANALYTICS_CONFIG.apiKey || ANALYTICS_CONFIG.apiKey === "YOUR_POSTHOG_API_KEY") {
      return;
    }

    if (window.posthog && typeof window.posthog.init === "function") {
      configurePostHog();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    const hostDomain = ANALYTICS_CONFIG.host.includes("eu.i.posthog.com")
      ? "https://eu-assets.i.posthog.com/static/array.js"
      : "https://us-assets.i.posthog.com/static/array.js";
    script.src = hostDomain;
    script.onload = () => configurePostHog();
    document.head.appendChild(script);
  }

  function configurePostHog() {
    if (window.posthog && typeof window.posthog.init === "function" && !isPostHogLoaded) {
      window.posthog.init(ANALYTICS_CONFIG.apiKey, {
        api_host: ANALYTICS_CONFIG.host,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
          maskAllInputs: ANALYTICS_CONFIG.maskInputs,
          maskInputOptions: { password: true }
        }
      });
      isPostHogLoaded = true;
    }
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

      // PostHog event dispatch
      try {
        if (window.posthog && typeof window.posthog.capture === "function") {
          window.posthog.capture(eventName, payload);
        }
      } catch (e) {
        console.warn("[Analytics] PostHog dispatch issue:", e);
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
    },

    setApiKey: function (key, host) {
      if (key) {
        ANALYTICS_CONFIG.apiKey = key;
        if (host) ANALYTICS_CONFIG.host = host;
        try {
          localStorage.setItem("mbbs_posthog_key", key);
        } catch (_) {}
        loadPostHogSDK();
      }
    }
  };

  window.Analytics = Analytics;
  loadPostHogSDK();
})();
