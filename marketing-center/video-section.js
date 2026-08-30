/* BetInsight Marketing-Center · Videos, Reels & Networker-PDF · 2026-08-30 */
(() => {
  "use strict";

  const VIDEO_API = "https://api.github.com/repos/betinsightclub/profil/contents/marketing-center/downloads/videos?ref=main";
  const PRESENTATIONS_API = "https://api.github.com/repos/betinsightclub/profil/contents/marketing-center/downloads/praesentationen?ref=main";
  const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
  const PDF_EXT = /\.pdf$/i;
  const NETWORKER_FILE = /networker/i;
  const $ = selector => document.querySelector(selector);
  const tr = (key, fallback, vars = {}) => window.BetInsightI18n?.t(key, vars, fallback) || fallback;

  const style = document.createElement("style");
  style.textContent = `
    .quick-nav{grid-template-columns:repeat(3,minmax(0,1fr))}
    .video-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .video-card{overflow:hidden;background:linear-gradient(155deg,rgba(18,36,51,.96),rgba(13,26,38,.99));border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow)}
    .video-preview{position:relative;background:#02070b;aspect-ratio:9/16;max-height:560px;margin:0 auto;overflow:hidden}
    .video-preview video{display:block;width:100%;height:100%;object-fit:contain;background:#02070b}
    .video-body{padding:20px}
    .video-type{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;color:#d9fff1;font-size:.72rem;font-weight:850;background:rgba(37,230,167,.1);border:1px solid rgba(37,230,167,.28);border-radius:999px}
    .video-body h3{margin:12px 0 8px;font-size:1.18rem}
    .video-body p{margin:0;color:var(--muted);line-height:1.6}
    .video-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
    .video-actions .presentation-button{flex:1 1 180px}
    .networker-presentation-card{margin-top:14px;background:linear-gradient(145deg,rgba(37,230,167,.09),rgba(13,26,38,.98));border-color:rgba(37,230,167,.30)}
    .networker-presentation-card .presentation-icon{color:#052319;background:linear-gradient(145deg,#25e6a7,#87f4d1)}
    .networker-presentation-card .networker-label{display:inline-flex;width:max-content;margin-bottom:8px;padding:5px 9px;color:#d9fff1;font-size:.7rem;font-weight:850;background:rgba(37,230,167,.09);border:1px solid rgba(37,230,167,.25);border-radius:999px}
    @media(max-width:1000px){.quick-nav{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.video-grid{grid-template-columns:1fr}.video-preview{max-height:640px}}
    @media(max-width:620px){.quick-nav{grid-template-columns:1fr}.video-actions{display:grid;grid-template-columns:1fr}.video-actions .presentation-button{width:100%}}
  `;
  document.head.appendChild(style);

  function videoPath(fileName) {
    return "downloads/videos/" + encodeURIComponent(fileName);
  }

  function presentationPath(fileName) {
    return "downloads/praesentationen/" + encodeURIComponent(fileName);
  }

  function titleFor(fileName) {
    if (/werbevideo-01.*5-start-units/i.test(fileName)) {
      return tr("marketingPage.promoVideo1Title", "BetInsight · Kostenlos starten · 5 Start-Units");
    }
    return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function descriptionFor(fileName) {
    if (/werbevideo-01.*5-start-units/i.test(fileName)) {
      return tr("marketingPage.promoVideo1Description", "Freigegebenes BetInsight-Werbevideo im Hochformat für YouTube Shorts, Telegram, WhatsApp und Social Media. Partner können das Video herunterladen und mit ihrem eigenen Empfehlungslink veröffentlichen.");
    }
    return tr("marketingPage.videoGenericDescription", "Freigegebenes BetInsight-Video zum Ansehen und Herunterladen.");
  }

  function makeNavLink() {
    const nav = $(".quick-nav");
    if (!nav || nav.querySelector('a[href="#videos"]')) return;
    const imagesLink = nav.querySelector('a[href="#bilder"]');
    const link = document.createElement("a");
    link.href = "#videos";
    link.innerHTML = `<strong data-bi-i18n="marketingPage.navVideos">🎬 Videos & Reels</strong><span data-bi-i18n="marketingPage.navVideosCopy">Freigegebene Videos ansehen und herunterladen.</span>`;
    if (imagesLink?.nextSibling) nav.insertBefore(link, imagesLink.nextSibling); else nav.appendChild(link);
  }

  function makeSection() {
    if ($("#videos")) return;
    const images = $("#bilder");
    if (!images) return;
    const section = document.createElement("section");
    section.className = "section";
    section.id = "videos";
    section.innerHTML = `
      <div class="section-head">
        <div>
          <h2 data-bi-i18n="marketingPage.videosHeading">Videos & Reels</h2>
          <p data-bi-i18n="marketingPage.videosCopy">Freigegebene BetInsight-Videos direkt ansehen oder für eigene Beiträge herunterladen.</p>
        </div>
        <span class="status-pill" id="videoStatus">Lädt …</span>
      </div>
      <div class="loading-box" id="videoLoading"><div><div class="spinner"></div><strong data-bi-i18n="marketingPage.videosLoading">Videos werden geladen</strong></div></div>
      <div class="error-box" id="videoError" hidden><div><strong data-bi-i18n="marketingPage.videosError">Videos konnten gerade nicht geladen werden.</strong><span data-bi-i18n="marketingPage.reload">Bitte die Seite in einem Moment neu laden.</span></div></div>
      <div class="empty-box" id="videoEmpty" hidden><div><strong data-bi-i18n="marketingPage.noVideos">Noch keine freigegebenen Videos vorhanden.</strong></div></div>
      <div class="video-grid" id="videoGrid" hidden></div>`;
    images.insertAdjacentElement("afterend", section);
  }

  function tuneComingSoon() {
    const card = document.querySelector('.future-card h3[data-bi-i18n="marketingPage.videoTitle"]')?.closest(".future-card");
    if (!card) return;
    const icon = card.querySelector(".future-icon");
    const title = card.querySelector("h3");
    const copy = card.querySelector("p");
    const label = card.querySelector(".future-label");
    if (icon) icon.textContent = "🎥";
    if (title) {
      title.dataset.biI18n = "marketingPage.webinarMaterialTitle";
      title.textContent = tr("marketingPage.webinarMaterialTitle", "Webinar-Material");
    }
    if (copy) {
      copy.dataset.biI18n = "marketingPage.webinarMaterialCopy";
      copy.textContent = tr("marketingPage.webinarMaterialCopy", "Einladungen, Teaser und weitere Materialien für Live-Webinare und Aufzeichnungen.");
    }
    if (label) label.textContent = tr("marketingPage.preparing", "In Vorbereitung");

    const soonCopy = document.querySelector('a[href="#demnaechst"] span');
    if (soonCopy) {
      soonCopy.dataset.biI18n = "marketingPage.navSoonCopyUpdated";
      soonCopy.textContent = tr("marketingPage.navSoonCopyUpdated", "Webinar-Material, Banner, QR-Codes und weitere Sprachen.");
    }
  }

  function installNetworkerPresentationCard(file) {
    const section = $("#praesentation");
    if (!section || !file || section.querySelector(".networker-presentation-card")) return;
    const url = presentationPath(file.name);
    const card = document.createElement("article");
    card.className = "presentation-card networker-presentation-card";
    card.innerHTML = `
      <div class="presentation-icon">PDF</div>
      <div class="presentation-copy">
        <span class="networker-label">Networker-Info</span>
        <h3>${tr("marketingPage.networkerPdfTitle", "Premium-Provisionsplan für Networker")}</h3>
        <p>${tr("marketingPage.networkerPdfDescription", "Provisionssätze bis Ebene 8, feste Eurobeträge sowie transparente 2×2- und 3×3-Rechenbeispiele. Ohne Einkommens- oder Verdienstgarantie.")}</p>
      </div>
      <div class="presentation-actions">
        <a class="presentation-button secondary" href="${url}" target="_blank" rel="noopener">${tr("marketingPage.viewPdf", "PDF ansehen")}</a>
        <a class="presentation-button" href="${url}" download="${file.name}">${tr("marketingPage.downloadPdf", "PDF herunterladen")}</a>
      </div>`;
    const mainCard = section.querySelector(".presentation-card");
    if (mainCard) mainCard.insertAdjacentElement("afterend", card); else section.appendChild(card);
  }

  async function loadNetworkerPresentation() {
    try {
      const response = await fetch(PRESENTATIONS_API, {headers:{Accept:"application/vnd.github+json"}});
      if (!response.ok) throw new Error("GitHub API " + response.status);
      const data = await response.json();
      const file = data.find(item => item && item.type === "file" && PDF_EXT.test(item.name) && NETWORKER_FILE.test(item.name));
      if (file) installNetworkerPresentationCard(file);
    } catch (err) {
      console.warn("BetInsight Networker PDF discovery", err);
    }
  }

  function buildCard(file) {
    const url = videoPath(file.name);
    const card = document.createElement("article");
    card.className = "video-card";

    const preview = document.createElement("div");
    preview.className = "video-preview";
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("aria-label", titleFor(file.name));
    const source = document.createElement("source");
    source.src = url;
    source.type = file.name.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
    video.appendChild(source);
    preview.appendChild(video);

    const body = document.createElement("div");
    body.className = "video-body";
    const type = document.createElement("span");
    type.className = "video-type";
    type.textContent = tr("marketingPage.videoApproved", "✓ Freigegeben");
    const title = document.createElement("h3");
    title.textContent = titleFor(file.name);
    const description = document.createElement("p");
    description.textContent = descriptionFor(file.name);

    const actions = document.createElement("div");
    actions.className = "video-actions";
    const view = document.createElement("a");
    view.className = "presentation-button secondary";
    view.href = url;
    view.target = "_blank";
    view.rel = "noopener";
    view.textContent = tr("marketingPage.viewVideoFile", "▶ Video separat öffnen");
    const download = document.createElement("a");
    download.className = "presentation-button";
    download.href = url;
    download.setAttribute("download", file.name);
    download.textContent = tr("marketingPage.downloadVideo", "⬇ Video herunterladen");
    actions.append(view, download);
    body.append(type, title, description, actions);
    card.append(preview, body);
    return card;
  }

  let videoFiles = [];

  function renderVideos() {
    const grid = $("#videoGrid");
    const status = $("#videoStatus");
    if (!grid || !status) return;
    grid.innerHTML = "";
    videoFiles.forEach(file => grid.appendChild(buildCard(file)));
    if (videoFiles.length) {
      grid.hidden = false;
      status.textContent = tr(videoFiles.length === 1 ? "marketingPage.oneVideo" : "marketingPage.videosCount", videoFiles.length === 1 ? "1 Video" : "{{count}} Videos", {count: videoFiles.length});
    }
  }

  async function loadVideos() {
    const loading = $("#videoLoading");
    const error = $("#videoError");
    const empty = $("#videoEmpty");
    const status = $("#videoStatus");
    try {
      const response = await fetch(VIDEO_API, {headers:{Accept:"application/vnd.github+json"}});
      if (!response.ok) throw new Error("GitHub API " + response.status);
      const data = await response.json();
      videoFiles = data.filter(item => item && item.type === "file" && VIDEO_EXT.test(item.name)).sort((a,b) => a.name.localeCompare(b.name, window.BetInsightI18n?.getLanguage?.() || "de"));
      if (loading) loading.hidden = true;
      if (!videoFiles.length) {
        if (empty) empty.hidden = false;
        if (status) status.textContent = tr("marketingPage.zeroVideos", "0 Videos");
        return;
      }
      renderVideos();
    } catch (err) {
      console.warn("BetInsight video gallery", err);
      if (loading) loading.hidden = true;
      if (error) error.hidden = false;
      if (status) status.textContent = tr("marketingPage.unreachable", "Nicht erreichbar");
    }
  }

  function refreshLanguage() {
    tuneComingSoon();
    if (videoFiles.length) renderVideos();
  }

  function init() {
    makeNavLink();
    makeSection();
    tuneComingSoon();
    loadVideos();
    loadNetworkerPresentation();
    window.addEventListener("bi:languagechange", refreshLanguage);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
