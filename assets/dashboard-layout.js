/* BetInsight Dashboard-Layout · 2026-09-01-01
   Empfehlungslinks werden in den Profilzugang verschoben.
   Netzwerkebenen werden über network-lazy.js nur bei Bedarf geladen.
   Keine Unit-, Referral-, Tipp-, Zahlungs- oder Wechselstubenbestände werden verändert. */
(() => {
  "use strict";

  const SCRIPT_BASE = new URL("./", document.currentScript?.src || location.href);

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
        @media(max-width:600px){
          .bi-profile-referral-links .referral-link-row{grid-template-columns:1fr}
          .bi-profile-referral-links .referral-link-row button{width:100%;min-width:0}
        }
      `;
      document.head.appendChild(style);
    }
  }

  function loadNetworkLazy() {
    if (document.querySelector('script[data-bi-network-lazy="1"]')) return;
    const script = document.createElement("script");
    script.src = new URL("network-lazy.js?v=20260901-1", SCRIPT_BASE).toString();
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
