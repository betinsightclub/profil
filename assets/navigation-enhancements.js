/* BetInsight Navigation Enhancements v1.2 · 2026-09-09
   UI-only layer: keeps all existing routes/business logic intact.
   Adds: Academy/Ressourcen accordion, language/settings section, theme switcher
   and the presentation-only member translation completion layer.
*/
(() => {
  "use strict";

  const SCRIPT_URL = document.currentScript?.src || "";
  const ASSET_BASE = SCRIPT_URL ? new URL("./", SCRIPT_URL) : new URL("/assets/", location.origin);
  const APP_ROOT = new URL("../", ASSET_BASE);

  const text = (de, en) => {
    try { return window.BetInsightI18n?.getLanguage?.() === "en" ? en : de; }
    catch (e) { return de; }
  };

  function ensureCompletionScope() {
    const parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (parts[0] === "profil") parts.shift();
    const first = String(parts[0] || "").toLowerCase();
    let scope = "";
    if (first === "free-units") scope = "fan-challenge";
    else if (first === "premium-upgrade") scope = "premium-upgrade";
    if (!scope || document.querySelector('meta[name="bi-i18n-scope"]')) return;
    const meta = document.createElement("meta");
    meta.name = "bi-i18n-scope";
    meta.content = scope;
    document.head.appendChild(meta);
  }

  function loadCompletion() {
    ensureCompletionScope();
    if (window.BetInsightMemberCompletion) return;
    const src = new URL("i18n/member-completion.js?v=20260909-1", ASSET_BASE).toString();
    const existing = [...document.scripts].find(script => script.src === src || script.dataset.biMemberCompletion === "1");
    if (existing) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.biMemberCompletion = "1";
    script.addEventListener("error", () => console.warn("BetInsight translation completion layer could not be loaded."), {once:true});
    document.head.appendChild(script);
  }

  function navigateLocal(segment) {
    try {
      if (window.BetInsightSession?.navigateLocal) {
        window.BetInsightSession.navigateLocal(segment);
        return;
      }
    } catch (e) {}
    const clean = String(segment || "").replace(/^\/+|\/+$/g, "");
    location.assign(new URL(clean ? `${clean}/` : "", APP_ROOT).toString());
  }

  function closeMobileNav() {
    const sidebar = document.getElementById("bi-nav-sidebar");
    if (!sidebar) return;
    if (matchMedia("(max-width:1179px)").matches) {
      sidebar.classList.remove("bi-nav-sidebar-open");
      document.querySelector(".bi-nav-overlay")?.classList.remove("bi-nav-overlay-open");
      document.documentElement.classList.remove("bi-nav-lock-scroll");
      const toggle = document.querySelector(".bi-nav-mobile-toggle");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.classList.remove("bi-nav-mobile-toggle-hidden");
    }
  }

  function makeSubLink(id, label, segment) {
    const link = document.createElement("a");
    link.className = "bi-nav-sub-link";
    link.href = "#";
    link.dataset.biEnhancementRoute = id;
    link.innerHTML = `<span class="bi-nav-sub-dot" aria-hidden="true">•</span><span class="bi-nav-label">${label}</span>`;
    link.addEventListener("click", event => {
      event.preventDefault();
      closeMobileNav();
      navigateLocal(segment);
    });
    return link;
  }

  function enhanceResources(sidebar) {
    if (sidebar.querySelector('[data-bi-nav-group="resources-group"]')) return;
    const original = sidebar.querySelector('[data-bi-nav-route="ressourcen"]');
    if (!original) return;

    const group = document.createElement("div");
    group.className = "bi-nav-group bi-nav-resources-group";
    group.dataset.biNavGroup = "resources-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bi-nav-group-button";
    button.setAttribute("aria-expanded", "false");
    const icon = original.querySelector(".bi-nav-icon")?.cloneNode(true) || document.createElement("span");
    if (!icon.classList.contains("bi-nav-icon")) icon.className = "bi-nav-icon";
    button.appendChild(icon);
    const label = document.createElement("span");
    label.className = "bi-nav-label";
    label.textContent = text("Academy & Ressourcen", "Academy & Resources");
    const chevron = document.createElement("span");
    chevron.className = "bi-nav-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    button.append(label, chevron);

    const submenu = document.createElement("div");
    submenu.className = "bi-nav-submenu";
    const inner = document.createElement("div");
    inner.className = "bi-nav-submenu-inner";
    inner.append(
      makeSubLink("academy", text("BetInsight Academy", "BetInsight Academy"), "academy"),
      makeSubLink("werbematerial", text("Werbematerial & Downloads", "Marketing Material & Downloads"), "werbematerial")
    );
    submenu.appendChild(inner);

    button.addEventListener("click", () => {
      const open = !group.classList.contains("bi-nav-group-open");
      if (open && matchMedia("(max-width:1179px)").matches) {
        sidebar.querySelectorAll(".bi-nav-group-open").forEach(other => {
          if (other !== group) {
            other.classList.remove("bi-nav-group-open");
            other.querySelector(".bi-nav-group-button")?.setAttribute("aria-expanded", "false");
          }
        });
      }
      group.classList.toggle("bi-nav-group-open", open);
      button.setAttribute("aria-expanded", String(open));
    });

    group.append(button, submenu);
    original.replaceWith(group);

    const path = location.pathname.replace(/\/+$/, "");
    if (/\/(academy|werbematerial)$/.test(path)) {
      group.classList.add("bi-nav-group-open", "bi-nav-group-current");
      button.setAttribute("aria-expanded", "true");
      const active = path.endsWith("/academy") ? "academy" : "werbematerial";
      group.querySelector(`[data-bi-enhancement-route="${active}"]`)?.classList.add("bi-nav-sub-link-active");
    }
  }

  function enhanceSettings(sidebar) {
    const footer = sidebar.querySelector(".bi-nav-footer");
    if (!footer) return;

    const language = sidebar.querySelector(".bi-language-switcher");
    if (language) {
      if (!language.dataset.biSettingsEnhanced) {
        language.dataset.biSettingsEnhanced = "1";
        const title = document.createElement("div");
        title.className = "bi-nav-settings-title bi-nav-language-title";
        title.innerHTML = `<span aria-hidden="true">🌍</span><span>${text("Sprache / Land", "Language / Country")}</span>`;
        language.prepend(title);
        language.classList.add("bi-language-settings-block");
      }
      if (language.parentElement !== footer) footer.prepend(language);
      language.classList.remove("bi-language-switcher-under-logo");
    }

    if (window.BetInsightTheme && !footer.querySelector(".bi-theme-switcher")) {
      const theme = window.BetInsightTheme.createSwitcher();
      const logout = [...footer.children].find(el => el.matches?.("button.bi-nav-settings-link"));
      if (logout) footer.insertBefore(theme, logout);
      else footer.appendChild(theme);
    }
  }

  function apply() {
    const sidebar = document.getElementById("bi-nav-sidebar");
    if (!sidebar) return false;
    enhanceResources(sidebar);
    enhanceSettings(sidebar);
    return true;
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  });

  function start() {
    loadCompletion();
    apply();
    observer.observe(document.documentElement, {childList:true, subtree:true});
    window.addEventListener("bi:languagechange", () => setTimeout(apply, 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();

  window.BetInsightNavigationEnhancements = Object.freeze({apply});
})();