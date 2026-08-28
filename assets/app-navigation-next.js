/* BetInsight App Navigation NEXT · multilingual + dashboard-token-free routing
   IMPORTANT: This preview file is NOT referenced by production pages yet.
   It is built for staged migration and testing on feature/i18n-multilang-safe-v3.

   Security invariant:
   - dashboard UUIDs are read from BetInsightSession/localStorage only.
   - no internal navigation URL is generated with dashboard_token, id or UUID token parameters.
   - cross-origin Premium Network handoff remains disabled here until a separate secure handoff is ready.
*/
(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 1179;
  const YOUTUBE_URL = "https://www.youtube.com/@betinsightclub";
  const ACCOUNT_SETTINGS_URL = "https://betinsight.systeme.io/school/course/mitglieder/lecture/9870726";

  const icons = {
    dashboard: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    daily: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16v11H4z"/><path d="M12 9v11M4 13h16"/><path d="M7.5 9C5.5 9 5 7.9 5 7c0-1.1.9-2 2-2 2.2 0 5 4 5 4M16.5 9C18.5 9 19 7.9 19 7c0-1.1-.9-2-2-2-2.2 0-5 4-5 4"/></svg>',
    tipps: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 9 13l3 3 7-9"/><path d="M14 7h5v5"/></svg>',
    buy: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 10.2c0-1.1 1.1-2 3-2s3 .9 3 2-1 1.8-3 1.8-3 .8-3 1.8 1.1 2 3 2 3-.9 3-2"/><path d="M12 6.5v11"/></svg>',
    exchange: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/></svg>',
    wallet: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 8h15"/><path d="M15 12h4v4h-4a2 2 0 0 1 0-4Z"/></svg>',
    providers: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1.5-5h-13Z"/><path d="M5 9v11h14V9"/><path d="M8 20v-6h4v6"/><path d="M15 13h2"/></svg>',
    network: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="m10.7 8.2-3.4 6.5M13.3 8.2l3.4 6.5M8.5 17h7"/></svg>',
    membership: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L5 8.1l4.8-.7Z"/><path d="M7 19h10"/></svg>',
    support: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h2v-7H4Zm16 0v4a2 2 0 0 1-2 2h-2v-7h4Z"/><path d="M16 19c0 1.1-.9 2-2 2h-2"/></svg>'
  };

  const navigation = [
    { id: "dashboard", key: "nav.dashboard", icon: icons.dashboard },
    { id: "daily", key: "nav.daily", icon: icons.daily },
    {
      id: "tipps-group", key: "nav.tips", icon: icons.tipps,
      children: [
        { id: "tipps", key: "nav.newTips" },
        { id: "freigeschaltet", key: "nav.unlockedTips" }
      ]
    },
    { id: "kaufen", key: "nav.buyPackages", icon: icons.buy },
    {
      id: "wechselboerse-group", key: "nav.exchange", icon: icons.exchange,
      children: [
        { id: "wechselboerse", key: "nav.overview" },
        { id: "angebote", key: "nav.buyOffers" },
        { id: "verkaufen", key: "nav.sellUnits" }
      ]
    },
    { id: "wallet", key: "nav.wallet", icon: icons.wallet },
    { id: "anbieter", key: "nav.providers", icon: icons.providers },
    {
      id: "netzwerk-group", key: "nav.network", icon: icons.network,
      children: [
        { id: "netzwerk", key: "nav.unitCommissions" },
        { id: "premium-provisionen", key: "nav.premiumCommissions" },
        { id: "marketing-center", key: "nav.marketingCenter" }
      ]
    },
    { id: "premium", key: "nav.membership", icon: icons.membership },
    { id: "support", key: "nav.support", icon: icons.support }
  ];

  let sidebar = null;
  let overlay = null;
  let toggle = null;
  let closeButton = null;

  const i18n = () => window.BetInsightI18n;
  const session = () => window.BetInsightSession;
  const t = (key, fallback) => i18n()?.t(key, {}, fallback) || fallback;

  function isMobile() {
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function label(item) {
    return t(item.key, item.id);
  }

  function showMessage(text) {
    const message = document.getElementById("message");
    if (message) {
      message.textContent = text;
      message.classList.add("bi-nav-route-message");
      window.setTimeout(() => message.classList.remove("bi-nav-route-message"), 2600);
      return;
    }
    console.info(`[BetInsight] ${text}`);
  }

  function requireDashboardAccess() {
    const api = session();
    if (!api?.hasDashboardAccess()) {
      showMessage(t("session.dashboardMissing", "Der persönliche Dashboard-Zugang ist für diese Seite noch nicht verfügbar."));
      return false;
    }
    return true;
  }

  function navigateLocal(segment = "", options = {}) {
    const api = session();
    if (!api) return;
    api.navigateLocal(segment, options);
  }

  function navigateProtected(segment = "", options = {}) {
    if (!requireDashboardAccess()) return;
    navigateLocal(segment, options);
  }

  function navigateProfileHash(hash) {
    if (!requireDashboardAccess()) return;
    const api = session();
    const rootPath = api.appPath();
    const currentPath = window.location.pathname;
    if (currentPath === rootPath) {
      if (window.location.hash !== `#${hash}`) history.pushState(null, "", `#${hash}`);
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      updateActiveState();
      closeNavigation();
      return;
    }
    api.navigateLocal("", { hash });
  }

  function logoutUser() {
    const confirmed = window.confirm(t("session.logoutConfirm", "Auf diesem Gerät ausloggen? Der gespeicherte Profilzugang wird entfernt."));
    if (!confirmed) return;

    try {
      localStorage.removeItem("betinsight_profile_token");
      localStorage.removeItem("betinsight_dashboard_token");
      localStorage.removeItem("betinsight_login_next");
      localStorage.removeItem("betinsight_email");
      sessionStorage.removeItem("betinsight_support_uuid_v2");
    } catch (e) {}

    if (isMobile()) closeNavigation();
    session()?.replaceLocal("");
  }

  function route(id) {
    switch (id) {
      case "dashboard": navigateProtected(""); break;
      case "daily": navigateProtected("daily"); break;
      case "tipps": navigateProtected("tipps"); break;
      case "freigeschaltet": navigateProtected("freigeschaltet"); break;
      case "kaufen": navigateProtected("pakete"); break;
      case "wechselboerse": navigateProtected("wechselboerse"); break;
      case "angebote": navigateProtected("wechselboerse/angebote"); break;
      case "verkaufen": navigateProtected("verkaufen"); break;
      case "wallet": navigateProtected("wallet"); break;
      case "anbieter": navigateLocal("anbieter"); break;
      case "netzwerk": navigateProfileHash("netzwerk"); break;
      case "premium": navigateProfileHash("premium"); break;
      case "marketing-center": navigateProtected("marketing-center"); break;
      case "support": navigateProtected("support"); break;
      case "premium-provisionen":
        showMessage(t("session.networkHandoffPending", "Der sichere Zugang zum Premium-Netzwerk wird gerade auf tokenfreie Übergabe umgestellt."));
        break;
      default: break;
    }
  }

  function activeId() {
    const hash = String(window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (["netzwerk", "premium"].includes(hash)) return hash;

    const api = session();
    const base = api?.basePath?.() || "/";
    const path = window.location.pathname;
    const relative = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\/+/, "");
    const parts = relative.split("/").filter(Boolean);
    const first = parts[0] || "dashboard";
    const second = parts[1] || "";
    if (first === "wechselboerse" && second === "angebote") return "angebote";
    if (first === "pakete") return "kaufen";
    const known = ["daily", "tipps", "freigeschaltet", "wechselboerse", "verkaufen", "wallet", "anbieter", "marketing-center", "support"];
    return known.includes(first) ? first : "dashboard";
  }

  function groupForRoute(routeId) {
    if (["tipps", "freigeschaltet"].includes(routeId)) return "tipps-group";
    if (["wechselboerse", "verkaufen", "angebote"].includes(routeId)) return "wechselboerse-group";
    if (["netzwerk", "premium-provisionen", "marketing-center"].includes(routeId)) return "netzwerk-group";
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
    document.querySelectorAll(".bi-nav-link, .bi-nav-sub-link").forEach(link => {
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
    link.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${label(item)}</span>`;
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
    button.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${label(item)}</span><span class="bi-nav-chevron" aria-hidden="true">⌄</span>`;
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
      link.innerHTML = `<span class="bi-nav-sub-dot" aria-hidden="true">•</span><span class="bi-nav-label">${label(child)}</span>`;
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

  function ensurePreviewStyles() {
    if (document.getElementById("bi-nav-next-styles")) return;
    const style = document.createElement("style");
    style.id = "bi-nav-next-styles";
    style.textContent = `
      .bi-language-switcher{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 10px}
      .bi-language-button{min-height:34px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(255,255,255,.035);color:#b9d5e1;font:800 11px/1 Inter,Arial,sans-serif;cursor:pointer}
      .bi-language-button[aria-pressed="true"]{border-color:rgba(37,230,167,.45);background:rgba(37,230,167,.10);color:#caffed}
      .bi-social-footer{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;margin:50px auto 0;padding:18px 0 4px;border-top:1px solid rgba(104,191,230,.12);color:#7398aa;font-family:Inter,Arial,sans-serif}
      .bi-social-footer-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .bi-social-links{display:flex;align-items:center;justify-content:center;gap:8px}
      .bi-social-link{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(3,24,35,.58);text-decoration:none}
      .bi-social-icon{display:block;width:20px;height:20px}
    `;
    document.head.appendChild(style);
  }

  function buildSocialFooter(page) {
    if (!page || page.querySelector(".bi-social-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "bi-social-footer";
    footer.setAttribute("aria-label", "BetInsight Social Media");
    footer.innerHTML = `<span class="bi-social-footer-label">${t("nav.followUs", "Folge uns")}</span>`;

    const links = document.createElement("div");
    links.className = "bi-social-links";
    const youtube = document.createElement("a");
    youtube.className = "bi-social-link bi-social-youtube";
    youtube.href = YOUTUBE_URL;
    youtube.target = "_blank";
    youtube.rel = "noopener noreferrer";
    youtube.setAttribute("aria-label", t("nav.openYoutube", "BetInsight Club auf YouTube öffnen"));
    youtube.innerHTML = '<svg class="bi-social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5.2" width="20" height="13.6" rx="4.2" fill="#ff0033"/><path d="M10 8.7 16 12l-6 3.3Z" fill="#fff"/></svg>';
    links.appendChild(youtube);
    footer.appendChild(links);
    page.appendChild(footer);
  }

  function buildNavigation() {
    if (!session() || !i18n()) {
      console.warn("BetInsight Navigation NEXT requires app-session.js and i18n/core.js.");
      return;
    }

    ensurePreviewStyles();

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "bi-nav-mobile-toggle";
    toggle.setAttribute("aria-label", t("nav.openMenu", "BetInsight-Menü öffnen"));
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "bi-nav-sidebar");
    toggle.textContent = "☰";

    overlay = document.createElement("div");
    overlay.className = "bi-nav-overlay";
    overlay.setAttribute("aria-hidden", "true");

    sidebar = document.createElement("aside");
    sidebar.id = "bi-nav-sidebar";
    sidebar.className = "bi-nav-sidebar";
    sidebar.setAttribute("aria-label", t("nav.appNavigation", "BetInsight App-Navigation"));

    const brand = document.createElement("div");
    brand.className = "bi-nav-brand";
    const logo = document.createElement("img");
    logo.className = "bi-nav-logo-image";
    logo.src = new URL(session().appPath("logo_betisight.club.png"), window.location.origin).toString();
    logo.alt = "BetInsight";

    closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bi-nav-close";
    closeButton.setAttribute("aria-label", t("nav.closeMenu", "Menü schließen"));
    closeButton.textContent = "×";
    brand.append(logo, closeButton);

    const list = document.createElement("nav");
    list.className = "bi-nav-list";
    list.setAttribute("aria-label", t("nav.mainNavigation", "Hauptnavigation"));
    navigation.forEach(item => list.appendChild(item.children ? createGroup(item) : createDirectLink(item)));

    const footer = document.createElement("div");
    footer.className = "bi-nav-footer";
    footer.appendChild(i18n().createSwitcher());

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "bi-nav-settings-link";
    logoutButton.style.width = "100%";
    logoutButton.style.cursor = "pointer";
    logoutButton.innerHTML = `<span class="bi-nav-settings-icon" aria-hidden="true">↪</span><span>${t("nav.logout", "Ausloggen")}</span>`;
    logoutButton.addEventListener("click", logoutUser);

    const settingsLink = document.createElement("a");
    settingsLink.className = "bi-nav-settings-link";
    settingsLink.href = ACCOUNT_SETTINGS_URL;
    settingsLink.target = "_blank";
    settingsLink.rel = "noopener noreferrer";
    settingsLink.innerHTML = `<span class="bi-nav-settings-icon" aria-hidden="true">⚙</span><span>${t("nav.accountSettings", "Kontoeinstellungen")}</span>`;

    const caption = document.createElement("span");
    caption.className = "bi-nav-footer-caption";
    caption.textContent = "BetInsight App";

    footer.append(logoutButton, settingsLink, caption);
    sidebar.append(brand, list, footer);
    document.body.append(overlay, sidebar, toggle);

    const page = document.querySelector("main");
    if (page) {
      page.classList.add("bi-nav-content-offset", "bi-nav-mobile-safe");
      buildSocialFooter(page);
    }

    toggle.addEventListener("click", () => sidebar.classList.contains("bi-nav-sidebar-open") ? closeNavigation() : openNavigation());
    closeButton.addEventListener("click", closeNavigation);
    overlay.addEventListener("click", closeNavigation);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && sidebar.classList.contains("bi-nav-sidebar-open")) closeNavigation();
    });
    window.addEventListener("resize", () => { if (!isMobile()) closeNavigation(); updateActiveState(); });
    window.addEventListener("hashchange", updateActiveState);
    window.addEventListener("popstate", updateActiveState);
    updateActiveState();
  }

  async function init() {
    await i18n()?.init?.();
    buildNavigation();
  }

  window.addEventListener("bi:languagechange", () => {
    if (!sidebar) return;
    sidebar.remove();
    overlay?.remove();
    toggle?.remove();
    sidebar = overlay = toggle = closeButton = null;
    document.querySelector(".bi-social-footer")?.remove();
    buildNavigation();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
