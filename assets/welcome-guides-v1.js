/* BetInsight Welcome Guides: six language-matched public PDFs. No account or payment logic. */
(() => {
  "use strict";
  const GUIDES = Object.freeze({
    de: {file:"BetInsight_Willkommensguide_DE_korrigiert.pdf",name:"Deutsch",heading:"Dein BetInsight-Willkommensguide",description:"Der Einstieg in BetInsight: Profil, Tipps, Units, Fan Challenge und weitere Funktionen.",view:"📄 PDF ansehen",download:"⬇ PDF herunterladen",academy:"Zur Academy"},
    en: {file:"BetInsight_Welcome_Guide_EN_International_Final.pdf",name:"English",heading:"Your BetInsight Welcome Guide",description:"Get started with BetInsight: your profile, tips, Units, Fan Challenge and more.",view:"📄 View PDF",download:"⬇ Download PDF",academy:"Open Academy"},
    es: {file:"BetInsight_Guia_de_Bienvenida_ES_Alta_Legibilidad.pdf",name:"Español",heading:"Tu guía de bienvenida de BetInsight",description:"Conoce BetInsight: tu perfil, pronósticos, Units, Fan Challenge y mucho más.",view:"📄 Ver PDF",download:"⬇ Descargar PDF",academy:"Abrir Academy"},
    pt: {file:"BetInsight_Guia_de_Boas_Vindas_PT.pdf",name:"Português",heading:"Seu guia de boas-vindas BetInsight",description:"Conheça a BetInsight: perfil, dicas, Units, Fan Challenge e muito mais.",view:"📄 Ver PDF",download:"⬇ Baixar PDF",academy:"Abrir Academy"},
    it: {file:"BetInsight_Guida_di_Benvenuto_IT.pdf",name:"Italiano",heading:"La tua guida di benvenuto BetInsight",description:"Scopri BetInsight: profilo, pronostici, Units, Fan Challenge e altre funzioni.",view:"📄 Visualizza PDF",download:"⬇ Scarica PDF",academy:"Apri Academy"},
    fr: {file:"BetInsight_Guide_de_Bienvenue_FR_avec_packs.pdf",name:"Français",heading:"Votre guide de bienvenue BetInsight",description:"Découvrez BetInsight : profil, pronostics, Units, Fan Challenge et autres fonctionnalités.",view:"📄 Voir le PDF",download:"⬇ Télécharger le PDF",academy:"Ouvrir l’Academy"}
  });
  const scriptUrl = [...document.scripts].find(s => /\\/welcome-guides-v1\\.js(?:\\?|$)/.test(s.src))?.src || new URL("assets/welcome-guides-v1.js",location.href).href;
  const asset = file => new URL("../marketing-center/downloads/anleitungen/" + encodeURIComponent(file),scriptUrl).href;
  const academyUrl = new URL("../academy/",scriptUrl).href;
  function language() {
    let pref="";
    try { pref=localStorage.getItem("betinsight_language")||""; } catch(_e) {}
    const selected = window.BetInsightI18n?.getLanguage?.() || pref || document.documentElement.lang || "de";
    const normalized=String(selected).toLowerCase().split("-")[0];
    return GUIDES[normalized] ? normalized : "en";
  }
  const make=(tag,cls,txt)=>{const node=document.createElement(tag); if(cls)node.className=cls; if(txt)node.textContent=txt;return node;};
  function render() {
    const lang=language(),g=GUIDES[lang],href=asset(g.file);
    document.querySelectorAll("[data-bi-welcome-guide]").forEach(root=>{
      root.replaceChildren();
      root.lang=lang;
      const info=make("div","bi-welcome-info");
      const heading=make("h2","bi-welcome-title","📘 "+g.heading);
      const description=make("p","bi-welcome-description",g.description);
      const label=make("span","bi-welcome-language",g.name+" · PDF");
      info.append(heading,description,label);
      const actions=make("div","bi-welcome-actions");
      const view=make("a","bi-welcome-button bi-welcome-secondary",g.view);
      view.href=href;view.target="_blank";view.rel="noopener noreferrer";
      const download=make("a","bi-welcome-button bi-welcome-primary",g.download);
      download.href=href;download.download=g.file;
      actions.append(view,download);
      if(root.dataset.biWelcomeGuide==="dashboard") {
        const more=make("a","bi-welcome-academy",g.academy+" →");
        more.href=academyUrl;actions.append(more);
      }
      root.append(info,actions);
    });
  }
  function init(){
    if(!document.getElementById("bi-welcome-guide-css")) {
      const style=document.createElement("style");style.id="bi-welcome-guide-css";
      style.textContent=`
      [data-bi-welcome-guide]{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:wrap;margin:20px 0 30px;padding:20px 24px;background:linear-gradient(130deg,#0e3245,#071e2b);border:1px solid rgba(49,218,178,.35);border-radius:18px;color:#f2faff;font-family:Inter,system-ui,Arial,sans-serif}
      .bi-welcome-info{flex:1 1 300px;min-width:0}.bi-welcome-title{margin:0 0 6px;font-size:clamp(1.13rem,2vw,1.45rem);font-weight:800;line-height:1.3}.bi-welcome-description{margin:0 0 8px;color:#accbd7;font-size:.92rem;line-height:1.5}.bi-welcome-language{color:#6eedd0;font-size:.75rem;font-weight:800}
      .bi-welcome-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}
      .bi-welcome-button{display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:10px 14px;border-radius:11px;text-align:center;text-decoration:none;font-size:.88rem;font-weight:800;line-height:1.3}
      .bi-welcome-primary{background:#3ce9b7;color:#042217}.bi-welcome-secondary{border:1px solid #397a9e;background:#103b57;color:#f2faff}
      .bi-welcome-academy{color:#a8deff;text-decoration:underline;text-underline-offset:3px;font-size:.84rem}
      .bi-welcome-button:hover,.bi-welcome-button:focus-visible,.bi-welcome-academy:focus-visible{outline:2px solid #7be1ff;outline-offset:2px}
      [data-bi-welcome-guide="dashboard"]{margin:0 0 18px;padding:14px 18px;border-radius:14px}[data-bi-welcome-guide="dashboard"] .bi-welcome-title{font-size:1.12rem}
      [data-bi-welcome-guide="dashboard"] .bi-welcome-description{font-size:.84rem}
      @media(max-width:720px){[data-bi-welcome-guide]{padding:16px;gap:12px}.bi-welcome-actions{width:100%;justify-content:stretch}.bi-welcome-button{flex:1 1 140px}.bi-welcome-academy{flex:1 1 100%;text-align:center;padding:7px}}
      `;
      document.head.appendChild(style);
    }
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("bi:languagechange",render);
  window.addEventListener("pageshow",render);
})();
