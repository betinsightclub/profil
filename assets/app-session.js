/* BetInsight app session helper · token-safe migration foundation
   Rule: dashboard UUIDs are stored locally and MUST NOT be generated into browser URLs.
   This file does not authenticate a user. Server-side APIs must still validate the UUID. */
(() => {
  "use strict";

  const DASHBOARD_STORAGE_KEY = "betinsight_dashboard_token";
  const PROFILE_STORAGE_KEY = "betinsight_profile_token";
  const GITHUB_HOST = "betinsightclub.github.io";

  function clean(value) {
    return String(value || "").trim();
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value));
  }

  function basePath() {
    return window.location.hostname.toLowerCase() === GITHUB_HOST ? "/profil/" : "/";
  }

  function appPath(segment = "") {
    const base = basePath();
    const normalized = clean(segment).replace(/^\/+|\/+$/g, "");
    if (!normalized) return base;
    const looksLikeFile = /\.[a-z0-9]{2,8}$/i.test(normalized);
    return `${base}${normalized}${looksLikeFile ? "" : "/"}`;
  }

  function getDashboardUuid() {
    try {
      const stored = clean(localStorage.getItem(DASHBOARD_STORAGE_KEY));
      if (isUuid(stored)) return stored;
    } catch (e) {}

    if (typeof window.getConfirmedDashboardToken === "function") {
      const confirmed = clean(window.getConfirmedDashboardToken());
      if (isUuid(confirmed)) {
        rememberDashboardUuid(confirmed);
        return confirmed;
      }
    }

    return "";
  }

  function rememberDashboardUuid(value) {
    const uuid = clean(value);
    if (!isUuid(uuid)) return false;
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, uuid);
      const profileStored = clean(localStorage.getItem(PROFILE_STORAGE_KEY));
      if (isUuid(profileStored)) localStorage.removeItem(PROFILE_STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function forgetDashboardUuid() {
    try { localStorage.removeItem(DASHBOARD_STORAGE_KEY); } catch (e) {}
  }

  function captureLegacyIngress() {
    /* Compatibility only: old bookmarked links may still contain a UUID.
       New BetInsight navigation MUST NEVER create such URLs. */
    try {
      const url = new URL(window.location.href);
      let found = "";
      for (const name of ["dashboard_token", "id", "token"]) {
        const value = clean(url.searchParams.get(name));
        if (isUuid(value)) {
          found = value;
          url.searchParams.delete(name);
        }
      }
      if (!found) return "";

      rememberDashboardUuid(found);
      const query = url.searchParams.toString();
      history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash);
      return found;
    } catch (e) {
      return "";
    }
  }

  function stripDashboardParams() {
    try {
      const url = new URL(window.location.href);
      let changed = false;
      for (const name of ["dashboard_token", "id"]) {
        if (url.searchParams.has(name)) {
          url.searchParams.delete(name);
          changed = true;
        }
      }
      const token = clean(url.searchParams.get("token"));
      if (token && isUuid(token)) {
        url.searchParams.delete("token");
        changed = true;
      }
      if (!changed) return;
      const query = url.searchParams.toString();
      history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash);
    } catch (e) {}
  }

  function navigateLocal(segment = "", options = {}) {
    const path = appPath(segment);
    const hash = clean(options.hash).replace(/^#/, "");
    const target = path + (hash ? `#${encodeURIComponent(hash)}` : "");
    window.location.assign(target);
  }

  function replaceLocal(segment = "", options = {}) {
    const path = appPath(segment);
    const hash = clean(options.hash).replace(/^#/, "");
    const target = path + (hash ? `#${encodeURIComponent(hash)}` : "");
    window.location.replace(target);
  }

  function hasDashboardAccess() {
    return Boolean(getDashboardUuid());
  }

  window.BetInsightSession = Object.freeze({
    dashboardStorageKey: DASHBOARD_STORAGE_KEY,
    profileStorageKey: PROFILE_STORAGE_KEY,
    isUuid,
    basePath,
    appPath,
    getDashboardUuid,
    rememberDashboardUuid,
    forgetDashboardUuid,
    captureLegacyIngress,
    stripDashboardParams,
    navigateLocal,
    replaceLocal,
    hasDashboardAccess
  });

  captureLegacyIngress();
  stripDashboardParams();
})();
