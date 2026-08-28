/* BetInsight App Navigation Loader · 2026-08-28-02
   Lädt die unveränderte Navigation sowie die neue READONLY-Kontobewegungsanzeige. */
(() => {
  "use strict";
  const current = document.currentScript?.src || new URL("assets/app-navigation.js", window.location.href).href;
  const base = new URL("./", current);
  const core = document.createElement("script");
  core.src = new URL("app-navigation-core.js", base).href;
  core.async = false;
  core.onload = () => {
    const history = document.createElement("script");
    history.src = new URL("account-history.js", base).href;
    history.async = false;
    document.head.appendChild(history);
  };
  document.head.appendChild(core);
})();
