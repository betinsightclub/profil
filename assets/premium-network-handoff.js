/* BetInsight Premium Network handoff · 2026-08-30 v2
   Transfers the confirmed dashboard UUID from app.betinsight.club to
   betinsight.network without placing the UUID in the browser address bar.

   Transport:
   - a trusted betinsight.network window is opened from the user's click
   - the UUID is sent only with window.postMessage to the fixed target origin
   - /handoff/ stores it in same-origin sessionStorage and opens /premium/
   - no automatic bounce back is used, so a failed handoff cannot create a loop
*/
(() => {
  "use strict";

  const HANDOFF_URL = "https://betinsight.network/handoff/?v=2";
  const HANDOFF_ORIGIN = "https://betinsight.network";
  const ACCOUNT_GATEWAY = "/konto/?next=premium-provisionen";
  const MESSAGE_TYPE = "BI_NETWORK_HANDOFF_V2";
  const ACK_TYPE = "BI_NETWORK_HANDOFF_ACK_V2";
  let activeTransfer = null;

  function dashboardUuid() {
    try {
      const session = window.BetInsightSession;
      const value = String(session?.getDashboardUuid?.() || localStorage.getItem("betinsight_dashboard_token") || "").trim();
      if (session?.isUuid?.(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return value;
    } catch (e) {}
    return "";
  }

  function stopTransfer() {
    if (!activeTransfer) return;
    if (activeTransfer.timer) window.clearInterval(activeTransfer.timer);
    if (activeTransfer.timeout) window.clearTimeout(activeTransfer.timeout);
    if (activeTransfer.onMessage) window.removeEventListener("message", activeTransfer.onMessage);
    activeTransfer = null;
  }

  function startHandoff(existingWindow = null) {
    const token = dashboardUuid();
    if (!token) {
      if (existingWindow && !existingWindow.closed) existingWindow.close();
      window.location.assign(ACCOUNT_GATEWAY);
      return false;
    }

    let target = existingWindow;
    if (!target || target.closed) {
      target = window.open(HANDOFF_URL, "betinsightPremiumNetwork");
      if (!target) return false;
    } else {
      try { target.location.replace(HANDOFF_URL); }
      catch (e) { try { target.location.href = HANDOFF_URL; } catch (_) {} }
    }

    stopTransfer();

    const payload = Object.freeze({type: MESSAGE_TYPE, token});
    const send = () => {
      if (!target || target.closed) {
        stopTransfer();
        return;
      }
      try { target.postMessage(payload, HANDOFF_ORIGIN); } catch (e) {}
    };

    const onMessage = event => {
      if (event.origin !== HANDOFF_ORIGIN || event.source !== target) return;
      if (event.data?.type !== ACK_TYPE) return;
      stopTransfer();
    };

    window.addEventListener("message", onMessage);
    const timer = window.setInterval(send, 250);
    const timeout = window.setTimeout(stopTransfer, 10000);
    activeTransfer = {target, timer, timeout, onMessage};
    send();
    return true;
  }

  document.addEventListener("click", event => {
    const element = event.target instanceof Element
      ? event.target.closest('[data-bi-nav-route="premium-provisionen"]')
      : null;
    if (!element) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const opened = startHandoff();
    if (!opened) window.location.assign(ACCOUNT_GATEWAY);
  }, true);

  window.BetInsightPremiumNetworkHandoff = Object.freeze({ start: startHandoff });
})();
