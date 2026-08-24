/* BetInsight App Navigation · Prototype v1 · 2026-08-24
   Reuses the profile page's existing token helpers. It does not authenticate users. */
(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 1179;
  const GITHUB_HOST = "betinsightclub.github.io";
  const PROFILE_STORAGE_KEY = "betinsight_profile_token";

  const icons = {
    dashboard: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    tipps: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 9 13l3 3 7-9"/><path d="M14 7h5v5"/></svg>',
    unlocked: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 9.7-1.7"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="m9 15 2 2 4-4"/></svg>',
    buy: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 10.2c0-1.1 1.1-2 3-2s3 .9 3 2-1 1.8-3 1.8-3 .8-3 1.8 1.1 2 3 2 3-.9 3-2"/><path d="M12 6.5v11"/></svg>',
    exchange: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/></svg>',
    wallet: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 8h15"/><path d="M15 12h4v4h-4a2 2 0 0 1 0-4Z"/></svg>',
    network: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="m10.7 8.2-3.4 6.5M13.3 8.2l3.4 6.5M8.5 17h7"/></svg>',
    membership: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L5 8.1l4.8-.7Z"/><path d="M7 19h10"/></svg>',
    support: '<svg class="bi-nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h2v-7H4Zm16 0v4a2 2 0 0 1-2 2h-2v-7h4Z"/><path d="M16 19c0 1.1-.9 2-2 2h-2"/></svg>'
  };

  const items = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "tipps", label: "Neue Tipps", icon: icons.tipps },
    { id: "freigeschaltet", label: "Freigeschaltete Tipps", icon: icons.unlocked },
    { id: "kaufen", label: "Units kaufen", icon: icons.buy },
    { id: "wechselboerse", label: "Unit-Wechselstube", icon: icons.exchange },
    { id: "wallet", label: "Wallet", icon: icons.wallet },
    { id: "netzwerk", label: "Netzwerk & Provisionen", icon: icons.network },
    { id: "premium", label: "Mitgliedschaft", icon: icons.membership },
    { id: "support", label: "Support", icon: icons.support }
  ];

  let sidebar = null;
  let overlay = null;
  let toggle = null;
  let closeButton = null;
  let floatingBack = null;

  function isMobile() {
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function basePath() {
    return window.location.hostname.toLowerCase() === GITHUB_HOST ? "/profil/" : "/";
  }

  function appPath(segment = "") {
    const base = basePath();
    return segment ? `${base}${segment.replace(/^\/+|\/+$/g, "")}/` : base;
  }

  function currentProfileToken() {
    const saved = typeof window.getSavedToken === "function"
      ? String(window.getSavedToken() || "").trim()
      : String(localStorage.getItem(PROFILE_STORAGE_KEY) || "").trim();
    if (saved && !(typeof window.isDashboardUuid === "function" && window.isDashboardUuid(saved))) return saved;

    const active = typeof window.getActiveToken === "function"
      ? String(window.getActiveToken() || "").trim()
      : "";
    if (active && !(typeof window.isDashboardUuid === "function" && window.isDashboardUuid(active))) return active;
    return "";
  }

  function currentDashboardUuid() {
    if (typeof window.getConfirmedDashboardToken === "function") {
      const confirmed = String(window.getConfirmedDashboardToken() || "").trim();
      if (confirmed) return confirmed;
    }
    return "";
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

  function navigateLocalHash(hash) {
    if (window.location.pathname !== appPath()) {
      const token = currentProfileToken();
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
      case "dashboard":
        if (window.location.pathname === appPath()) {
          if (window.location.hash) history.pushState(null, "", window.location.pathname + window.location.search);
          window.scrollTo({ top: 0, behavior: "smooth" });
          updateActiveState();
          closeNavigation();
        } else {
          const profileToken = currentProfileToken();
          const dashboardUuid = currentDashboardUuid();
          const token = profileToken || dashboardUuid;
          window.location.assign(appPath() + (token ? `?token=${encodeURIComponent(token)}` : ""));
        }
        break;
      case "tipps": navigateProfileRoute("tipps"); break;
      case "freigeschaltet": navigateDashboardRoute("freigeschaltet"); break;
      case "kaufen": navigateProfileRoute("kaufen"); break;
      case "wechselboerse": navigateDashboardRoute("wechselboerse"); break;
      case "wallet": navigateDashboardRoute("wallet", "id"); break;
      case "netzwerk": navigateLocalHash("netzwerk"); break;
      case "premium": navigateLocalHash("premium"); break;
      case "support": navigateDashboardRoute("support"); break;
      default: break;
    }
  }

  function activeId() {
    const hash = String(window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (hash === "netzwerk") return "netzwerk";
    if (hash === "premium") return "premium";
    if (["wallet", "tipps", "kaufen", "freigeschaltet"].includes(hash)) return hash;

    const path = window.location.pathname;
    const base = basePath();
    const relative = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\/+/, "");
    const first = relative.split("/").filter(Boolean)[0] || "dashboard";
    if (items.some(item => item.id === first)) return first;
    return "dashboard";
  }

  function updateActiveState() {
    const active = activeId();
    document.querySelectorAll(".bi-nav-link").forEach(link => {
      const selected = link.dataset.biNavRoute === active;
      link.classList.toggle("bi-nav-link-active", selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function openNavigation() {
    if (!sidebar || !overlay || !toggle) return;
    sidebar.classList.add("bi-nav-sidebar-open");
    overlay.classList.add("bi-nav-overlay-open");
    overlay.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("bi-nav-lock-scroll");
    if (floatingBack) floatingBack.classList.add("bi-nav-obscured-by-drawer");
    window.setTimeout(() => closeButton?.focus(), 0);
  }

  function closeNavigation() {
    if (!sidebar || !overlay || !toggle) return;
    sidebar.classList.remove("bi-nav-sidebar-open");
    overlay.classList.remove("bi-nav-overlay-open");
    overlay.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("bi-nav-lock-scroll");
    if (floatingBack) floatingBack.classList.remove("bi-nav-obscured-by-drawer");
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
    logo.src = new URL("logo_betisight.club.png", window.location.href).toString();
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

    items.forEach(item => {
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
      list.appendChild(link);
    });

    const footer = document.createElement("div");
    footer.className = "bi-nav-footer";
    footer.textContent = "BetInsight App · Navigation Prototype";

    sidebar.append(brand, list, footer);
    document.body.append(overlay, sidebar, toggle);

    const page = document.querySelector("main");
    if (page) page.classList.add("bi-nav-content-offset", "bi-nav-mobile-safe");

    floatingBack = document.querySelector(".floating-back-button");
    if (floatingBack) floatingBack.classList.add("bi-nav-floating-adjust");

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
    });
    window.addEventListener("hashchange", updateActiveState);
    window.addEventListener("popstate", updateActiveState);

    updateActiveState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildNavigation, { once: true });
  else buildNavigation();
})();
