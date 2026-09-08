/* BetInsight Theme Manager v1.3 · 2026-09-08
   UI-only theme layer. No business logic, tokens, payments, balances or routing are changed.
   Choices: BetInsight Blue (default), BetInsight Green, Light, System.
   v1.3: full theme coverage for the approved member-facing page set.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "betinsight_theme";
  const THEMES = ["blue", "green", "light", "system"];
  const SCRIPT_URL = document.currentScript?.src || new URL("assets/theme-manager.js", location.href).toString();
  const ASSET_BASE = new URL("./", SCRIPT_URL);
  const APP_ROOT = new URL("../", SCRIPT_URL);
  const MEMBER_PAGES = new Set([
    "daily","free-units","fan-challenge","tipps","freigeschaltet","pakete","kaufen",
    "wechselboerse","angebote","verkaufen","meine-verkaufsangebote","wallet","anbieter",
    "ressourcen","academy","werbematerial","marketing-center","support","konto","premium-upgrade"
  ]);
  const LABELS = {
    de:{title:"Darstellung",blue:"BetInsight Blue",green:"BetInsight Green",light:"Hell",system:"System"},
    en:{title:"Appearance",blue:"BetInsight Blue",green:"BetInsight Green",light:"Light",system:"System"},
    es:{title:"Apariencia",blue:"BetInsight Blue",green:"BetInsight Green",light:"Claro",system:"Sistema"},
    pt:{title:"Aparência",blue:"BetInsight Blue",green:"BetInsight Green",light:"Claro",system:"Sistema"},
    it:{title:"Aspetto",blue:"BetInsight Blue",green:"BetInsight Green",light:"Chiaro",system:"Sistema"},
    fr:{title:"Apparence",blue:"BetInsight Blue",green:"BetInsight Green",light:"Clair",system:"Système"}
  };

  function relativePath() {
    const root = APP_ROOT.pathname.replace(/\/+$/, "/");
    let path = location.pathname;
    if (path.startsWith(root)) path = path.slice(root.length);
    path = path.replace(/^\/+|\/+$/g, "").replace(/\/index\.html$/i, "");
    return path === "index.html" ? "" : path;
  }

  function pageId() {
    const path = relativePath();
    if (!path) return "dashboard";
    if (path === "wechselboerse/angebote" || path.startsWith("wechselboerse/angebote/")) return "angebote";
    return path.split("/")[0].toLowerCase();
  }

  function isRootDashboard() { return pageId() === "dashboard"; }

  function ensureThemeStylesheets() {
    const id = pageId();
    if (isRootDashboard()) {
      document.documentElement.dataset.biDashboard = "1";
      delete document.documentElement.dataset.biMemberPage;
      if (!document.getElementById("bi-dashboard-theme-styles")) {
        const link = document.createElement("link");
        link.id = "bi-dashboard-theme-styles";
        link.rel = "stylesheet";
        link.href = new URL("dashboard-theme.css?v=20260908-2", ASSET_BASE).toString();
        document.head.appendChild(link);
      }
      return;
    }
    if (!MEMBER_PAGES.has(id)) return;
    document.documentElement.dataset.biMemberPage = "1";
    document.documentElement.dataset.biPage = id;
    if (!document.getElementById("bi-member-theme-styles")) {
      const link = document.createElement("link");
      link.id = "bi-member-theme-styles";
      link.rel = "stylesheet";
      link.href = new URL("member-theme.css?v=20260908-1", ASSET_BASE).toString();
      document.head.appendChild(link);
    }
  }

  function lang() {
    const raw = String(window.BetInsightI18n?.getLanguage?.() || document.documentElement.lang || "de").toLowerCase();
    if (raw.startsWith("pt")) return "pt";
    const short = raw.split("-")[0];
    return LABELS[raw] ? raw : (LABELS[short] ? short : "de");
  }

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (THEMES.includes(saved)) return saved;
    } catch (e) {}
    return "blue";
  }

  function resolvedTheme(theme) {
    if (theme !== "system") return theme;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "blue";
  }

  function updateBrowserColor(resolved) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", resolved === "light" ? "#eef5f8" : resolved === "green" ? "#041e18" : "#061923");
  }

  function applyTheme(theme, persist = true) {
    const safe = THEMES.includes(theme) ? theme : "blue";
    const resolved = resolvedTheme(safe);
    document.documentElement.dataset.biTheme = resolved;
    document.documentElement.dataset.biThemeChoice = safe;
    document.documentElement.style.colorScheme = resolved === "light" ? "light" : "dark";
    updateBrowserColor(resolved);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, safe); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("betinsight:themechange", {detail:{choice:safe,resolved}}));
    return {choice:safe,resolved};
  }

  function currentTheme() { return document.documentElement.dataset.biThemeChoice || preferredTheme(); }

  function ensureStyles() {
    if (document.getElementById("bi-theme-manager-styles")) return;
    const style = document.createElement("style");
    style.id = "bi-theme-manager-styles";
    style.textContent = `
      .bi-theme-switcher{display:grid;gap:7px;margin:2px 0 4px;padding:10px;border:1px solid rgba(89,189,239,.14);border-radius:12px;background:rgba(6,35,52,.48)}
      .bi-theme-toggle{display:grid;grid-template-columns:24px 1fr 18px;gap:7px;align-items:center;width:100%;min-height:36px;padding:5px 3px;border:0;background:transparent;color:#c4dfeb;text-align:left;font:800 11px/1.2 Inter,Arial,sans-serif;cursor:pointer}
      .bi-theme-toggle-icon{font-size:14px}.bi-theme-chevron{color:#6f98ae;transition:transform .18s ease}.bi-theme-switcher.open .bi-theme-chevron{transform:rotate(180deg)}
      .bi-theme-options{display:grid;grid-template-columns:1fr 1fr;gap:6px}.bi-theme-options[hidden]{display:none}
      .bi-theme-options button{display:flex;align-items:center;gap:7px;min-height:34px;padding:7px 8px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.035);color:#9ebfce;font:800 9px/1.2 Inter,Arial,sans-serif;cursor:pointer;text-align:left}
      .bi-theme-options button:hover,.bi-theme-options button:focus-visible{outline:none;border-color:rgba(89,168,255,.38);color:#fff}.bi-theme-options button.active{border-color:rgba(37,230,167,.45);box-shadow:inset 0 0 0 1px rgba(37,230,167,.12);color:#eafff7}
      .bi-theme-dot{display:inline-block;width:10px;height:10px;border-radius:50%;border:1px solid rgba(255,255,255,.32)}
      .bi-theme-dot-blue{background:#199cff}.bi-theme-dot-green{background:#17d998}.bi-theme-dot-light{background:#f4f7fa;border-color:#8ea6b3}.bi-theme-dot-system{background:linear-gradient(90deg,#199cff 0 50%,#eef4f7 50% 100%)}
      .bi-nav-settings-title{display:flex;align-items:center;gap:7px;margin:0 1px 6px;color:#7da5b8;font:900 9px/1.2 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      .bi-language-settings-block{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;margin:2px 0 4px!important;padding:10px!important;border:1px solid rgba(89,189,239,.14)!important;border-radius:12px!important;background:rgba(6,35,52,.48)!important}
      .bi-language-settings-block .bi-nav-settings-title{grid-column:1/-1}.bi-language-settings-block .bi-language-select{width:100%!important;margin:0!important}
      html[data-bi-theme="green"]{--blue:#20d39a;--cyan:#27e2b2;--green:#20e6a7;--border:rgba(50,215,165,.20)}
      html[data-bi-theme="green"] .bi-nav-sidebar{border-right-color:rgba(39,217,157,.20);background:radial-gradient(circle at 18% 0%,rgba(32,211,154,.16),transparent 30%),linear-gradient(180deg,rgba(3,27,27,.995),rgba(3,35,31,.995) 48%,rgba(2,18,19,.998))}
      html[data-bi-theme="green"] .bi-nav-link:hover,html[data-bi-theme="green"] .bi-nav-group-button:hover,html[data-bi-theme="green"] .bi-nav-sub-link:hover{border-color:rgba(39,217,157,.20);background:rgba(25,139,100,.11)}
      html[data-bi-theme="green"] .bi-nav-link-active,html[data-bi-theme="green"] .bi-nav-sub-link-active{border-color:rgba(39,217,157,.30);background:linear-gradient(90deg,rgba(25,154,108,.30),rgba(16,89,66,.16));box-shadow:inset 3px 0 0 #20d39a,0 10px 24px rgba(0,97,62,.10)}
      html[data-bi-theme="green"] .bi-nav-link-active::after,html[data-bi-theme="green"] .bi-nav-sub-link-active::after{background:#3ee6ad;box-shadow:0 0 10px rgba(62,230,173,.9)}
      html[data-bi-theme="green"] .bi-nav-link-active .bi-nav-icon,html[data-bi-theme="green"] .bi-nav-group-current>.bi-nav-group-button .bi-nav-icon{border-color:rgba(39,217,157,.28);background:rgba(25,154,108,.17);color:#49e9b7}
      html[data-bi-theme="green"] .bi-nav-group-open>.bi-nav-group-button .bi-nav-chevron,html[data-bi-theme="green"] .bi-nav-sub-link-active .bi-nav-sub-dot{color:#49e9b7}
      html[data-bi-theme="light"] .bi-nav-sidebar{border-right-color:rgba(44,104,139,.16);background:radial-gradient(circle at 18% 0%,rgba(25,156,255,.10),transparent 30%),linear-gradient(180deg,#f8fbfd,#f0f6f9 48%,#eaf2f6);box-shadow:18px 0 50px rgba(22,52,68,.12);color:#143245}
      html[data-bi-theme="light"] .bi-nav-brand{border-bottom-color:rgba(31,77,102,.10)}html[data-bi-theme="light"] .bi-nav-link,html[data-bi-theme="light"] .bi-nav-group-button,html[data-bi-theme="light"] .bi-nav-sub-link{color:#517287}
      html[data-bi-theme="light"] .bi-nav-link:hover,html[data-bi-theme="light"] .bi-nav-group-button:hover,html[data-bi-theme="light"] .bi-nav-sub-link:hover{color:#15384d;border-color:rgba(25,126,187,.16);background:rgba(25,126,187,.07)}
      html[data-bi-theme="light"] .bi-nav-link-active,html[data-bi-theme="light"] .bi-nav-sub-link-active{color:#102f43;border-color:rgba(25,126,187,.22);background:linear-gradient(90deg,rgba(25,156,255,.17),rgba(25,156,255,.07));box-shadow:inset 3px 0 0 #168ee5,0 8px 20px rgba(38,104,145,.08)}
      html[data-bi-theme="light"] .bi-nav-group-current>.bi-nav-group-button{color:#15384d;background:rgba(25,126,187,.06)}html[data-bi-theme="light"] .bi-nav-icon{border-color:rgba(31,83,111,.10);background:rgba(255,255,255,.66);color:#66869a}
      html[data-bi-theme="light"] .bi-nav-settings-link,html[data-bi-theme="light"] .bi-theme-switcher,html[data-bi-theme="light"] .bi-language-settings-block{border-color:rgba(35,100,136,.15)!important;background:rgba(255,255,255,.72)!important;color:#355b70}
      html[data-bi-theme="light"] .bi-theme-toggle{color:#355b70}html[data-bi-theme="light"] .bi-theme-options button{border-color:rgba(35,100,136,.12);background:#f4f8fa;color:#56778a}html[data-bi-theme="light"] .bi-theme-options button:hover{color:#163b50;background:#eef5f8}
      html[data-bi-theme="light"] .bi-nav-footer{border-top-color:rgba(31,77,102,.10)}html[data-bi-theme="light"] .bi-nav-footer-caption,html[data-bi-theme="light"] .bi-nav-settings-title{color:#6f8d9d}html[data-bi-theme="light"] .bi-language-select{background:#eef5f8!important;color:#274d62!important}
    `;
    document.head.appendChild(style);
  }

  function createSwitcher() {
    ensureStyles();
    const labels = LABELS[lang()] || LABELS.de;
    const wrap = document.createElement("div");
    wrap.className = "bi-theme-switcher";
    wrap.innerHTML = `<button type="button" class="bi-theme-toggle" aria-expanded="false"><span class="bi-theme-toggle-icon" aria-hidden="true">🎨</span><span class="bi-theme-toggle-label">${labels.title}</span><span class="bi-theme-chevron" aria-hidden="true">⌄</span></button><div class="bi-theme-options" hidden><button type="button" data-theme="blue"><span class="bi-theme-dot bi-theme-dot-blue"></span><span>${labels.blue}</span></button><button type="button" data-theme="green"><span class="bi-theme-dot bi-theme-dot-green"></span><span>${labels.green}</span></button><button type="button" data-theme="light"><span class="bi-theme-dot bi-theme-dot-light"></span><span>${labels.light}</span></button><button type="button" data-theme="system"><span class="bi-theme-dot bi-theme-dot-system"></span><span>${labels.system}</span></button></div>`;
    const toggle = wrap.querySelector(".bi-theme-toggle");
    const options = wrap.querySelector(".bi-theme-options");
    const sync = () => { const active=currentTheme(); wrap.querySelectorAll("[data-theme]").forEach(btn=>btn.classList.toggle("active",btn.dataset.theme===active)); };
    toggle.addEventListener("click",()=>{const open=options.hidden;options.hidden=!open;toggle.setAttribute("aria-expanded",String(open));wrap.classList.toggle("open",open);});
    wrap.querySelectorAll("[data-theme]").forEach(btn=>btn.addEventListener("click",()=>{applyTheme(btn.dataset.theme);sync();options.hidden=true;toggle.setAttribute("aria-expanded","false");wrap.classList.remove("open");}));
    sync();
    return wrap;
  }

  ensureStyles();
  ensureThemeStylesheets();
  applyTheme(preferredTheme(),false);

  if (window.matchMedia) {
    const mq=window.matchMedia("(prefers-color-scheme: light)");
    const listener=()=>{if(currentTheme()==="system")applyTheme("system",false);};
    if(mq.addEventListener)mq.addEventListener("change",listener);else if(mq.addListener)mq.addListener(listener);
  }

  window.BetInsightTheme=Object.freeze({applyTheme,currentTheme,createSwitcher,themes:[...THEMES],pageId});
})();
