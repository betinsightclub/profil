/* BetInsight Premium Network handoff · 2026-08-30
   Purpose: transfer the already-confirmed dashboard UUID from app.betinsight.club
   to betinsight.network without ever placing it in the browser address bar.

   Transport:
   - fixed trusted destination only
   - token is placed temporarily in window.name
   - /handoff/ on betinsight.network reads and clears window.name immediately
   - premium page then uses its existing same-origin sessionStorage session
*/
(() => {
  "use strict";

  const HANDOFF_URL = "https://betinsight.network/handoff/";
  const ACCOUNT_GATEWAY = "/konto/?next=premium-provisionen";
  const PREFIX = "BI_NETWORK_HANDOFF_V1:";

  function dashboardUuid() {
    try {
      const session = window.BetInsightSession;
      const value = String(session?.getDashboardUuid?.() || "").trim();
      if (session?.isUuid?.(value)) return value;
    } catch (e) {}
    return "";
  }

  function startHandoff() {
    const token = dashboardUuid();
    if (!token) {
      window.location.assign(ACCOUNT_GATEWAY);
      return;
    }

    try {
      window.name = PREFIX + token;
    } catch (e) {
      window.location.assign(ACCOUNT_GATEWAY);
      return;
    }
    window.location.assign(HANDOFF_URL);
  }

  document.addEventListener("click", event => {
    const element = event.target instanceof Element
      ? event.target.closest('[data-bi-nav-route="premium-provisionen"]')
      : null;
    if (!element) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    startHandoff();
  }, true);

  window.BetInsightPremiumNetworkHandoff = Object.freeze({ start: startHandoff });
})();
