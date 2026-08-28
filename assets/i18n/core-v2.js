/* BetInsight i18n core v2 · manifest-driven multilingual customer UI
   Supports shared locales plus lazy page-specific locale scopes. */
(() => {
  "use strict";

  const STORAGE_KEY = "betinsight_language";
  const FALLBACK = "de";
  const SCRIPT_URL = document.currentScript?.src || "";
  const dictionaries = new Map();
  const scopedDictionaries = new Map();
  const PAGE_SCOPES = Object.freeze({
    "verkaufen": "sell",
    "angebote": "offers",
    "marketing-center": "marketing-center",
    "support": "support"
  });
  let supported = ["de", "en"];
  let defaultLanguage = FALLBACK;
  let activeLanguage = FALLBACK;
  let activeDictionary = {};
  let manifestPromise;
  let initPromise;

  const clean = value => String(value || "").trim().toLowerCase();

  function assetUrl(relative) {
    if (SCRIPT_URL) return new URL(relative, SCRIPT_URL).toString();
    return `/assets/i18n/${String(relative || "").replace(/^\.\//, "")}`;
  }

  async function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (async () => {
      try {
        const response = await fetch(assetUrl("./locales/manifest.json"), { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) throw new Error("manifest");
        const data = await response.json();
        const languages = Array.isArray(data?.languages) ? [...new Set(data.languages.map(clean).filter(Boolean))] : [];
        if (languages.length) supported = languages;
        const requestedDefault = clean(data?.default);
        defaultLanguage = supported.includes(requestedDefault) ? requestedDefault : (supported.includes(FALLBACK) ? FALLBACK : supported[0]);
      } catch (e) {
        supported = ["de", "en"];
        defaultLanguage = FALLBACK;
      }
      return { default: defaultLanguage, languages: [...supported] };
    })();
    return manifestPromise;
  }

  function normalize(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (supported.includes(raw)) return raw;
    const short = raw.split("-")[0];
    return supported.includes(short) ? short : "";
  }

  function storedLanguage() {
    try { return normalize(localStorage.getItem(STORAGE_KEY)); } catch (e) { return ""; }
  }

  function preferredLanguage() {
    const saved = storedLanguage();
    if (saved) return saved;
    const html = normalize(document.documentElement.lang);
    if (html) return html;
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const candidate of candidates) {
      const normalized = normalize(candidate);
      if (normalized) return normalized;
    }
    return defaultLanguage;
  }

  async function loadDictionary(language) {
    const lang = normalize(language) || defaultLanguage;
    if (dictionaries.has(lang)) return dictionaries.get(lang);
    const response = await fetch(assetUrl(`./locales/${lang}.json`), { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`locale:${lang}`);
    const dictionary = await response.json();
    dictionaries.set(lang, dictionary || {});
    return dictionary || {};
  }

  function pageScope() {
    const metaScope = clean(document.querySelector('meta[name="bi-i18n-scope"]')?.content);
    if (metaScope) return metaScope;
    const parts = window.location.pathname.split("/").filter(Boolean).map(clean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (PAGE_SCOPES[parts[i]]) return PAGE_SCOPES[parts[i]];
    }
    return "";
  }

  async function loadScopedDictionary(scope, language) {
    const safeScope = clean(scope).replace(/[^a-z0-9_-]/g, "");
    const lang = normalize(language) || defaultLanguage;
    if (!safeScope) return {};
    const cacheKey = `${safeScope}:${lang}`;
    if (scopedDictionaries.has(cacheKey)) return scopedDictionaries.get(cacheKey);
    try {
      const response = await fetch(assetUrl(`./pages/${safeScope}/${lang}.json`), { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(`scope:${safeScope}:${lang}`);
      const data = await response.json();
      scopedDictionaries.set(cacheKey, data || {});
      return data || {};
    } catch (e) {
      scopedDictionaries.set(cacheKey, {});
      return {};
    }
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return target;
    Object.entries(source).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const base = target[key] && typeof target[key] === "object" && !Array.isArray(target[key]) ? target[key] : {};
        target[key] = deepMerge(base, value);
      } else target[key] = value;
    });
    return target;
  }

  function cloneDictionary(dictionary) {
    try { return JSON.parse(JSON.stringify(dictionary || {})); } catch (e) { return { ...(dictionary || {}) }; }
  }

  function lookup(dictionary, key) {
    return String(key || "").split(".").reduce((value, part) => {
      if (value && Object.prototype.hasOwnProperty.call(value, part)) return value[part];
      return undefined;
    }, dictionary);
  }

  function interpolate(value, variables = {}) {
    return String(value).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : "");
  }

  function t(key, variables = {}, fallback = "") {
    const value = lookup(activeDictionary, key);
    if (value !== undefined && value !== null && typeof value !== "object") return interpolate(value, variables);
    return interpolate(fallback || key, variables);
  }

  function apply(root = document) {
    root.querySelectorAll?.("[data-bi-i18n]").forEach(el => {
      const key = el.getAttribute("data-bi-i18n");
      const fallback = el.getAttribute("data-bi-i18n-fallback") || el.textContent || "";
      el.textContent = t(key, {}, fallback);
    });
    root.querySelectorAll?.("[data-bi-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-bi-i18n-placeholder");
      el.setAttribute("placeholder", t(key, {}, el.getAttribute("placeholder") || ""));
    });
    root.querySelectorAll?.("[data-bi-i18n-aria-label]").forEach(el => {
      const key = el.getAttribute("data-bi-i18n-aria-label");
      el.setAttribute("aria-label", t(key, {}, el.getAttribute("aria-label") || ""));
    });
    root.querySelectorAll?.("[data-bi-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-bi-i18n-title");
      el.setAttribute("title", t(key, {}, el.getAttribute("title") || ""));
    });
  }

  async function setLanguage(language, options = {}) {
    await loadManifest();
    let resolved = normalize(language) || defaultLanguage;
    let dictionary;
    try { dictionary = await loadDictionary(resolved); }
    catch (e) { resolved = defaultLanguage; dictionary = await loadDictionary(defaultLanguage); }
    activeLanguage = resolved;
    activeDictionary = cloneDictionary(dictionary);
    const scope = pageScope();
    if (scope) deepMerge(activeDictionary, await loadScopedDictionary(scope, activeLanguage));
    document.documentElement.lang = activeLanguage;
    if (options.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, activeLanguage); } catch (e) {}
    }
    if (options.apply !== false) apply(document);
    window.dispatchEvent(new CustomEvent("bi:languagechange", { detail: { language: activeLanguage, scope } }));
    return activeLanguage;
  }

  async function loadScope(scope, options = {}) {
    await init();
    const fragment = await loadScopedDictionary(scope, activeLanguage);
    deepMerge(activeDictionary, fragment);
    if (options.apply !== false) apply(document);
    return fragment;
  }

  function createSwitcher(options = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = options.className || "bi-language-switcher";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));
    supported.forEach(language => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bi-language-button";
      button.dataset.biLanguage = language;
      button.textContent = language.toUpperCase();
      const label = t(`language.${language}`, {}, language.toUpperCase());
      button.title = label;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", language === activeLanguage ? "true" : "false");
      button.classList.toggle("is-active", language === activeLanguage);
      button.addEventListener("click", async () => {
        await setLanguage(language);
        wrapper.querySelectorAll("[data-bi-language]").forEach(item => {
          const selected = item.dataset.biLanguage === activeLanguage;
          item.setAttribute("aria-pressed", selected ? "true" : "false");
          item.classList.toggle("is-active", selected);
        });
        wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));
      });
      wrapper.appendChild(button);
    });
    return wrapper;
  }

  function init() {
    if (!initPromise) {
      initPromise = (async () => { await loadManifest(); return setLanguage(preferredLanguage(), { persist: false }); })().catch(async () => {
        activeLanguage = defaultLanguage;
        activeDictionary = cloneDictionary(await loadDictionary(defaultLanguage));
        const scope = pageScope();
        if (scope) deepMerge(activeDictionary, await loadScopedDictionary(scope, defaultLanguage));
        document.documentElement.lang = defaultLanguage;
        apply(document);
        return defaultLanguage;
      });
    }
    return initPromise;
  }

  window.BetInsightI18n = Object.freeze({
    init, t, apply, setLanguage, loadScope, createSwitcher,
    getLanguage: () => activeLanguage,
    getSupportedLanguages: () => [...supported],
    storageKey: STORAGE_KEY,
    get defaultLanguage() { return defaultLanguage; }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { init(); }, { once: true });
  else init();
})();
