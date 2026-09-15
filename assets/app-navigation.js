/* BetInsight App Navigation compatibility loader · multilingual customer app
   Goals:
   - customer pages that still include assets/app-navigation.js receive the multilingual v2 navigation
   - the large legacy root dashboard receives the DE/EN adapter without rewriting its business logic
   - internal customer navigation no longer generates URLs containing profile/dashboard access values
   - Premium Network uses a short-lived one-time-code handoff
   - admin pages are not part of this migration
   - selected users can receive a private Assist-mode switch without changing normal dashboard logic
*/
(() => {
  "use strict";

  const SCRIPT_URL = document.currentScript?.src || new URL("assets/app-navigation.js", location.href).toString();
  const ASSET_BASE = new URL("./", SCRIPT_URL);
  const APP_ROOT = new URL("../", SCRIPT_URL);
  const LANDING_PAGE_URL = "https://betinsight.club/";
  const PROFILE_API_URL = "https://hook.eu1.make.com/h51f7yyocer340kadcpp078uwcy2svbq";
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

  function installCuratedProviderChoice() {
    const pathname = location.pathname.replace(/\/+$/, "/");
    const providerPath = new URL("anbieter/", APP_ROOT).pathname.replace(/\/+$/, "/");
    if (pathname !== providerPath && pathname !== providerPath + "index.html") return;
    if (window.__betinsightCuratedProviderChoiceInstalled) return;
    window.__betinsightCuratedProviderChoiceInstalled = true;

    document.addEventListener("click", event => {
      const button = event.target instanceof Element ? event.target.closest('.choice[data-mode="any"]') : null;
      if (!button) return;

      const country = String(document.getElementById("countrySelect")?.value || "").trim().toUpperCase();
      const region = String(document.getElementById("regionSelect")?.value || "").trim();
      if (!country) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const url = new URL("anbieter-auswahl/", APP_ROOT);
      url.searchParams.set("country", country);
      if (region) url.searchParams.set("region", region);
      location.assign(url.toString());
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

  function storedAccess() {
    try {
      return String(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "").trim() || String(localStorage.getItem(PROFILE_STORAGE_KEY) || "").trim();
    } catch (e) { return ""; }
  }

  function installAssistAccess() {
    if (!isRootDashboard() || window.__betinsightAssistAccessInstalled) return;
    window.__betinsightAssistAccessInstalled = true;

    const attempt = async (remaining = 12) => {
      let access = storedAccess();
      if (!access) {
        const params = new URLSearchParams(location.search);
        access = String(params.get("dashboard_token") || params.get("token") || params.get("id") || "").trim();
      }
      if (!access) {
        if (remaining > 0) setTimeout(() => attempt(remaining - 1), 650);
        return;
      }

      try {
        const [profileResponse, configResponse] = await Promise.all([
          fetch(`${PROFILE_API_URL}?token=${encodeURIComponent(access)}&_=${Date.now()}`, {cache:"no-store", credentials:"omit"}),
          fetch(new URL(`assist/config.json?_=${Date.now()}`, APP_ROOT), {cache:"no-store", credentials:"omit"})
        ]);
        if (!profileResponse.ok || !configResponse.ok) return;
        const profile = await profileResponse.json();
        const config = await configResponse.json();
        if (!profile || profile.found === false) return;

        const userId = String(profile.user_id || profile.userid || profile.id || "").trim();
        const userConfig = Array.isArray(config?.users) ? config.users.find(user => String(user?.user_id || "").trim() === userId && user?.enabled !== false) : null;
        if (!userConfig || document.getElementById("bi-assist-switch-card")) return;

        const style = document.createElement("style");
        style.id = "bi-assist-switch-style";
        style.textContent = `
          .bi-assist-switch-card{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:-4px 0 22px;padding:15px 18px;border:1px solid rgba(24,212,163,.24);border-radius:18px;background:linear-gradient(110deg,rgba(8,48,63,.96),rgba(5,31,44,.96));box-shadow:0 16px 42px rgba(0,0,0,.22)}
          .bi-assist-switch-copy{min-width:0}.bi-assist-switch-copy strong{display:block;color:#f1fbff;font-size:14px}.bi-assist-switch-copy span{display:block;margin-top:4px;color:#95bacb;font-size:11px;line-height:1.4}
          .bi-assist-switch{position:relative;display:inline-block;flex:0 0 auto;width:58px;height:32px}.bi-assist-switch input{opacity:0;width:0;height:0}.bi-assist-slider{position:absolute;inset:0;cursor:pointer;border-radius:999px;background:#294653;border:1px solid rgba(255,255,255,.12);transition:.2s}.bi-assist-slider:before{content:"";position:absolute;width:24px;height:24px;left:4px;top:3px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 3px 9px rgba(0,0,0,.35)}.bi-assist-switch input:checked+.bi-assist-slider{background:linear-gradient(90deg,#11c998,#18a8ff)}.bi-assist-switch input:checked+.bi-assist-slider:before{transform:translateX(26px)}
          @media(max-width:620px){.bi-assist-switch-card{margin-top:0}.bi-assist-switch-copy strong{font-size:13px}}
        `;
        document.head.appendChild(style);

        const card = document.createElement("div");
        card.id = "bi-assist-switch-card";
        card.className = "bi-assist-switch-card";
        card.innerHTML = `<div class="bi-assist-switch-copy"><strong>🧭 Einfach-Modus</strong><span>Privater vereinfachter Zugang für deinen persönlichen Assist-Modus.</span></div><label class="bi-assist-switch" aria-label="Einfach-Modus öffnen"><input id="biAssistSwitch" type="checkbox"><span class="bi-assist-slider"></span></label>`;

        const header = document.querySelector(".dashboard-header");
        const page = document.querySelector(".page") || document.body;
        if (header?.parentNode) header.insertAdjacentElement("afterend", card);
        else page.insertAdjacentElement("afterbegin", card);

        card.querySelector("#biAssistSwitch")?.addEventListener("change", event => {
          if (event.target.checked) safeRoute("assist");
        });
      } catch (error) {
        console.warn("BetInsight Assist-Zugang konnte nicht geprüft werden:", error);
      }
    };

    const start = () => setTimeout(() => attempt(), 450);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
    else start();
  }

  /* Install a synchronous safety patch before any dependency is loaded. The legacy dashboard
     starts its profile request in its inline script; these replacements make sure a fast response
     cannot trigger one of the former token-in-URL routes before the v2 stack is ready. */
  if (isRootDashboard()) {
    window.goBuyUnits = () => safeRoute("kaufen");
    window.goTipps = () => safeRoute("tipps");
    window.goFreigeschaltet = () => safeRoute("freigeschaltet");
    window.goUnitExchange = () => safeRoute("wechselboerse");
    window.goMarketingCenter = () => safeRoute("ressourcen");
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
    installCuratedProviderChoice();
    installPremiumProvisionInfo();
    installAssistAccess();
    addDashboardScope();
    try {
      await loadScript("tip-expiry-guard.js?v=20260905-2");
      await loadScript("app-session.js?v=20260905-4","BetInsightSession");
      await loadScript("i18n/core-v2.js?v=20260913-2","BetInsightI18n");
      await window.BetInsightI18n?.init?.();
      if (isRootDashboard()) await loadScript("i18n/dashboard-legacy.js");
      await loadScript("app-navigation-v2.js?v=20260906-resources-1");
      await loadScript("premium-network-handoff.js?v=20260830-9","BetInsightPremiumNetworkHandoff");
      if (isRootDashboard()) {
        await loadScript("dashboard-layout.js?v=20260911-2");
        await loadScript("account-history.js");
        if (!window.BetInsightMemberCompletion) await loadScript("i18n/dashboard-completion.js");
        await loadScript("partner-invite-links.js?v=20260905-1");
      }
    } catch (error) {
      console.error("BetInsight multilingual navigation could not be loaded:", error);
    }
  }

  boot();
})();