/* BetInsight Marketing-Center · persönlicher Webinar-Funnel · 2026-09-05 */
(() => {
  "use strict";

  const PROFILE_API = "https://hook.eu1.make.com/h51f7yyocer340kadcpp078uwcy2svbq";
  const FUNNEL_BASE = "https://betinsight.club/de/webinar/";
  const $ = selector => document.querySelector(selector);
  const tr = (key, fallback, vars = {}) => window.BetInsightI18n?.t(key, vars, fallback) || fallback;

  const style = document.createElement("style");
  style.textContent = `
    .webinar-funnel-card{position:relative;overflow:hidden;padding:24px;background:linear-gradient(145deg,rgba(37,230,167,.10),rgba(89,168,255,.08) 46%,rgba(13,26,38,.98));border:1px solid rgba(37,230,167,.30);border-radius:22px;box-shadow:var(--shadow)}
    .webinar-funnel-card:after{content:"";position:absolute;right:-70px;top:-90px;width:220px;height:220px;border-radius:50%;background:rgba(89,168,255,.10);pointer-events:none}
    .webinar-funnel-main{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end}
    .webinar-funnel-copy h3{margin:0 0 8px;font-size:1.28rem}.webinar-funnel-copy p{max-width:760px;margin:0;color:var(--muted);line-height:1.65}
    .webinar-funnel-label{display:block;margin:20px 0 7px;color:#d9fff1;font-size:.75rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}
    .webinar-funnel-link{min-height:52px;padding:14px 15px;overflow-wrap:anywhere;color:#e8f6ff;background:rgba(7,16,25,.66);border:1px solid rgba(89,168,255,.26);border-radius:13px;font-size:.9rem;line-height:1.45}
    .webinar-funnel-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.webinar-funnel-actions button,.webinar-funnel-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 17px;border-radius:12px;font-weight:900;text-decoration:none;cursor:pointer}
    .webinar-funnel-copy-btn{color:#04140f;background:linear-gradient(135deg,var(--accent),#7af2c8);border:1px solid rgba(255,255,255,.12)}
    .webinar-funnel-open{color:var(--text);background:rgba(89,168,255,.12);border:1px solid rgba(89,168,255,.34)}
    .webinar-funnel-actions [disabled],.webinar-funnel-actions .is-disabled{opacity:.45;pointer-events:none;cursor:not-allowed}
    .webinar-funnel-feedback{min-height:20px;margin-top:9px;color:var(--accent);font-size:.8rem;font-weight:800}
    .webinar-funnel-error{color:#ffc1c4}
    @media(max-width:800px){.webinar-funnel-main{grid-template-columns:1fr}.webinar-funnel-actions{align-items:stretch}.webinar-funnel-actions button,.webinar-funnel-actions a{flex:1 1 190px}}
    @media(max-width:620px){.webinar-funnel-card{padding:19px}.webinar-funnel-actions{display:grid;grid-template-columns:1fr}.webinar-funnel-actions button,.webinar-funnel-actions a{width:100%}}
  `;
  document.head.appendChild(style);

  function cleanRef(value) {
    const ref = String(value || "").trim();
    return /^[A-Za-z0-9_-]{2,50}$/.test(ref) ? ref : "";
  }

  function getAccessValue() {
    const session = window.BetInsightSession;
    const profile = String(session?.getProfileToken?.() || "").trim();
    if (profile) return profile;
    const dashboard = String(session?.getDashboardUuid?.() || "").trim();
    return dashboard;
  }

  function makeNavLink() {
    const nav = $(".quick-nav");
    if (!nav || nav.querySelector('a[href="#webinar-funnel"]')) return;
    const first = nav.querySelector("a");
    const link = document.createElement("a");
    link.href = "#webinar-funnel";
    link.innerHTML = `<strong data-bi-i18n="marketingPage.navWebinarFunnel">🎯 Mein Webinar-Funnel</strong><span data-bi-i18n="marketingPage.navWebinarFunnelCopy">Deinen persönlichen Webinar-Link direkt kopieren und teilen.</span>`;
    if (first) nav.insertBefore(link, first); else nav.appendChild(link);
  }

  function makeSection() {
    if ($("#webinar-funnel")) return;
    const images = $("#bilder");
    if (!images) return;
    const section = document.createElement("section");
    section.className = "section";
    section.id = "webinar-funnel";
    section.innerHTML = `
      <div class="section-head">
        <div>
          <h2 data-bi-i18n="marketingPage.webinarFunnelHeading">Mein persönlicher Webinar-Funnel</h2>
          <p data-bi-i18n="marketingPage.webinarFunnelCopy">Diesen Link kannst du dauerhaft an Interessenten weitergeben. Der nächste Live-Termin wird automatisch aktualisiert; dein persönlicher Empfehlungs-Code wird durch die Webinar-Seiten und in der Webinar-Anmeldung mitgeführt.</p>
        </div>
        <span class="status-pill" id="webinarFunnelStatus" data-bi-i18n="marketingPage.webinarFunnelLoading">Persönlicher Webinar-Link wird geladen …</span>
      </div>
      <article class="webinar-funnel-card">
        <div class="webinar-funnel-main">
          <div class="webinar-funnel-copy">
            <h3 data-bi-i18n="marketingPage.webinarFunnelLinkLabel">Dein dauerhafter Partner-Link</h3>
            <p id="webinarFunnelHelp" data-bi-i18n="marketingPage.webinarFunnelLoading">Persönlicher Webinar-Link wird geladen …</p>
            <span class="webinar-funnel-label" data-bi-i18n="marketingPage.webinarFunnelLinkLabel">Dein dauerhafter Partner-Link</span>
            <div class="webinar-funnel-link" id="webinarFunnelLink">…</div>
            <div class="webinar-funnel-feedback" id="webinarFunnelFeedback" aria-live="polite"></div>
          </div>
          <div class="webinar-funnel-actions">
            <button class="webinar-funnel-copy-btn" id="copyWebinarFunnel" type="button" disabled data-bi-i18n="marketingPage.copyFunnelLink">Link kopieren</button>
            <a class="webinar-funnel-open is-disabled" id="openWebinarFunnel" href="#" target="_blank" rel="noopener" aria-disabled="true" data-bi-i18n="marketingPage.openFunnel">Funnel ansehen</a>
          </div>
        </div>
      </article>`;
    images.insertAdjacentElement("beforebegin", section);
  }

  function setUnavailable() {
    const status = $("#webinarFunnelStatus");
    const help = $("#webinarFunnelHelp");
    const link = $("#webinarFunnelLink");
    const feedback = $("#webinarFunnelFeedback");
    if (status) status.textContent = tr("marketingPage.unreachable", "Nicht erreichbar");
    if (help) help.textContent = tr("marketingPage.webinarFunnelMissing", "Dein persönlicher Webinar-Link konnte noch nicht geladen werden. Öffne das Marketing-Center bitte über dein BetInsight-Profil und versuche es erneut.");
    if (link) link.textContent = "—";
    if (feedback) {
      feedback.classList.add("webinar-funnel-error");
      feedback.textContent = tr("marketingPage.webinarFunnelMissing", "Dein persönlicher Webinar-Link konnte noch nicht geladen werden. Öffne das Marketing-Center bitte über dein BetInsight-Profil und versuche es erneut.");
    }
  }

  function setReady(refCode) {
    const url = FUNNEL_BASE + "?ref=" + encodeURIComponent(refCode);
    const status = $("#webinarFunnelStatus");
    const help = $("#webinarFunnelHelp");
    const link = $("#webinarFunnelLink");
    const copy = $("#copyWebinarFunnel");
    const open = $("#openWebinarFunnel");
    const feedback = $("#webinarFunnelFeedback");
    if (status) status.textContent = tr("marketingPage.webinarFunnelReady", "Persönlicher Link bereit");
    if (help) help.textContent = tr("marketingPage.webinarFunnelCopy", "Diesen Link kannst du dauerhaft an Interessenten weitergeben. Der nächste Live-Termin wird automatisch aktualisiert; dein persönlicher Empfehlungs-Code wird durch die Webinar-Seiten und in der Webinar-Anmeldung mitgeführt.");
    if (link) {
      link.textContent = url;
      link.dataset.url = url;
    }
    if (copy) copy.disabled = false;
    if (open) {
      open.href = url;
      open.classList.remove("is-disabled");
      open.removeAttribute("aria-disabled");
    }
    if (feedback) {
      feedback.classList.remove("webinar-funnel-error");
      feedback.textContent = "";
    }
  }

  async function copyFunnelLink() {
    const link = $("#webinarFunnelLink")?.dataset.url || "";
    const feedback = $("#webinarFunnelFeedback");
    const button = $("#copyWebinarFunnel");
    if (!link || !button) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    const old = button.textContent;
    button.textContent = tr("marketingPage.funnelCopied", "✓ Webinar-Link kopiert");
    if (feedback) feedback.textContent = tr("marketingPage.funnelCopied", "✓ Webinar-Link kopiert");
    setTimeout(() => {
      button.textContent = tr("marketingPage.copyFunnelLink", "Link kopieren");
      if (feedback) feedback.textContent = "";
    }, 1800);
  }

  async function loadPersonalFunnel() {
    const access = getAccessValue();
    if (!access) {
      setUnavailable();
      return;
    }
    try {
      const response = await fetch(PROFILE_API + "?token=" + encodeURIComponent(access), {cache:"no-store"});
      if (!response.ok) throw new Error("Profilabruf HTTP " + response.status);
      const data = await response.json();
      if (!data || data.found === false) throw new Error("Profil nicht gefunden");
      const refCode = cleanRef(data.ref_code);
      if (!refCode) throw new Error("ref_code fehlt");
      setReady(refCode);
    } catch (err) {
      console.warn("BetInsight Webinar-Funnel", err);
      setUnavailable();
    }
  }

  function refreshLanguage() {
    const nav = document.querySelector('.quick-nav a[href="#webinar-funnel"]');
    const navStrong = nav?.querySelector("strong");
    const navSpan = nav?.querySelector("span");
    if (navStrong) navStrong.textContent = tr("marketingPage.navWebinarFunnel", "🎯 Mein Webinar-Funnel");
    if (navSpan) navSpan.textContent = tr("marketingPage.navWebinarFunnelCopy", "Deinen persönlichen Webinar-Link direkt kopieren und teilen.");
    const heading = $("#webinar-funnel h2");
    const sectionCopy = $("#webinar-funnel .section-head p");
    const labelHeading = $("#webinar-funnel .webinar-funnel-copy h3");
    const label = $("#webinar-funnel .webinar-funnel-label");
    const copy = $("#copyWebinarFunnel");
    const open = $("#openWebinarFunnel");
    if (heading) heading.textContent = tr("marketingPage.webinarFunnelHeading", "Mein persönlicher Webinar-Funnel");
    if (sectionCopy) sectionCopy.textContent = tr("marketingPage.webinarFunnelCopy", "Diesen Link kannst du dauerhaft an Interessenten weitergeben. Der nächste Live-Termin wird automatisch aktualisiert; dein persönlicher Empfehlungs-Code wird durch die Webinar-Seiten und in der Webinar-Anmeldung mitgeführt.");
    if (labelHeading) labelHeading.textContent = tr("marketingPage.webinarFunnelLinkLabel", "Dein dauerhafter Partner-Link");
    if (label) label.textContent = tr("marketingPage.webinarFunnelLinkLabel", "Dein dauerhafter Partner-Link");
    if (copy && !copy.disabled) copy.textContent = tr("marketingPage.copyFunnelLink", "Link kopieren");
    if (open) open.textContent = tr("marketingPage.openFunnel", "Funnel ansehen");
    const ready = Boolean($("#webinarFunnelLink")?.dataset.url);
    const status = $("#webinarFunnelStatus");
    const help = $("#webinarFunnelHelp");
    if (ready) {
      if (status) status.textContent = tr("marketingPage.webinarFunnelReady", "Persönlicher Link bereit");
      if (help) help.textContent = tr("marketingPage.webinarFunnelCopy", "Diesen Link kannst du dauerhaft an Interessenten weitergeben. Der nächste Live-Termin wird automatisch aktualisiert; dein persönlicher Empfehlungs-Code wird durch die Webinar-Seiten und in der Webinar-Anmeldung mitgeführt.");
    }
  }

  function init() {
    makeNavLink();
    makeSection();
    $("#copyWebinarFunnel")?.addEventListener("click", copyFunnelLink);
    loadPersonalFunnel();
    window.addEventListener("bi:languagechange", refreshLanguage);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
