"use strict";
/* BetInsight 12-Ligen Grün-Finder. Nur Master-Sitzung, kostenfrei aus Supabase-Cache.
   Optionale Neuanfragen: ausdrückliche Bestätigung, maximal drei Ligen pro Klick. */
(()=>{
  const el=id=>document.getElementById(id);
  const priorities=[
    "basketball_nba","basketball_euroleague","icehockey_nhl","americanfootball_nfl",
    "soccer_italy_serie_a","soccer_france_ligue_one","soccer_portugal_primeira_liga",
    "soccer_netherlands_eredivisie","basketball_wnba","baseball_mlb","baseball_kbo","baseball_npb"
  ];
  const german=(n,d=2)=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d});
  const add=(tag,value,cls="")=>{const x=document.createElement(tag);x.textContent=String(value??"");if(cls)x.className=cls;return x};
  let report=null;
  function render(d){
    const result=el("greenFinderResults"),overview=el("greenFinderSummary"),leagueList=el("greenFinderLeagues");
    result.replaceChildren();leagueList.replaceChildren();
    const greens=Array.isArray(d.green_candidates)?d.green_candidates:[];
    overview.textContent=d.scanned_leagues+" Ligen unterstützt · "+d.snapshot_leagues+
      " mit Quoten-Snapshot · "+d.current_leagues+" noch gültig · "+d.current_games+
      " kommende Spiele im gültigen Cache · "+greens.length+" gültige grüne Auswahlen. "+
      (d.current_leagues<d.scanned_leagues?"Nicht alle Ligen sind aktuell geprüft. ":"")+
      "0 neue Anbieter-Credits verbraucht.";
    if(!greens.length){
      const none=add("div","Keine aktuelle grüne Preisampel in den "+d.current_leagues+
        " Ligen mit gültigen Cache-Daten gefunden. Fehlende oder abgelaufene Ligen gelten ausdrücklich NICHT als erfolglos geprüft. "+
        "Für neue Quoten ist eine gesondert bestätigte Abfrage nötig.","info");
      none.style.gridColumn="1/-1";result.append(none);
    }
    for(const g of greens){
      const card=add("article","","match");
      card.append(add("span","🟢 Grün nach strengem Marktfilter · virtueller Test","tag good"));
      card.append(add("h3",g.home+" – "+g.away));
      card.append(add("p",g.league+" · "+timeLabel(g.kickoff),"muted"));
      card.append(add("p",g.selection+" · Quote "+german(g.odds)+" · "+g.bookmaker));
      card.append(add("p","Rechnerischer Marktabstand +"+german(g.gap_pp)+
        " Prozentpunkte · Marktbasierte Wahrscheinlichkeit "+german(g.market_probability)+" %","small"));
      card.append(add("p","Abruf: "+timeLabel(g.fetched_at)+" · Angebot für ein konkretes DE-Konto nicht verifiziert.","small muted"));
      const b=add("button","Ligadetails ohne Anbieterabruf ansehen","secondary");
      b.type="button";
      b.addEventListener("click",async()=>{
        const key=g.sport_key;
        if(SOCCER_KEYS.includes(key)){
          el("soccerLeague").value=key;
          el("soccerPanel").scrollIntoView({behavior:"smooth",block:"start"});
          await showScout(key,"Aus gültigem Cache, 0 neue Anbieter-Credits");
        }else{
          el("otherOddsLeague").value=key;
          el("additionalOddsScout").scrollIntoView({behavior:"smooth",block:"start"});
          try{await showOtherOdds(key,"Aus gültigem Cache, 0 neue Anbieter-Credits")}
          catch(e){el("otherOddsStatus").textContent="Cache inzwischen abgelaufen: "+String(e.message||e)}
        }
      });
      card.append(b);result.append(card);
    }
    for(const l of d.leagues||[]){
      const row=add("div","","green-league-row");
      row.append(add("strong",l.league+" · "+(l.status==="current"?"🟢 Daten gültig":l.status==="expired"?"🟠 Daten abgelaufen":"⚪ Nicht geladen")));
      row.append(add("div",l.future_games+" kommende Spiele im Snapshot · "+
        l.green_in_snapshot+" grün im Snapshot"+
        (l.status==="current"?"":" (nicht aktuell)")+
        (l.best_gap_pp==null?"":" · bester Abstand "+german(l.best_gap_pp)+" Pp."),"small muted"));
      if(l.fetched_at)row.append(add("div","Quotenstand "+timeLabel(l.fetched_at)+" · gültig bis "+timeLabel(l.expires_at),"small muted"));
      leagueList.append(row);
    }
  }
  async function search(){
    if(!rawToken)return null;
    const button=el("greenScanCached");button.disabled=true;
    el("greenFinderStatus").textContent="Suche alle 12 Ligen im vorhandenen Cache · 0 API-Credits …";
    try{
      const d=await duelCall("green_scan_cached");
      report=d;render(d);
      el("greenFinderStatus").textContent="Fertig: "+d.green_count+
        " grüne Auswahlen, "+d.current_leagues+" Ligen mit gültigen Quoten, 0 neue Anbieter-Credits. "+
        "Prüfzeitpunkt: "+timeLabel(d.generated_at)+".";
      return d;
    }catch(e){
      el("greenFinderStatus").textContent="Cache-Suche fehlgeschlagen: "+String(e.message||e);
      return null;
    }finally{button.disabled=false}
  }
  async function refresh(){
    if(!rawToken)return;
    if(!report)await search();
    if(!report)return;
    const cap=Math.min(3,Math.max(1,Number(el("greenRefreshLimit").value)||1));
    const keys=priorities.filter(key=>report.leagues.some(l=>l.sport_key===key&&l.status!=="current")).slice(0,cap);
    if(!keys.length){
      el("greenFinderStatus").textContent="Alle 12 Ligen haben einen gültigen Cache. Kein kostenpflichtiger Abruf notwendig.";
      return;
    }
    const names=keys.map(k=>report.leagues.find(l=>l.sport_key===k)?.league||k);
    if(!confirm("Neue Quoten können API-Credits verbrauchen. Nur diese "+keys.length+" Liga(n) neu abrufen?\n\n"+
      names.join("\n")+"\n\nMaximal "+keys.length+" neue Liga-Abfragen. Kein automatischer Folgeabruf."))return;
    const b=el("greenRefresh"),scan=el("greenScanCached");b.disabled=true;scan.disabled=true;
    let reportedCalls=0;const failed=[];
    try{
      for(let i=0;i<keys.length;i++){
        const key=keys[i];
        el("greenFinderStatus").textContent="Aktualisierung "+(i+1)+"/"+keys.length+": "+names[i]+
          " · gemeldete Anbieterabrufe: "+reportedCalls;
        try{
          const out=SOCCER_KEYS.includes(key)?await soccerRequest(key):await otherOddsRequest(key);
          reportedCalls+=Number(out.provider_requests||0);
        }catch(e){failed.push(names[i]+": "+String(e.message||e))}
      }
    }finally{b.disabled=false;scan.disabled=false}
    const d=await search();
    if(d)el("greenFinderStatus").textContent="Aktualisiert: "+keys.length+" Liga-Abfrage(n), "+
      reportedCalls+" gemeldete neue Anbieterabrufe · "+d.green_count+" aktuelle grüne Auswahl(en)."+
      (failed.length?" Nicht verfügbar: "+failed.join("; ").slice(0,180):"");
  }
  el("greenScanCached").addEventListener("click",search);
  el("greenRefresh").addEventListener("click",refresh);
})();