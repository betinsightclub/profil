/* BetInsight i18n core v2 · manifest-driven multilingual customer UI
   Supports shared locales plus lazy page-specific locale scopes.
   UI enhancement loader added 2026-09-08: theme + compact navigation only; business logic unchanged. */
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
  let uiEnhancementsPromise;

  const clean = value => String(value || "").trim().toLowerCase();

  function assetUrl(relative) {
    if (SCRIPT_URL) return new URL(relative, SCRIPT_URL).toString();
    return `/assets/i18n/${String(relative || "").replace(/^\.\//, "")}`;
  }

  function rootAssetUrl(relative) {
    if (SCRIPT_URL) return new URL(`../${String(relative || "").replace(/^\.\//, "")}`, SCRIPT_URL).toString();
    return `/assets/${String(relative || "").replace(/^\.\//, "")}`;
  }

  function loadUiScript(relative, globalName) {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    const src = rootAssetUrl(relative);
    const existing = [...document.scripts].find(script => script.src === src);
    if (existing) {
      return new Promise((resolve, reject) => {
        const done = () => !globalName || window[globalName] ? resolve(globalName ? window[globalName] : true) : reject(new Error(`${globalName} missing`));
        if (!globalName || window[globalName]) return done();
        existing.addEventListener("load", done, {once:true});
        existing.addEventListener("error", reject, {once:true});
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.biUiEnhancement = globalName || "1";
      script.addEventListener("load", () => {
        if (!globalName || window[globalName]) resolve(globalName ? window[globalName] : true);
        else reject(new Error(`${globalName} missing`));
      }, {once:true});
      script.addEventListener("error", reject, {once:true});
      document.head.appendChild(script);
    });
  }

  function loadUiEnhancements() {
    if (!uiEnhancementsPromise) {
      uiEnhancementsPromise = (async () => {
        await loadUiScript("theme-manager.js?v=20260908-3", "BetInsightTheme");
        await loadUiScript("navigation-enhancements.js?v=20260908-2", "BetInsightNavigationEnhancements");
        return true;
      })().catch(error => {
        console.error("BetInsight UI enhancements could not be loaded.", error);
        return false;
      });
    }
    return uiEnhancementsPromise;
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

  function placeSwitcherBelowMemberLogo(wrapper) {
    const move = () => {
      const sidebar = document.getElementById("bi-nav-sidebar");
      const brand = sidebar?.querySelector(".bi-nav-brand");
      if (!sidebar || !brand || !wrapper.isConnected) return false;
      if (wrapper.previousElementSibling !== brand) brand.insertAdjacentElement("afterend", wrapper);
      wrapper.classList.add("bi-language-switcher-under-logo");
      return true;
    };
    if (move()) return;
    requestAnimationFrame(() => {
      if (!move()) window.setTimeout(move, 40);
    });
  }

  function createSwitcher(options = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = options.className || "bi-language-switcher";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "7px";
    wrapper.style.margin = "4px 12px 12px";
    wrapper.style.padding = "6px 8px";
    wrapper.style.border = "1px solid rgba(255,255,255,.10)";
    wrapper.style.borderRadius = "10px";
    wrapper.style.background = "rgba(255,255,255,.035)";

    const icon = document.createElement("span");
    icon.textContent = "🌐";
    icon.setAttribute("aria-hidden", "true");
    icon.style.fontSize = "14px";
    icon.style.flex = "0 0 auto";

    const select = document.createElement("select");
    select.className = "bi-language-select";
    select.setAttribute("aria-label", t("language.label", {}, "Sprache"));
    select.style.width = "100%";
    select.style.minWidth = "0";
    select.style.minHeight = "32px";
    select.style.padding = "4px 26px 4px 8px";
    select.style.border = "0";
    select.style.borderRadius = "8px";
    select.style.outline = "none";
    select.style.background = "#071d2a";
    select.style.color = "#dceef5";
    select.style.font = "800 11px/1 Inter,Arial,sans-serif";
    select.style.cursor = "pointer";

    supported.forEach(language => {
      const option = document.createElement("option");
      option.value = language;
      option.textContent = `${language.toUpperCase()} · ${t(`language.${language}`, {}, language.toUpperCase())}`;
      select.appendChild(option);
    });
    select.value = activeLanguage;

    select.addEventListener("change", async () => {
      await setLanguage(select.value);
      select.value = activeLanguage;
      select.setAttribute("aria-label", t("language.label", {}, "Sprache"));
      supported.forEach(language => {
        const option = [...select.options].find(item => item.value === language);
        if (option) option.textContent = `${language.toUpperCase()} · ${t(`language.${language}`, {}, language.toUpperCase())}`;
      });
      wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));
      placeSwitcherBelowMemberLogo(wrapper);
    });

    wrapper.append(icon, select);
    requestAnimationFrame(() => placeSwitcherBelowMemberLogo(wrapper));
    return wrapper;
  }

  function init() {
    if (!initPromise) {
      initPromise = (async () => {
        await loadManifest();
        const language = await setLanguage(preferredLanguage(), { persist: false });
        loadUiEnhancements();
        return language;
      })().catch(async () => {
        activeLanguage = defaultLanguage;
        activeDictionary = cloneDictionary(await loadDictionary(defaultLanguage));
        const scope = pageScope();
        if (scope) deepMerge(activeDictionary, await loadScopedDictionary(scope, defaultLanguage));
        document.documentElement.lang = defaultLanguage;
        apply(document);
        loadUiEnhancements();
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