/* BetInsight App Navigation compatibility loader · multilingual customer app
   Goals:
   - customer pages that still include assets/app-navigation.js receive the multilingual v2 navigation
   - the large legacy root dashboard receives the DE/EN adapter without rewriting its business logic
   - internal customer navigation no longer generates URLs containing profile/dashboard access values
   - Premium Network uses a token-free cross-domain handoff via a trusted bridge
   - admin pages are not part of this migration
*/
(() => {
  "use strict";

  const SCRIPT_URL = document.currentScript?.src || new URL("assets/app-navigation.js", location.href).toString();
  const ASSET_BASE = new URL("./", SCRIPT_URL);
  const APP_ROOT = new URL("../", SCRIPT_URL);
  const LANDING_PAGE_URL = "https://betinsight.club/";
  const PROFILE_STORAGE_KEY = "betinsight_profile_token";
  const DASHBOARD_STORAGE_KEY = "betinsight_dashboard_token";
  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||"").trim());

  function isRootDashboard() {
    const pathname = location.pathname.replace(/\/+$/, "/");
    return pathname === APP_ROOT.pathname.replace(/\/+$/, "/") || pathname === APP_ROOT.pathname.replace(/\/+$/, "/") + "index.html";
  }

  function installLandingLogoLink() {
    if (window.__betinsightLandingLogoLinkInstalled) return;
    window.__betinsightLandingLogoLinkInstalled = true;

    const style = document.createElement("style");
    style.id = "bi-logo-landing-link-style";
    style.textContent = ".bi-nav-logo-image{cursor:pointer}";
    document.head.appendChild(style);

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target.closest(".bi-nav-logo-image") : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      location.assign(LANDING_PAGE_URL);
    }, true);
  }

  function safePath(segment = "", hash = "") {
    const clean = String(segment||"").replace(/^\/+|\/+$/g, "");
    const url = new URL(clean ? `${clean}/` : "", APP_ROOT);
    url.search = "";
    url.hash = hash ? String(hash).replace(/^#/, "") : "";
    return url.toString();
  }

  function safeRoute(segment = "", replace = false, hash = "") {
    const href = safePath(segment, hash);
    replace ? location.replace(href) : location.assign(href);
  }

  function rememberRawAccess(value) {
    const token = String(value||"").trim();
    if (!token) return;
    try {
      if (isUuid(token)) localStorage.setItem(DASHBOARD_STORAGE_KEY, token);
      else localStorage.setItem(PROFILE_STORAGE_KEY, token);
    } catch (e) {}
  }

  function extractAccess(value) {
    const clean = String(value||"").trim();
    if (!clean) return "";
    try {
      const url = new URL(clean);
      return String(url.searchParams.get("dashboard_token") || url.searchParams.get("id") || url.searchParams.get("token") || "").trim();
    } catch (e) {}
    const match = clean.match(/(?:dashboard_token|id|token)=([^&#\s]+)/i);
    if (match) { try { return decodeURIComponent(match[1]); } catch (e) { return match[1]; } }
    return clean;
  }

  /* Install a synchronous safety patch before any dependency is loaded. The legacy dashboard
     starts its profile request in its inline script; these replacements make sure a fast response
     cannot trigger one of the former token-in-URL routes before the v2 stack is ready. */
  if (isRootDashboard()) {
    window.goBuyUnits = () => safeRoute("kaufen");
    window.goTipps = () => safeRoute("tipps");
    window.goFreigeschaltet = () => safeRoute("freigeschaltet");
    window.goUnitExchange = () => safeRoute("wechselboerse");
    window.goMarketingCenter = () => safeRoute("marketing-center");
    window.goSupport = () => safeRoute("support");
    window.openReceivedProfileLink = () => {
      const input = document.getElementById("receivedProfileLink");
      const token = extractAccess(input?.value || "");
      if (!token) {
        const message = document.getElementById("receivedLinkMessage");
        if (message) message.textContent = "Bitte Profil-Link oder Zugangscode eintragen.";
        return;
      }
      rememberRawAccess(token);
      const hash = ["premium","netzwerk","wallet","tipps","kaufen","freigeschaltet"].includes(String(location.hash||"").replace(/^#/,"").toLowerCase()) ? location.hash : "";
      safeRoute("", true, hash);
    };
    window.handleDeepLinkAfterProfileLoad = () => {
      if (window.deepLinkHandled) return;
      const target = String(location.hash||"").replace(/^#/,"").trim().toLowerCase();
      if (!target) return;
      if (["wallet","freigeschaltet","tipps","kaufen"].includes(target)) {
        window.deepLinkHandled = true;
        safeRoute(target, true);
        return;
      }
      if ((target === "premium" || target === "netzwerk") && typeof window.scrollToDeepLinkTarget === "function") {
        if (window.scrollToDeepLinkTarget(target)) window.deepLinkHandled = true;
      }
    };
  }

  function addDashboardScope() {
    if (!isRootDashboard() || document.querySelector('meta[name="bi-i18n-scope"]')) return;
    const meta = document.createElement("meta");
    meta.name = "bi-i18n-scope";
    meta.content = "dashboard";
    document.head.appendChild(meta);
  }

  function loadScript(relative, globalName = "") {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    const src = new URL(relative, ASSET_BASE).toString();
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) return new Promise((resolve,reject) => {
      if (!globalName || window[globalName]) return resolve(globalName ? window[globalName] : true);
      existing.addEventListener("load",() => resolve(globalName ? window[globalName] : true),{once:true});
      existing.addEventListener("error",reject,{once:true});
    });
    return new Promise((resolve,reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.biCompat = "1";
      script.addEventListener("load",() => resolve(globalName ? window[globalName] : true),{once:true});
      script.addEventListener("error",reject,{once:true});
      document.head.appendChild(script);
    });
  }

  async function boot() {
    installLandingLogoLink();
    addDashboardScope();
    try {
      await loadScript("tip-expiry-guard.js");
      await loadScript("app-session.js","BetInsightSession");
      await loadScript("i18n/core-v2.js","BetInsightI18n");
      await window.BetInsightI18n?.init?.();
      if (isRootDashboard()) await loadScript("i18n/dashboard-legacy.js");
      await loadScript("app-navigation-v2.js?v=20260830-4");
      await loadScript("premium-network-handoff.js?v=20260830-4","BetInsightPremiumNetworkHandoff");
      if (isRootDashboard()) {
        await loadScript("dashboard-layout.js");
        await loadScript("account-history.js");
        await loadScript("i18n/dashboard-completion.js");
      }
    } catch (error) {
      console.error("BetInsight multilingual navigation could not be loaded:", error);
    }
  }

  boot();
})();