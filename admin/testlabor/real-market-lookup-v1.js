"use strict";
/* BetInsight master-only, explicitly approved single-game DNB / DC market feed. */
(()=>{
 const $=id=>document.getElementById(id);
 const t=(tag,value,css="")=>{const a=document.createElement(tag);a.textContent=String(value??"");if(css)a.className=css;return a};
 const fmt=n=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
 const leagueKeys=["soccer_italy_serie_a","soccer_france_ligue_one","soccer_netherlands_eredivisie","soccer_portugal_primeira_liga"];
 let snapshot=null,fixtures=[];
 function show(msg){$("realMarketStatus").textContent=msg}
 function listGames(){
  const select=$("realMarketGame"),prev=select.value;
  select.replaceChildren();
  const eligible=(snapshot?.examples||[]).filter(x=>x.cache_status==="current"&&
      leagueKeys.includes(x.sport_key)&&x.game_id&&Date.parse(x.kickoff)>Date.now()+600000);
  fixtures=eligible;
  if(!eligible.length){
   const o=document.createElement("option");o.textContent="Keine aktuelle Fußballliga geladen";o.value="";select.add(o);
   $("realMarketRequest").disabled=true;
   $("realMarketHints").textContent="Für echte Marktangebote muss zuerst eine der vier Fußballligen aktualisiert werden. Nur gültige 1X2-Quoten erlauben eine Einzelspiel-Abfrage.";
  }else{
   for(const g of eligible){
    const o=document.createElement("option");o.value=g.sport_key+"|"+g.game_id;
    o.textContent=g.league+" · "+g.home+" – "+g.away+" · "+timeLabel(g.kickoff);select.add(o);
   }
   if([...select.options].some(o=>o.value===prev))select.value=prev;
   $("realMarketRequest").disabled=false;
   $("realMarketHints").textContent=eligible.length+" aktuelle Spiele wählbar. Bei Auswahl eines Zusatzmarkts wird der Quotenpreis einzeln abgefragt und nicht das gesamte Ligaangebot erneut bezahlt.";
  }
  return eligible.length;
 }
 async function load(){
  if(!rawToken)return;
  const b=$("realMarketLoad");b.disabled=true;
  show("Prüfe vorhandene 1X2-Quoten, ohne Credits zu verbrauchen …");
  try{snapshot=await duelCall("market_lab_cached");const n=listGames();show(n?
     n+" gültige Fußballbegegnungen für die Einzelmarkt-Prüfung gefunden. Noch keine neuen Anbieterabrufe.":
     "0 aktuelle Fußballspiele verfügbar. Zuerst eine Liga aktualisieren; der alte historische Marktvergleich bleibt kostenfrei.");}
  catch(e){show("Aktuelle Spiele konnten nicht geladen werden: "+String(e.message||e))}
  finally{b.disabled=false}
 }
 async function updateLeague(){
  if(!rawToken)return;
  const key=$("realMarketLeague").value;
  const name=$("realMarketLeague").selectedOptions?.[0]?.textContent||key;
  if(!leagueKeys.includes(key))return;
  if(!confirm("Für "+name+" einen neuen 1X2-Ligaabruf erlauben?\nNur bei abgelaufenem Cache wird eine neue Quotenanfrage benötigt (normalerweise 1 Credit).\nKein automatischer Zusatzmarkt-Abruf."))return;
  const b=$("realMarketRefresh");b.disabled=true;
  show("Aktualisiere "+name+" und prüfe anschließend aktuelle Spiele …");
  try{
   const d=await soccerRequest(key);
   const cost=Number(d.provider_requests||0);
   await load();
   show("Liga: "+name+" · "+cost+" neu gemeldete API-Anfrage(n). "+
     fixtures.filter(x=>x.sport_key===key).length+" gültige auswählbare Spiele. "+
     "Noch keine echten DNB-/Doppelte-Chance-Quoten abgefragt.");
  }catch(e){show("Ligaabruf nicht erfolgreich: "+String(e.message||e))}
  finally{b.disabled=false}
 }
 function renderOffer(d,g,key){
  const result=$("realMarketResults");result.replaceChildren();
  const title=t("h3",g.home+" – "+g.away+" · "+(key==="draw_no_bet"?"Draw No Bet":"Doppelte Chance"));
  result.append(title);
  result.append(t("div","Quelle: "+(d.source||"The Odds API")+
   " · "+d.bookmaker_count+" Buchmacher mit interpretierbaren Marktquoten · Stand: "+
   timeLabel(d.checked_at),"small muted"));
  result.append(t("div","DE-Kontoquote: nicht bestätigt · unabhängig validierte Gewinnwahrscheinlichkeit: fehlt · "+
   "keine grüne Freigabe.","market-quote-warning"));
  const labels={HOME:"Heimsieg – Remis Geld zurück",AWAY:"Auswärtssieg – Remis Geld zurück",
   "1X":"Doppelte Chance 1X","X2":"Doppelte Chance X2","12":"Doppelte Chance 12"};
  const map={HOME:"DNB_HOME",AWAY:"DNB_AWAY","1X":"DC_1X","X2":"DC_X2","12":"DC_12"};
  const groups=new Map();
  for(const offer of d.offerings||[])for(const option of offer.choices||[]){
    if(!labels[option.code])continue;
    if(!groups.has(option.code))groups.set(option.code,[]);
    groups.get(option.code).push({...option,bookmaker:offer.bookmaker,bookmaker_key:offer.bookmaker_key,
      updated_at:offer.market_updated});
  }
  const codes=key==="draw_no_bet"?["HOME","AWAY"]:["1X","X2","12"];
  for(const code of codes){
   const options=(groups.get(code)||[]).sort((a,b)=>b.odds-a.odds);
   const wrap=t("div","","green-league-row");
   wrap.append(t("strong",labels[code]));
   if(!options.length){wrap.append(t("div","Kein Angebot für diese Auswahl.","small muted"));result.append(wrap);continue}
   const model=(g.markets||[]).find(x=>x.code===map[code]);
   const best=options[0];
   wrap.append(t("div","Bestes gespeichertes API-Angebot: "+fmt(best.odds)+" bei "+best.bookmaker+
     " · Anbieterkennung: "+best.bookmaker_key,"small"));
   wrap.append(t("div","Marktbasierte theoretische Mindestquote: "+
     (model?.needed_odds_for_plus5pp!=null?fmt(model.needed_odds_for_plus5pp):"nicht berechenbar")+
     " · Keine unabhängige Modellfreigabe.","small muted"));
   wrap.append(t("div",options.length+" Buchmacherangebote · Angebotszeitpunkt: "+
     (best.updated_at?timeLabel(best.updated_at):"nicht angegeben"),"small muted"));
   if(model?.needed_odds_for_plus5pp!=null){
      wrap.append(t("div",Number(best.odds)>=Number(model.needed_odds_for_plus5pp)?
        "Theoretischer Zielpreis erreicht – trotzdem KEIN Grün ohne geprüftes Modell und DE-Quote.":
        "Theoretischer Zielpreis nicht erreicht – KEIN Grün.","small muted"));
   }
   result.append(wrap);
  }
 }
 async function fetchMarket(){
  const id=$("realMarketGame").value,key=$("realMarketType").value;
  const g=fixtures.find(x=>x.sport_key+"|"+x.game_id===id);
  if(!g||!["draw_no_bet","double_chance"].includes(key)){show("Bitte ein gültiges aktuelles Spiel und einen Markt wählen.");return}
  if(!confirm("Echte "+(key==="draw_no_bet"?"Draw-No-Bet":"Doppelte-Chance")+
    "-Angebote für "+g.home+" – "+g.away+" abrufen?\n"+
    "Eine neue Einzelspiel-/Markt-Anfrage kann 1 API-Credit kosten (EU, 1 Markt). "+
    "Anfragen werden pro Tag begrenzt. Keine automatische Folgeabfrage."))return;
  const b=$("realMarketRequest");b.disabled=true;
  show("Frage genau einen Markt für "+g.home+" – "+g.away+" ab …");
  try{
    const r=await fetch(WORKSHOP_API,{method:"POST",headers:{"content-type":"application/json"},
      credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(28000),
      body:JSON.stringify({action:"market_quote",session_hash:await hash(rawToken),
        fixture:{sport_key:g.sport_key,game_id:g.game_id,home:g.home,away:g.away,kickoff:g.kickoff,market_key:key}})});
    const d=await r.json();
    if(!r.ok||d.ok!==true)throw Error(String(d.error||"MARKET_REQUEST_FAILED"));
    const requests=Number(d.provider_requests||0),credit=d.credit_last;
    if(d.found){
      renderOffer(d,g,key);
      show("Ergebnis gespeichert · "+requests+" neue Anbieteranfrage(n) · tatsächlich gemeldete API-Credits: "+
        (credit==null?"nicht gemeldet":credit)+
        ". Die echte Quote ist da; die unabhängige Prognoseprüfung fehlt weiterhin.");
    }else{
      $("realMarketResults").replaceChildren(t("div","Keine echte Marktquote verfügbar: "+
        String(d.error||"Kein passendes Angebot")+
        ". Das heißt nicht, dass das Spiel schlecht ist. Keine Ampel freigegeben.","info"));
      show("Keine angebotene Marktquote gefunden · "+requests+
        " Anbieteranfrage(n) · Credits laut Anbieter: "+(credit==null?"nicht gemeldet":credit)+".");
    }
  }catch(e){show("Einzelmarkt-Abfrage fehlgeschlagen: "+String(e.message||e))}
  finally{b.disabled=false}
 }
 $("realMarketLoad").addEventListener("click",load);
 $("realMarketRefresh").addEventListener("click",updateLeague);
 $("realMarketRequest").addEventListener("click",fetchMarket);
})();
