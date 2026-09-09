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
