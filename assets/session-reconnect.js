/* BetInsight resilient app session bridge · 2026-09-30
   Purpose: keep TIME CLASH/member pages from falling back to "Guest" before
   the shared BetInsight session has been checked and server-validated.
   No credentials are written into URLs. */
(() => {
  "use strict";

  const RETURN_KEY = "betinsight_return_after_connect";
  const DASHBOARD_KEY = "betinsight_dashboard_token";
  const PROFILE_KEY = "betinsight_profile_token";
  const PROFILE_API = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-member-gateway?route=profile-read";
  const CHECK_COOLDOWN = 4000;
  let lastCheck = 0;
  let checking = null;
  let lastValidCredential = "";

  const clean = value => String(value || "").trim();
  const lang = () => {
    const q = new URLSearchParams(location.search).get("lang");
    const saved = (() => { try { return localStorage.getItem("betinsight_language"); } catch (_) { return ""; } })();
    const v = clean(q || saved || document.documentElement.lang || "de").toLowerCase();
    return ["de","en","es","fr","it","pt","nl","zh-tw"].includes(v) ? v : "de";
  };
  const copy = {
    de:{checking:"BI: Verbindung wird geprüft …",signed:"BI: angemeldet",guest:"BI: Gast",connect:"🔗 Konto verbinden"},
    en:{checking:"BI: Checking connection …",signed:"BI: signed in",guest:"BI: Guest",connect:"🔗 Connect account"},
    es:{checking:"BI: Comprobando conexión …",signed:"BI: conectado",guest:"BI: Invitado",connect:"🔗 Conectar cuenta"},
    fr:{checking:"BI : Vérification …",signed:"BI : connecté",guest:"BI : Invité",connect:"🔗 Connecter le compte"},
    it:{checking:"BI: Verifica connessione …",signed:"BI: connesso",guest:"BI: Ospite",connect:"🔗 Collega account"},
    pt:{checking:"BI: A verificar ligação …",signed:"BI: autenticado",guest:"BI: Convidado",connect:"🔗 Ligar conta"},
    nl:{checking:"BI: Verbinding controleren …",signed:"BI: ingelogd",guest:"BI: Gast",connect:"🔗 Account verbinden"},
    "zh-tw":{checking:"BI：正在檢查連線 …",signed:"BI：已登入",guest:"BI：訪客",connect:"🔗 連結帳戶"}
  };
  const tr = key => (copy[lang()] || copy.de)[key];

  function sessionApi() { return window.BetInsightSession || null; }
  function storedCredential() {
    const api = sessionApi();
    let d = "", p = "";
    try {
      d = clean(api?.getDashboardUuid?.() || localStorage.getItem(DASHBOARD_KEY));
      p = clean(api?.getProfileToken?.() || localStorage.getItem(PROFILE_KEY));
    } catch (_) {}
    return d || p || "";
  }

  function sessionTextNodes() {
    const nodes = [];
    document.querySelectorAll("#biSession,.bi-session,#trainerSessionText").forEach(el => {
      if (!nodes.includes(el)) nodes.push(el);
    });
    return nodes;
  }

  function accountButton() { return document.getElementById("accountBtn"); }

  function ensureStyle() {
    if (document.getElementById("bi-session-reconnect-style")) return;
    const s = document.createElement("style");
    s.id = "bi-session-reconnect-style";
    s.textContent = `
      .bi-session-connect{display:inline-flex;align-items:center;justify-content:center;margin-left:7px;padding:6px 9px;border:1px solid rgba(116,217,255,.34);border-radius:999px;background:rgba(12,66,91,.46);color:#dff8ff!important;text-decoration:none!important;font:900 10px/1.2 Inter,Arial,sans-serif;white-space:nowrap;cursor:pointer}
      .bi-session-connect:hover,.bi-session-connect:focus-visible{outline:none;border-color:rgba(116,217,255,.72);background:rgba(17,91,123,.66)}
      [data-bi-session-status="checking"]{opacity:.82}
      [data-bi-session-status="signed"]{color:#71e5bd!important}
    `;
    document.head.appendChild(s);
  }

  function removeConnect() {
    document.querySelectorAll(".bi-session-connect").forEach(el => el.remove());
  }

  function rememberReturn() {
    try {
      const safe = location.pathname + location.search + location.hash;
      if (safe.startsWith("/") && !safe.startsWith("//")) localStorage.setItem(RETURN_KEY, safe);
    } catch (_) {}
  }

  function connectHref() { return "/konto/?next=dashboard"; }

  function addConnect() {
    ensureStyle();
    removeConnect();
    const anchorTarget = document.getElementById("biSession") || accountButton();
    if (!anchorTarget) return;
    const a = document.createElement("a");
    a.className = "bi-session-connect";
    a.href = connectHref();
    a.textContent = tr("connect");
    a.addEventListener("click", rememberReturn);
    anchorTarget.insertAdjacentElement("afterend", a);
  }

  function setState(state, label) {
    const text = label || tr(state === "checking" ? "checking" : state === "signed" ? "signed" : "guest");
    sessionTextNodes().forEach(el => {
      el.textContent = text;
      el.dataset.biSessionStatus = state;
    });
    const btn = accountButton();
    if (btn) {
      btn.dataset.state = state === "signed" ? "member" : state;
      btn.dataset.biSessionStatus = state;
      btn.title = text;
    }
    if (state === "guest") addConnect();
    else removeConnect();
  }

  async function validate(credential) {
    if (!credential) return null;
    const response = await fetch(PROFILE_API + "&token=" + encodeURIComponent(credential), {
      cache: "no-store",
      credentials: "omit",
      headers: {"Accept":"application/json"}
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.found === false || !data.email) return null;
    return data;
  }

  async function check(force = false) {
    const now = Date.now();
    if (!force && checking) return checking;
    if (!force && now - lastCheck < CHECK_COOLDOWN && lastValidCredential) {
      setState("signed");
      return true;
    }
    lastCheck = now;
    checking = (async () => {
      setState("checking");
      const credential = storedCredential();
      if (!credential) {
        lastValidCredential = "";
        setState("guest");
        window.dispatchEvent(new CustomEvent("bi:sessionstate",{detail:{state:"guest"}}));
        return false;
      }
      try {
        const profile = await validate(credential);
        if (!profile) {
          lastValidCredential = "";
          setState("guest");
          window.dispatchEvent(new CustomEvent("bi:sessionstate",{detail:{state:"guest"}}));
          return false;
        }
        lastValidCredential = credential;
        setState("signed");
        window.dispatchEvent(new CustomEvent("bi:sessionstate",{detail:{state:"signed",profile}}));
        return true;
      } catch (_) {
        /* A transient network failure must not turn a locally known member into Guest. */
        lastValidCredential = credential;
        setState("signed");
        window.dispatchEvent(new CustomEvent("bi:sessionstate",{detail:{state:"signed",transient:true}}));
        return true;
      }
    })();
    try { return await checking; }
    finally { checking = null; }
  }

  function bind() {
    window.addEventListener("pageshow", () => check(true));
    window.addEventListener("focus", () => check(false));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(false); });
    window.addEventListener("storage", event => {
      if ([DASHBOARD_KEY,PROFILE_KEY].includes(event.key)) check(true);
    });
    window.addEventListener("bi:languagechange", () => check(true));
    const btn = accountButton();
    if (btn) {
      btn.addEventListener("click", event => {
        if (btn.dataset.biSessionStatus === "guest") {
          event.preventDefault();
          event.stopImmediatePropagation();
          rememberReturn();
          location.assign(connectHref());
        }
      }, true);
    }
  }

  async function init() {
    ensureStyle();
    setState("checking");
    for (let i=0; i<20 && !window.BetInsightSession; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    bind();
    await check(true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();