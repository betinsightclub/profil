/* BetInsight Dashboard-Layout · 2026-09-02-03
   Empfehlungslinks werden in den Profilzugang verschoben.
   Netzwerkebenen werden beim ersten Öffnen einmal komplett geladen und danach im Browser gecacht.
   Entfernt: oberer Netzwerk-laden-Button, unterer Netzwerkdaten-laden-Button und Marketing-Center im Netzwerkbereich.
   Aktualisierung bleibt je geöffneter Ebene möglich.
   Keine Unit-, Referral-, Tipp-, Zahlungs- oder Wechselstubenbestände werden verändert. */
(() => {
  "use strict";

  const SCRIPT_BASE = new URL("./", document.currentScript?.src || location.href);

  function cleanupObsoleteNetworkButtons() {
    const section = document.getElementById("referralSection");
    if (!section) return;
    section.querySelectorAll(".network-refresh-button,.footer-action-marketing").forEach(button => button.remove());
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

    cleanupObsoleteNetworkButtons();

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
        #referralSection .network-refresh-button,
        #referralSection .footer-action-marketing{display:none!important}
        #referralSection .referral-footer-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
        @media(max-width:760px){#referralSection .referral-footer-actions{grid-template-columns:1fr}}
        @media(max-width:600px){
          .bi-profile-referral-links .referral-link-row{grid-template-columns:1fr}
          .bi-profile-referral-links .referral-link-row button{width:100%;min-width:0}
        }
      `;
      document.head.appendChild(style);
    }

    const section = document.getElementById("referralSection");
    if (section && !window.__biNetworkButtonCleanupObserver) {
      const observer = new MutationObserver(() => cleanupObsoleteNetworkButtons());
      observer.observe(section,{childList:true,subtree:true});
      window.__biNetworkButtonCleanupObserver = observer;
    }
  }

  function loadNetworkLazy() {
    if (document.querySelector('script[data-bi-network-lazy="1"]')) return;
    const script = document.createElement("script");
    script.src = new URL("network-lazy.js?v=20260902-1", SCRIPT_BASE).toString();
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
