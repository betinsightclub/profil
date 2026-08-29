/* BetInsight dashboard i18n completion layer · 2026-08-29
   Presentation only: translates legacy/dynamically inserted customer dashboard copy.
   It does not alter API calls, tokens, Units, webhooks, form values or business logic.
   Future languages only need a matching pages/dashboard-completion/<lang>.json file. */
(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src || new URL("assets/i18n/dashboard-completion.js", location.href).toString();
  const localeBase = new URL("./pages/dashboard-completion/", scriptUrl);
  const sourceText = new WeakMap();
  const renderedText = new WeakMap();
  const cache = new Map();
  let dictionary = {};
  let entries = [];
  let applying = false;
  let observer = null;

  function language() {
    const fromCore = String(window.BetInsightI18n?.getLanguage?.() || "").trim().toLowerCase();
    if (fromCore) return fromCore;
    try { return String(localStorage.getItem("betinsight_language") || "de").trim().toLowerCase() || "de"; }
    catch (_) { return "de"; }
  }

  async function loadDictionary(lang) {
    const clean = String(lang || "de").trim().toLowerCase();
    if (cache.has(clean)) return cache.get(clean);
    try {
      const response = await fetch(new URL(`${encodeURIComponent(clean)}.json`, localeBase), { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(`dashboard-completion:${clean}`);
      const data = await response.json();
      const safe = data && typeof data === "object" && !Array.isArray(data) ? data : {};
      cache.set(clean, safe);
      return safe;
    } catch (_) {
      if (clean !== "de") return loadDictionary("de");
      cache.set("de", {});
      return {};
    }
  }

  function translate(value) {
    let result = String(value ?? "");
    for (const [source, target] of entries) {
      if (result.includes(source)) result = result.split(source).join(String(target));
    }
    return result;
  }

  function ignored(node) {
    const parent = node?.parentElement;
    if (!parent) return true;
    return Boolean(parent.closest("script,style,noscript,code,pre,[data-bi-i18n-ignore]"));
  }

  function processText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || ignored(node)) return;
    const current = String(node.nodeValue ?? "");
    const last = renderedText.get(node);
    if (!sourceText.has(node) || current !== last) sourceText.set(node, current);
    const source = sourceText.get(node) ?? current;
    const next = translate(source);
    renderedText.set(node, next);
    if (current !== next) node.nodeValue = next;
  }

  function walk(root = document.body) {
    if (!root) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) processText(root);
      else {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) processText(walker.currentNode);
      }
    } finally {
      applying = false;
    }
  }

  function updateProtectedPseudoLabel() {
    const label = String(dictionary["Geschützt"] || "Geschützt").replace(/["\\]/g, "\\$&");
    document.documentElement.style.setProperty("--bi-history-protected-label", `"${label}"`);
  }

  function ensureStyle() {
    if (document.getElementById("bi-dashboard-completion-style")) return;
    const style = document.createElement("style");
    style.id = "bi-dashboard-completion-style";
    style.textContent = `.bi-account-history .private-value-hidden::after{content:var(--bi-history-protected-label,"Geschützt")!important}`;
    document.head.appendChild(style);
  }

  async function applyLanguage(lang = language()) {
    dictionary = await loadDictionary(lang);
    entries = Object.entries(dictionary)
      .filter(([source]) => source)
      .sort((a, b) => b[0].length - a[0].length);
    updateProtectedPseudoLabel();
    walk(document.body);
  }

  function startObserver() {
    if (observer || typeof MutationObserver !== "function") return;
    observer = new MutationObserver(records => {
      if (applying) return;
      for (const record of records) {
        if (record.type === "characterData") processText(record.target);
        else record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) processText(node);
          else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
        });
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  async function boot() {
    const root = location.pathname.replace(/\/+$/, "/");
    if (root !== "/" && root !== "/profil/") return;
    ensureStyle();
    await applyLanguage();
    startObserver();
    window.addEventListener("bi:languagechange", event => applyLanguage(event?.detail?.language || language()));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
