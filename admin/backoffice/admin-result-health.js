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
    art.innerHTML='<div class="panel-heading"><div><h3>🛡️ Ergebnisse &amp; Berichte prüfen</h3><p class="muted">Nur auf deine Anforderung. Keine regelmäßige Prüfung, kein automatischer Abgleich.</p></div></div>'+
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">'+
      '<span id="biHealthSheet">Google Sheets: noch nicht geprüft</span>'+
      '<span id="biHealthStory">Spielberichte: noch nicht geprüft</span>'+
      '<button type="button" class="button button-neutral" id="biHealthRefresh">Jetzt prüfen &amp; abgleichen</button></div>'+
      '<p class="muted" style="margin-top:9px;font-size:12px">Bedeutung: „synchron“ = Ergebnisstand auch im Google Sheet. „Fertig“ = Spielbericht mit geprüften externen Daten; „fehlend“ = noch kein externer Bericht; „in Prüfung“ = der Datenanbieter konnte noch nicht abschließend bestätigt werden. Deine Gewinn-/Verlust-Wertung und Units werden nicht verändert.</p>'+'<p class="muted" id="biHealthNote" style="margin-top:6px;font-size:12px">Es erfolgt erst durch deinen Klick ein einmaliger Abgleich der ausstehenden Ergebniszeilen und eine einmalige Nachprüfung fehlender Fußball-/Tennisberichte.</p>';
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
    if(btn){btn.disabled=true;btn.textContent="Prüfung läuft …";}
    try{
      const resp=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"health_run",session_hash:await sha256(s.token)})});
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
        const run=data.manual_run||{};
        const sheetStep=run.sheets||{}, storyStep=run.stories||{}, tennisStep=run.tennis||{};
        const failedSteps=[["Sheet-Abgleich",sheetStep],["Berichtsnachprüfung",storyStep],["Tennis-Ergebnissicherung",tennisStep]].filter(([,v])=>v.ok===false).map(([name])=>name);
        note.textContent="Einmalig geprüft: "+stamp+". "+
          (sheetStep.ok?"Jetzt aktualisierte Sheet-Zeilen: "+Number(sheetStep.synced||0)+". ":"")+
          (storyStep.ok?"Geprüfte Berichtsanfragen: "+Number(storyStep.checked||0)+". ":"")+
          (tennisStep.ok?"Gesicherte Tennisergebnisse: "+Number(tennisStep.stored||0)+". ":"")+
          (failedSteps.length?"Nicht erfolgreich: "+failedSteps.join(", ")+". ":"")+
          "Kein weiterer Lauf ohne erneuten Klick.";
      }
    }catch(e){if(note)note.textContent="Status derzeit nicht abrufbar: "+String(e?.message||e).slice(0,100)}
    finally{if(btn){btn.disabled=false;btn.textContent="Jetzt prüfen & abgleichen";}}
  }
  function start(){if(!document.getElementById("tab-master"))return;inject();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
