(function(){
  "use strict";

  const API = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-member-performance";
  const SESSION_KEY = "betinsight_admin_session_v1";
  const MODULE_ID = "betinsightMemberPerformanceAdmin";
  const PRIVACY_KEY = "betinsight_member_performance_email_privacy_v1";

  function esc(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function euro(v){
    return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  }
  function pct(v){
    return new Intl.NumberFormat("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(v)||0)+" %";
  }
  function formatDate(v){
    const d=new Date(v||"");
    return Number.isNaN(d.getTime())?"–":new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
  }
  async function sha256Hex(text){
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(text||"")));
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }
  function readSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);
      if(!raw)return null;
      const s=JSON.parse(raw);
      if(!s||!s.token)return null;
      return s;
    }catch(_){return null}
  }
  async function api(body){
    const session=readSession();
    if(!session)throw new Error("Keine aktive Admin-Session.");
    const sessionHash=await sha256Hex(session.token);
    const response=await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      cache:"no-store",
      credentials:"omit",
      body:JSON.stringify(Object.assign({},body,{session_hash:sessionHash}))
    });
    const raw=await response.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch(_){throw new Error("Performance-API lieferte keine gültige Antwort.");}
    if(!response.ok||data.ok!==true)throw new Error(data.message||data.error||("HTTP "+response.status));
    return data;
  }
  function injectStyles(){
    if(document.getElementById("biPerfAdminStyles"))return;
    const style=document.createElement("style");
    style.id="biPerfAdminStyles";
    style.textContent=`
      #${MODULE_ID}{margin:22px 0;padding:20px;border:1px solid rgba(77,184,255,.24);border-radius:16px;background:linear-gradient(180deg,rgba(9,35,49,.97),rgba(4,24,35,.97));box-shadow:0 18px 45px rgba(0,0,0,.18)}
      #${MODULE_ID} .bi-perf-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}
      #${MODULE_ID} h3{margin:0 0 6px;color:#fff;font-size:20px}
      #${MODULE_ID} .bi-perf-sub{margin:0;color:#9fc2d3;font-size:13px;line-height:1.55}
      #${MODULE_ID} .bi-perf-head-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}\n      #${MODULE_ID} .bi-perf-testpill{padding:6px 10px;border:1px solid rgba(255,207,51,.35);border-radius:999px;color:#ffdb68;background:rgba(255,207,51,.08);font-size:11px;font-weight:900;white-space:nowrap}\n      #${MODULE_ID} .bi-perf-privacy{padding:7px 10px;border:1px solid rgba(115,210,255,.3);border-radius:999px;background:rgba(25,126,178,.12);color:#bfeaff;font-size:11px;font-weight:900;cursor:pointer;white-space:nowrap}\n      #${MODULE_ID} .bi-perf-privacy.active{border-color:rgba(24,216,159,.38);background:rgba(24,216,159,.1);color:#9af5d4}
      #${MODULE_ID} .bi-perf-controls{display:grid;grid-template-columns:minmax(260px,2fr) minmax(180px,1fr) auto;gap:10px;align-items:end;margin-bottom:15px}
      #${MODULE_ID} label{display:block;margin:0 0 6px;color:#9edbf5;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      #${MODULE_ID} select,#${MODULE_ID} button{font:inherit}
      #${MODULE_ID} select{width:100%;min-height:42px;padding:9px 11px;border-radius:10px;border:1px solid rgba(126,196,230,.25);background:#082536;color:#fff}
      #${MODULE_ID} .bi-perf-load,#${MODULE_ID} .bi-perf-publish{min-height:42px;padding:10px 15px;border:0;border-radius:10px;font-weight:900;cursor:pointer}
      #${MODULE_ID} .bi-perf-load{background:linear-gradient(90deg,#168aff,#00b8ff);color:#fff}
      #${MODULE_ID} .bi-perf-publish{background:linear-gradient(90deg,#0dbb83,#13d39a);color:#042017}
      #${MODULE_ID} .bi-perf-publish.is-live{background:rgba(255,113,120,.12);color:#ffc5c8;border:1px solid rgba(255,113,120,.35)}
      #${MODULE_ID} button:disabled{opacity:.5;cursor:not-allowed}
      #${MODULE_ID} .bi-perf-meta{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-bottom:14px}
      #${MODULE_ID} .bi-perf-kpi{padding:11px;border:1px solid rgba(151,205,230,.13);border-radius:11px;background:rgba(255,255,255,.03);min-width:0}
      #${MODULE_ID} .bi-perf-kpi span{display:block;color:#88adbf;font-size:10px;text-transform:uppercase;font-weight:800;margin-bottom:5px}
      #${MODULE_ID} .bi-perf-kpi strong{display:block;color:#fff;font-size:17px;overflow-wrap:anywhere}
      #${MODULE_ID} .bi-perf-chartwrap{position:relative;border:1px solid rgba(159,208,233,.14);border-radius:13px;background:rgba(0,0,0,.15);padding:12px;overflow:hidden}
      #${MODULE_ID} .bi-perf-legend{display:flex;gap:16px;flex-wrap:wrap;margin:0 0 8px;color:#bdd7e3;font-size:11px}
      #${MODULE_ID} .bi-perf-dot{display:inline-block;width:22px;height:3px;border-radius:3px;vertical-align:middle;margin-right:6px}
      #${MODULE_ID} .bi-perf-dot.actual{background:#18d89f}
      #${MODULE_ID} .bi-perf-dot.benchmark{background:rgba(72,176,255,.55)}
      #${MODULE_ID} svg{display:block;width:100%;height:300px}
      #${MODULE_ID} .bi-perf-chart-empty{padding:65px 12px;text-align:center;color:#8db0c0}
      #${MODULE_ID} .bi-perf-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:13px;flex-wrap:wrap}
      #${MODULE_ID} .bi-perf-status{color:#9fc2d3;font-size:12px;line-height:1.45}
      #${MODULE_ID} .bi-perf-status.ok{color:#91f5cf}
      #${MODULE_ID} .bi-perf-status.err{color:#ffc6ca}
      #${MODULE_ID} .bi-perf-note{margin-top:10px;color:#789dad;font-size:11px;line-height:1.5}
      @media(max-width:900px){
        #${MODULE_ID} .bi-perf-controls{grid-template-columns:1fr}
        #${MODULE_ID} .bi-perf-meta{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:560px){
        #${MODULE_ID}{padding:15px}
        #${MODULE_ID} .bi-perf-head{display:block}
        #${MODULE_ID} .bi-perf-testpill{display:inline-block;margin-top:8px}
        #${MODULE_ID} .bi-perf-meta{grid-template-columns:1fr 1fr}
        #${MODULE_ID} svg{height:240px}
      }
    `;
    document.head.appendChild(style);
  }
  function createModule(){
    if(document.getElementById(MODULE_ID))return document.getElementById(MODULE_ID);
    const main=document.querySelector("main");
    const footer=main?.querySelector("footer.footer");
    if(!main||!footer)return null;
    const section=document.createElement("section");
    section.id=MODULE_ID;
    section.innerHTML=`
      <div class="bi-perf-head">
        <div>
          <h3>📈 Nutzer-Performance · Testmodul</h3>
          <p class="bi-perf-sub">Ein Nutzer nach dem anderen: tatsächliche Freischaltungen gegen die Vergleichslinie „alle verfügbaren Tipps seit Registrierung“.</p>
        </div>
        <div class="bi-perf-head-actions"><button class="bi-perf-privacy active" id="biPerfPrivacy" type="button" aria-pressed="true">🔒 E-Mail ausgeblendet</button><span class="bi-perf-testpill">MASTER · TEST</span></div>
      </div>
      <div class="bi-perf-controls">
        <div>
          <label for="biPerfUser">Nutzer auswählen</label>
          <select id="biPerfUser"><option value="">Nutzer werden geladen …</option></select>
        </div>
        <div>
          <label for="biPerfMode">Berechnung</label>
          <select id="biPerfMode">
            <option value="fixed">Konstantes Stammkapital</option>
            <option value="compound">Mit Zinseszins</option>
          </select>
        </div>
        <button class="bi-perf-load" id="biPerfLoad" type="button">Kurve anzeigen</button>
      </div>
      <div class="bi-perf-meta">
        <div class="bi-perf-kpi"><span>Registriert</span><strong id="biPerfRegistered">–</strong></div>
        <div class="bi-perf-kpi"><span>Freischaltungen gesamt</span><strong id="biPerfUnlocks">–</strong></div>
        <div class="bi-perf-kpi"><span>Gewertet / offen</span><strong id="biPerfTips">–</strong></div>
        <div class="bi-perf-kpi"><span>Gewonnen / verloren / neutral</span><strong id="biPerfWL">–</strong></div>
        <div class="bi-perf-kpi"><span>Eigener Verlauf</span><strong id="biPerfActual">–</strong></div>
        <div class="bi-perf-kpi"><span>Alle verfügbaren Tipps</span><strong id="biPerfBenchmark">–</strong></div>
      </div>
      <div class="bi-perf-chartwrap">
        <div class="bi-perf-legend">
          <span><i class="bi-perf-dot actual"></i>Deine tatsächliche Entwicklung</span>
          <span><i class="bi-perf-dot benchmark"></i>Alle verfügbaren Tipps seit Registrierung</span>
        </div>
        <div id="biPerfChart" class="bi-perf-chart-empty">Bitte zuerst einen Nutzer auswählen.</div>
      </div>
      <div class="bi-perf-actions">
        <div id="biPerfStatus" class="bi-perf-status">Noch nichts veröffentlicht. Das Modul ist zunächst nur für den Master sichtbar.</div>
        <button class="bi-perf-publish" id="biPerfPublish" type="button" disabled>Im Nutzerprofil veröffentlichen</button>
      </div>
      <div class="bi-perf-note">Modellrechnung ab 1.000 €. Gewonnen/Verloren werden erst nach bestätigtem Endergebnis gewertet. Abgesagt/void bleiben kapitalneutral. Die Vergleichslinie verrät keine nachträglich gesperrten Tippinhalte.</div>
    `;
    main.insertBefore(section,footer);
    return section;
  }
  function setStatus(text,type){
    const el=document.getElementById("biPerfStatus");
    if(!el)return;
    el.textContent=text;
    el.className="bi-perf-status"+(type?" "+type:"");
  }
  function chart(points){
    const host=document.getElementById("biPerfChart");
    if(!host)return;
    if(!Array.isArray(points)||points.length<2){
      host.className="bi-perf-chart-empty";
      host.textContent="Für diesen Nutzer liegen noch keine gewerteten Tipps seit der Registrierung vor.";
      return;
    }
    host.className="";
    const W=1000,H=300,pL=56,pR=18,pT=20,pB=42;
    const vals=[];
    points.forEach(p=>{vals.push(Number(p.actual)||0,Number(p.benchmark)||0)});
    let min=Math.min(...vals),max=Math.max(...vals);
    const pad=Math.max(20,(max-min)*.15);
    min=Math.floor((min-pad)/25)*25;
    max=Math.ceil((max+pad)/25)*25;
    if(max<=min)max=min+100;
    const x=i=>pL+(points.length===1?0:(i/(points.length-1))*(W-pL-pR));
    const y=v=>pT+((max-v)/(max-min))*(H-pT-pB);
    const path=key=>points.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(Number(p[key])||0).toFixed(1)).join(" ");
    const grid=[0,.25,.5,.75,1].map(t=>{
      const yy=pT+t*(H-pT-pB),value=max-t*(max-min);
      return '<line x1="'+pL+'" y1="'+yy+'" x2="'+(W-pR)+'" y2="'+yy+'" stroke="rgba(180,215,232,.12)" stroke-width="1"/>'+
        '<text x="'+(pL-8)+'" y="'+(yy+4)+'" text-anchor="end" fill="#789dad" font-size="11">'+esc(Math.round(value)+" €")+'</text>';
    }).join("");
    const first=esc(points[0].label||points[0].date||"");
    const last=esc(points[points.length-1].label||points[points.length-1].date||"");
    host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="Persönliche Kapitalentwicklung">'+
      grid+
      '<path d="'+path("benchmark")+'" fill="none" stroke="rgba(72,176,255,.48)" stroke-width="3" stroke-dasharray="8 7" vector-effect="non-scaling-stroke"/>'+
      '<path d="'+path("actual")+'" fill="none" stroke="#18d89f" stroke-width="4" vector-effect="non-scaling-stroke"/>'+
      '<circle cx="'+x(points.length-1)+'" cy="'+y(points[points.length-1].actual)+'" r="5" fill="#18d89f"/>'+
      '<text x="'+pL+'" y="'+(H-12)+'" fill="#789dad" font-size="11">'+first+'</text>'+
      '<text x="'+(W-pR)+'" y="'+(H-12)+'" text-anchor="end" fill="#789dad" font-size="11">'+last+'</text>'+
      '</svg>';
  }

  let users=[];
  let current=null;
  let emailPrivacyActive=true;

  function readPrivacy(){
    try{
      const stored=sessionStorage.getItem(PRIVACY_KEY);
      emailPrivacyActive=stored===null?true:stored!=="0";
    }catch(_){emailPrivacyActive=true}
  }
  function renderPrivacyButton(){
    const btn=document.getElementById("biPerfPrivacy");
    if(!btn)return;
    btn.classList.toggle("active",emailPrivacyActive);
    btn.setAttribute("aria-pressed",emailPrivacyActive?"true":"false");
    btn.textContent=emailPrivacyActive?"🔒 E-Mail ausgeblendet":"🔓 E-Mail sichtbar";
  }
  function renderUserOptions(){
    const sel=document.getElementById("biPerfUser");
    if(!sel)return;
    const selected=sel.value;
    sel.innerHTML='<option value="">Bitte Nutzer auswählen</option>'+users.map(u=>{
      const identity=(u.ref_code||u.user_id);
      const emailPart=emailPrivacyActive?"":(" · "+u.email);
      const label=identity+emailPart+" · "+(u.unlock_count||0)+" Freisch.";
      return '<option value="'+esc(u.user_id)+'">'+esc(label)+(u.visible?" · LIVE":"")+'</option>';
    }).join("");
    if(selected&&users.some(u=>String(u.user_id)===String(selected)))sel.value=selected;
  }
  function toggleEmailPrivacy(){
    emailPrivacyActive=!emailPrivacyActive;
    try{sessionStorage.setItem(PRIVACY_KEY,emailPrivacyActive?"1":"0")}catch(_){}
    renderPrivacyButton();
    renderUserOptions();
  }

  async function loadUsers(){
    setStatus("Nutzerliste wird geladen …","");
    const data=await api({action:"list_users"});
    users=Array.isArray(data.users)?data.users:[];
    renderUserOptions();
    setStatus(users.length+" Nutzer verfügbar. Datenschutz ist standardmäßig aktiv: E-Mail-Adressen sind in der Auswahl ausgeblendet.","ok");
  }
  async function loadSelected(){
    const sel=document.getElementById("biPerfUser");
    const mode=document.getElementById("biPerfMode").value;
    const userId=sel.value;
    if(!userId){setStatus("Bitte zuerst einen Nutzer auswählen.","err");return}
    const btn=document.getElementById("biPerfLoad");
    btn.disabled=true;btn.textContent="Wird geladen …";
    try{
      const data=await api({action:"load_user",user_id:userId,mode});
      current=data;
      document.getElementById("biPerfRegistered").textContent=formatDate(data.user?.registered_at);
      document.getElementById("biPerfUnlocks").textContent=String(data.actual?.unlocks_total??0);
      document.getElementById("biPerfTips").textContent=String(data.actual?.settled??data.actual?.tips??0)+" / "+String(data.actual?.open??0);
      document.getElementById("biPerfWL").textContent=(data.actual?.wins??0)+" / "+(data.actual?.losses??0)+" / "+(data.actual?.neutral??0)+" · "+pct(data.actual?.hit_rate??0);
      document.getElementById("biPerfActual").textContent=euro(data.actual?.end_capital);
      document.getElementById("biPerfBenchmark").textContent=euro(data.benchmark?.end_capital);
      chart(data.points);
      const pub=document.getElementById("biPerfPublish");
      pub.disabled=false;
      pub.classList.toggle("is-live",data.visible===true);
      pub.textContent=data.visible===true?"Aus Nutzerprofil entfernen":"Im Nutzerprofil veröffentlichen";
      setStatus((data.user?.ref_code||data.user?.user_id||"Nutzer")+" geladen · Start 1.000 € · "+(mode==="compound"?"Zinseszins":"konstantes Stammkapital"),"ok");
    }catch(e){
      setStatus(e?.message||"Kurve konnte nicht geladen werden.","err");
    }finally{
      btn.disabled=false;btn.textContent="Kurve anzeigen";
    }
  }
  async function togglePublish(){
    if(!current?.user?.user_id)return;
    const btn=document.getElementById("biPerfPublish");
    const next=current.visible!==true;
    btn.disabled=true;
    try{
      const data=await api({
        action:"set_visibility",
        user_id:current.user.user_id,
        visible:next,
        request_id:(crypto.randomUUID?crypto.randomUUID():"perf-"+Date.now())
      });
      current.visible=data.visible===true;
      btn.classList.toggle("is-live",current.visible);
      btn.textContent=current.visible?"Aus Nutzerprofil entfernen":"Im Nutzerprofil veröffentlichen";
      setStatus(current.visible?"Performance-Modul ist für diesen Nutzer jetzt im Profil freigegeben.":"Performance-Modul wurde für diesen Nutzer wieder ausgeblendet.","ok");
      const u=users.find(x=>x.user_id===current.user.user_id);if(u)u.visible=current.visible;
    }catch(e){
      setStatus(e?.message||"Freigabe konnte nicht geändert werden.","err");
    }finally{
      btn.disabled=false;
    }
  }

  async function init(){
    if(document.getElementById(MODULE_ID))return;
    const session=readSession();
    if(!session)return;
    const isMaster=String(session.master||"").toUpperCase()==="JA"||String(session.role||"").toUpperCase()==="MASTER"||String(session.adminId||"")==="ADM-001";
    if(!isMaster)return;
    injectStyles();
    const module=createModule();
    if(!module)return;
    readPrivacy();
    renderPrivacyButton();
    document.getElementById("biPerfPrivacy")?.addEventListener("click",toggleEmailPrivacy);
    document.getElementById("biPerfLoad")?.addEventListener("click",loadSelected);
    document.getElementById("biPerfUser")?.addEventListener("change",()=>{ if(document.getElementById("biPerfUser").value) loadSelected(); });
    document.getElementById("biPerfMode")?.addEventListener("change",()=>{ if(document.getElementById("biPerfUser").value) loadSelected(); });
    document.getElementById("biPerfPublish")?.addEventListener("click",togglePublish);
    try{await loadUsers()}catch(e){setStatus(e?.message||"Nutzerliste konnte nicht geladen werden.","err");}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,250));
  else setTimeout(init,250);
})();