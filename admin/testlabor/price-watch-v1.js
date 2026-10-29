"use strict";
/* BetInsight price-watch v1: READ-ONLY cached, price deviations are never betting advice */
(()=>{
 const $=id=>document.getElementById(id);
 const format=n=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
 const elt=(name,content,className)=>{const x=document.createElement(name);x.textContent=String(content??"");if(className)x.className=className;return x};
 const names={winamax:"Winamax (DE)",tipico:"Tipico", "888sport":"888sport",other:"Weitere Buchmacher"};
 const badge=(text,ok)=>{
  const x=elt("span",text,"tag");
  if(!ok){x.style.borderColor="#c5a367";x.style.color="#ffe2a2"}
  return x;
 };
 function itemCard(v, historical){
  const el=elt("article","","match");
  el.append(badge(historical?"Nur historische Beobachtung":"Aktuelle Cache-Beobachtung",!historical));
  const name=elt("h3",v.home+" – "+v.away);
  el.append(name);
  el.append(elt("div",v.league+" · "+timeLabel(v.kickoff),"small muted"));
  el.append(elt("div","Auswahl: "+v.selection+" · Quote "+format(v.odds)+" · "+v.bookmaker));
  const gap=Number(v.gap_pp);
  const score=elt("p",(gap>=0?"+":"")+format(gap)+" Prozentpunkte gegenüber Gewinnschwelle","price-watch-gap");
  score.style.fontWeight="850";score.style.fontSize="18px";
  score.style.color=gap>=0?"#ffe0a2":"#ffb7aa";
  el.append(score);
  el.append(elt("div","Marktwert: "+format(v.market_probability)+" % · Gewinnschwelle: "+
   format(v.break_even)+" % · Referenzangebote: "+v.reference_books,"small muted"));
  el.append(elt("div","Anbieterkennung: "+(v.bookmaker_key||"im alten Snapshot nicht enthalten")+
   " · "+v.label,"small muted"));
  el.append(elt("div","Zeitpunkt: "+timeLabel(v.fetched_at)+
    (historical?" · Historisch/abgelaufen; keine aktuelle Freigabe":" · Cache gültig bis "+timeLabel(v.expires_at)),
    "small muted"));
  if(v.meets_price_threshold)el.append(elt("p","Nur Marktbeobachtung: +5-Pp.-Schwelle erreicht, aber KEINE grüne Freigabe: Anbieterzuordnung, Konto-Quote und unabhängige Prognose nicht nachgewiesen.","small muted"));
  return el;
 }
 function render(d){
  const stat=$("priceWatchStatus"),summary=$("priceWatchOverview"),current=$("priceWatchCurrent"),
   historical=$("priceWatchHistorical"),groups=$("priceWatchGroups");
  current.replaceChildren();historical.replaceChildren();groups.replaceChildren();
  const now=Array.isArray(d.current_watch)?d.current_watch:[];
  const old=Array.isArray(d.historical_watch)?d.historical_watch:[];
  summary.textContent=
    d.current_leagues+" Ligen mit gültigen Daten · "+d.current_observations+
    " aktuelle vergleichbare Quoten · "+d.historical_observations+
    " historische Quoten · 0 neue Anbieterabrufe. "+
    "Nur Marktpreisvergleich; keine unabhängige Spielprognose.";
  for(const v of now)current.append(itemCard(v,false));
  if(!now.length)current.append(elt("div","Zurzeit keine passende aktuelle Quote im gewählten Anbieterfilter. "+
     "Fehlende bzw. abgelaufene Daten zählen nicht als Marktanalyse.","info"));
  for(const v of old)historical.append(itemCard(v,true));
  if(!old.length)historical.append(elt("div","Keine gespeicherten historischen Preisbeobachtungen für diese Auswahl.","info"));
  for(const g of (d.groups||[])){
   if(g.group==="other" && d.provider!=="all" && d.provider!=="other")continue;
   const p=elt("div",(names[g.group]||g.group)+": "+g.current+
     " aktuelle / "+g.observations+" gespeicherte Beobachtungen"+
     (g.best_gap_pp===null?"":" · bester gespeicherter Abstand "+(g.best_gap_pp>=0?"+":"")+format(g.best_gap_pp)+" Pp."),"green-league-row");
   groups.append(p);
  }
  stat.textContent="Preisvergleich fertig · "+timeLabel(d.generated_at)+
    " · Anbieter: "+(names[d.provider]||"Alle")+" · 0 neue Quoten-Credits.";
 }
 async function compare(){
  if(!rawToken)return;
  const b=$("priceWatchRun");b.disabled=true;
  $("priceWatchStatus").textContent="Gespeicherte Quoten werden verglichen (0 zusätzliche Anbieterabfragen) …";
  try{
   const d=await duelCall("price_watch_cached",{query:{provider:$("priceWatchProvider").value}});
   render(d);
  }catch(e){$("priceWatchStatus").textContent="Preisvergleich nicht abgeschlossen: "+String(e.message||e)}
  finally{b.disabled=false}
 }
 $("priceWatchRun").addEventListener("click",compare);
})();
