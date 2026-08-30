/* BetInsight Premium Network handoff · 2026-08-30 v3
   Secure cross-domain handoff without exposing the dashboard UUID in any browser URL.

   Flow:
   1. app.betinsight.club already holds the confirmed dashboard UUID locally.
   2. A cryptographically random, short-lived handoff code is created.
   3. Make validates the UUID server-side and stores code -> UUID for 3 minutes.
   4. Only the opaque handoff code is sent to betinsight.network.
   5. betinsight.network redeems the code once and creates its own session.
*/
(() => {
  "use strict";

  const ISSUE_URL = "https://hook.eu1.make.com/l12lvfgly1e4b9p1op3oohfbncnfwkqh";
  const HANDOFF_URL = "https://betinsight.network/handoff/";
  const ACCOUNT_GATEWAY = "/konto/?next=premium-provisionen";

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
  }

  function dashboardUuid() {
    try {
      const session = window.BetInsightSession;
      const value = String(session?.getDashboardUuid?.() || localStorage.getItem("betinsight_dashboard_token") || "").trim();
      if (session?.isUuid?.(value) || isUuid(value)) return value;
    } catch (e) {}
    return "";
  }

  function randomCode() {
    try {
      if (crypto?.randomUUID) return crypto.randomUUID();
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      return "";
    }
  }

  function closeTarget(target) {
    try { if (target && !target.closed) target.close(); } catch (e) {}
  }

  function showWaiting(target) {
    try {
      target.document.title = "BetInsight – Premium & Network";
      target.document.body.style.margin = "0";
      target.document.body.innerHTML = '<div style="font-family:Arial,sans-serif;background:#03131d;color:#dff6ff;min-height:100vh;display:grid;place-items:center"><div style="padding:24px;border:1px solid rgba(104,203,235,.2);border-radius:18px;background:#062433;text-align:center">Premium &amp; Network wird sicher geöffnet …</div></div>';
    } catch (e) {}
  }

  async function startHandoff(existingWindow = null) {
    const token = dashboardUuid();
    if (!token) {
      closeTarget(existingWindow);
      if (!window.location.pathname.startsWith("/konto")) window.location.assign(ACCOUNT_GATEWAY);
      return false;
    }

    let target = existingWindow;
    if (!target || target.closed) {
      target = window.open("about:blank", "betinsightPremiumNetwork");
      if (!target) return false;
    }
    showWaiting(target);

    const code = randomCode();
    if (!code) {
      closeTarget(target);
      return false;
    }

    try {
      const issue = new URL(ISSUE_URL);
      issue.searchParams.set("dashboard_token", token);
      issue.searchParams.set("code", code);

      const response = await fetch(issue.toString(), {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
      let data = null;
      try { data = await response.json(); } catch (e) {}
      if (!response.ok || data?.success !== true || String(data?.code || "") !== code) {
        throw new Error("handoff_issue_failed");
      }

      const destination = new URL(HANDOFF_URL);
      destination.searchParams.set("code", code);
      try { target.location.replace(destination.toString()); }
      catch (e) { target.location.href = destination.toString(); }
      return true;
    } catch (e) {
      try {
        if (target && !target.closed) {
          target.document.body.innerHTML = '<div style="font-family:Arial,sans-serif;background:#03131d;color:#dff6ff;min-height:100vh;display:grid;place-items:center;margin:0"><div style="max-width:520px;padding:24px;border:1px solid rgba(255,112,121,.25);border-radius:18px;background:#062433;text-align:center"><strong style="display:block;margin-bottom:8px">Premium &amp; Network konnte nicht geöffnet werden.</strong><span style="color:#9bb8c4">Bitte dieses Fenster schließen und im BetInsight-Menü erneut auf Premium-Provisionen klicken.</span></div></div>';
        }
      } catch (_) {}
      return false;
    }
  }

  window.BetInsightPremiumNetworkHandoff = Object.freeze({ start: startHandoff });
})();
