/*
 * BetInsight Tipp-Center: short-lived, tab-only view cache.
 * This is only for painting views while current Supabase reads run.
 * Never use cached values to authorize tip unlocks or debit Units.
 */
(function () {
  "use strict";
  if (window.BetInsightTipViewCache) return;

  const KEY = "bi-tip-view-cache-v1";
  const MAX_AGE_MS = 2 * 60 * 1000;
  let writeQueue = Promise.resolve();

  async function identity(token) {
    const bytes = new TextEncoder().encode(String(token));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
  }

  async function read(token) {
    if (!token || !globalThis.crypto?.subtle) return null;
    try {
      const stored = sessionStorage.getItem(KEY);
      if (!stored) return null;
      const item = JSON.parse(stored);
      if (!item || !item.data || Date.now() - Number(item.savedAt) > MAX_AGE_MS ||
          item.identity !== await identity(token)) {
        sessionStorage.removeItem(KEY);
        return null;
      }
      return item.data;
    } catch (_) {
      return null;
    }
  }

  function merge(token, fields) {
    if (!token || !fields || !globalThis.crypto?.subtle) return Promise.resolve();
    writeQueue = writeQueue.catch(() => {}).then(async function () {
      try {
        const existing = await read(token) || {};
        const data = Object.assign({}, existing, fields);
        sessionStorage.setItem(KEY, JSON.stringify({
          identity: await identity(token),
          savedAt: Date.now(),
          data
        }));
      } catch (_) {
        // Cache failures must never interrupt existing tip or wallet functionality.
      }
    });
    return writeQueue;
  }

  window.BetInsightTipViewCache = Object.freeze({ read, merge });
})();
