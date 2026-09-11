/* BetInsight Dashboard-Layout · 2026-09-11-01
   Empfehlungslinks werden in den Profilzugang verschoben.
   Die obere Netzwerkübersicht wird automatisch aus dem Browser-Cache angezeigt; fehlt der Cache, werden Ebenen 1–3 einmal gemeinsam geladen.
   Entfernt: oberer Netzwerk-laden-Button, unterer Netzwerkdaten-laden-Button und Marketing-Center im Netzwerkbereich.
   Produktionsansicht: interne Cache-/Make-Hinweise werden vollständig ausgeblendet; obere Netzwerkübersicht kompakt.
   Performance-Fix: Netzwerk-DOM-Änderungen werden gebündelt; der Observer schreibt nicht mehr rekursiv in beobachtete Inhalte.
   Mitgliedschaft-Fix 2026-09-11: Tarifvergleich hat jetzt echte Aktionsbuttons; Menüpunkt Mitgliedschaft öffnet den Vergleich; externe Premium-Aktivierung/Verlängerung führt zur produktiven Premium-Upgrade-Seite.
   Keine Unit-, Referral-, Tipp-, Zahlungs- oder Wechselstubenbestände werden verändert. */
(() => {
  "use strict";

  const SCRIPT_BASE = new URL("./", document.currentScript?.src || location.href);
  let sanitizeQueued = false;

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
        const wanted = "Netzwerkdaten konnten nicht aktualisiert werden. Bitte erneut versuchen.";
        if (status.textContent !== wanted) status.textContent = wanted;
        if (status.style.display !== "block") status.style.display = "block";
      } else {
        if (status.textContent !== "") status.textContent = "";
        if (status.style.display !== "none") status.style.display = "none";
      }
    }
  }

  function queueSanitizeNetworkUi() {
    if (sanitizeQueued) return;
    sanitizeQueued = true;
    requestAnimationFrame(() => {
      sanitizeQueued = false;
      sanitizeNetworkUi();
    });
  }

  function membershipLevelFromUi() {
    const text = String(document.getElementById("membershipStatus")?.textContent || "").trim().toLowerCase();
    if (text.includes("plus")) return 2;
    if (text.includes("premium")) return 1;
    return 0;
  }

  function openPremiumCheckout() {
    const url = new URL("../premium-upgrade/", SCRIPT_BASE);
    url.search = "";
    url.hash = "";
    location.assign(url.toString());
  }

  function ensureMembershipActionStyle() {
    if (document.getElementById("bi-membership-actions-style")) return;
    const style = document.createElement("style");
    style.id = "bi-membership-actions-style";
    style.textContent = `
      .membership-info-tier{display:flex;flex-direction:column}
      .bi-membership-tier-action{margin-top:auto;padding-top:15px}
      .bi-membership-tier-button{width:100%;min-height:40px;padding:8px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:10px;font-weight:900;cursor:pointer;transition:transform .16s ease,filter .16s ease,box-shadow .16s ease}
      .bi-membership-tier-button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.08)}
      .bi-membership-tier-button.premium{background:linear-gradient(135deg,#0edca6,#0db884);box-shadow:0 8px 20px rgba(14,220,166,.15)}
      .bi-membership-tier-button.plus{background:linear-gradient(135deg,#ffab2e,#e88700);box-shadow:0 8px 20px rgba(255,171,46,.14)}
      .bi-membership-tier-button.current{background:rgba(255,255,255,.055);color:#9fc1cf;cursor:default;box-shadow:none}
      .bi-membership-tier-button:disabled{opacity:.78}
      .bi-membership-dialog-hint{margin-top:9px;color:#8fb1bf;font-size:8px;line-height:1.35;text-align:center}
    `;
    document.head.appendChild(style);
  }

  function refreshMembershipDialogActions() {
    const dialog = document.getElementById("membershipInfoPanel");
    if (!dialog) return;
    ensureMembershipActionStyle();

    const level = membershipLevelFromUi();
    const basis = dialog.querySelector('.membership-info-tier[data-membership-level="0"]');
    const premium = dialog.querySelector('.membership-info-tier[data-membership-level="1"]');
    const plus = dialog.querySelector('.membership-info-tier[data-membership-level="2"]');

    const install = (card, key, label, kind, disabled, handler) => {
      if (!card) return;
      let holder = card.querySelector(`.bi-membership-tier-action[data-action="${key}"]`);
      if (!holder) {
        holder = document.createElement("div");
        holder.className = "bi-membership-tier-action";
        holder.dataset.action = key;
        const button = document.createElement("button");
        button.type = "button";
        holder.appendChild(button);
        card.appendChild(holder);
      }
      const button = holder.querySelector("button");
      button.className = `bi-membership-tier-button ${kind}${disabled ? " current" : ""}`;
      button.textContent = label;
      button.disabled = !!disabled;
      button.onclick = disabled ? null : handler;
    };

    install(
      basis,
      "basis",
      level === 0 ? "✓ Dein aktueller Tarif" : "✓ Im Tarif enthalten",
      "current",
      true,
      null
    );

    let premiumLabel = "⭐ Premium wählen";
    let premiumDisabled = false;
    if (level === 1) premiumLabel = "🔄 Premium verlängern";
    if (level >= 2) {
      premiumLabel = "✓ In Premium Plus enthalten";
      premiumDisabled = true;
    }
    install(premium,"premium",premiumLabel,"premium",premiumDisabled,() => {
      if (typeof window.closeMembershipInfo === "function") window.closeMembershipInfo();
      openPremiumCheckout();
    });

    const plusLabel = level === 2 ? "🔄 Premium Plus verlängern" : level === 1 ? "⬆ Auf Premium Plus upgraden" : "✨ Premium Plus wählen";
    install(plus,"plus",plusLabel,"plus",false,() => {
      if (typeof window.closeMembershipInfo === "function") window.closeMembershipInfo();
      openPremiumCheckout();
    });

    if (!dialog.querySelector(".bi-membership-dialog-hint")) {
      const hint = document.createElement("div");
      hint.className = "bi-membership-dialog-hint";
      hint.textContent = "Aktivierung, Verlängerung und Tarifwechsel werden sicher über die Premium-Zahlungsseite fortgesetzt.";
      dialog.appendChild(hint);
    }
  }

  function fixPremiumManagerUi() {
    const manager = document.getElementById("premiumManagerOverlay");
    if (!manager) return;

    const originalAction = window.premiumActionNotConnected;
    window.premiumActionNotConnected = function(type) {
      if (type === "EXTERN" || type === "UPGRADE_PLUS") {
        if (typeof window.closePremiumManager === "function") window.closePremiumManager();
        openPremiumCheckout();
        return;
      }
      const message = document.getElementById("premiumManagerMessage");
      if (message) {
        if (type === "PROVISIONSGUTHABEN") message.textContent = "Die Verlängerung direkt aus Provisionsguthaben ist noch nicht freigeschaltet. Nutze aktuell bitte die normale Premium-Zahlung.";
        else if (type === "AUTO") message.textContent = "Die automatische Verlängerung ist noch nicht freigeschaltet. Deine Mitgliedschaft kann aktuell über „Jetzt verlängern“ verlängert werden.";
        else if (typeof originalAction === "function") originalAction(type);
      }
    };

    const originalOpen = window.openPremiumManager;
    if (typeof originalOpen === "function" && !originalOpen.__biFixed) {
      const wrappedOpen = function(...args) {
        originalOpen.apply(this,args);
        const message = document.getElementById("premiumManagerMessage");
        if (message) message.textContent = "Hier kannst du deine Mitgliedschaft verlängern oder auf Premium Plus wechseln. Guthaben- und Auto-Verlängerung werden separat freigeschaltet.";
        const externalText = document.getElementById("premiumExternalText");
        if (externalText) externalText.textContent = "Sichere Verlängerung über die BetInsight Premium-Zahlungsseite.";
      };
      wrappedOpen.__biFixed = true;
      window.openPremiumManager = wrappedOpen;
    }
  }

  function installMembershipUiFix() {
    refreshMembershipDialogActions();
    fixPremiumManagerUi();

    const status = document.getElementById("membershipStatus");
    if (status && !window.__biMembershipStatusObserver) {
      const observer = new MutationObserver(() => refreshMembershipDialogActions());
      observer.observe(status,{childList:true,subtree:true,characterData:true});
      window.__biMembershipStatusObserver = observer;
    }

    if (!window.__biMembershipNavClickInstalled) {
      document.addEventListener("click", event => {
        const target = event.target instanceof Element ? event.target.closest('[data-bi-nav-route="premium"]') : null;
        if (!target) return;
        setTimeout(() => {
          refreshMembershipDialogActions();
          const overlay = document.getElementById("membershipInfoOverlay");
          if (overlay?.hidden && typeof window.toggleMembershipInfo === "function") window.toggleMembershipInfo();
        },0);
      });
      window.__biMembershipNavClickInstalled = true;
    }

    const infoButton = document.getElementById("membershipInfoButton");
    if (infoButton && !infoButton.dataset.biActionsRefresh) {
      infoButton.addEventListener("click",() => setTimeout(refreshMembershipDialogActions,0));
      infoButton.dataset.biActionsRefresh = "1";
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
      const observer = new MutationObserver(() => queueSanitizeNetworkUi());
      observer.observe(section,{childList:true,subtree:true});
      window.__biNetworkButtonCleanupObserver = observer;
    }
  }

  function loadNetworkLazy() {
    if (document.querySelector('script[data-bi-network-lazy="1"]')) return;
    const script = document.createElement("script");
    script.src = new URL("network-lazy.js?v=20260902-3", SCRIPT_BASE).toString();
    script.async = false;
    script.dataset.biNetworkLazy = "1";
    script.addEventListener("error", () => console.error("BetInsight Netzwerk-Sparmodus konnte nicht geladen werden."), { once:true });
    document.head.appendChild(script);
  }

  function boot() {
    applyDashboardLayout();
    installMembershipUiFix();
    loadNetworkLazy();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();