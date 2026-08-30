/* BetInsight App Navigation compatibility loader · multilingual customer app
   Goals:
   - customer pages that still include assets/app-navigation.js receive the multilingual v2 navigation
   - the large legacy root dashboard receives the DE/EN adapter without rewriting its business logic
   - internal customer navigation no longer generates URLs containing profile/dashboard access values
   - Premium Network uses a short-lived one-time-code handoff
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

  function installPremiumProvisionInfo() {
    if (!isRootDashboard() || window.__betinsightPremiumProvisionInfoInstalled) return;
    window.__betinsightPremiumProvisionInfoInstalled = true;

    const apply = () => {
      const dialog = document.getElementById("membershipInfoPanel");
      if (!dialog || dialog.querySelector(".bi-premium-provision-plan")) return;

      if (!document.getElementById("bi-premium-provision-plan-style")) {
        const style = document.createElement("style");
        style.id = "bi-premium-provision-plan-style";
        style.textContent = `
          .bi-premium-provision-plan{margin-top:13px;padding:12px 13px;border:1px solid rgba(99,184,220,.16);border-radius:13px;background:rgba(1,16,25,.42)}
          .bi-premium-provision-plan strong{display:block;margin-bottom:7px;color:#effbff;font-size:10px}
          .bi-premium-provision-rates{display:flex;flex-wrap:wrap;gap:5px}
          .bi-premium-provision-rate{display:inline-flex;align-items:center;min-height:22px;padding:3px 7px;border:1px solid rgba(255,255,255,.09);border-radius:999px;background:rgba(255,255,255,.045);color:#d7edf7;font-size:8px;font-weight:900;white-space:nowrap}
          .premium-info-tier .bi-premium-provision-rate{border-color:rgba(14,220,166,.16)}
          .premiumplus-info-tier .bi-premium-provision-rate{border-color:rgba(255,171,46,.18)}
          .bi-premium-provision-max{margin-top:8px;color:#9fc7d7;font-size:8px;line-height:1.4}
          .bi-premium-provision-max b{color:#fff}
          .bi-premium-provision-rules{margin-top:14px;padding:11px 13px;border:1px solid rgba(255,193,91,.13);border-radius:12px;background:rgba(255,193,91,.035);color:#a9c7d3;font-size:9px;line-height:1.5}
          .bi-premium-provision-rules b{color:#eefaff}
        `;
        document.head.appendChild(style);
      }

      const premium = dialog.querySelector(".premium-info-tier");
      const plus = dialog.querySelector(".premiumplus-info-tier");
      const addPlan = (card, title, rates, max) => {
        if (!card) return;
        const box = document.createElement("div");
        box.className = "bi-premium-provision-plan";
        box.innerHTML = `<strong>${title}</strong><div class="bi-premium-provision-rates">${rates.map(([level,rate]) => `<span class="bi-premium-provision-rate">Ebene ${level}: ${rate}</span>`).join("")}</div><div class="bi-premium-provision-max">Maximale Tarif-Provision bei vollständiger Berechtigung: <b>${max}</b></div>`;
        card.appendChild(box);
      };

      addPlan(premium, "Premium-Provisionsplan", [[1,"30 %"],[2,"12 %"],[3,"8 %"],[4,"5 %"],[5,"3 %"]], "58 %");
      addPlan(plus, "Premium-Plus-Provisionsplan", [[1,"30 %"],[2,"12 %"],[3,"8 %"],[4,"5 %"],[5,"3 %"],[6,"2 %"],[7,"1,5 %"],[8,"1 %"]], "62,5 %");

      const rules = document.createElement("div");
      rules.className = "bi-premium-provision-rules";
      rules.innerHTML = "<b>So gilt der Provisionsplan:</b> Die Prozentsätze beziehen sich auf erfolgreich bezahlte Premium- bzw. Premium-Plus-Zahlungen. Provisionen entstehen nur für die mit dem eigenen Tarif freigeschalteten Ebenen, beginnen ab bestätigter Aktivierung und werden nicht rückwirkend vergeben. Nicht provisionsberechtigte oder unbesetzte Ebenen werden nicht auf andere Ebenen umverteilt. Das Unit-Referral-System bis Ebene 3 bleibt davon getrennt.";
      dialog.appendChild(rules);
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, {once:true});
    else apply();
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
    installPremiumProvisionInfo();
    addDashboardScope();
    try {
      await loadScript("tip-expiry-guard.js");
      await loadScript("app-session.js","BetInsightSession");
      await loadScript("i18n/core-v2.js","BetInsightI18n");
      await window.BetInsightI18n?.init?.();
      if (isRootDashboard()) await loadScript("i18n/dashboard-legacy.js");
      await loadScript("app-navigation-v2.js?v=20260830-9");
      await loadScript("premium-network-handoff.js?v=20260830-9","BetInsightPremiumNetworkHandoff");
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