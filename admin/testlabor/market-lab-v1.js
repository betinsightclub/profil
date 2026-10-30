"use strict";
/* Zero-credit soccer market research only: no real DC/DNB offers and no green authorizations */
(()=>{
 const $=id=>document.getElementById(id);
 const txt=(tag,content,cls)=>{const e=document.createElement(tag);e.textContent=String(content??"");if(cls)e.className=cls;return e};
 const fmt=n=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
 let data=null;
 const update=()=>{
   if(!data)return;
   const area=$("marketLabResults");area.replaceChildren();
   const type=$("marketLabType").value,filter=$("marketLabLeague").value;
   const rows=(data.examples||[]).filter(x=>filter==="all"||x.sport_key===filter);
   let shown=0;
   for(const match of rows){
     const marketOptions=(match.markets||[]).filter(m=>
       type==="all" || m.market_type===type);
     if(!marketOptions.length)continue;
     const card=txt("article","","match");
     card.append(txt("span",match.cache_status==="current"?
       "Marktvergleich aus gültigem 1X2-Cache":"HISTORISCHE QUOTEN · kein aktueller Tipp","tag"));
     card.append(txt("h3",match.home+" – "+match.away));
     card.append(txt("div",match.league+" · "+timeLabel(match.kickoff)+" · "+
       match.bookmaker_count+" 1X2-Buchmacher","small muted"));
     card.append(txt("p","Markt-Schätzung: Heimsieg "+fmt(match.home_pct)+" % · Remis "+
       fmt(match.draw_pct)+" % · Auswärtssieg "+fmt(match.away_pct)+" %","small muted"));
     for(const m of marketOptions){
       const r=txt("div","","green-league-row");
       r.append(txt("strong",m.name));
       r.append(txt("div","Theoretisch faire Quote "+fmt(m.fair_odds)+
          " · Mindestquote für +5 Prozentpunkte: "+
          (m.needed_odds_for_plus5pp===null?"nicht berechenbar":fmt(m.needed_odds_for_plus5pp)),"small"));
       r.append(txt("div",m.market_type==="draw_no_bet"?
         "DNB: Remis = Einsatz zurück. +5 Pp. beziehen sich auf die bedingte Gewinnwahrscheinlichkeit ohne Remis.":
         "Doppelte Chance: keine Einsatzrückzahlung, sondern zwei gewinnende Spielausgänge.","small muted"));
       r.append(txt("div","Tatsächliche Buchmacherquote: NICHT vorhanden · "+
         "Keine grüne Freigabe möglich.","small muted"));
       card.append(r);
     }
     card.append(txt("p","Quotenstand: "+timeLabel(match.fetched_at)+
       " · Ausschließlich theoretische Zielpreise, keine verifizierten Marktangebote.","small muted"));
     area.append(card);shown++;
     if(shown>=20)break;
   }
   if(!shown)area.append(txt("div","Keine passenden Fußballbegegnungen in den gespeicherten Daten. "+
     "Es wurden keine weiteren API-Credits verbraucht.","info"));
   $("marketLabStatus").textContent="Angezeigt: "+shown+" Begegnungen · "+
     data.sample_games+" auswertbare Spiele aus 1X2-Snapshots insgesamt · 0 neue API-Credits. "+
     "Grüne Freigaben: 0 (es liegen keine tatsächlichen DNB-/DC-Angebote vor).";
 };
 const run=async()=>{
   if(!rawToken)return;
   const b=$("marketLabRun");b.disabled=true;
   $("marketLabStatus").textContent="Berechne theoretische Quoten aus vorhandenen 1X2-Daten …";
   try{
      data=await duelCall("market_lab_cached");
      const options=$("marketLabLeague");
      if(options.options.length===1)for(const league of data.leagues||[]){
        const opt=document.createElement("option");opt.value=league.sport_key;
        opt.textContent=league.league;
        options.append(opt);
      }
      update();
   }catch(e){$("marketLabStatus").textContent="Marktvergleich fehlgeschlagen: "+String(e.message||e)}
   finally{b.disabled=false}
 };
 $("marketLabRun").addEventListener("click",run);
 $("marketLabType").addEventListener("change",update);
 $("marketLabLeague").addEventListener("change",update);
})();