/* BetInsight App Navigation v2 · staged multilingual migration
   Premium/Netzwerk hash fix · 2026-08-30

   Security invariant:
   - dashboard UUIDs are stored locally through BetInsightSession.
   - internal navigation NEVER creates URLs containing dashboard_token, id or UUID token values.
   - legacy incoming UUID URLs may be captured once and immediately cleaned by app-session.js.
   - cross-origin Premium Network handoff uses a short-lived server-side one-time code and never exposes the dashboard UUID in the URL.

   Migration invariant:
   - existing customer pages only need the normal app-navigation.css plus this one script.
   - this script loads app-session.js and i18n/core-v2.js automatically when needed.
   - German remains the fallback language.
*/
(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 1179;
  const YOUTUBE_URL = "https://www.youtube.com/@betinsightclub";
  const TELEGRAM_URL = "https://t.me/betinsightclub_official";
  const ACCOUNT_SETTINGS_URL = "https://betinsight.systeme.io/school/course/mitglieder/lecture/9870726";
  const SCRIPT_URL = document.currentScript?.src || "";
  const ASSET_BASE = SCRIPT_URL ? new URL("./", SCRIPT_URL) : new URL("/assets/", window.location.origin);

  const icons = {
    dashboard:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    daily:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16v11H4z"/><path d="M12 9v11M4 13h16"/><path d="M7.5 9C5.5 9 5 7.9 5 7c0-1.1.9-2 2-2 2.2 0 5 4 5 4M16.5 9C18.5 9 19 7.9 19 7c0-1.1-.9-2-2-2-2.2 0-5 4-5 4"/></svg>',
    tips:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 9 13l3 3 7-9"/><path d="M14 7h5v5"/></svg>',
    buy:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 10.2c0-1.1 1.1-2 3-2s3 .9 3 2-1 1.8-3 1.8-3 .8-3 1.8 1.1 2 3 2 3-.9 3-2"/><path d="M12 6.5v11"/></svg>',
    exchange:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/></svg>',
    wallet:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 8h15"/><path d="M15 12h4v4h-4a2 2 0 0 1 0-4Z"/></svg>',
    providers:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1.5-5h-13Z"/><path d="M5 9v11h14V9"/><path d="M8 20v-6h4v6"/><path d="M15 13h2"/></svg>',
    network:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="m10.7 8.2-3.4 6.5M13.3 8.2l3.4 6.5M8.5 17h7"/></svg>',
    membership:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L5 8.1l4.8-.7Z"/><path d="M7 19h10"/></svg>',
    support:'<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h2v-7H4Zm16 0v4a2 2 0 0 1-2 2h-2v-7h4Z"/><path d="M16 19c0 1.1-.9 2-2 2h-2"/></svg>'
  };

  const navigation = [
    {id:"dashboard",key:"nav.dashboard",fallback:"Dashboard",icon:icons.dashboard},
    {id:"free-units-group",key:"nav.freeUnits",fallback:"Free Units",icon:icons.daily,children:[
      {id:"daily",key:"nav.daily",fallback:"Daily Bonus"},
      {id:"fan-challenge",key:"nav.fanChallenge",fallback:"Fan Challenge"}
    ]},
    {id:"tips-group",key:"nav.tips",fallback:"Tipps",icon:icons.tips,children:[
      {id:"tipps",key:"nav.newTips",fallback:"Neue Tipps"},
      {id:"freigeschaltet",key:"nav.unlockedTips",fallback:"Freigeschaltete Tipps"}
    ]},
    {id:"kaufen",key:"nav.buyPackages",fallback:"Units-Pakete kaufen",icon:icons.buy},
    {id:"exchange-group",key:"nav.exchange",fallback:"Unit-Wechselstube",icon:icons.exchange,children:[
      {id:"wechselboerse",key:"nav.overview",fallback:"Übersicht"},
      {id:"angebote",key:"nav.buyOffers",fallback:"Angebote kaufen"},
      {id:"verkaufen",key:"nav.sellUnits",fallback:"Units verkaufen"},
      {id:"meine-verkaufsangebote",key:"nav.mySaleOffers",fallback:"Meine Verkaufsangebote",fallbackEn:"My Sale Offers"}
    ]},
    {id:"wallet",key:"nav.wallet",fallback:"Wallet",icon:icons.wallet},
    {id:"anbieter",key:"nav.providers",fallback:"Wettanbieter",icon:icons.providers},
    {id:"network-group",key:"nav.network",fallback:"Netzwerk & Provisionen",icon:icons.network,children:[
      {id:"netzwerk",key:"nav.unitCommissions",fallback:"Unit-Provisionen"},
      {id:"premium-provisionen",key:"nav.premiumCommissions",fallback:"Premium-Provisionen"},
      {id:"marketing-center",key:"nav.marketingCenter",fallback:"Marketing-Center"}
    ]},
    {id:"premium",key:"nav.membership",fallback:"Mitgliedschaft",icon:icons.membership},
    {id:"support",key:"nav.support",fallback:"Support",icon:icons.support}
  ];

  let sidebar, overlay, toggle, closeButton;

  const waitForDom = () => document.readyState === "loading"
    ? new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, {once:true}))
    : Promise.resolve();

  function loadScript(relative, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    const absolute = new URL(relative, ASSET_BASE).toString();
    const existing = [...document.scripts].find(script => script.src === absolute);
    if (existing) {
      return new Promise((resolve, reject) => {
        const check = () => window[globalName] ? resolve(window[globalName]) : reject(new Error(`${globalName} missing`));
        if (existing.dataset.biLoaded === "1") return check();
        existing.addEventListener("load", check, {once:true});
        existing.addEventListener("error", reject, {once:true});
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = absolute;
      script.defer = true;
      script.dataset.biDependency = globalName;
      script.addEventListener("load", () => {
        script.dataset.biLoaded = "1";
        window[globalName] ? resolve(window[globalName]) : reject(new Error(`${globalName} missing`));
      }, {once:true});
      script.addEventListener("error", reject, {once:true});
      document.head.appendChild(script);
    });
  }

  async function ensureDependencies() {
    await loadScript("app-session.js", "BetInsightSession");
    await loadScript("i18n/core-v2.js", "BetInsightI18n");
    await window.BetInsightI18n.init();
  }

  const i18n = () => window.BetInsightI18n;
  const session = () => window.BetInsightSession;
  const t = (key, fallback) => i18n()?.t(key, {}, fallback) || fallback;
  const isMobile = () => window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  const localizedFallback = item => i18n()?.getLanguage?.() === "en" && item?.fallbackEn ? item.fallbackEn : item?.fallback;
  const itemLabel = item => t(item.key, localizedFallback(item));
  const socialText = (de,en) => i18n()?.getLanguage?.() === "en" ? en : de;

  function showMessage(text) {
    const message = document.getElementById("message");
    if (message) {
      message.textContent = text;
      message.classList.add("bi-nav-route-message");
      window.setTimeout(() => message.classList.remove("bi-nav-route-message"), 2600);
      return;
    }
    const toast = document.createElement("div");
    toast.className = "bi-nav-v2-toast";
    toast.textContent = text;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function requireDashboardAccess() {
    if (session()?.hasDashboardAccess()) return true;
    showMessage(t("session.dashboardMissing", "Der persönliche Dashboard-Zugang ist für diese Seite noch nicht verfügbar."));
    return false;
  }

  function requireAnyAccess() {
    if (session()?.hasDashboardAccess() || session()?.hasProfileAccess()) return true;
    showMessage(t("session.profileMissing", socialText("Dein persönlicher Zugang ist für diese Seite noch nicht verfügbar.","Your personal access is not available for this page yet.")));
    return false;
  }

  function navigateProtected(segment = "", options = {}) {
    if (!requireDashboardAccess()) return;
    session().navigateLocal(segment, options);
  }

  function navigateAnyProtected(segment = "", options = {}) {
    if (!requireAnyAccess()) return;
    session().navigateLocal(segment, options);
  }

  function navigateProfileHash(hash) {
    if (!requireAnyAccess()) return;
    const root = session().appPath();
    if (window.location.pathname === root) {
      if (window.location.hash !== `#${hash}`) history.pushState(null, "", `#${hash}`);
      document.getElementById(hash)?.scrollIntoView({behavior:"smooth",block:"start"});
      updateActiveState();
      closeNavigation();
      return;
    }
    session().navigateLocal("", {hash});
  }

  function logoutUser() {
    if (!window.confirm(t("session.logoutConfirm", "Auf diesem Gerät ausloggen? Der gespeicherte Profilzugang wird entfernt."))) return;
    try {
      localStorage.removeItem("betinsight_profile_token");
      localStorage.removeItem("betinsight_dashboard_token");
      localStorage.removeItem("betinsight_login_next");
      localStorage.removeItem("betinsight_email");
      sessionStorage.removeItem("betinsight_support_uuid_v2");
    } catch (e) {}
    if (isMobile()) closeNavigation();
    session().replaceLocal("");
  }

  function route(id) {
    switch (id) {
      case "dashboard": navigateProtected(""); break;
      case "daily": navigateProtected("daily"); break;
      case "fan-challenge": navigateProtected("fan-challenge"); break;
      case "tipps": navigateAnyProtected("tipps"); break;
      case "freigeschaltet": navigateProtected("freigeschaltet"); break;
      case "kaufen": navigateProtected("pakete"); break;
      case "wechselboerse": navigateProtected("wechselboerse"); break;
      case "angebote": navigateProtected("wechselboerse/angebote"); break;
      case "verkaufen": navigateProtected("verkaufen"); break;
      case "meine-verkaufsangebote": navigateProtected("meine-verkaufsangebote"); break;
      case "wallet": navigateProtected("wallet"); break;
      case "anbieter": session().navigateLocal("anbieter"); break;
      case "netzwerk": navigateProfileHash("netzwerk"); break;
      case "premium": navigateProfileHash("premium"); break;
      case "marketing-center": navigateProtected("marketing-center"); break;
      case "support": navigateProtected("support"); break;
      case "premium-provisionen": {
        showMessage(t("session.networkOpening", "Premium & Network wird sicher geöffnet …"));
        loadScript("premium-network-handoff.js?v=20260830-9", "BetInsightPremiumNetworkHandoff")
          .then(async () => {
            const started = await window.BetInsightPremiumNetworkHandoff?.start?.();
            if (!started) {
              if (!session()?.hasDashboardAccess()) {
                window.location.assign(session().appPath("konto") + "?next=premium-provisionen");
              } else {
                showMessage(t("session.networkHandoffError", "Premium & Network konnte gerade nicht geöffnet werden. Bitte versuche es erneut."));
              }
            }
          })
          .catch(() => showMessage(t("session.networkHandoffError", "Premium & Network konnte gerade nicht geöffnet werden. Bitte versuche es erneut.")));
        break;
      }
      default: break;
    }
  }

  function activeId() {
    const hash = String(window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (["netzwerk","premium"].includes(hash)) return hash;
    const base = session()?.basePath?.() || "/";
    const relative = window.location.pathname.startsWith(base)
      ? window.location.pathname.slice(base.length)
      : window.location.pathname.replace(/^\/+/, "");
    const parts = relative.split("/").filter(Boolean);
    const first = parts[0] || "dashboard";
    const second = parts[1] || "";
    if (first === "wechselboerse" && second === "angebote") return "angebote";
    if (first === "pakete") return "kaufen";
    const known = ["daily","fan-challenge","tipps","freigeschaltet","wechselboerse","verkaufen","meine-verkaufsangebote","wallet","anbieter","marketing-center","support"];
    return known.includes(first) ? first : "dashboard";
  }

  function groupForRoute(id) {
    if (["daily","fan-challenge"].includes(id)) return "free-units-group";
    if (["tipps","freigeschaltet"].includes(id)) return "tips-group";
    if (["wechselboerse","angebote","verkaufen","meine-verkaufsangebote"].includes(id)) return "exchange-group";
    if (["netzwerk","premium-provisionen","marketing-center"].includes(id)) return "network-group";
    return "";
  }

  function setGroupOpen(group, open, collapseOthers = false) {
    if (!group) return;
    if (collapseOthers && open) {
      document.querySelectorAll(".bi-nav-group-open").forEach(other => {
        if (other !== group) {
          other.classList.remove("bi-nav-group-open");
          other.querySelector(".bi-nav-group-button")?.setAttribute("aria-expanded", "false");
        }
      });
    }
    group.classList.toggle("bi-nav-group-open", open);
    group.querySelector(".bi-nav-group-button")?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function updateActiveState() {
    const active = activeId();
    const activeGroup = groupForRoute(active);
    document.querySelectorAll(".bi-nav-link,.bi-nav-sub-link").forEach(link => {
      const selected = link.dataset.biNavRoute === active;
      link.classList.toggle("bi-nav-link-active", selected && link.classList.contains("bi-nav-link"));
      link.classList.toggle("bi-nav-sub-link-active", selected && link.classList.contains("bi-nav-sub-link"));
      selected ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
    });
    document.querySelectorAll(".bi-nav-group").forEach(group => {
      const current = group.dataset.biNavGroup === activeGroup;
      group.classList.toggle("bi-nav-group-current", current);
      if (current) setGroupOpen(group, true, isMobile());
    });
  }

  function openNavigation() {
    if (!sidebar || !overlay || !toggle) return;
    sidebar.classList.add("bi-nav-sidebar-open");
    overlay.classList.add("bi-nav-overlay-open");
    overlay.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("bi-nav-mobile-toggle-hidden");
    document.documentElement.classList.add("bi-nav-lock-scroll");
    window.setTimeout(() => closeButton?.focus(), 0);
  }

  function closeNavigation() {
    if (!sidebar || !overlay || !toggle) return;
    sidebar.classList.remove("bi-nav-sidebar-open");
    overlay.classList.remove("bi-nav-overlay-open");
    overlay.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("bi-nav-mobile-toggle-hidden");
    document.documentElement.classList.remove("bi-nav-lock-scroll");
  }

  function createDirectLink(item) {
    const link = document.createElement("a");
    link.className = "bi-nav-link";
    link.href = "#";
    link.dataset.biNavRoute = item.id;
    link.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${itemLabel(item)}</span>`;
    link.addEventListener("click", event => {
      event.preventDefault();
      if (isMobile()) closeNavigation();
      route(item.id);
    });
    return link;
  }

  function createGroup(item) {
    const group = document.createElement("div");
    group.className = "bi-nav-group";
    group.dataset.biNavGroup = item.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bi-nav-group-button";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${itemLabel(item)}</span><span class="bi-nav-chevron" aria-hidden="true">⌄</span>`;
    button.addEventListener("click", () => setGroupOpen(group, !group.classList.contains("bi-nav-group-open"), isMobile()));

    const submenu = document.createElement("div");
    submenu.className = "bi-nav-submenu";
    const inner = document.createElement("div");
    inner.className = "bi-nav-submenu-inner";
    item.children.forEach(child => {
      const link = document.createElement("a");
      link.className = "bi-nav-sub-link";
      link.href = "#";
      link.dataset.biNavRoute = child.id;
      link.innerHTML = `<span class="bi-nav-sub-dot" aria-hidden="true">•</span><span class="bi-nav-label">${itemLabel(child)}</span>`;
      link.addEventListener("click", event => {
        event.preventDefault();
        if (isMobile()) closeNavigation();
        route(child.id);
      });
      inner.appendChild(link);
    });
    submenu.appendChild(inner);
    group.append(button, submenu);
    return group;
  }

  function ensureStyles() {
    if (document.getElementById("bi-nav-v2-styles")) return;
    const style = document.createElement("style");
    style.id = "bi-nav-v2-styles";
    style.textContent = `
      .bi-language-switcher{display:grid;grid-template-columns:repeat(auto-fit,minmax(42px,1fr));gap:6px;margin:8px 0 10px}
      .bi-language-button{min-height:34px;padding:0 8px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(255,255,255,.035);color:#b9d5e1;font:800 11px/1 Inter,Arial,sans-serif;cursor:pointer}
      .bi-language-button:hover,.bi-language-button:focus-visible{outline:none;border-color:rgba(89,168,255,.38);color:#fff}
      .bi-language-button[aria-pressed="true"]{border-color:rgba(37,230,167,.45);background:rgba(37,230,167,.10);color:#caffed}
      .bi-nav-v2-toast{position:fixed;right:18px;bottom:18px;z-index:10050;max-width:min(420px,calc(100vw - 36px));padding:13px 15px;border:1px solid rgba(255,200,87,.34);border-radius:12px;background:#102633;color:#f7e5ad;font:700 13px/1.45 Inter,Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.34)}
      .bi-social-footer{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;margin:50px auto 0;padding:18px 0 4px;border-top:1px solid rgba(104,191,230,.12);color:#7398aa;font-family:Inter,Arial,sans-serif}
      .bi-social-footer-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .bi-social-links{display:flex;align-items:center;justify-content:center;gap:8px}
      .bi-social-link{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(3,24,35,.58);text-decoration:none;box-shadow:0 8px 20px rgba(0,0,0,.16);transition:transform .16s ease,border-color .16s ease,background .16s ease}
      .bi-social-link:hover,.bi-social-link:focus-visible{transform:translateY(-1px);border-color:rgba(89,168,255,.48);background:rgba(12,49,68,.52);outline:none}
      .bi-social-icon{display:block;width:20px;height:20px}
    `;
    document.head.appendChild(style);
  }

  function buildSocialFooter(page) {
    if (!page || page.querySelector(".bi-social-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "bi-social-footer";
    footer.setAttribute("aria-label", "BetInsight Social Media");
    footer.innerHTML = `<span class="bi-social-footer-label">${t("nav.followUs",socialText("Folge uns","Follow us"))}</span>`;
    const links = document.createElement("div");
    links.className = "bi-social-links";

    const youtube = document.createElement("a");
    youtube.className = "bi-social-link bi-social-youtube";
    youtube.href = YOUTUBE_URL;
    youtube.target = "_blank";
    youtube.rel = "noopener noreferrer";
    youtube.setAttribute("aria-label", t("nav.openYoutube",socialText("BetInsight Club auf YouTube öffnen","Open BetInsight Club on YouTube")));
    youtube.title = t("nav.openYoutube",socialText("BetInsight Club auf YouTube öffnen","Open BetInsight Club on YouTube"));
    youtube.innerHTML = '<svg class="bi-social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5.2" width="20" height="13.6" rx="4.2" fill="#ff0033"/><path d="M10 8.7 16 12l-6 3.3Z" fill="#fff"/></svg>';

    const telegram = document.createElement("a");
    telegram.className = "bi-social-link bi-social-telegram";
    telegram.href = TELEGRAM_URL;
    telegram.target = "_blank";
    telegram.rel = "noopener noreferrer";
    const telegramLabel = socialText("BetInsight Club auf Telegram öffnen","Open BetInsight Club on Telegram");
    telegram.setAttribute("aria-label", telegramLabel);
    telegram.title = telegramLabel;
    telegram.innerHTML = '<svg class="bi-social-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#229ED9"/><path d="M17.6 7.3 15 17c-.2.7-.8.9-1.4.5l-4-3-1.9 1.8c-.2.2-.4.4-.8.4l.3-4.1 7.4-6.7c.3-.3-.1-.5-.5-.2l-9.1 5.7-3.9-1.2c-.8-.3-.9-.9.2-1.3l15.2-5.9c.7-.3 1.4.2 1.1 1.4Z" fill="#fff"/></svg>';

    links.append(youtube,telegram);
    footer.appendChild(links);
    page.appendChild(footer);
  }

  function destroyNavigation() {
    sidebar?.remove(); overlay?.remove(); toggle?.remove();
    document.querySelector(".bi-social-footer")?.remove();
    sidebar = overlay = toggle = closeButton = null;
  }

  function buildNavigation() {
    destroyNavigation();
    ensureStyles();

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "bi-nav-mobile-toggle";
    toggle.setAttribute("aria-label", t("nav.openMenu",socialText("BetInsight-Menü öffnen","Open BetInsight menu")));
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "bi-nav-sidebar");
    toggle.textContent = "☰";

    overlay = document.createElement("div");
    overlay.className = "bi-nav-overlay";
    overlay.setAttribute("aria-hidden", "true");

    sidebar = document.createElement("aside");
    sidebar.id = "bi-nav-sidebar";
    sidebar.className = "bi-nav-sidebar";
    sidebar.setAttribute("aria-label", t("nav.appNavigation",socialText("BetInsight App-Navigation","BetInsight app navigation")));

    const brand = document.createElement("div");
    brand.className = "bi-nav-brand";
    const logo = document.createElement("img");
    logo.className = "bi-nav-logo-image";
    logo.src = new URL(session().appPath("logo_betisight.club.png"), window.location.origin).toString();
    logo.alt = "BetInsight";
    logo.addEventListener("error", () => { logo.hidden = true; });

    closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bi-nav-close";
    closeButton.setAttribute("aria-label", t("nav.closeMenu",socialText("Menü schließen","Close menu")));
    closeButton.textContent = "×";
    brand.append(logo, closeButton);

    const list = document.createElement("nav");
    list.className = "bi-nav-list";
    list.setAttribute("aria-label", t("nav.mainNavigation",socialText("Hauptnavigation","Main navigation")));
    navigation.forEach(item => list.appendChild(item.children ? createGroup(item) : createDirectLink(item)));

    const footer = document.createElement("div");
    footer.className = "bi-nav-footer";
    footer.appendChild(i18n().createSwitcher());

    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "bi-nav-settings-link";
    logout.style.width = "100%";
    logout.style.cursor = "pointer";
    logout.style.fontFamily = "inherit";
    logout.style.textAlign = "left";
    logout.innerHTML = `<span class="bi-nav-settings-icon" aria-hidden="true">↪</span><span>${t("nav.logout",socialText("Ausloggen","Log Out"))}</span>`;
    logout.addEventListener("click", logoutUser);

    const settings = document.createElement("a");
    settings.className = "bi-nav-settings-link";
    settings.href = ACCOUNT_SETTINGS_URL;
    settings.target = "_blank";
    settings.rel = "noopener noreferrer";
    settings.innerHTML = `<span class="bi-nav-settings-icon" aria-hidden="true">⚙</span><span>${t("nav.accountSettings",socialText("Kontoeinstellungen","Account Settings"))}</span>`;

    const caption = document.createElement("span");
    caption.className = "bi-nav-footer-caption";
    caption.textContent = "BetInsight App";

    footer.append(logout, settings, caption);
    sidebar.append(brand, list, footer);
    document.body.append(overlay, sidebar, toggle);

    const page = document.querySelector("main");
    if (page) {
      page.classList.add("bi-nav-content-offset","bi-nav-mobile-safe");
      buildSocialFooter(page);
    }

    toggle.addEventListener("click", () => sidebar.classList.contains("bi-nav-sidebar-open") ? closeNavigation() : openNavigation());
    closeButton.addEventListener("click", closeNavigation);
    overlay.addEventListener("click", closeNavigation);
    updateActiveState();
  }

  function bindGlobalEvents() {
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && sidebar?.classList.contains("bi-nav-sidebar-open")) closeNavigation();
    });
    window.addEventListener("resize", () => { if (!isMobile()) closeNavigation(); updateActiveState(); });
    window.addEventListener("hashchange", updateActiveState);
    window.addEventListener("popstate", updateActiveState);
    window.addEventListener("bi:languagechange", () => {
      i18n()?.apply?.(document);
      buildNavigation();
    });
  }

  async function init() {
    try {
      await waitForDom();
      await ensureDependencies();
      i18n().apply(document);
      buildNavigation();
      bindGlobalEvents();
      window.BetInsightNavigationV2 = Object.freeze({route, rebuild:buildNavigation});
    } catch (error) {
      console.error("BetInsight navigation v2 could not initialize.", error);
    }
  }

  init();
})();