/* BetInsight i18n core · Phase 1 preview
   Branch-only foundation for multilingual customer pages.
   German remains the fallback language. No business logic, token logic or backend field names are translated. */
(() => {
  "use strict";

  const STORAGE_KEY = "betinsight_language";
  const DEFAULT_LANGUAGE = "de";
  const SUPPORTED_LANGUAGES = Object.freeze(["de", "en"]);
  const SCRIPT_URL = document.currentScript?.src || "";
  const dictionaries = new Map();
  let activeLanguage = DEFAULT_LANGUAGE;
  let activeDictionary = {};
  let initPromise = null;

  function normalizeLanguage(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    if (SUPPORTED_LANGUAGES.includes(raw)) return raw;
    const short = raw.split("-")[0];
    return SUPPORTED_LANGUAGES.includes(short) ? short : "";
  }

  function storedLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return "";
    }
  }

  function preferredLanguage() {
    const saved = storedLanguage();
    if (saved) return saved;

    const htmlLanguage = normalizeLanguage(document.documentElement.lang);
    if (htmlLanguage) return htmlLanguage;

    const browserLanguage = normalizeLanguage(navigator.language);
    return browserLanguage || DEFAULT_LANGUAGE;
  }

  function localeUrl(language) {
    if (SCRIPT_URL) return new URL(`./locales/${language}.json`, SCRIPT_URL).toString();
    const prefix = window.location.hostname.toLowerCase() === "betinsightclub.github.io" ? "/profil" : "";
    return `${prefix}/assets/i18n/locales/${language}.json`;
  }

  async function loadDictionary(language) {
    const lang = normalizeLanguage(language) || DEFAULT_LANGUAGE;
    if (dictionaries.has(lang)) return dictionaries.get(lang);

    const response = await fetch(localeUrl(lang), {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin"
    });
    if (!response.ok) throw new Error(`Locale ${lang} could not be loaded.`);

    const dictionary = await response.json();
    dictionaries.set(lang, dictionary || {});
    return dictionary || {};
  }

  function lookup(dictionary, key) {
    return String(key || "").split(".").reduce((value, part) => {
      if (value && Object.prototype.hasOwnProperty.call(value, part)) return value[part];
      return undefined;
    }, dictionary);
  }

  function interpolate(value, variables = {}) {
    return String(value).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
      return Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : "";
    });
  }

  function t(key, variables = {}, fallback = "") {
    const translated = lookup(activeDictionary, key);
    if (translated !== undefined && translated !== null && typeof translated !== "object") {
      return interpolate(translated, variables);
    }
    return fallback || key;
  }

  function apply(root = document) {
    root.querySelectorAll?.("[data-bi-i18n]").forEach(element => {
      const key = element.getAttribute("data-bi-i18n");
      const fallback = element.getAttribute("data-bi-i18n-fallback") || element.textContent || "";
      element.textContent = t(key, {}, fallback);
    });

    root.querySelectorAll?.("[data-bi-i18n-html]").forEach(element => {
      const key = element.getAttribute("data-bi-i18n-html");
      const fallback = element.getAttribute("data-bi-i18n-fallback") || element.innerHTML || "";
      element.innerHTML = t(key, {}, fallback);
    });

    root.querySelectorAll?.("[data-bi-i18n-placeholder]").forEach(element => {
      const key = element.getAttribute("data-bi-i18n-placeholder");
      element.setAttribute("placeholder", t(key, {}, element.getAttribute("placeholder") || ""));
    });

    root.querySelectorAll?.("[data-bi-i18n-aria-label]").forEach(element => {
      const key = element.getAttribute("data-bi-i18n-aria-label");
      element.setAttribute("aria-label", t(key, {}, element.getAttribute("aria-label") || ""));
    });

    root.querySelectorAll?.("[data-bi-i18n-title]").forEach(element => {
      const key = element.getAttribute("data-bi-i18n-title");
      element.setAttribute("title", t(key, {}, element.getAttribute("title") || ""));
    });
  }

  async function setLanguage(language, options = {}) {
    const lang = normalizeLanguage(language) || DEFAULT_LANGUAGE;
    let dictionary;
    let resolvedLanguage = lang;

    try {
      dictionary = await loadDictionary(lang);
    } catch (error) {
      if (lang !== DEFAULT_LANGUAGE) {
        dictionary = await loadDictionary(DEFAULT_LANGUAGE);
        resolvedLanguage = DEFAULT_LANGUAGE;
      } else {
        throw error;
      }
    }

    activeLanguage = resolvedLanguage;
    activeDictionary = dictionary || {};
    document.documentElement.lang = activeLanguage;

    if (options.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, activeLanguage); } catch (e) {}
    }

    if (options.apply !== false) apply(document);

    window.dispatchEvent(new CustomEvent("bi:languagechange", {
      detail: { language: activeLanguage }
    }));

    return activeLanguage;
  }

  function createSwitcher(options = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = options.className || "bi-language-switcher";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));

    SUPPORTED_LANGUAGES.forEach(language => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bi-language-button";
      button.dataset.biLanguage = language;
      button.textContent = language.toUpperCase();
      button.setAttribute("aria-pressed", language === activeLanguage ? "true" : "false");
      button.addEventListener("click", async () => {
        await setLanguage(language);
        wrapper.querySelectorAll("[data-bi-language]").forEach(item => {
          item.setAttribute("aria-pressed", item.dataset.biLanguage === activeLanguage ? "true" : "false");
        });
        wrapper.setAttribute("aria-label", t("language.label", {}, "Sprache"));
      });
      wrapper.appendChild(button);
    });

    return wrapper;
  }

  function registerDictionary(language, dictionary) {
    const lang = normalizeLanguage(language);
    if (!lang || !dictionary || typeof dictionary !== "object") return false;
    dictionaries.set(lang, dictionary);
    return true;
  }

  function init() {
    if (!initPromise) {
      initPromise = setLanguage(preferredLanguage(), { persist: false }).catch(async () => {
        activeDictionary = await loadDictionary(DEFAULT_LANGUAGE);
        activeLanguage = DEFAULT_LANGUAGE;
        document.documentElement.lang = DEFAULT_LANGUAGE;
        apply(document);
        return DEFAULT_LANGUAGE;
      });
    }
    return initPromise;
  }

  window.BetInsightI18n = Object.freeze({
    init,
    t,
    apply,
    setLanguage,
    getLanguage: () => activeLanguage,
    getSupportedLanguages: () => [...SUPPORTED_LANGUAGES],
    createSwitcher,
    registerDictionary,
    storageKey: STORAGE_KEY,
    defaultLanguage: DEFAULT_LANGUAGE
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init(); }, { once: true });
  } else {
    init();
  }
})();
