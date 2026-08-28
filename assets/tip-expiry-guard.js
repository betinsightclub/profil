/* BetInsight Tip Expiry Guard · 2026-08-28
   - runs only on /tipps/
   - uses the public tip feed's boolean `expired` flag; exact kickoff time stays hidden
   - prevents expired unlock attempts before they reach the paid unlock flow
   - rechecks immediately before every unlock click
   - existing server-side unlock guard remains the final authority
*/
(() => {
  "use strict";

  if (!/\/tipps\/?(?:index\.html)?$/i.test(location.pathname)) return;

  const TIPS_FEED = "https://hook.eu1.make.com/36gm8kvlfcb7jwae8ypxe8oripquonq5";
  const EXPIRED_TEXT = "⏱️ Tipp abgelaufen";
  const EXPIRED_NOTE = "Freischaltung ab Anpfiff nicht mehr möglich. Es werden keine Units abgezogen.";
  let feedPromise = null;

  const asExpired = value => value === true || String(value).toLowerCase() === "true" || Number(value) === 1;

  async function getFeed(force = false) {
    if (!feedPromise || force) {
      feedPromise = fetch(TIPS_FEED + "?expirycheck=" + Date.now(), {cache:"no-store"})
        .then(response => response.ok ? response.json() : Promise.reject(new Error("Tips feed unavailable")))
        .then(rows => Array.isArray(rows) ? rows : [])
        .catch(error => { console.warn("BetInsight expiry feed check failed", error); return []; });
    }
    return feedPromise;
  }

  function markExpired(card, button) {
    if (!card || !button) return;
    button.disabled = true;
    button.textContent = EXPIRED_TEXT;
    button.dataset.expiryState = "expired";
    button.style.background = "linear-gradient(90deg,#536976,#3b4b55)";
    button.style.boxShadow = "none";
    const note = card.querySelector(".small-note");
    if (note) note.textContent = EXPIRED_NOTE;
    const result = card.querySelector(".unlock-result");
    if (result && !result.textContent.trim()) {
      result.innerHTML = '<div class="unlock-message info">' + EXPIRED_NOTE + '</div>';
    }
  }

  function installCardGuard() {
    const originalCreate = window.createOpenTipCard;
    if (typeof originalCreate !== "function" || originalCreate.__biExpiryWrapped) return false;

    function wrappedCreate(tip) {
      const card = originalCreate(tip);
      const button = card?.querySelector?.(".unlock-button");
      if (button) {
        button.dataset.expiryState = asExpired(tip?.expired) ? "expired" : "active";
        if (asExpired(tip?.expired)) markExpired(card, button);
      }
      return card;
    }
    wrappedCreate.__biExpiryWrapped = true;
    window.createOpenTipCard = wrappedCreate;
    return true;
  }

  function installUnlockGuard() {
    const originalUnlock = window.freischalten;
    if (typeof originalUnlock !== "function" || originalUnlock.__biExpiryWrapped) return false;

    async function wrappedUnlock(tippId, card, button) {
      if (button?.dataset?.expiryState === "expired") {
        markExpired(card, button);
        return;
      }

      // Always refresh directly before the paid unlock request. This closes the case
      // where the page was opened before kickoff and the user clicks only after kickoff.
      const rows = await getFeed(true);
      const tip = rows.find(row => String(row?.tipp_id || "") === String(tippId || ""));
      if (tip && asExpired(tip.expired)) {
        markExpired(card, button);
        return;
      }

      if (button) button.dataset.expiryState = "active";
      return originalUnlock(tippId, card, button);
    }
    wrappedUnlock.__biExpiryWrapped = true;
    window.freischalten = wrappedUnlock;
    return true;
  }

  function install() {
    const createInstalled = installCardGuard();
    installUnlockGuard();

    // If the first async render won the race before this deferred helper loaded,
    // rerender once so already expired cards are visibly disabled too.
    if (createInstalled && document.querySelector(".tip-card") && typeof window.loadPage === "function") {
      window.setTimeout(() => window.loadPage(), 0);
    }
  }

  install();
})();
