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
  const SUPPORTED = ["de", "en"];

  const LABELS = {
    de: {
      dashboard:"Dashboard",
      daily:"Daily Bonus",
      tipps:"Tipps",
      "tipps-group":"Tipps",
      freigeschaltet:"Freigeschaltete Tipps",
      kaufen:"Units-Pakete kaufen",
      "wechselboerse-group":"Unit-Wechselstube",
      wechselboerse:"Übersicht",
      angebote:"Angebote kaufen",
      verkaufen:"Units verkaufen",
      "meine-verkaufsangebote":"Meine Verkaufsangebote",
      wallet:"Wallet",
      anbieter:"Wettanbieter",
      "netzwerk-group":"Netzwerk & Provisionen",
      netzwerk:"Unit-Provisionen",
      "premium-provisionen":"Premium-Provisionen",
      "marketing-center":"Marketing-Center",
      premium:"Mitgliedschaft",
      support:"Support"
    },
    en: {
      dashboard:"Dashboard",
      daily:"Daily Bonus",
      tipps:"Tips",
      "tipps-group":"Tips",
      freigeschaltet:"Unlocked Tips",
      kaufen:"Buy Unit Packages",
      "wechselboerse-group":"Unit Exchange",
      wechselboerse:"Overview",
      angebote:"Buy Offers",
      verkaufen:"Sell Units",
      "meine-verkaufsangebote":"My Sale Offers",
      wallet:"Wallet",
      anbieter:"Betting Providers",
      "netzwerk-group":"Network & Commissions",
      netzwerk:"Unit Commissions",
      "premium-provisionen":"Premium Commissions",
      "marketing-center":"Marketing Center",
      premium:"Membership",
      support:"Support"
    }
  };

  let active = "de";
  let wrapper = null;
  let select = null;

  function readStored() {
    try {
      const value = String(localStorage.getItem(STORAGE_KEY) || "").toLowerCase();
      return SUPPORTED.includes(value) ? value : "de";
    } catch (_) {
      return "de";
    }
  }

  function persist(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

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
      const logout = [...sidebar.querySelectorAll(".bi-nav-settings-link")].find(el => /Ausloggen|Log Out/i.test(el.textContent || ""));
      const settings = [...sidebar.querySelectorAll(".bi-nav-settings-link")].find(el => /Kontoeinstellungen|Account Settings/i.test(el.textContent || ""));
      if (logout) {
        const span = logout.querySelector("span:last-child");
        if (span) span.textContent = lang === "en" ? "Log Out" : "Ausloggen";
      }
      if (settings) {
        const span = settings.querySelector("span:last-child");
        if (span) span.textContent = lang === "en" ? "Account Settings" : "Kontoeinstellungen";
      }
    }
  }

  async function applyLanguage(lang, { persistChoice = true } = {}) {
    active = SUPPORTED.includes(lang) ? lang : "de";
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
    select.innerHTML = '<option value="de">DE · Deutsch</option><option value="en">EN · English</option>';
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
