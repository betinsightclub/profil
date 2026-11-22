(function () {
  "use strict";
  const KEY = "betinsight_admin_session_v1";
  let session;
  try { session = JSON.parse(sessionStorage.getItem(KEY) || "null"); }
  catch (_) { session = null; }
  if (!session || String(session.adminId || "") !== "ADM-003") return;

  const TARGET_PATTERN = /(?:preis[\\w-]*units?|units?[\\w-]*preis|price[\\w-]*units?|units?[\\w-]*price|freischalt[\\w-]*preis|unlock[\\w-]*units?)/i;
  const NOTICE_ID = "biFrankFixedUnitNotice";
  const SELECTOR = "input,select";
  let queued = false;
  let applying = false;

  function controls() {
    const result = new Set();
    document.querySelectorAll(SELECTOR).forEach(el => {
      if (TARGET_PATTERN.test(String(el.id || "")) ||
          TARGET_PATTERN.test(String(el.name || ""))) result.add(el);
    });
    document.querySelectorAll("label").forEach(label => {
      const text = String(label.textContent || "").toLowerCase();
      if (!(/preis/.test(text) && /unit/.test(text)) &&
          !(/freischaltpreis/.test(text))) return;
      const byFor = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      const within = label.querySelector(SELECTOR);
      const nearby = label.parentElement && label.parentElement.querySelector(SELECTOR);
      [byFor, within, nearby].forEach(el => {
        if (el && el.matches && el.matches(SELECTOR)) result.add(el);
      });
    });
    return Array.from(result);
  }
  function enforceOne(el) {
    if (!el || !el.isConnected) return;
    if (el.tagName === "SELECT") {
      const valid = el.options.length === 1 &&
        String(el.options[0].value) === "1";
      if (!valid) {
        el.replaceChildren(new Option("1 Unit", "1"));
      }
      if (String(el.value) !== "1") el.value = "1";
      el.setAttribute("aria-label", "Freischaltpreis: fest 1 Unit");
    } else if (el.tagName === "INPUT") {
      if (String(el.value) !== "1") el.value = "1";
      if (el.min !== "1") el.min = "1";
      if (el.max !== "1") el.max = "1";
      if (el.step !== "1") el.step = "1";
      if (!el.readOnly) el.readOnly = true;
      el.setAttribute("aria-label", "Freischaltpreis: fest 1 Unit");
    }
    el.dataset.biFrankOneUnit = "1";
  }
  function ensureNotice(el) {
    if (document.getElementById(NOTICE_ID)) return;
    const tag = document.createElement("div");
    tag.id = NOTICE_ID;
    tag.textContent = "Wiedereinstiegsregel für Frank: Jeder neue Tipp kostet fest 1 Unit.";
    tag.style.cssText = "margin:7px 0 11px;padding:9px 12px;border-radius:9px;border:1px solid rgba(73,208,160,.4);background:rgba(22,146,107,.13);color:#d4fbe8;font:600 13px/1.4 Arial,sans-serif";
    el.insertAdjacentElement("afterend", tag);
  }
  function apply() {
    if (applying) return;
    applying = true;
    try {
      const targets = controls();
      targets.forEach(enforceOne);
      if (targets.length) ensureNotice(targets[0]);
    } finally { applying = false; }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  // Keep the price fixed even if the form re-renders or a script changes the value.
  document.addEventListener("focusin", e => {
    if (e.target && e.target.matches && e.target.matches(SELECTOR)) apply();
  }, true);
  document.addEventListener("input", e => {
    if (e.target && e.target.matches && e.target.matches(SELECTOR)) apply();
  }, true);
  document.addEventListener("change", e => {
    if (e.target && e.target.matches && e.target.matches(SELECTOR)) apply();
  }, true);
  document.addEventListener("submit", () => apply(), true);
  document.addEventListener("click", e => {
    if (e.target && e.target.closest && e.target.closest("button")) apply();
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, {once:true});
  else apply();
  new MutationObserver(schedule).observe(document.documentElement, {childList:true,subtree:true});
})();
