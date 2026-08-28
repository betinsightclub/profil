/* BetInsight App Navigation Loader · 2026-08-28-04
   Lädt die unveränderte Navigation, das kompaktere Dashboard-Layout, die READONLY-Kontobewegungsanzeige und den Tipp-Ablaufwächter. */
(() => {
  "use strict";
  const current = document.currentScript?.src || new URL("assets/app-navigation.js", window.location.href).href;
  const base = new URL("./", current);

  const expiryGuard = document.createElement("script");
  expiryGuard.src = new URL("tip-expiry-guard.js", base).href;
  expiryGuard.async = false;
  document.head.appendChild(expiryGuard);

  const core = document.createElement("script");
  core.src = new URL("app-navigation-core.js", base).href;
  core.async = false;
  core.onload = () => {
    const layout = document.createElement("script");
    layout.src = new URL("dashboard-layout.js", base).href;
    layout.async = false;
    layout.onload = () => {
      const history = document.createElement("script");
      history.src = new URL("account-history.js", base).href;
      history.async = false;
      document.head.appendChild(history);
    };
    document.head.appendChild(layout);
  };
  document.head.appendChild(core);
})();
