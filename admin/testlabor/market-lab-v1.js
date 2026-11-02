"use strict";
/* Zero-credit soccer market research only: no real DC/DNB offers and no green authorizations */
(()=>{
 const $=id=>document.getElementById(id);
 const txt=(tag,content,cls)=>{const e=document.createElement(tag);e.textContent=String(content??"");if(cls)e.className=cls;return e};
 const fmt=n=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});

 // A display-only signal: no real DC/DNB quote = no price-ampel.
 // Independent probabilities and verified prices are required for color status.
 function marketSignal(match,m){
   const price=Number(m.real_market_odds);
   const p=Number(m.model_probability_pct);
   if(match.cache_status!=="current")return {light:"gray",label:"Nicht bewertbar",reason:"1X2-Daten historisch/abgelaufen."};
   if(m.quote_verified!==true || m.real_market_odds==null || !Number.isFinite(price) || price<=1)
     return {light:"gray",label:"Nicht bewertbar",reason:"Keine aktuelle geprüfte Buchmacherquote für genau diesen Markt."};
   if(m.independent_probability_available!==true || !Number.isFinite(p) || p<=0||p>=100)
     return {light:"gray",label:"Nicht bewertbar",reason:"Unabhängige Wahrscheinlichkeit ist nicht validiert."};
   const delta=p-100/price;
   if(price<1.4||price>2.5)return {light:"red",label:"Nicht geeignet",reason:"Quote außerhalb des bisherigen Bereichs 1,40–2,50."};
   if(delta>=5)return {light:"green",label:"Preisregel erfüllt – nur Test",reason:"Berechneter Abstand +"+fmt(delta)+" Pp.; keine automatische Tippfreigabe."};
   if(delta>=0)return {light:"yellow",label:"Kein ausreichender Vorteil",reason:"Preisabstand "+fmt(delta)+" Pp.; erforderlich sind +5,00 Pp."};
   return {light:"red",label:"Zu geringer Quotenpreis",reason:"Preisabstand "+fmt(delta)+" Pp. unter der Gewinnschwelle."};
 }
 function renderAmpel(match,m){
   const signal=marketSignal(match,m);
   const panel=txt("div","","market-ampel market-ampel-"+signal.light);
   panel.setAttribute("role","status");
   const bulbs=txt("div","","market-ampel-bulbs");
   for(const [name,label] of [["red","Rot"],["yellow","Gelb"],["green","Grün"],["gray","Grau"]]){
      const dot=txt("span","", "market-ampel-dot market-ampel-dot-"+name+(signal.light===name?" active":""));
      dot.setAttribute("aria-hidden","true");dot.title=label;
      bulbs.append(dot);
   }
   const detail=txt("div","","market-ampel-copy");
   detail.append(txt("strong","Ampel: "+signal.label));
   detail.append(txt("div",signal.reason,"small muted"));
   panel.append(bulbs,detail);
   return panel;
 }

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
       r.append(renderAmpel(match,m));
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
   const numberOfOptions=rows.slice(0,shown).reduce((sum,match)=>
     sum+(match.markets||[]).filter(m=>type==="all"||m.market_type===type).length,0);
   $("marketLabStatus").textContent="Angezeigt: "+shown+(shown===1?" Begegnung mit ":" Begegnungen mit ")+
     numberOfOptions+" Marktampeln · 0 grüne Freigaben · "+
     "0 neue API-Credits. Ohne echte DNB-/Doppelte-Chance-Quote bleibt die Ampel grau.";
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