/* BetInsight · mark Academy / resource child pages as Academy & Ressourcen in sidebar */
(() => {
  "use strict";

  function applyResourceActiveState() {
    const resourceLink = document.querySelector('.bi-nav-link[data-bi-nav-route="ressourcen"]');
    if (!resourceLink) return false;

    document.querySelectorAll('.bi-nav-link-active,.bi-nav-sub-link-active').forEach(el => {
      el.classList.remove('bi-nav-link-active','bi-nav-sub-link-active');
      el.removeAttribute('aria-current');
    });
    document.querySelectorAll('.bi-nav-group-current').forEach(el => el.classList.remove('bi-nav-group-current'));

    resourceLink.classList.add('bi-nav-link-active');
    resourceLink.setAttribute('aria-current','page');
    return true;
  }

  function init() {
    if (applyResourceActiveState()) return;

    const observer = new MutationObserver(() => {
      if (applyResourceActiveState()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});

    window.setTimeout(() => {
      applyResourceActiveState();
      observer.disconnect();
    }, 5000);
  }

  window.addEventListener('bi:languagechange', () => window.setTimeout(applyResourceActiveState, 0));
  window.addEventListener('pageshow', () => window.setTimeout(applyResourceActiveState, 0));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

/* BetInsight · Werbematerial: Videos automatisch aus marketing-center/downloads/videos laden */
(() => {
  "use strict";

  const VIDEO_API = "https://api.github.com/repos/betinsightclub/profil/contents/marketing-center/downloads/videos?ref=main";
  const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

  function isWerbematerialPage() {
    return /\/werbematerial\/?$/i.test(window.location.pathname);
  }

  function videoUrl(fileName) {
    return "../marketing-center/downloads/videos/" + encodeURIComponent(fileName);
  }

  function isPortrait(fileName) {
    return /hochformat|9x16|9-16|9_16/i.test(fileName);
  }

  function isLandscape(fileName) {
    return /querformat|16x9|16-9|16_9/i.test(fileName);
  }

  function titleFor(fileName) {
    if (/werbevideo-01.*5-start-units/i.test(fileName)) {
      return "BetInsight · Kostenlos starten · 5 Start-Units";
    }
    if (/werbevideo-02.*analyse-strategie-anpfiff/i.test(fileName)) {
      return "BetInsight · Analyse. Strategie. Anpfiff.";
    }
    return fileName
      .replace(/\.[^.]+$/, "")
      .replace(/^betinsight[-_]/i, "BetInsight · ")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function descriptionFor(fileName) {
    if (/werbevideo-01.*5-start-units/i.test(fileName)) {
      return "Freigegebenes BetInsight-Werbevideo im Hochformat für YouTube Shorts, Telegram, WhatsApp und Social Media. Das Video kann heruntergeladen und mit dem eigenen Empfehlungslink veröffentlicht werden.";
    }
    if (/werbevideo-02.*analyse-strategie-anpfiff/i.test(fileName)) {
      return isPortrait(fileName)
        ? "Freigegebener BetInsight-Werbeclip im Hochformat für Reels, Shorts, TikTok, WhatsApp-Status und weitere Social-Media-Beiträge."
        : "Freigegebener BetInsight-Werbeclip im Querformat für YouTube, Telegram, Facebook, Webseiten und weitere Beiträge.";
    }
    return "Freigegebenes BetInsight-Video zum Ansehen, Herunterladen und Veröffentlichen mit dem eigenen Empfehlungslink.";
  }

  function formatLabel(fileName) {
    if (isPortrait(fileName)) return "✓ Freigegeben · Hochformat 9:16";
    if (isLandscape(fileName)) return "✓ Freigegeben · Querformat 16:9";
    return "✓ Freigegeben · Video";
  }

  function mimeType(fileName) {
    const n = fileName.toLowerCase();
    if (n.endsWith(".webm")) return "video/webm";
    if (n.endsWith(".mov")) return "video/quicktime";
    return "video/mp4";
  }

  function buildCard(file) {
    const url = videoUrl(file.name);
    const card = document.createElement("article");
    card.className = "video-card";

    const preview = document.createElement("div");
    preview.className = "video-preview";
    if (isLandscape(file.name)) {
      preview.style.aspectRatio = "16 / 9";
      preview.style.maxHeight = "none";
    } else if (isPortrait(file.name)) {
      preview.style.aspectRatio = "9 / 16";
    }

    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("aria-label", titleFor(file.name));

    const source = document.createElement("source");
    source.src = url;
    source.type = mimeType(file.name);
    video.appendChild(source);
    preview.appendChild(video);

    const body = document.createElement("div");
    body.className = "video-body";

    const badge = document.createElement("span");
    badge.className = "video-type";
    badge.textContent = formatLabel(file.name);

    const title = document.createElement("h3");
    title.textContent = titleFor(file.name);

    const description = document.createElement("p");
    description.textContent = descriptionFor(file.name);

    const actions = document.createElement("div");
    actions.className = "video-actions";

    const view = document.createElement("a");
    view.className = "btn secondary";
    view.href = url;
    view.target = "_blank";
    view.rel = "noopener";
    view.textContent = "▶ Video separat öffnen";

    const download = document.createElement("a");
    download.className = "btn primary";
    download.href = url;
    download.setAttribute("download", file.name);
    download.textContent = "⬇ Video herunterladen";

    actions.append(view, download);
    body.append(badge, title, description, actions);
    card.append(preview, body);
    return card;
  }

  async function loadWerbematerialVideos() {
    if (!isWerbematerialPage()) return;

    const section = document.getElementById("videos");
    const grid = section?.querySelector(".video-grid");
    const status = section?.querySelector(".section-head .status");
    if (!section || !grid || !status) return;

    try {
      const response = await fetch(VIDEO_API, {headers:{Accept:"application/vnd.github+json"}, cache:"no-store"});
      if (!response.ok) throw new Error("GitHub API " + response.status);
      const items = await response.json();
      const files = items
        .filter(item => item && item.type === "file" && VIDEO_EXT.test(item.name))
        .sort((a,b) => a.name.localeCompare(b.name, "de", {numeric:true, sensitivity:"base"}));

      if (!files.length) return;

      grid.innerHTML = "";
      files.forEach(file => grid.appendChild(buildCard(file)));
      status.textContent = files.length === 1 ? "1 Video verfügbar" : `${files.length} Videos verfügbar`;
    } catch (error) {
      console.warn("BetInsight Werbematerial video discovery", error);
      /* Bei Fehler bleibt die fest eingebaute bisherige Videokarte als Fallback sichtbar. */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadWerbematerialVideos, {once:true});
  } else {
    loadWerbematerialVideos();
  }
})();

/* BetInsight · Werbematerial: einzelne Textvorlage direkt per Flagge umschalten */
(() => {
  "use strict";

  const LANGUAGES = [
    {code:"de", flag:"🇩🇪", label:"Deutsch"},
    {code:"en", flag:"🇬🇧", label:"English"},
    {code:"es", flag:"🇪🇸", label:"Español"},
    {code:"pt", flag:"🇵🇹", label:"Português"},
    {code:"it", flag:"🇮🇹", label:"Italiano"},
    {code:"fr", flag:"🇫🇷", label:"Français"}
  ];

  const TEMPLATE_MAP = {
    copyTextNew1:{tag:"newCuriousTag", title:"newCuriousTitle", body:"newCuriousBody"},
    copyTextNew2:{tag:"newTrustTag", title:"newTrustTitle", body:"newTrustBody"},
    copyTextNew3:{tag:"newStoryTag", title:"newStoryTitle", body:"newStoryBody"},
    copyText1:{tag:"whatsappTag", title:"whatsappTitle", body:"whatsappBody"},
    copyText2:{tag:"telegramGeneralTag", title:"telegramGeneralTitle", body:"telegramGeneralBody"},
    copyText3:{tag:"socialTag", title:"socialTitle", body:"socialBody"},
    copyText4:{tag:"telegramPromoTag", title:"successTitle", body:"successBody"}
  };

  const localeCache = new Map();

  function isWerbematerialPage() {
    return /\/werbematerial\/?$/i.test(window.location.pathname);
  }

  function normalizeLanguage(value) {
    const code = String(value || "de").toLowerCase().split("-")[0];
    return LANGUAGES.some(item => item.code === code) ? code : "de";
  }

  function activePageLanguage() {
    return normalizeLanguage(window.BetInsightI18n?.getLanguage?.() || document.documentElement.lang || "de");
  }

  function loadLocale(language) {
    const lang = normalizeLanguage(language);
    if (!localeCache.has(lang)) {
      localeCache.set(lang,
        fetch(`../assets/i18n/pages/werbematerial/${lang}.json`, {cache:"no-store"})
          .then(response => {
            if (!response.ok) throw new Error(`Locale ${lang}: ${response.status}`);
            return response.json();
          })
          .then(data => data?.marketingMaterialsPage || {})
      );
    }
    return localeCache.get(lang);
  }

  function injectStyles() {
    if (document.getElementById("bi-template-language-styles")) return;
    const style = document.createElement("style");
    style.id = "bi-template-language-styles";
    style.textContent = `
      .template-language-switch{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:10px;padding:9px 10px;background:rgba(4,15,23,.42);border:1px solid var(--line,rgba(111,199,235,.18));border-radius:12px}
      .template-language-globe{display:grid;place-items:center;width:27px;height:28px;font-size:.88rem;opacity:.78}
      .template-language-button{display:grid;place-items:center;width:34px;height:30px;padding:0;font-size:1.02rem;line-height:1;background:rgba(15,45,62,.62);border:1px solid rgba(111,199,235,.18);border-radius:9px;cursor:pointer;opacity:.68;filter:saturate(.82);transition:transform .16s ease,border-color .16s ease,background .16s ease,opacity .16s ease,box-shadow .16s ease}
      .template-language-button:hover{transform:translateY(-1px);opacity:1;border-color:rgba(65,171,255,.55);background:rgba(65,171,255,.11)}
      .template-language-button.is-active{opacity:1;filter:none;border-color:rgba(65,171,255,.78);background:rgba(65,171,255,.16);box-shadow:0 0 0 2px rgba(65,171,255,.08)}
      .template-language-button:focus-visible{outline:2px solid var(--green,#19dfa8);outline-offset:2px}
      .template-language-button[disabled]{cursor:wait;opacity:.45;transform:none}
      @media(max-width:380px){.template-language-switch{gap:5px;padding-inline:7px}.template-language-button{width:32px}}
    `;
    document.head.appendChild(style);
  }

  function setActiveFlag(card, language) {
    const lang = normalizeLanguage(language);
    card.querySelectorAll(".template-language-button").forEach(button => {
      const active = button.dataset.templateLanguage === lang;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  async function applyTemplateLanguage(card, language) {
    const copyButton = card.querySelector(".copy-button[data-copy-target]");
    const bodyId = copyButton?.dataset.copyTarget;
    const keys = TEMPLATE_MAP[bodyId];
    const body = bodyId ? document.getElementById(bodyId) : null;
    const tag = card.querySelector(".text-type");
    const title = card.querySelector("h3");
    if (!keys || !body || !tag || !title) return;

    const lang = normalizeLanguage(language);
    const controls = [...card.querySelectorAll(".template-language-button")];
    controls.forEach(button => button.disabled = true);

    try {
      const locale = await loadLocale(lang);
      if (locale[keys.tag]) tag.textContent = locale[keys.tag];
      if (locale[keys.title]) title.textContent = locale[keys.title];
      if (locale[keys.body]) body.textContent = locale[keys.body];
      card.dataset.templateLanguage = lang;
      setActiveFlag(card, lang);
    } catch (error) {
      console.warn("BetInsight template language switch", error);
    } finally {
      controls.forEach(button => button.disabled = false);
    }
  }

  function addLanguageSwitch(card) {
    if (card.querySelector(".template-language-switch")) return;
    const copyButton = card.querySelector(".copy-button[data-copy-target]");
    if (!copyButton || !TEMPLATE_MAP[copyButton.dataset.copyTarget]) return;

    const row = document.createElement("div");
    row.className = "template-language-switch";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Sprache der Textvorlage wählen");

    const globe = document.createElement("span");
    globe.className = "template-language-globe";
    globe.textContent = "🌐";
    globe.setAttribute("aria-hidden", "true");
    row.appendChild(globe);

    LANGUAGES.forEach(language => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "template-language-button";
      button.dataset.templateLanguage = language.code;
      button.textContent = language.flag;
      button.title = language.label;
      button.setAttribute("aria-label", language.label);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => applyTemplateLanguage(card, language.code));
      row.appendChild(button);
    });

    copyButton.insertAdjacentElement("afterend", row);
    const initialLanguage = activePageLanguage();
    setActiveFlag(card, initialLanguage);
    applyTemplateLanguage(card, initialLanguage);
  }

  function initTemplateLanguages() {
    if (!isWerbematerialPage()) return;
    injectStyles();
    document.querySelectorAll("#texte .text-card").forEach(addLanguageSwitch);
  }

  window.addEventListener("bi:languagechange", () => {
    if (!isWerbematerialPage()) return;
    const lang = activePageLanguage();
    document.querySelectorAll("#texte .text-card").forEach(card => applyTemplateLanguage(card, lang));
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemplateLanguages, {once:true});
  } else {
    initTemplateLanguages();
  }
})();
