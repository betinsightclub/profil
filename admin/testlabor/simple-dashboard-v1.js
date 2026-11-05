"use strict";
/* Simplified master view: a free read-only assessment and one optional explicitly confirmed league refresh.
   Old expert sections remain available but collapsed. No automatic provider requests. */
(()=>{
 const byId=id=>document.getElementById(id);
 const make=(tag,value,css)=>{const el=document.createElement(tag);el.textContent=String(value??"");if(css)el.className=css;return el};
 const de=(number,decimals=2)=>Number(number).toLocaleString("de-DE",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
 const leagues=[
  ["soccer_italy_serie_a","Serie A · Italien"],
  ["soccer_france_ligue_one","Ligue 1 · Frankreich"],
  ["soccer_netherlands_eredivisie","Eredivisie · Niederlande"],
  ["soccer_portugal_primeira_liga","Primeira Liga · Portugal"],
  ["basketball_nba","NBA · Basketball"],
  ["basketball_euroleague","EuroLeague · Basketball"],
  ["basketball_wnba","WNBA · Basketball"],
  ["icehockey_nhl","NHL · Eishockey"],
  ["americanfootball_nfl","NFL · American Football"],
  ["baseball_mlb","MLB · Baseball"],
  ["baseball_kbo","KBO · Baseball"],
  ["baseball_npb","NPB · Baseball"]
 ];
 let latestScan=null, busy=false;
 const leagueSelect=byId("simpleLeague");
 for(const [key,name] of leagues){
  const item=document.createElement("option");item.value=key;item.textContent=name;
  leagueSelect.append(item);
 }
 const result=byId("simpleResult"),status=byId("simpleStatus"),scanButton=byId("simpleCheck"),refreshButton=byId("simpleRefresh");
 const busyState=active=>{
   busy=active;scanButton.disabled=active;refreshButton.disabled=active;
 };
 function render(scan,watch,partial){
  latestScan=scan;
  result.replaceChildren();
  const cur=Number(scan.current_leagues||0),n=Number(scan.scanned_leagues||12);
  const green=Array.isArray(scan.green_candidates)?scan.green_candidates:[];
  const stats=make("div","","simple-stats");
  for(const [label,value] of [
    ["Aktuelle Ligen",cur+" / "+n],
    ["Bevorstehende Spiele",Number(scan.current_games||0)],
    ["Preisfilter-Treffer",green.length]
  ]){
    const tile=make("div","","simple-stat");
    tile.append(make("span",label,"small muted"));
    tile.append(make("strong",value,"simple-stat-value"));
    stats.append(tile);
  }
  result.append(stats);
  const headline=make("div","","simple-verdict");
  headline.append(make("strong",
    cur===0?"Keine aktuellen Quoten vorhanden":
    green.length?"Preisfilter-Treffer gefunden – noch keine validierte Empfehlung":
    "Keine grüne Preisfreigabe in den aktuell geladenen Ligen"));
  const line=cur===0?
   "Die gespeicherten Quoten sind abgelaufen oder fehlen. Das ist keine Aussage über die Qualität der Spiele.":
   green.length?
   green.length+" Auswahl(en) bestehen den bisherigen Marktpreisfilter. Eine unabhängig geprüfte Gewinnwahrscheinlichkeit sowie eine tatsächlich verfügbare DE-Quote sind damit nicht nachgewiesen.":
   "Geprüft wurden nur "+cur+" Ligen mit gültigem Cache. Weitere Ligen sind nicht automatisch untersucht worden; eine gute Wette lässt sich daraus nicht ableiten.";
  headline.append(make("p",line,"muted"));
  result.append(headline);
  const next=make("p",
    green.length?
      "Du bist im richtigen Quoten-Finder. Diese Treffer sind vorläufige Marktbeobachtungen – keine freigegebenen Wetttipps.":
    cur<n?
      "Du bist richtig und die kostenlose Suche hat funktioniert. Derzeit haben nur "+cur+
      " von "+n+" Ligen gültige Quoten. Du musst nichts weiter anklicken. Falls du weitere Ligen untersuchen willst, findest du ganz unten den einklappbaren Bereich „Neue Quotendaten für eine Liga laden“ – Kosten entstehen nur nach deiner ausdrücklichen Bestätigung.":
      "Du bist richtig. Alle gespeicherten Ligen wurden mit aktuell gültigen Daten überprüft. Kein grüner Treffer bedeutet: Kein Angebot erfüllt derzeit den Preisfilter.",
    "simple-next-step");
  result.append(next);
  const observations=Array.isArray(watch?.current_watch)?watch.current_watch:[];
  if(observations.length){
    result.append(make("h3","Die drei besten aktuellen Preisbeobachtungen"));
    result.append(make("p","Reine Marktabstände – keine Wettempfehlungen oder Prognosen.","small muted"));
    const grid=make("div","","simple-observations");
    for(const x of observations.slice(0,3)){
      const tile=make("article","","simple-observation");
      tile.append(make("strong",x.home+" – "+x.away));
      tile.append(make("span",x.league+" · "+timeLabel(x.kickoff),"small muted"));
      tile.append(make("div",x.selection+" · Quote "+de(x.odds)+" · "+x.bookmaker,"small"));
      const p=Number(x.gap_pp);
      tile.append(make("strong",(p>=0?"+":"")+de(p)+" Prozentpunkte","simple-gap"));
      tile.append(make("span","Marktvergleich · DE-Angebot nicht bestätigt","small muted"));
      grid.append(tile);
    }
    result.append(grid);
  }else{
    result.append(make("p",partial?
      "Der zusätzliche Buchmachervergleich war nicht abrufbar; die oben angezeigte kostenlose Cache-Prüfung ist trotzdem gültig.":
      "Keine aktuellen Preisbeobachtungen für eine Rangliste. Zunächst müssen aktuelle Quotendaten vorhanden sein.","small muted"));
  }
  result.append(make("p",
    "Wichtig: Der Grün-Finder besitzt noch kein unabhängig validiertes Prognosemodell. Ein Marktpreisabstand ist kein nachgewiesener Gewinnvorteil. Es wurde keine Wette platziert.",
    "simple-disclaimer"));
 }
 async function checkOnly(opts={}){
   if(!rawToken || busy)return;
   busyState(true);
   status.textContent="Prüfe gespeicherte Quoten – ohne neue Anbieter-Credits …";
   try{
    const scan=await duelCall("green_scan_cached");
    let watch=null,partial=false;
    try{watch=await duelCall("price_watch_cached",{query:{provider:"all"}})}
    catch(_){partial=true}
    render(scan,watch,partial);
    status.textContent=(opts.afterRefresh||"Kostenlose Prüfung abgeschlossen")+
      " · "+scan.current_leagues+" von "+scan.scanned_leagues+
      " Ligen mit aktuellen Daten · 0 neue Anbieter-Abfragen durch diese Prüfung. "+
      (partial?"Buchmachervergleich derzeit nicht verfügbar.":"");
   }catch(e){
    status.textContent="Prüfung nicht abgeschlossen: "+String(e.message||e);
   }finally{busyState(false)}
 }
 async function updateOne(){
   if(!rawToken || busy)return;
   const key=leagueSelect.value;
   const option=leagues.find(x=>x[0]===key);
   if(!option){byId("simpleRefreshStatus").textContent="Bitte zuerst eine Liga auswählen.";return}
   if(latestScan?.leagues?.some(l=>l.sport_key===key&&l.status==="current")){
     byId("simpleRefreshStatus").textContent=option[1]+" hat noch gültige Quotendaten. Kein neuer Anbieterabruf nötig.";
     return;
   }
   const ok=confirm("Neue 1X2-Quoten für "+option[1]+" abrufen?\n"+
     "Das kann kostenpflichtige API-Credits verbrauchen (üblicherweise ein Liga-Abruf). "+
     "Es wird nur diese eine Liga abgefragt. Keine weiteren oder automatischen Abrufe.");
   if(!ok)return;
   busyState(true);
   byId("simpleRefreshStatus").textContent="Rufe neue Quotendaten für "+option[1]+" ab …";
   let detail;
   try{
    detail=SOCCER_KEYS.includes(key)?await soccerRequest(key):await otherOddsRequest(key);
    const calls=Number(detail.provider_requests||0);
    byId("simpleRefreshStatus").textContent=
       option[1]+" · "+calls+" neue Anbieteranfrage(n) gemeldet. Der anschließende Vergleich ist kostenlos.";
   }catch(e){
    byId("simpleRefreshStatus").textContent=
      "Abruf für "+option[1]+" fehlgeschlagen: "+String(e.message||e)+
      ". Es wurde keine weitere Liga versucht.";
   }finally{busyState(false)}
   // Only cached local scan, zero additional provider calls.
   await checkOnly({afterRefresh:"Quotenprüfung nach dem ausgewählten Liga-Abruf abgeschlossen"});
 }
 scanButton.addEventListener("click",()=>checkOnly());
 refreshButton.addEventListener("click",updateOne);
})();
