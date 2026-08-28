/* BetInsight Admin Backoffice i18n · 2026-08-28
   Presentation-only translation layer.
   - Uses the shared betinsight_language preference.
   - Never changes form values, data-* attributes, API payloads, status codes or backend semantics.
   - Loads page locales dynamically so future languages need only a locale file + manifest entry.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "betinsight_language";
  const DEFAULT_LANGUAGE = "de";
  const GITHUB_HOST = "betinsightclub.github.io";
  const ROOT = window.location.hostname.toLowerCase() === GITHUB_HOST ? "/profil/" : "/";
  const ADMIN_LOCALE_BASE = `${ROOT}assets/i18n/admin-backoffice/`;
  const GLOBAL_MANIFEST = `${ROOT}assets/i18n/locales/manifest.json`;
  const ADMIN_MANIFEST = `${ADMIN_LOCALE_BASE}manifest.json`;
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);
  const TRANSLATABLE_ATTRIBUTES = ["title", "aria-label", "placeholder"];

  const locales = new Map();
  const sourceText = new WeakMap();
  const renderedText = new WeakMap();
  const attributeState = new WeakMap();
  let activeLanguage = DEFAULT_LANGUAGE;
  let supportedLanguages = [DEFAULT_LANGUAGE, "en"];
  let switcher = null;
  let select = null;
  let observer = null;

  function assetFetch(url) {
    return fetch(url, { cache: "no-store", credentials: "same-origin" });
  }

  async function loadManifest() {
    for (const url of [GLOBAL_MANIFEST, ADMIN_MANIFEST]) {
      try {
        const response = await assetFetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const languages = Array.isArray(data?.languages)
          ? [...new Set(data.languages.map(v => String(v || "").trim().toLowerCase()).filter(Boolean))]
          : [];
        if (languages.length) {
          supportedLanguages = languages;
          return data;
        }
      } catch (_) {}
    }
    supportedLanguages = [DEFAULT_LANGUAGE, "en"];
    return { default: DEFAULT_LANGUAGE, languages: supportedLanguages };
  }

  async function loadLocale(language) {
    const lang = String(language || "").trim().toLowerCase();
    if (!lang) return null;
    if (locales.has(lang)) return locales.get(lang);
    try {
      const response = await assetFetch(`${ADMIN_LOCALE_BASE}${encodeURIComponent(lang)}.json`);
      if (!response.ok) return null;
      const data = await response.json();
      const locale = {
        name: String(data?.name || lang.toUpperCase()),
        short: String(data?.short || lang.toUpperCase()),
        title: String(data?.title || "BetInsight – Mein Backoffice"),
        exact: data?.exact && typeof data.exact === "object" ? data.exact : {},
        contains: data?.contains && typeof data.contains === "object" ? data.contains : {}
      };
      locale.containsEntries = Object.entries(locale.contains)
        .filter(([from]) => String(from).length)
        .sort((a, b) => b[0].length - a[0].length);
      locales.set(lang, locale);
      return locale;
    } catch (_) {
      return null;
    }
  }

  function splitWhitespace(value) {
    const text = String(value ?? "");
    const leading = text.match(/^\s*/)?.[0] || "";
    const trailing = text.match(/\s*$/)?.[0] || "";
    return { leading, trailing, core: text.slice(leading.length, text.length - trailing.length) };
  }

  function translateText(value, language = activeLanguage) {
    const text = String(value ?? "");
    if (!text || language === DEFAULT_LANGUAGE) return text;
    const locale = locales.get(language);
    if (!locale) return text;
    const { leading, trailing, core } = splitWhitespace(text);
    if (!core) return text;

    let translated = Object.prototype.hasOwnProperty.call(locale.exact, core)
      ? String(locale.exact[core])
      : core;

    if (translated === core) {
      for (const [from, to] of locale.containsEntries) {
        if (translated.includes(from)) translated = translated.split(from).join(String(to));
      }
    }
    return leading + translated + trailing;
  }

  function ignoredElement(element) {
    if (!element) return true;
    if (element.closest?.("[data-bi-admin-i18n-ignore]")) return true;
    return SKIP_TAGS.has(element.tagName);
  }

  function renderTextNode(node) {
    const parent = node?.parentElement;
    if (!node || !parent || ignoredElement(parent)) return;

    const current = String(node.nodeValue ?? "");
    const lastRendered = renderedText.get(node);
    if (!sourceText.has(node) || current !== lastRendered) sourceText.set(node, current);

    const source = sourceText.get(node) ?? current;
    const next = translateText(source);
    renderedText.set(node, next);
    if (current !== next) node.nodeValue = next;
  }

  function getAttrState(element) {
    let state = attributeState.get(element);
    if (!state) {
      state = { source: {}, rendered: {} };
      attributeState.set(element, state);
    }
    return state;
  }

  function renderAttribute(element, name) {
    if (!element?.hasAttribute?.(name) || ignoredElement(element)) return;
    const state = getAttrState(element);
    const current = String(element.getAttribute(name) ?? "");
    if (!(name in state.source) || current !== state.rendered[name]) state.source[name] = current;
    const next = translateText(state.source[name] ?? current);
    state.rendered[name] = next;
    if (current !== next) element.setAttribute(name, next);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      renderTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      const element = root;
      if (ignoredElement(element)) return;
      TRANSLATABLE_ATTRIBUTES.forEach(name => renderAttribute(element, name));
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return ignoredElement(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) renderTextNode(walker.currentNode);

    if (root.querySelectorAll) {
      root.querySelectorAll("[title],[aria-label],[placeholder]").forEach(element => {
        TRANSLATABLE_ATTRIBUTES.forEach(name => renderAttribute(element, name));
      });
    }
  }

  function applyLanguage() {
    document.documentElement.lang = activeLanguage;
    const locale = locales.get(activeLanguage) || locales.get(DEFAULT_LANGUAGE);
    if (locale?.title) document.title = locale.title;
    walk(document.body);
    if (select && select.value !== activeLanguage) select.value = activeLanguage;
  }

  async function setLanguage(language, options = {}) {
    const requested = String(language || "").trim().toLowerCase();
    const locale = await loadLocale(requested);
    activeLanguage = locale ? requested : DEFAULT_LANGUAGE;
    await loadLocale(DEFAULT_LANGUAGE);
    if (options.persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, activeLanguage); } catch (_) {}
    }
    applyLanguage();
    window.dispatchEvent(new CustomEvent("bi:languagechange", {
      detail: { language: activeLanguage, area: "admin-backoffice" }
    }));
    return activeLanguage;
  }

  function injectStyles() {
    if (document.getElementById("bi-admin-i18n-style")) return;
    const style = document.createElement("style");
    style.id = "bi-admin-i18n-style";
    style.textContent = `
      .bi-admin-language-switcher{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 9px;border:1px solid rgba(0,218,255,.28);border-radius:11px;background:rgba(0,218,255,.07);color:#d8f5ff;font-weight:800}
      .bi-admin-language-switcher-icon{font-size:16px;line-height:1}
      .bi-admin-language-select{min-height:32px;max-width:150px;padding:4px 26px 4px 8px;border:0;border-radius:8px;outline:none;background:#071d2a;color:#fff;font:inherit;font-size:13px;font-weight:900;cursor:pointer}
      .bi-admin-language-select:focus-visible{box-shadow:0 0 0 2px rgba(0,218,255,.55)}
      @media(max-width:700px){.bi-admin-language-switcher{order:-1}.bi-admin-language-select{max-width:132px}}
    `;
    document.head.appendChild(style);
  }

  async function buildSwitcher(availableLanguages) {
    if (switcher || !document.body) return;
    const target = document.querySelector(".top-actions") || document.querySelector(".topbar");
    if (!target) return;

    injectStyles();
    switcher = document.createElement("div");
    switcher.className = "bi-admin-language-switcher";
    switcher.dataset.biAdminI18nIgnore = "true";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Sprache / Language");

    const icon = document.createElement("span");
    icon.className = "bi-admin-language-switcher-icon";
    icon.textContent = "🌐";
    icon.setAttribute("aria-hidden", "true");

    select = document.createElement("select");
    select.className = "bi-admin-language-select";
    select.setAttribute("aria-label", "Sprache / Language");

    availableLanguages.forEach(lang => {
      const locale = locales.get(lang);
      if (!locale) return;
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = `${locale.short} · ${locale.name}`;
      select.appendChild(option);
    });
    select.value = activeLanguage;
    select.addEventListener("change", () => setLanguage(select.value));

    switcher.append(icon, select);
    target.prepend(switcher);
  }

  function observe() {
    if (observer || !document.body) return;
    observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          renderTextNode(mutation.target);
          continue;
        }
        if (mutation.type === "attributes") {
          renderAttribute(mutation.target, mutation.attributeName);
          continue;
        }
        mutation.addedNodes.forEach(node => walk(node));
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES
    });
  }

  async function init() {
    await loadManifest();
    const available = [];
    for (const lang of supportedLanguages) {
      if (await loadLocale(lang)) available.push(lang);
    }
    if (!available.includes(DEFAULT_LANGUAGE) && await loadLocale(DEFAULT_LANGUAGE)) available.unshift(DEFAULT_LANGUAGE);
    if (!available.length) return;

    let preferred = DEFAULT_LANGUAGE;
    try {
      const stored = String(localStorage.getItem(STORAGE_KEY) || "").trim().toLowerCase();
      if (available.includes(stored)) preferred = stored;
    } catch (_) {}

    activeLanguage = preferred;
    await buildSwitcher(available);
    applyLanguage();
    observe();
  }

  window.BetInsightAdminI18n = Object.freeze({
    init,
    t: text => translateText(text),
    setLanguage,
    getLanguage: () => activeLanguage,
    getSupportedLanguages: () => supportedLanguages.filter(lang => locales.has(lang)),
    storageKey: STORAGE_KEY
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
