/* BetInsight Dashboard-Layout · 2026-09-02-05
   Empfehlungslinks werden in den Profilzugang verschoben.
   Netzwerkebenen werden beim ersten Öffnen einmal komplett geladen und danach im Browser gehalten.
   Entfernt: oberer Netzwerk-laden-Button, unterer Netzwerkdaten-laden-Button und Marketing-Center im Netzwerkbereich.
   Produktionsansicht: interne Cache-/Make-Hinweise werden vollständig ausgeblendet; obere Netzwerkübersicht kompakt.
   Keine Unit-, Referral-, Tipp-, Zahlungs- oder Wechselstubenbestände werden verändert. */
(() => {
  "use strict";

  const SCRIPT_BASE = new URL("./", document.currentScript?.src || location.href);

  function cleanupObsoleteNetworkButtons() {
    const section = document.getElementById("referralSection");
    if (!section) return;
    section.querySelectorAll(".network-refresh-button,.footer-action-marketing").forEach(button => button.remove());
  }

  function sanitizeNetworkUi() {
    const section = document.getElementById("referralSection");
    if (!section) return;

    cleanupObsoleteNetworkButtons();

    section.querySelectorAll(".bi-lazy-level-note").forEach(note => {
      if (note.dataset.biPublicText === "1") return;
      note.innerHTML = "<strong>Netzwerkdaten werden geladen.</strong><br>Bitte einen Moment warten.";
      note.dataset.biPublicText = "1";
    });

    const status = document.getElementById("referralStatus");
    if (status) {
      const raw = String(status.textContent || "").toLowerCase();
      const isError = raw.includes("konnte nicht") || raw.includes("konnten nicht") || raw.includes("fehler");
      if (isError) {
        status.textContent = "Netzwerkdaten konnten nicht aktualisiert werden. Bitte erneut versuchen.";
        status.style.display = "block";
      } else {
        status.textContent = "";
        status.style.display = "none";
      }
    }
  }

  function applyDashboardLayout() {
    const profilePanelBody = document.querySelector("#profileBox .profile-grid > .panel:first-child .panel-body");
    const referralLinkGroup = document.querySelector("#referralSection .referral-link-group");

    if (profilePanelBody && referralLinkGroup && !document.getElementById("biProfileReferralLinks")) {
      const wrapper = document.createElement("section");
      wrapper.id = "biProfileReferralLinks";
      wrapper.className = "bi-profile-referral-links";
      wrapper.innerHTML = `
        <div class="bi-profile-referral-links-head">
          <strong>🔗 Meine Empfehlungslinks</strong>
          <span>Registrierungs- und Landingpage-Link direkt teilen.</span>
        </div>`;
      wrapper.appendChild(referralLinkGroup);
      profilePanelBody.appendChild(wrapper);
    }

    const referralPanel = document.querySelector("#referralSection > .panel");
    const title = referralPanel?.querySelector(".panel-title");
    const subtitle = referralPanel?.querySelector(".panel-subtitle");
    if (title) title.innerHTML = `🌐 <span class="panel-title-accent">Netzwerk &amp; Referral-Übersicht</span>`;
    if (subtitle) subtitle.textContent = "Deine Partnerstruktur und Referral-Units auf einen Blick.";

    sanitizeNetworkUi();

    if (!document.getElementById("bi-dashboard-layout-style")) {
      const style = document.createElement("style");
      style.id = "bi-dashboard-layout-style";
      style.textContent = `
        .bi-profile-referral-links{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)}
        .bi-profile-referral-links-head{margin-bottom:10px}
        .bi-profile-referral-links-head strong{display:block;color:#dff5ff;font-size:13px;font-weight:900}
        .bi-profile-referral-links-head span{display:block;margin-top:4px;color:#83abc0;font-size:10px;line-height:1.4}
        .bi-profile-referral-links .referral-link-group{margin-top:0;gap:9px}
        .bi-profile-referral-links .referral-link-heading{margin-bottom:5px;font-size:10px}
        .bi-profile-referral-links .referral-link-row{gap:8px;padding:8px;border-radius:13px}
        .bi-profile-referral-links .referral-linkbox{min-height:42px;padding:11px 12px;font-size:11px}
        .bi-profile-referral-links .referral-link-row button{min-width:165px;min-height:42px;padding:9px 10px;font-size:11px}

        #referralSection .referral-overview{gap:10px}
        #referralSection .referral-stat{min-height:100px;padding:12px 14px;border-radius:14px}
        #referralSection .referral-stat-label{font-size:10px;line-height:1.2}
        #referralSection .network-levels{gap:3px;margin-top:7px}
        #referralSection .network-level-line{font-size:12px;line-height:1.15}
        #referralSection .referral-stat-value{margin-top:8px;font-size:26px;line-height:1}
        #referralSection .referral-stat-note{margin-top:5px;font-size:9px;line-height:1.25}

        #referralSection .network-refresh-button,
        #referralSection .footer-action-marketing{display:none!important}
        #referralSection .referral-footer-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
        #referralSection #referralStatus{display:none;margin:8px 0 0;color:#ffb454;font-size:10px;line-height:1.35;text-align:center}

        @media(max-width:980px){
          #referralSection .referral-stat{min-height:94px}
        }
        @media(max-width:760px){
          #referralSection .referral-footer-actions{grid-template-columns:1fr}
          #referralSection .referral-stat{min-height:0;padding:11px 13px}
        }
        @media(max-width:600px){
          .bi-profile-referral-links .referral-link-row{grid-template-columns:1fr}
          .bi-profile-referral-links .referral-link-row button{width:100%;min-width:0}
        }
      `;
      document.head.appendChild(style);
    }

    const section = document.getElementById("referralSection");
    if (section && !window.__biNetworkButtonCleanupObserver) {
      const observer = new MutationObserver(() => sanitizeNetworkUi());
      observer.observe(section,{childList:true,subtree:true,characterData:true});
      window.__biNetworkButtonCleanupObserver = observer;
    }
  }

  function loadNetworkLazy() {
    if (document.querySelector('script[data-bi-network-lazy="1"]')) return;
    const script = document.createElement("script");
    script.src = new URL("network-lazy.js?v=20260902-2", SCRIPT_BASE).toString();
    script.async = false;
    script.dataset.biNetworkLazy = "1";
    script.addEventListener("error", () => console.error("BetInsight Netzwerk-Sparmodus konnte nicht geladen werden."), { once:true });
    document.head.appendChild(script);
  }

  function boot() {
    applyDashboardLayout();
    loadNetworkLazy();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
