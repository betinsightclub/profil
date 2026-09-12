/* BetInsight member language selector · safe presentation layer
   - Customer/member area only; admin/backoffice excluded.
   - Does not touch routes, tokens, API calls, Make, Sheets, Units or business logic.
   - Stores the shared language preference under betinsight_language.
   - If BetInsightI18n is present on a migrated page, delegates the actual page translation to it.
   - On legacy live pages, translates only the central navigation labels so the selector can be tested safely.
*/
(() => {
  "use strict";

  if (/^\/admin(?:\/|$)/i.test(window.location.pathname)) return;

  const STORAGE_KEY = "betinsight_language";
  const SUPPORTED = ["de", "en", "es", "pt", "it", "fr"];
  const OPTIONS = {
    de:"DE · Deutsch", en:"EN · English", es:"ES · Español",
    pt:"PT · Português", it:"IT · Italiano", fr:"FR · Français"
  };

  const LABELS = {
    de: {dashboard:"Dashboard",daily:"Daily Bonus",tipps:"Tipps","tipps-group":"Tipps",freigeschaltet:"Freigeschaltete Tipps",kaufen:"Units-Pakete kaufen","wechselboerse-group":"Unit-Wechselstube",wechselboerse:"Übersicht",angebote:"Angebote kaufen",verkaufen:"Units verkaufen","meine-verkaufsangebote":"Meine Verkaufsangebote",wallet:"Wallet",anbieter:"Wettanbieter","netzwerk-group":"Netzwerk & Provisionen",netzwerk:"Unit-Provisionen","premium-provisionen":"Premium-Provisionen","marketing-center":"Academy & Ressourcen",premium:"Mitgliedschaft",support:"Support",logout:"Ausloggen",settings:"Kontoeinstellungen"},
    en: {dashboard:"Dashboard",daily:"Daily Bonus",tipps:"Tips","tipps-group":"Tips",freigeschaltet:"Unlocked Tips",kaufen:"Buy Unit Packages","wechselboerse-group":"Unit Exchange",wechselboerse:"Overview",angebote:"Buy Offers",verkaufen:"Sell Units","meine-verkaufsangebote":"My Sale Offers",wallet:"Wallet",anbieter:"Betting Providers","netzwerk-group":"Network & Commissions",netzwerk:"Unit Commissions","premium-provisionen":"Premium Commissions","marketing-center":"Academy & Resources",premium:"Membership",support:"Support",logout:"Log Out",settings:"Account Settings"},
    es: {dashboard:"Panel",daily:"Bono diario",tipps:"Pronósticos","tipps-group":"Pronósticos",freigeschaltet:"Pronósticos desbloqueados",kaufen:"Comprar paquetes de Units","wechselboerse-group":"Intercambio de Units",wechselboerse:"Resumen",angebote:"Comprar ofertas",verkaufen:"Vender Units","meine-verkaufsangebote":"Mis ofertas de venta",wallet:"Wallet",anbieter:"Casas de apuestas","netzwerk-group":"Red y comisiones",netzwerk:"Comisiones de Units","premium-provisionen":"Comisiones Premium","marketing-center":"Academy y recursos",premium:"Membresía",support:"Soporte",logout:"Cerrar sesión",settings:"Configuración de la cuenta"},
    pt: {dashboard:"Painel",daily:"Bônus diário",tipps:"Dicas","tipps-group":"Dicas",freigeschaltet:"Dicas desbloqueadas",kaufen:"Comprar pacotes de Units","wechselboerse-group":"Casa de câmbio de Units",wechselboerse:"Visão geral",angebote:"Comprar ofertas",verkaufen:"Vender Units","meine-verkaufsangebote":"Minhas ofertas de venda",wallet:"Wallet",anbieter:"Casas de apostas","netzwerk-group":"Rede e comissões",netzwerk:"Comissões de Units","premium-provisionen":"Comissões Premium","marketing-center":"Academy e recursos",premium:"Assinatura",support:"Suporte",logout:"Sair",settings:"Configurações da conta"},
    it: {dashboard:"Dashboard",daily:"Bonus giornaliero",tipps:"Pronostici","tipps-group":"Pronostici",freigeschaltet:"Pronostici sbloccati",kaufen:"Acquista pacchetti Unit","wechselboerse-group":"Scambio Unit",wechselboerse:"Panoramica",angebote:"Acquista offerte",verkaufen:"Vendi Unit","meine-verkaufsangebote":"Le mie offerte di vendita",wallet:"Wallet",anbieter:"Bookmaker","netzwerk-group":"Rete e commissioni",netzwerk:"Commissioni Unit","premium-provisionen":"Commissioni Premium","marketing-center":"Academy e risorse",premium:"Abbonamento",support:"Supporto",logout:"Esci",settings:"Impostazioni account"},
    fr: {dashboard:"Tableau de bord",daily:"Bonus quotidien",tipps:"Pronostics","tipps-group":"Pronostics",freigeschaltet:"Pronostics débloqués",kaufen:"Acheter des packs d'Units","wechselboerse-group":"Échange d'Units",wechselboerse:"Vue d'ensemble",angebote:"Acheter des offres",verkaufen:"Vendre des Units","meine-verkaufsangebote":"Mes offres de vente",wallet:"Wallet",anbieter:"Opérateurs de paris","netzwerk-group":"Réseau et commissions",netzwerk:"Commissions d'Units","premium-provisionen":"Commissions Premium","marketing-center":"Academy et ressources",premium:"Adhésion",support:"Support",logout:"Se déconnecter",settings:"Paramètres du compte"}
  };

  let active = "de";
  let wrapper = null;
  let select = null;

  function normalize(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (SUPPORTED.includes(raw)) return raw;
    const short = raw.split("-")[0];
    return SUPPORTED.includes(short) ? short : "";
  }

  function readStored() {
    try { return normalize(localStorage.getItem(STORAGE_KEY)) || "de"; }
    catch (_) { return "de"; }
  }

  function persist(lang) { try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {} }

  function injectStyles() {
    if (document.getElementById("bi-member-language-style")) return;
    const style = document.createElement("style");
    style.id = "bi-member-language-style";
    style.textContent = `
      .bi-member-language-switch{display:flex;align-items:center;gap:7px;margin:8px 12px 12px;padding:6px 8px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.035);box-sizing:border-box}
      .bi-member-language-icon{font-size:14px;line-height:1;flex:0 0 auto}
      .bi-member-language-select{width:100%;min-width:0;min-height:32px;padding:4px 26px 4px 8px;border:0;border-radius:8px;outline:none;background:#071d2a;color:#dceef5;font:800 11px/1 Inter,Arial,sans-serif;cursor:pointer}
      .bi-member-language-select:focus-visible{box-shadow:0 0 0 2px rgba(89,168,255,.45)}
    `;
    document.head.appendChild(style);
  }

  function setLabel(el, text) {
    const label = el.querySelector?.(".bi-nav-label");
    if (label && text) label.textContent = text;
  }

  function translateNavigation(lang) {
    const dictionary = LABELS[lang] || LABELS.de;
    document.querySelectorAll("[data-bi-nav-route]").forEach(el => {
      const id = String(el.dataset.biNavRoute || "").trim();
      setLabel(el, dictionary[id]);
    });
    document.querySelectorAll("[data-bi-nav-group]").forEach(group => {
      const id = String(group.dataset.biNavGroup || "").trim();
      const button = group.querySelector(".bi-nav-group-button");
      if (button) setLabel(button, dictionary[id]);
    });

    const sidebar = document.getElementById("bi-nav-sidebar");
    if (sidebar) {
      const links = [...sidebar.querySelectorAll(".bi-nav-settings-link")];
      const logout = links.find(el => /Ausloggen|Log Out|Cerrar sesión|Sair|Esci|Se déconnecter/i.test(el.textContent || ""));
      const settings = links.find(el => /Kontoeinstellungen|Account Settings|Configuración de la cuenta|Configurações da conta|Impostazioni account|Paramètres du compte/i.test(el.textContent || ""));
      if (logout) { const span = logout.querySelector("span:last-child"); if (span) span.textContent = dictionary.logout; }
      if (settings) { const span = settings.querySelector("span:last-child"); if (span) span.textContent = dictionary.settings; }
    }
  }

  async function applyLanguage(lang, { persistChoice = true } = {}) {
    active = normalize(lang) || "de";
    if (persistChoice) persist(active);
    if (select) select.value = active;
    document.documentElement.lang = active;

    if (window.BetInsightI18n?.setLanguage) {
      try { await window.BetInsightI18n.setLanguage(active); } catch (_) {}
    }

    translateNavigation(active);
    window.dispatchEvent(new CustomEvent("bi:member-language-shell-change", { detail: { language: active } }));
  }

  function build() {
    const sidebar = document.getElementById("bi-nav-sidebar");
    const brand = sidebar?.querySelector(".bi-nav-brand");
    if (!sidebar || !brand) return false;

    document.getElementById("bi-member-language-switch")?.remove();
    injectStyles();

    wrapper = document.createElement("div");
    wrapper.id = "bi-member-language-switch";
    wrapper.className = "bi-member-language-switch";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-label", "Sprache / Language");

    const icon = document.createElement("span");
    icon.className = "bi-member-language-icon";
    icon.textContent = "🌐";
    icon.setAttribute("aria-hidden", "true");

    select = document.createElement("select");
    select.className = "bi-member-language-select";
    select.setAttribute("aria-label", "Sprache / Language");
    select.innerHTML = SUPPORTED.map(lang => `<option value="${lang}">${OPTIONS[lang]}</option>`).join("");
    select.value = active;
    select.addEventListener("change", () => applyLanguage(select.value));

    wrapper.append(icon, select);
    brand.insertAdjacentElement("afterend", wrapper);
    translateNavigation(active);
    return true;
  }

  function start() {
    active = readStored();
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (build() || attempts > 80) window.clearInterval(timer);
    }, 50);

    const observer = new MutationObserver(() => {
      const sidebar = document.getElementById("bi-nav-sidebar");
      if (sidebar && !document.getElementById("bi-member-language-switch")) build();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
