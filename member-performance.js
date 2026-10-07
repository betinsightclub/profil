(function(){
  "use strict";
  const API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-member-performance";
  const MODULE_ID="betinsightMemberPerformance";

  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
  function euro(v){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0)}
  function pct(v){return new Intl.NumberFormat("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(v)||0)+" %"}
  function getDashboardToken(){
    try{
      if(typeof getConfirmedDashboardToken==="function"){
        const t=String(getConfirmedDashboardToken()||"").trim();
        if(t)return t;
      }
    }catch(_){}
    try{return String(localStorage.getItem("betinsight_dashboard_token")||"").trim()}catch(_){return ""}
  }
  async function api(mode){
    const token=getDashboardToken();
    if(!token)return {ok:true,visible:false};
    const response=await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      cache:"no-store",
      credentials:"omit",
      body:JSON.stringify({action:"self",dashboard_token:token,mode:mode||"fixed"})
    });
    const raw=await response.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch(_){throw new Error("Performance-Daten konnten nicht gelesen werden.")}
    if(!response.ok||data.ok!==true)throw new Error(data.message||data.error||("HTTP "+response.status));
    return data;
  }
  function injectStyles(){
    if(document.getElementById("biMemberPerfStyles"))return;
    const s=document.createElement("style");s.id="biMemberPerfStyles";s.textContent=`
      #${MODULE_ID}{display:none;margin:28px 0;padding:20px;border:1px solid rgba(70,181,232,.22);border-radius:18px;background:linear-gradient(180deg,rgba(8,38,53,.96),rgba(4,25,35,.98));box-shadow:0 20px 45px rgba(0,0,0,.16)}
      #${MODULE_ID}.visible{display:block}
      #${MODULE_ID} .bmp-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      #${MODULE_ID} h2{margin:0 0 6px;color:#fff;font-size:22px}
      #${MODULE_ID} .bmp-sub{margin:0;color:#a9c8d7;font-size:13px;line-height:1.55}
      #${MODULE_ID} .bmp-mode{min-width:190px}
      #${MODULE_ID} .bmp-mode label{display:block;margin-bottom:5px;color:#86bdd8;font-size:10px;text-transform:uppercase;font-weight:800}
      #${MODULE_ID} select{width:100%;min-height:38px;padding:8px 10px;border:1px solid rgba(133,202,236,.24);border-radius:10px;background:#082536;color:#fff}
      #${MODULE_ID} .bmp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:13px}
      #${MODULE_ID} .bmp-kpi{padding:11px;border:1px solid rgba(159,208,233,.13);border-radius:11px;background:rgba(255,255,255,.03)}
      #${MODULE_ID} .bmp-kpi span{display:block;color:#85aabd;font-size:10px;text-transform:uppercase;font-weight:800;margin-bottom:5px}
      #${MODULE_ID} .bmp-kpi strong{display:block;color:#fff;font-size:17px}
      #${MODULE_ID} .bmp-chart{padding:12px;border:1px solid rgba(159,208,233,.13);border-radius:13px;background:rgba(0,0,0,.15);overflow:hidden}
      #${MODULE_ID} .bmp-legend{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;color:#bdd7e3;font-size:11px}
      #${MODULE_ID} .bmp-dot{display:inline-block;width:22px;height:3px;border-radius:3px;vertical-align:middle;margin-right:6px}
      #${MODULE_ID} .bmp-dot.actual{background:#18d89f}
      #${MODULE_ID} .bmp-dot.compare{background:rgba(72,176,255,.55)}
      #${MODULE_ID} svg{display:block;width:100%;height:280px}
      #${MODULE_ID} .bmp-empty{padding:55px 10px;text-align:center;color:#8eb0c0}
      #${MODULE_ID} .bmp-note{margin-top:10px;color:#7fa4b5;font-size:11px;line-height:1.55}
      @media(max-width:760px){
        #${MODULE_ID}{padding:15px}
        #${MODULE_ID} .bmp-head{display:block}
        #${MODULE_ID} .bmp-mode{margin-top:10px;min-width:0}
        #${MODULE_ID} .bmp-kpis{grid-template-columns:1fr 1fr}
        #${MODULE_ID} svg{height:230px}
      }
    `;document.head.appendChild(s);
  }
  function createModule(){
    let box=document.getElementById(MODULE_ID);if(box)return box;
    const footer=document.querySelector("footer.footer")||document.querySelector("footer");
    if(!footer||!footer.parentNode)return null;
    box=document.createElement("section");box.id=MODULE_ID;
    box.innerHTML=`
      <div class="bmp-head">
        <div><h2>Meine Performance</h2><p class="bmp-sub">Deine tatsächlichen Freischaltungen im Vergleich zu allen gewerteten BetInsight-Tipps, die dir seit deiner Registrierung zur Verfügung standen.</p></div>
        <div class="bmp-mode"><label for="bmpMode">Berechnung</label><select id="bmpMode"><option value="fixed">Konstantes Stammkapital</option><option value="compound">Mit Zinseszins</option></select></div>
      </div>
      <div class="bmp-kpis">
        <div class="bmp-kpi"><span>Startkapital</span><strong>1.000,00 €</strong></div>
        <div class="bmp-kpi"><span>Dein aktueller Modellstand</span><strong id="bmpActual">–</strong></div>
        <div class="bmp-kpi"><span>Gewonnen / verloren</span><strong id="bmpWL">–</strong></div>
        <div class="bmp-kpi"><span>Trefferquote</span><strong id="bmpRate">–</strong></div>
      </div>
      <div class="bmp-chart">
        <div class="bmp-legend"><span><i class="bmp-dot actual"></i>Deine Entwicklung</span><span><i class="bmp-dot compare"></i>Alle verfügbaren Tipps seit Registrierung</span></div>
        <div id="bmpChart" class="bmp-empty">Performance wird geladen …</div>
      </div>
      <div class="bmp-note">Modellrechnung ab 1.000 €. Nur bestätigte Ergebnisse werden gewertet; abgesagte/void Tipps sind kapitalneutral. Die Vergleichslinie zeigt keine Inhalte von Tipps, die du nicht freigeschaltet hast. Vergangene Ergebnisse sind keine Garantie für zukünftige Ergebnisse.</div>
    `;
    footer.parentNode.insertBefore(box,footer);return box;
  }
  function chart(points){
    const host=document.getElementById("bmpChart");if(!host)return;
    if(!Array.isArray(points)||points.length<2){host.className="bmp-empty";host.textContent="Seit deiner Registrierung liegen noch nicht genügend gewertete Tipps für eine Kurve vor.";return}
    host.className="";
    const W=1000,H=280,pL=55,pR=18,pT=18,pB=38;
    const vals=[];points.forEach(p=>vals.push(Number(p.actual)||0,Number(p.benchmark)||0));
    let min=Math.min(...vals),max=Math.max(...vals),pad=Math.max(20,(max-min)*.15);min=Math.floor((min-pad)/25)*25;max=Math.ceil((max+pad)/25)*25;if(max<=min)max=min+100;
    const x=i=>pL+(i/(points.length-1))*(W-pL-pR),y=v=>pT+((max-v)/(max-min))*(H-pT-pB);
    const path=key=>points.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(Number(p[key])||0).toFixed(1)).join(" ");
    const grid=[0,.25,.5,.75,1].map(t=>{const yy=pT+t*(H-pT-pB),val=max-t*(max-min);return '<line x1="'+pL+'" y1="'+yy+'" x2="'+(W-pR)+'" y2="'+yy+'" stroke="rgba(180,215,232,.12)" stroke-width="1"/><text x="'+(pL-8)+'" y="'+(yy+4)+'" text-anchor="end" fill="#789dad" font-size="11">'+esc(Math.round(val)+" €")+'</text>'}).join("");
    host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="Deine BetInsight Performance">'+grid+
      '<path d="'+path("benchmark")+'" fill="none" stroke="rgba(72,176,255,.48)" stroke-width="3" stroke-dasharray="8 7" vector-effect="non-scaling-stroke"/>'+
      '<path d="'+path("actual")+'" fill="none" stroke="#18d89f" stroke-width="4" vector-effect="non-scaling-stroke"/>'+
      '<circle cx="'+x(points.length-1)+'" cy="'+y(points[points.length-1].actual)+'" r="5" fill="#18d89f"/>'+
      '<text x="'+pL+'" y="'+(H-10)+'" fill="#789dad" font-size="11">'+esc(points[0].label||"")+'</text>'+
      '<text x="'+(W-pR)+'" y="'+(H-10)+'" text-anchor="end" fill="#789dad" font-size="11">'+esc(points[points.length-1].label||"")+'</text></svg>';
  }
  async function load(mode){
    const data=await api(mode);
    const box=createModule();if(!box)return;
    if(data.visible!==true){box.classList.remove("visible");return}
    box.classList.add("visible");
    document.getElementById("bmpActual").textContent=euro(data.actual?.end_capital);
    document.getElementById("bmpWL").textContent=(data.actual?.wins??0)+" / "+(data.actual?.losses??0);
    document.getElementById("bmpRate").textContent=pct(data.actual?.hit_rate??0);
    chart(data.points);
  }
  async function init(){
    injectStyles();
    createModule();
    let token=getDashboardToken();
    for(let i=0;!token&&i<24;i++){await new Promise(r=>setTimeout(r,500));token=getDashboardToken()}
    if(!token)return;
    try{await load("fixed")}catch(e){console.warn("Performance-Modul:",e)}
    document.getElementById("bmpMode")?.addEventListener("change",async e=>{
      const target=e.target;try{await load(target.value)}catch(err){console.warn("Performance-Modul:",err)}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,500));else setTimeout(init,500);
})();