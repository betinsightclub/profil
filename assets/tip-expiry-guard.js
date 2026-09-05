/* BetInsight Tip Expiry Guard · 2026-09-05 v2
   - runs only on /tipps/
   - exact kickoff stays hidden in the customer UI
   - uses static tip-status.json for zero-credit kickoff timers
   - removes a tip card automatically at kickoff while the page stays open
   - blocks a last-second unlock locally when kickoff has just been reached
   - existing server-side FIFO unlock guard remains the final authority
*/
(() => {
  "use strict";

  if (!/\/tipps\/?(?:index\.html)?$/i.test(location.pathname)) return;

  const currentScriptUrl = document.currentScript?.src || new URL("assets/tip-expiry-guard.js", location.href).toString();
  const STATUS_URL = new URL("../tip-status.json", currentScriptUrl).toString();
  const EXPIRED_TEXT = "⏱️ Tipp abgelaufen";
  const EXPIRED_NOTE = "Freischaltung ab Anpfiff nicht mehr möglich. Es werden keine Units abgezogen.";
  const MAX_TIMER = 2147483000;
  let statusPromise = null;

  const clean = value => String(value ?? "").trim();
  const asExpired = value => value === true || String(value).toLowerCase() === "true" || Number(value) === 1;

  async function loadStatus(force = false) {
    if (!statusPromise || force) {
      statusPromise = fetch(STATUS_URL + "?_=" + Date.now(), { cache: "no-store", credentials: "omit" })
        .then(response => response.ok ? response.json() : Promise.reject(new Error("Tip status unavailable")))
        .then(data => {
          const map = new Map();
          const rows = Array.isArray(data?.tips) ? data.tips : [];
          for (const row of rows) {
            const id = clean(row?.tipp_id ?? row?.tip_id);
            const stamp = Date.parse(clean(row?.kickoff_at ?? row?.expires_at));
            if (id && Number.isFinite(stamp)) map.set(id, stamp);
          }
          return map;
        })
        .catch(error => {
          console.warn("BetInsight static expiry status could not be loaded", error);
          return new Map();
        });
    }
    return statusPromise;
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

  function removeExpiredCard(card) {
    if (!card?.isConnected) return;
    const button = card.querySelector?.(".unlock-button");
    if (button) markExpired(card, button);
    card.hidden = true;
    window.setTimeout(() => {
      try { card.remove(); } catch (_) {}
    }, 0);
  }

  function scheduleRemoval(card, tipId, kickoff) {
    if (!card || !tipId || !Number.isFinite(kickoff)) return;
    card.dataset.tipId = tipId;
    const run = () => {
      const remaining = kickoff - Date.now();
      if (remaining <= 0) {
        removeExpiredCard(card);
        return;
      }
      window.setTimeout(run, Math.min(MAX_TIMER, remaining + 120));
    };
    run();
  }

  async function attachStaticExpiry(card, tip) {
    const tipId = clean(tip?.tipp_id);
    if (!card || !tipId) return;
    card.dataset.tipId = tipId;

    if (asExpired(tip?.expired)) {
      removeExpiredCard(card);
      return;
    }

    const status = await loadStatus(false);
    const kickoff = status.get(tipId);
    if (!Number.isFinite(kickoff)) return;
    scheduleRemoval(card, tipId, kickoff);
  }

  function installCardGuard() {
    const originalCreate = window.createOpenTipCard;
    if (typeof originalCreate !== "function" || originalCreate.__biExpiryWrapped) return false;

    function wrappedCreate(tip) {
      const card = originalCreate(tip);
      const button = card?.querySelector?.(".unlock-button");
      if (button) button.dataset.expiryState = asExpired(tip?.expired) ? "expired" : "active";
      attachStaticExpiry(card, tip);
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

      const status = await loadStatus(true);
      const kickoff = status.get(clean(tippId));
      if (Number.isFinite(kickoff) && Date.now() >= kickoff) {
        markExpired(card, button);
        window.setTimeout(() => removeExpiredCard(card), 850);
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
    // rerender once so every existing card receives its static kickoff timer.
    if (createInstalled && document.querySelector(".tip-card") && typeof window.loadPage === "function") {
      window.setTimeout(() => window.loadPage(), 0);
    }
  }

  install();
})();
