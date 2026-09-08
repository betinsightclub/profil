/* BetInsight Theme Manager v1.0 · 2026-09-08
   Adds user-selectable color schemes without touching business logic.
   Themes: BetInsight Blue (default), BetInsight Green, Light, System.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "betinsight_theme";
  const THEMES = ["blue", "green", "light", "system"];

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (THEMES.includes(saved)) return saved;
    } catch (e) {}
    return "blue";
  }

  function resolvedTheme(theme) {
    if (theme !== "system") return theme;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "blue";
  }

  function applyTheme(theme, persist = true) {
    const safe = THEMES.includes(theme) ? theme : "blue";
    const resolved = resolvedTheme(safe);
    document.documentElement.dataset.biTheme = resolved;
    document.documentElement.dataset.biThemeChoice = safe;
    document.documentElement.style.colorScheme = resolved === "light" ? "light" : "dark";
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, safe); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("betinsight:themechange", {detail:{choice:safe, resolved}}));
    return {choice:safe, resolved};
  }

  function currentTheme() {
    return document.documentElement.dataset.biThemeChoice || preferredTheme();
  }

  function createSwitcher() {
    const wrap = document.createElement("div");
    wrap.className = "bi-theme-switcher";
    wrap.innerHTML = `
      <button type="button" class="bi-theme-toggle" aria-expanded="false">
        <span class="bi-theme-toggle-icon" aria-hidden="true">🎨</span>
        <span class="bi-theme-toggle-label">Darstellung</span>
        <span class="bi-theme-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="bi-theme-options" hidden>
        <button type="button" data-theme="blue"><span class="bi-theme-dot bi-theme-dot-blue"></span><span>BetInsight Blue</span></button>
        <button type="button" data-theme="green"><span class="bi-theme-dot bi-theme-dot-green"></span><span>BetInsight Green</span></button>
        <button type="button" data-theme="light"><span class="bi-theme-dot bi-theme-dot-light"></span><span>Light</span></button>
        <button type="button" data-theme="system"><span class="bi-theme-dot bi-theme-dot-system"></span><span>System</span></button>
      </div>`;

    const toggle = wrap.querySelector(".bi-theme-toggle");
    const options = wrap.querySelector(".bi-theme-options");

    function sync() {
      const active = currentTheme();
      wrap.querySelectorAll("[data-theme]").forEach(btn => btn.classList.toggle("active", btn.dataset.theme === active));
    }

    toggle.addEventListener("click", () => {
      const open = options.hidden;
      options.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      wrap.classList.toggle("open", open);
    });

    wrap.querySelectorAll("[data-theme]").forEach(btn => btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
      sync();
      options.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      wrap.classList.remove("open");
    }));

    sync();
    return wrap;
  }

  const choice = preferredTheme();
  applyTheme(choice, false);

  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => { if (currentTheme() === "system") applyTheme("system", false); };
    if (mq.addEventListener) mq.addEventListener("change", listener);
    else if (mq.addListener) mq.addListener(listener);
  }

  window.BetInsightTheme = {applyTheme, currentTheme, createSwitcher, themes:[...THEMES]};
})();
