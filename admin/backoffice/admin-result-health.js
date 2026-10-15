(() => {
  "use strict";
  const API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-tip-result";
  const SESSION_KEY="betinsight_admin_session_v1";
  const tab=document.getElementById("tab-master");
  function session(){
    try{const s=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
      return s&&(String(s.master||"").toUpperCase()==="JA"||String(s.role||"").toUpperCase()==="MASTER")?s:null;
    }catch{return null}
  }
  if(!session())return;
  function inject(){
    if(document.getElementById("betinsightResultHealth")||!tab)return;
    const art=document.createElement("article");
    art.id="betinsightResultHealth";art.className="content-card full";art.style.marginBottom="16px";
    art.innerHTML='<div class="panel-heading"><div><h3>🛡️ Ergebnis- &amp; Berichtskontrolle</h3><p class="muted">Automatischer Abgleich mit Google Sheets alle 10 Minuten · Berichtsnachprüfung stündlich</p></div></div>'+
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">'+
      '<span id="biHealthSheet">Google Sheets: wird geprüft …</span>'+
      '<span id="biHealthStory">Spielberichte: wird geprüft …</span>'+
      '<button type="button" class="button button-neutral" id="biHealthRefresh">Status jetzt prüfen</button></div>'+
      '<p class="muted" id="biHealthNote" style="margin-top:9px;font-size:12px">Die Ergebnisbestätigung ist unabhängig von einem externen Bericht.</p>';
    const nearby=document.getElementById("masterResultsTableBody")?.closest("article");
    if(nearby?.parentElement)nearby.insertAdjacentElement("afterend",art);
    else tab.appendChild(art);
    art.querySelector("#biHealthRefresh")?.addEventListener("click",refresh);
  }
  async function sha256(t){
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(t||"")));
    return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  async function refresh(){
    inject();
    const btn=document.getElementById("biHealthRefresh"),sheet=document.getElementById("biHealthSheet"),
          story=document.getElementById("biHealthStory"),note=document.getElementById("biHealthNote"),s=session();
    if(!s?.token)return;
    if(btn)btn.disabled=true;
    try{
      const resp=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"health",session_hash:await sha256(s.token)})});
      const data=await resp.json();
      if(!resp.ok||data?.ok!==true)throw Error(data?.error||"STATUS_NOT_AVAILABLE");
      const sync=data.sheet||{},pending=Number(sync.PENDING||0),failed=Number(sync.FAILED||0);
      if(sheet)sheet.textContent="Google Sheets: "+Number(sync.SYNCED||0)+" synchron · "+pending+" ausstehend · "+failed+" Fehler";
      const stats=data.stories||{};
      if(story)story.textContent=stats.checked_at?
        "Quellenberichte: "+Number(stats.ready||0)+" / "+Number(stats.confirmed_eligible||0)+" fertig · "+
        Number(stats.missing||0)+" fehlend · "+Number(stats.pending||0)+" in Prüfung":
        "Quellenberichte: nächste automatische Prüfung steht aus";
      if(note){
        const stamp=stats.checked_at?new Date(stats.checked_at).toLocaleString("de-DE"):"noch keine";
        note.textContent=(failed?"Achtung: Fehlgeschlagener Sheets-Abgleich wird automatisch wiederholt. ":"")+
          "Letzte Berichtsprüfung: "+stamp+". Externe Spieldaten werden niemals erfunden oder zur automatischen Änderung deiner Master-Wertung benutzt.";
      }
    }catch(e){if(note)note.textContent="Status derzeit nicht abrufbar: "+String(e?.message||e).slice(0,100)}
    finally{if(btn)btn.disabled=false}
  }
  function start(){if(!document.getElementById("tab-master"))return;inject();refresh();
    setInterval(()=>{if(session())refresh()},5*60*1000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
