/* BetInsight App Navigation · 2026-08-25-02
   Reuses existing BetInsight token helpers/storage. It does not authenticate users.
   Login return targets are strictly whitelisted and never accept arbitrary external URLs. */
(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 1179;
  const GITHUB_HOST = "betinsightclub.github.io";
  const PROFILE_STORAGE_KEY = "betinsight_profile_token";
  const DASHBOARD_STORAGE_KEY = "betinsight_dashboard_token";
  const LOGIN_NEXT_KEY = "betinsight_login_next";
  const NETWORK_PREMIUM_URL = "https://betinsight.network/premium/";
  const ALLOWED_NEXT = new Set([
    "dashboard", "daily", "tipps", "freigeschaltet", "kaufen", "wechselboerse",
    "angebote", "verkaufen", "wallet", "netzwerk", "premium-provisionen",
    "marketing-center", "premium", "support"
  ]);

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
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "daily", label: "Daily Bonus", icon: icons.daily },
    {
      id: "tipps-group",
      label: "Tipps",
      icon: icons.tipps,
      children: [
        { id: "tipps", label: "Neue Tipps" },
        { id: "freigeschaltet", label: "Freigeschaltete Tipps" }
      ]
    },
    { id: "kaufen", label: "Units-Pakete kaufen", icon: icons.buy },
    {
      id: "wechselboerse-group",
      label: "Unit-Wechselstube",
      icon: icons.exchange,
      children: [
        { id: "wechselboerse", label: "Übersicht" },
        { id: "angebote", label: "Angebote kaufen" },
        { id: "verkaufen", label: "Units verkaufen" }
      ]
    },
    { id: "wallet", label: "Wallet", icon: icons.wallet },
    { id: "anbieter", label: "Wettanbieter", icon: icons.providers },
    {
      id: "netzwerk-group",
      label: "Netzwerk & Provisionen",
      icon: icons.network,
      children: [
        { id: "netzwerk", label: "Unit-Provisionen" },
        { id: "premium-provisionen", label: "Premium-Provisionen" },
        { id: "marketing-center", label: "Marketing-Center" }
      ]
    },
    { id: "premium", label: "Mitgliedschaft", icon: icons.membership },
    { id: "support", label: "Support", icon: icons.support }
  ];

  let sidebar = null;
  let overlay = null;
  let toggle = null;
  let closeButton = null;

  function isMobile() {
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
  }

  function normalizeNext(value) {
    const clean = String(value || "").trim().toLowerCase();
    return ALLOWED_NEXT.has(clean) ? clean : "";
  }

  function setPendingNext(value) {
    const clean = normalizeNext(value);
    if (!clean) return "";
    try { localStorage.setItem(LOGIN_NEXT_KEY, clean); } catch (e) {}
    return clean;
  }

  function getPendingNext() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normalizeNext(params.get("next"));
    if (fromUrl) return setPendingNext(fromUrl);
    try { return normalizeNext(localStorage.getItem(LOGIN_NEXT_KEY)); } catch (e) { return ""; }
  }

  function clearPendingNext() {
    try { localStorage.removeItem(LOGIN_NEXT_KEY); } catch (e) {}
  }

  function stripNextParam() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("next")) return;
      url.searchParams.delete("next");
      const search = url.searchParams.toString();
      history.replaceState(null, "", url.pathname + (search ? `?${search}` : "") + url.hash);
    } catch (e) {}
  }

  function basePath() {
    return window.location.hostname.toLowerCase() === GITHUB_HOST ? "/profil/" : "/";
  }

  function appPath(segment = "") {
    const base = basePath();
    const clean = String(segment || "").replace(/^\/+|\/+$/g, "");
    if (!clean) return base;
    const looksLikeFile = /\.[a-z0-9]{2,8}$/i.test(clean);
    return `${base}${clean}${looksLikeFile ? "" : "/"}`;
  }

  function urlAccessValue(...names) {
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const value = String(params.get(name) || "").trim();
      if (value) return value;
    }
    return "";
  }

  function currentProfileToken() {
    const fromUrl = urlAccessValue("token");
    if (fromUrl && !isUuid(fromUrl)) {
      localStorage.setItem(PROFILE_STORAGE_KEY, fromUrl);
      return fromUrl;
    }

    const saved = typeof window.getSavedToken === "function"
      ? String(window.getSavedToken() || "").trim()
      : String(localStorage.getItem(PROFILE_STORAGE_KEY) || "").trim();
    if (saved && !isUuid(saved)) return saved;

    const active = typeof window.getActiveToken === "function"
      ? String(window.getActiveToken() || "").trim()
      : "";
    if (active && !isUuid(active)) return active;
    return "";
  }

  function currentDashboardUuid() {
    const fromUrl = urlAccessValue("dashboard_token", "id", "token");
    if (isUuid(fromUrl)) {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, fromUrl);
      return fromUrl;
    }

    if (typeof window.getConfirmedDashboardToken === "function") {
      const confirmed = String(window.getConfirmedDashboardToken() || "").trim();
      if (isUuid(confirmed)) return confirmed;
    }
    const stored = String(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "").trim();
    return isUuid(stored) ? stored : "";
  }

  function logoutUser() {
    const confirmed = window.confirm("Auf diesem Gerät ausloggen? Der gespeicherte Profilzugang wird entfernt.");
    if (!confirmed) return;

    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    localStorage.removeItem(LOGIN_NEXT_KEY);
    localStorage.removeItem("betinsight_email");

    if (isMobile()) closeNavigation();
    window.location.replace(appPath());
  }

  function showMessage(text) {
    const message = document.getElementById("message");
    if (message) {
      message.textContent = text;
      message.classList.add("bi-nav-route-message");
      window.setTimeout(() => message.classList.remove("bi-nav-route-message"), 2200);
    }
  }

  function navigateProfileRoute(segment) {
    const token = currentProfileToken();
    if (!token) {
      showMessage("Der persönliche Profilzugang ist für diese Seite noch nicht verfügbar.");
      return;
    }
    window.location.assign(`${appPath(segment)}?token=${encodeURIComponent(token)}`);
  }

  function navigateDashboardRoute(segment, parameter = "token") {
    const dashboardUuid = currentDashboardUuid();
    if (!dashboardUuid) {
      showMessage("Der persönliche Dashboard-Zugang ist für diese Seite noch nicht verfügbar.");
      return;
    }
    window.location.assign(`${appPath(segment)}?${parameter}=${encodeURIComponent(dashboardUuid)}`);
  }

  function navigatePackageRoute() {
    const sessionToken = currentDashboardUuid() || currentProfileToken();
    if (!sessionToken) {
      showMessage("Der persönliche Zugang ist für die Paketauswahl noch nicht verfügbar.");
      return;
    }
    window.location.assign(`${appPath("pakete")}?token=${encodeURIComponent(sessionToken)}`);
  }

  function navigateDailyRoute() {
    const token = currentDashboardUuid() || currentProfileToken();
    if (!token) {
      showMessage("Der persönliche Zugang für Daily Bonus ist noch nicht verfügbar.");
      return;
    }
    window.location.assign(`${appPath("daily")}?token=${encodeURIComponent(token)}`);
  }

  function navigatePremiumNetworkRoute() {
    const dashboardUuid = currentDashboardUuid();
    if (dashboardUuid) {
      clearPendingNext();
      window.location.assign(`${NETWORK_PREMIUM_URL}?token=${encodeURIComponent(dashboardUuid)}`);
      return;
    }

    const profileToken = currentProfileToken();
    setPendingNext("premium-provisionen");
    if (profileToken) {
      window.location.assign(`${appPath()}?token=${encodeURIComponent(profileToken)}&next=premium-provisionen`);
      return;
    }

    window.location.assign(`${appPath("konto")}?next=premium-provisionen`);
  }

  function navigateLocalHash(hash) {
    if (window.location.pathname !== appPath()) {
      const token = currentDashboardUuid() || currentProfileToken();
      const query = token ? `?token=${encodeURIComponent(token)}` : "";
      window.location.assign(`${appPath()}${query}#${hash}`);
      return;
    }
    if (window.location.hash !== `#${hash}`) history.pushState(null, "", `#${hash}`);
    const target = document.getElementById(hash);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    updateActiveState();
    closeNavigation();
  }

  function route(id) {
    switch (id) {
      case "dashboard": {
        if (window.location.pathname === appPath()) {
          if (window.location.hash) history.pushState(null, "", window.location.pathname + window.location.search);
          window.scrollTo({ top: 0, behavior: "smooth" });
          updateActiveState();
          closeNavigation();
        } else {
          const token = currentDashboardUuid() || currentProfileToken();
          window.location.assign(appPath() + (token ? `?token=${encodeURIComponent(token)}` : ""));
        }
        break;
      }
      case "daily": navigateDailyRoute(); break;
      case "tipps": navigateProfileRoute("tipps"); break;
      case "freigeschaltet": navigateDashboardRoute("freigeschaltet"); break;
      case "kaufen": navigatePackageRoute(); break;
      case "wechselboerse": navigateDashboardRoute("wechselboerse"); break;
      case "angebote": navigateDashboardRoute("wechselboerse/angebote"); break;
      case "verkaufen": navigateDashboardRoute("verkaufen"); break;
      case "wallet": navigateDashboardRoute("wallet", "id"); break;
      case "anbieter": window.location.assign(appPath("anbieter")); break;
      case "netzwerk": navigateLocalHash("netzwerk"); break;
      case "premium-provisionen": navigatePremiumNetworkRoute(); break;
      case "marketing-center": {
        const token = currentDashboardUuid() || currentProfileToken();
        window.location.assign(`${appPath("marketing-center")}${token ? `?token=${encodeURIComponent(token)}` : ""}`);
        break;
      }
      case "premium": navigateLocalHash("premium"); break;
      case "support": navigateDashboardRoute("support"); break;
      default: break;
    }
  }

  function handlePendingNext(attempt = 0) {
    const pending = getPendingNext();
    if (!pending) return;

    if (pending === "premium-provisionen") {
      const dashboardUuid = currentDashboardUuid();
      if (dashboardUuid) {
        clearPendingNext();
        stripNextParam();
        window.location.assign(`${NETWORK_PREMIUM_URL}?token=${encodeURIComponent(dashboardUuid)}`);
        return;
      }

      if (attempt < 24 && window.location.pathname === appPath()) {
        window.setTimeout(() => handlePendingNext(attempt + 1), 250);
        return;
      }

      return;
    }

    clearPendingNext();
    stripNextParam();
    window.setTimeout(() => route(pending), 40);
  }

  function activeId() {
    const hash = String(window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (["netzwerk", "premium", "wallet", "tipps", "kaufen", "freigeschaltet"].includes(hash)) return hash;

    const path = window.location.pathname;
    const base = basePath();
    const relative = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\/+/, "");
    const parts = relative.split("/").filter(Boolean);
    const first = parts[0] || "dashboard";
    const second = parts[1] || "";
    if (first === "wechselboerse" && second === "angebote") return "angebote";
    const known = ["daily", "tipps", "freigeschaltet", "kaufen", "wechselboerse", "verkaufen", "wallet", "anbieter", "marketing-center", "support"];
    if (first === "pakete") return "kaufen";
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
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    document.querySelectorAll(".bi-nav-group").forEach(group => {
      const current = group.dataset.biNavGroup === activeGroup;
      group.classList.toggle("bi-nav-group-current", current);
      if (current) setGroupOpen(group, true, isMobile());
    });
  }

  function toggleGroup(group) {
    const open = !group.classList.contains("bi-nav-group-open");
    setGroupOpen(group, open, isMobile());
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
    link.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${item.label}</span>`;
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
    button.innerHTML = `<span class="bi-nav-icon">${item.icon}</span><span class="bi-nav-label">${item.label}</span><span class="bi-nav-chevron" aria-hidden="true">⌄</span>`;
    button.addEventListener("click", () => toggleGroup(group));

    const submenu = document.createElement("div");
    submenu.className = "bi-nav-submenu";
    const inner = document.createElement("div");
    inner.className = "bi-nav-submenu-inner";

    item.children.filter(child => child.visible !== false).forEach(child => {
      const link = document.createElement("a");
      link.className = "bi-nav-sub-link";
      link.href = "#";
      link.dataset.biNavRoute = child.id;
      link.innerHTML = `<span class="bi-nav-sub-dot" aria-hidden="true">•</span><span class="bi-nav-label">${child.label}</span>`;
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

  function buildNavigation() {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "bi-nav-mobile-toggle";
    toggle.setAttribute("aria-label", "BetInsight-Menü öffnen");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "bi-nav-sidebar");
    toggle.textContent = "☰";

    overlay = document.createElement("div");
    overlay.className = "bi-nav-overlay";
    overlay.setAttribute("aria-hidden", "true");

    sidebar = document.createElement("aside");
    sidebar.id = "bi-nav-sidebar";
    sidebar.className = "bi-nav-sidebar";
    sidebar.setAttribute("aria-label", "BetInsight App-Navigation");

    const brand = document.createElement("div");
    brand.className = "bi-nav-brand";

    const logo = document.createElement("img");
    logo.className = "bi-nav-logo-image";
    logo.src = new URL(appPath("logo_betisight.club.png"), window.location.origin).toString();
    logo.alt = "BetInsight";
    logo.addEventListener("error", () => { logo.hidden = true; });

    closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bi-nav-close";
    closeButton.setAttribute("aria-label", "Menü schließen");
    closeButton.textContent = "×";

    brand.append(logo, closeButton);

    const list = document.createElement("nav");
    list.className = "bi-nav-list";
    list.setAttribute("aria-label", "Hauptnavigation");

    navigation.forEach(item => {
      list.appendChild(Array.isArray(item.children) ? createGroup(item) : createDirectLink(item));
    });

    const footer = document.createElement("div");
    footer.className = "bi-nav-footer";

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "bi-nav-settings-link";
    logoutButton.style.width = "100%";
    logoutButton.style.cursor = "pointer";
    logoutButton.style.fontFamily = "inherit";
    logoutButton.style.textAlign = "left";
    logoutButton.innerHTML = '<span class="bi-nav-settings-icon" aria-hidden="true">↪</span><span>Ausloggen</span>';
    logoutButton.addEventListener("click", logoutUser);

    const settingsLink = document.createElement("a");
    settingsLink.className = "bi-nav-settings-link";
    settingsLink.href = "https://betinsight.systeme.io/school/course/mitglieder/lecture/9870726";
    settingsLink.target = "_blank";
    settingsLink.rel = "noopener noreferrer";
    settingsLink.innerHTML = '<span class="bi-nav-settings-icon" aria-hidden="true">⚙</span><span>Kontoeinstellungen</span>';

    const footerCaption = document.createElement("span");
    footerCaption.className = "bi-nav-footer-caption";
    footerCaption.textContent = "BetInsight App";

    footer.append(logoutButton, settingsLink, footerCaption);
    sidebar.append(brand, list, footer);
    document.body.append(overlay, sidebar, toggle);
    const page = document.querySelector("main");
    if (page) page.classList.add("bi-nav-content-offset", "bi-nav-mobile-safe");

    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("bi-nav-sidebar-open")) closeNavigation();
      else openNavigation();
    });
    closeButton.addEventListener("click", closeNavigation);
    overlay.addEventListener("click", closeNavigation);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && sidebar.classList.contains("bi-nav-sidebar-open")) {
        closeNavigation();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) closeNavigation();
      updateActiveState();
    });
    window.addEventListener("hashchange", updateActiveState);
    window.addEventListener("popstate", updateActiveState);

    updateActiveState();
    window.setTimeout(() => handlePendingNext(0), 80);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildNavigation, { once: true });
  else buildNavigation();
})();