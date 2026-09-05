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

  function installPremiumUpgradeRouting() {
    if (window.__betInsightPremiumUpgradeRoutingInstalled) return;
    window.__betInsightPremiumUpgradeRoutingInstalled = true;

    const selector = [
      "#upgradePremiumButton",
      "#upgradePremiumPlusButton",
      "#premiumPlusUpgradeButton",
      "#premiumExternalButton",
      "#premiumUpgradeLink",
      "#plusUpgradeLink"
    ].join(",");

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      navigateLocal("premium-upgrade");
    }, true);
  }

  function removeRedundantAffiliateDisclosure() {
    const remove = () => document.querySelectorAll(".affiliate-disclosure").forEach(element => element.remove());
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", remove, { once: true });
    else remove();
  }

  function installPremiumContextButtons() {
    const path = String(window.location.pathname || "").replace(/\/+$/, "");
    if (!/(?:^|\/)(?:tipps|freigeschaltet)$/.test(path) || window.__betInsightPremiumContextButtonsInstalled) return;
    window.__betInsightPremiumContextButtonsInstalled = true;

    if (!document.getElementById("bi-premium-context-cta-style")) {
      const style = document.createElement("style");
      style.id = "bi-premium-context-cta-style";
      style.textContent = `
        .bi-premium-context-cta{width:100%;min-height:42px;margin-top:11px;padding:9px 13px;border:1px solid rgba(95,207,255,.28);border-radius:11px;background:linear-gradient(90deg,#168dff,#08bdec);color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px rgba(0,152,230,.18);transition:transform .15s ease,filter .15s ease}
        .bi-premium-context-cta:hover{transform:translateY(-1px);filter:brightness(1.06)}
        .bi-premium-context-cta.plus{background:linear-gradient(90deg,#e69522,#ffbe4a);color:#061923;border-color:rgba(255,205,104,.35);box-shadow:0 10px 22px rgba(230,149,34,.16)}
      `;
      document.head.appendChild(style);
    }

    const apply = root => {
      const scope = root && root.querySelectorAll ? root : document;
      scope.querySelectorAll('.provider-panel[data-membership-level="0"],.provider-panel[data-membership-level="1"]').forEach(panel => {
        if (panel.querySelector(".bi-premium-context-cta")) return;
        const level = Number(panel.dataset.membershipLevel || 0);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bi-premium-context-cta" + (level === 1 ? " plus" : "");
        button.textContent = level === 1 ? "✨ Auf Premium Plus upgraden" : "⭐ Premium / Premium Plus ansehen";
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          navigateLocal("premium-upgrade");
        });
        const feedback = panel.querySelector(".provider-feedback");
        if (feedback) feedback.insertAdjacentElement("afterend", button);
        else panel.appendChild(button);
      });
    };

    apply(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) apply(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function installDailyBundledTransport() {
    try {
      const path = String(window.location.pathname || "").replace(/\/+$/, "");
      if (!path.endsWith("/daily") || window.__betInsightDailyBundledFetchInstalled) return;

      const endpoint = "https://hook.eu1.make.com/vnerimfqa86a1tullvqah885xgqcc0j7";
      const originalFetch = window.fetch.bind(window);
      const cachePrefix = "betinsight_daily_bundle_v1:";
      const readyTtl = 2 * 60 * 1000;
      const asBool = value => value === true || String(value).toLowerCase() === "true" || Number(value) === 1;
      const cacheKey = token => cachePrefix + token;
      const jsonResponse = data => new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });

      function readBundle(token) {
        try {
          const item = JSON.parse(localStorage.getItem(cacheKey(token)) || "null");
          if (!item || !item.data) return null;
          const data = item.data;
          const next = new Date(data.next_claim_at || "").getTime();
          const lockedUntilNextClaim = !asBool(data.can_claim) && Number.isFinite(next) && next > Date.now();
          if (lockedUntilNextClaim || Date.now() - Number(item.savedAt || 0) < readyTtl) return data;
        } catch (e) {}
        return null;
      }

      function writeBundle(token, data) {
        if (!token || !data) return;
        try { localStorage.setItem(cacheKey(token), JSON.stringify({ savedAt: Date.now(), data })); } catch (e) {}
      }

      function mergeClaimResult(token, data) {
        const current = readBundle(token);
        if (!current && !data) return;
        const merged = Object.assign({}, current || {});
        if (data.status === "success") {
          merged.status = "daily_status";
          merged.can_claim = false;
          merged.next_claim_at = data.next_claim_at || merged.next_claim_at || "";
          merged.streak_total = Number(data.streak_total || 0);
          merged.cycle_day = Number(data.cycle_day || 1);
          merged.loyalty_level = data.loyalty_level || merged.loyalty_level || "Starter";
          merged.last_number = data.daily_number || merged.last_number || "";
          merged.last_bonus_units = Number(data.bonus_units ?? data.total_bonus_units ?? 0);
          merged.total_claims = Number(merged.total_claims || 0) + 1;
          merged.box_pending = asBool(data.box_pending);
          merged.box_pending_id = data.box_pending_id || "";
          merged.box_opened_count = Number(data.box_opened_count || merged.box_opened_count || 0);
          if (Array.isArray(merged.history) && data.history_entry) {
            merged.history = [data.history_entry, ...merged.history].slice(0, 10);
          }
          writeBundle(token, merged);
          return;
        }
        if (data.status === "already_claimed" || data.status === "duplicate_request") {
          merged.status = "daily_status";
          merged.can_claim = false;
          merged.next_claim_at = data.next_claim_at || merged.next_claim_at || "";
          writeBundle(token, merged);
          return;
        }
        if (data.status === "box_opened" || data.status === "no_pending_box") {
          merged.status = "daily_status";
          merged.box_pending = false;
          merged.box_pending_id = "";
          if (data.status === "box_opened") merged.box_opened_count = Number(data.box_opened_count || merged.box_opened_count || 0);
          writeBundle(token, merged);
        }
      }

      window.fetch = async function(input, init = {}) {
        const url = typeof input === "string" ? input : input && input.url;
        if (url !== endpoint || String(init.method || "GET").toUpperCase() !== "POST") return originalFetch(input, init);

        let payload;
        try { payload = JSON.parse(String(init.body || "{}")); } catch (e) { return originalFetch(input, init); }
        const token = clean(payload.token);
        const request = clean(payload.request_id);
        if (!token || !request) return originalFetch(input, init);

        if (request.startsWith("STATUS-")) {
          const cached = readBundle(token);
          if (cached) return jsonResponse(cached);
          const loadPayload = Object.assign({}, payload, { request_id: "LOAD-" + request.slice(7) });
          const response = await originalFetch(input, Object.assign({}, init, { body: JSON.stringify(loadPayload) }));
          try {
            const data = await response.clone().json();
            if (data && data.status === "daily_status") writeBundle(token, data);
          } catch (e) {}
          return response;
        }

        if (request.startsWith("HISTORY-")) {
          const cached = readBundle(token);
          if (cached && Array.isArray(cached.history)) return jsonResponse(cached.history);
          return originalFetch(input, init);
        }

        const response = await originalFetch(input, init);
        try {
          const data = await response.clone().json();
          if (data && typeof data === "object") mergeClaimResult(token, data);
        } catch (e) {}
        return response;
      };

      window.__betInsightDailyBundledFetchInstalled = true;
    } catch (e) {}
  }

  function loadTipNotifications() {
    if (window.__betInsightTipNotificationLoaderInstalled) return;
    window.__betInsightTipNotificationLoaderInstalled = true;
    const script = document.createElement("script");
    script.src = appPath("assets/tip-notifications.js") + "?v=20260905-4";
    script.defer = true;
    script.dataset.biTipNotifications = "1";
    script.addEventListener("error", () => console.warn("BetInsight Tipp-Benachrichtigungen konnten nicht geladen werden."), { once: true });
    document.head.appendChild(script);
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
  removeRedundantAffiliateDisclosure();
  installPremiumUpgradeRouting();
  installPremiumContextButtons();
  installDailyBundledTransport();
  loadTipNotifications();
})();