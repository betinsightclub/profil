/* BetInsight app session helper · token-safe migration foundation
   Rule: sensitive profile/dashboard access values are stored locally and MUST NOT be generated into browser URLs.
   This file does not authenticate a user. Server-side APIs must still validate every supplied access value. */
(() => {
  "use strict";

  const DASHBOARD_STORAGE_KEY = "betinsight_dashboard_token";
  const PROFILE_STORAGE_KEY = "betinsight_profile_token";
  const GITHUB_HOST = "betinsightclub.github.io";

  function clean(value) { return String(value || "").trim(); }
  function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value)); }

  function basePath() { return window.location.hostname.toLowerCase() === GITHUB_HOST ? "/profil/" : "/"; }
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
      if (isUuid(confirmed)) { rememberDashboardUuid(confirmed); return confirmed; }
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
    } catch (e) { return false; }
  }

  function getProfileToken() {
    try {
      const stored = clean(localStorage.getItem(PROFILE_STORAGE_KEY));
      return stored && !isUuid(stored) ? stored : "";
    } catch (e) { return ""; }
  }

  function rememberProfileToken(value) {
    const token = clean(value);
    if (!token || isUuid(token)) return false;
    try { localStorage.setItem(PROFILE_STORAGE_KEY, token); return true; } catch (e) { return false; }
  }

  function forgetDashboardUuid() { try { localStorage.removeItem(DASHBOARD_STORAGE_KEY); } catch (e) {} }
  function forgetProfileToken() { try { localStorage.removeItem(PROFILE_STORAGE_KEY); } catch (e) {} }

  function captureLegacyIngress() {
    /* Compatibility only: old bookmarked links may still contain a profile token or UUID.
       New BetInsight navigation MUST NEVER create those access values in browser URLs. */
    try {
      const url = new URL(window.location.href);
      let dashboard = "";
      let profile = "";

      for (const name of ["dashboard_token", "id"]) {
        const value = clean(url.searchParams.get(name));
        if (isUuid(value)) {
          dashboard = value;
          url.searchParams.delete(name);
        }
      }

      const legacyToken = clean(url.searchParams.get("token"));
      if (legacyToken) {
        if (isUuid(legacyToken)) dashboard = legacyToken;
        else profile = legacyToken;
        url.searchParams.delete("token");
      }

      if (dashboard) rememberDashboardUuid(dashboard);
      if (profile) rememberProfileToken(profile);
      if (!dashboard && !profile) return { dashboard: "", profile: "" };

      const query = url.searchParams.toString();
      history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash);
      return { dashboard, profile };
    } catch (e) {
      return { dashboard: "", profile: "" };
    }
  }

  function stripSensitiveAccessParams() {
    try {
      const url = new URL(window.location.href);
      let changed = false;
      for (const name of ["dashboard_token", "id", "token"]) {
        if (url.searchParams.has(name)) { url.searchParams.delete(name); changed = true; }
      }
      if (!changed) return;
      const query = url.searchParams.toString();
      history.replaceState(null, "", url.pathname + (query ? `?${query}` : "") + url.hash);
    } catch (e) {}
  }

  function navigateLocal(segment = "", options = {}) {
    const path = appPath(segment);
    const hash = clean(options.hash).replace(/^#/, "");
    window.location.assign(path + (hash ? `#${encodeURIComponent(hash)}` : ""));
  }

  function replaceLocal(segment = "", options = {}) {
    const path = appPath(segment);
    const hash = clean(options.hash).replace(/^#/, "");
    window.location.replace(path + (hash ? `#${encodeURIComponent(hash)}` : ""));
  }

  function hasDashboardAccess() { return Boolean(getDashboardUuid()); }
  function hasProfileAccess() { return Boolean(getProfileToken()); }

  window.BetInsightSession = Object.freeze({
    dashboardStorageKey: DASHBOARD_STORAGE_KEY,
    profileStorageKey: PROFILE_STORAGE_KEY,
    isUuid,
    basePath,
    appPath,
    getDashboardUuid,
    rememberDashboardUuid,
    forgetDashboardUuid,
    getProfileToken,
    rememberProfileToken,
    forgetProfileToken,
    captureLegacyIngress,
    stripSensitiveAccessParams,
    stripDashboardParams: stripSensitiveAccessParams,
    navigateLocal,
    replaceLocal,
    hasDashboardAccess,
    hasProfileAccess
  });

  captureLegacyIngress();
  stripSensitiveAccessParams();
})();
