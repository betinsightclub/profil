/* BetInsight Stadionwelt: personal, read-only stadium journey.
   Uses existing visit records. Does not modify Supabase or the trainer wallet. */
(function(){
"use strict";
let cfg=null,active=false,playing=false,index=-1,timer=null,globeConfigured=null;
const langText={
de:["Meine Stadionreise","Besuchte Stadien in zeitlicher Reihenfolge. Wähle einen Halt oder spiele deine Reise ab.","Reise abspielen","Pause","Von vorn","Zurück","Weiter","Station","von","Mindestens zwei besuchte Stadien sind für eine Reise nötig.","Auf Karte zeigen","Datum unbekannt"],
en:["My stadium journey","Visited stadiums by visit date. Choose a stop or play your journey.","Play journey","Pause","Start over","Previous","Next","Stop","of","At least two visited stadiums are needed.","Show on map","Date unknown"],
es:["Mi viaje por estadios","Estadios visitados en orden cronológico. Elige una parada o reproduce el viaje.","Reproducir viaje","Pausa","Reiniciar","Anterior","Siguiente","Parada","de","Se necesitan dos estadios visitados.","Ver en mapa","Fecha desconocida"],
pt:["Minha viagem pelos estádios","Estádios visitados em ordem cronológica. Escolha uma parada ou reproduza a viagem.","Reproduzir viagem","Pausar","Reiniciar","Anterior","Próximo","Parada","de","São necessários dois estádios visitados.","Ver no mapa","Data desconhecida"],
it:["Il mio viaggio negli stadi","Stadi visitati per data. Scegli una tappa o riproduci il viaggio.","Riproduci viaggio","Pausa","Ricomincia","Indietro","Avanti","Tappa","di","Servono almeno due stadi visitati.","Mostra sulla mappa","Data sconosciuta"],
fr:["Mon voyage des stades","Stades visités par date. Choisissez une étape ou lancez le voyage.","Lancer le voyage","Pause","Recommencer","Précédent","Suivant","Étape","sur","Il faut au moins deux stades visités.","Voir sur la carte","Date inconnue"],
nl:["Mijn stadionreis","Bezochte stadions op datum. Kies een stop of speel de reis af.","Reis afspelen","Pauze","Opnieuw","Vorige","Volgende","Stop","van","Minstens twee bezochte stadions nodig.","Op kaart tonen","Datum onbekend"],
zh:["我的球場旅程","依到訪日期排列球場。選擇站點或播放旅程。","播放旅程","暫停","從頭開始","上一站","下一站","站","／","至少需要兩個到訪球場。","在地圖上查看","日期未知"]
};
function msg(i){return (langText[cfg?.lang?.()]||langText.en)[i]}
function safe(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function valid(s){const a=Number(s?.latitude),b=Number(s?.longitude);return !!s&&Number.isFinite(a)&&Number.isFinite(b)&&a>=-90&&a<=90&&b>=-180&&b<=180}
function ordered(){
 if(!cfg)return [];
 const stadiums=cfg.stadiums(),lookup=new Map(stadiums.map(s=>[Number(s.id),s]));
 return cfg.visits().map((visit,ordinal)=>({visit,stadium:lookup.get(Number(visit.stadium_id)),ordinal}))
 .sort((a,b)=>String(a.visit.visited_on||"9999").localeCompare(String(b.visit.visited_on||"9999"))||a.ordinal-b.ordinal);
}
function entries(){return ordered().filter(x=>valid(x.stadium))}
function stopIndex(visit){return entries().findIndex(x=>String(x.visit.id)===String(visit.id))}
function legs(){
 if(!active)return [];
 const stops=entries(),out=[];
 for(let i=1;i<stops.length;i++){
  const a=stops[i-1].stadium,b=stops[i].stadium;
  if(Number(a.latitude)===Number(b.latitude)&&Number(a.longitude)===Number(b.longitude))continue;
  out.push({startLat:Number(a.latitude),startLng:Number(a.longitude),endLat:Number(b.latitude),endLng:Number(b.longitude),completed:i<=index});
 }
 return out;
}
function geo(){
 return {type:"FeatureCollection",features:legs().map(leg=>({
  type:"Feature",properties:{completed:leg.completed?1:0},geometry:{
   type:"LineString",coordinates:[[leg.startLng,leg.startLat],[leg.endLng,leg.endLat]]
  }
 }))};
}
function refresh(){
 if(!cfg)return;
 const globe=cfg.globe(),streetMap=cfg.streetMap();
 if(globe&&typeof globe.arcsData==="function"){
  try{
   if(globeConfigured!==globe){
    globe.arcStartLat("startLat").arcStartLng("startLng").arcEndLat("endLat").arcEndLng("endLng")
     .arcColor(d=>d.completed?"#4cf6db":"rgba(147,219,224,0.28)")
     .arcAltitudeAutoScale(.20).arcStroke(.65)
     .arcDashLength(.57).arcDashGap(.27).arcDashAnimateTime(2000).arcsTransitionDuration(400);
    globeConfigured=globe;
   }
   globe.arcsData(legs());
  }catch(e){console.info("Stadionreise: 3D route unavailable",e)}
 }
 try{streetMap?.getSource("stadium-journey")?.setData(geo())}catch(e){console.info("Stadionreise: map route unavailable",e)}
 if(cfg.leaflet()?.active())cfg.leaflet().update(cfg.leafletConfig());
 const panel=document.getElementById("journeyOverlay"),stops=entries(),current=stops[index];
 if(panel){
  const show=active&&!!current&&cfg.passportVisible();
  panel.classList.toggle("hide",!show);
  panel.replaceChildren();
  if(show){
   const put=(tag,value,cl)=>{const el=document.createElement(tag);el.textContent=value;if(cl)el.className=cl;panel.appendChild(el)};
   put("span",msg(0)+" · "+msg(7)+" "+(index+1)+" "+msg(8)+" "+stops.length,"journey-step");
   put("strong",current.stadium.name);
   put("span",[current.stadium.city,current.stadium.country].filter(Boolean).join(" · "));
  }
 }
}
function pause(render=true){if(timer!==null)clearTimeout(timer);timer=null;playing=false;if(render)cfg?.renderPassport()}
function goto(i){
 const stops=entries();if(i<0||i>=stops.length)return;
 active=true;index=i;
 cfg.select(stops[i].stadium.id,true,true);
 refresh();
}
function next(){pause(false);if(!active)goto(0);else goto(Math.min(index+1,entries().length-1))}
function prev(){pause(false);goto(Math.max(0,index-1))}
function tick(){
 if(!playing)return;
 timer=setTimeout(()=>{
  if(!playing)return;
  if(index>=entries().length-1){pause();return}
  goto(index+1);tick();
 },Math.max(7400,(Number(cfg.rotationDuration?.())||4000)+(cfg?.isGlobe?.()?4500:1600)));
}
function onRotationDurationChanged(){
 // If the viewer changes the duration mid-tour, allow the current camera move to finish.
 if(playing){if(timer!==null)clearTimeout(timer);timer=null;tick()}
}
function play(){
 const stops=entries();
 if(stops.length<2){if(stops.length===1)goto(0);cfg.toast(msg(9));return}
 pause(false);
 if(!active||index>=stops.length-1)goto(0);
 playing=true;cfg.renderPassport();tick();
}
function reset(){pause(false);if(entries().length)goto(0)}
function stop(){pause(false);active=false;index=-1;refresh()}
function panelHTML(){
 const stops=entries(),num=stops.length;
 const progress=active&&index>=0?msg(7)+" "+(index+1)+" "+msg(8)+" "+num:num+" "+cfg.stadiaLabel();
 return "<section class='passport-journey' aria-label='"+safe(msg(0))+"'>"+
  "<h4>🌍 "+safe(msg(0))+"</h4><p>"+safe(msg(1))+"</p>"+
  "<span class='passport-journey-progress'>"+safe(progress)+"</span>"+
  (num<2?"<p>"+safe(msg(9))+"</p>":"")+
  "<div class='passport-journey-buttons'>"+
  "<button type='button' class='btn primary' id='journeyPlay' "+(num<2?"disabled":"")+">"+safe(playing?msg(3):msg(2))+"</button>"+
  "<button type='button' class='btn' id='journeyRestart' "+(!num?"disabled":"")+">↺ "+safe(msg(4))+"</button>"+
  "<button type='button' class='btn' id='journeyPrev' "+(!active||index<=0?"disabled":"")+">← "+safe(msg(5))+"</button>"+
  "<button type='button' class='btn' id='journeyNext' "+(!active||index>=num-1||num<2?"disabled":"")+">"+safe(msg(6))+" →</button>"+
  "</div></section>";
}
function visitButtonHTML(visit){
 const e=ordered().find(x=>String(x.visit.id)===String(visit.id));
 if(!e)return "";
 const idx=stopIndex(visit),isHere=active&&index===idx&&idx>=0;
 return "<button class='passport-stop-button' type='button' data-journey-stop='"+idx+"' "+
 (idx<0?"disabled":"")+
 " aria-label='"+safe(msg(10)+": "+(e.stadium?.name||"Stadium"))+"'>"+
 "<span class='passport-stop-number'>"+(idx>=0?idx+1:"–")+"</span>"+
 "<span class='passport-stop-info'><span class='passport-stop-name'>"+safe(e.stadium?.name||"Stadium")+"</span>"+
 "<span class='passport-stop-meta'>"+safe([e.stadium?.city,e.stadium?.country].filter(Boolean).join(" · "))+
 " · "+safe(visit.visited_on||msg(11))+"</span></span>"+
 "<span class='passport-stop-arrow'>"+(isHere?"●":"⌖")+"</span></button>";
}
function bind(){
 const playBtn=document.getElementById("journeyPlay");
 playBtn?.addEventListener("click",()=>playing?pause():play());
 document.getElementById("journeyRestart")?.addEventListener("click",reset);
 document.getElementById("journeyPrev")?.addEventListener("click",prev);
 document.getElementById("journeyNext")?.addEventListener("click",next);
 document.querySelectorAll("[data-journey-stop]").forEach(btn=>btn.addEventListener("click",()=>{
  const i=Number(btn.dataset.journeyStop);if(i>=0){pause(false);goto(i)}
 }));
}
function install(config){cfg=config;refresh()}
function onVisitsChanged(){
 if(index>=entries().length){pause(false);active=false;index=-1}
 refresh();
}
function tourStops(){return active?entries().map(e=>e.stadium):[]}
window.BetInsightStadiumJourney={
 install,ordered,entries,active:()=>active,playing:()=>playing,index:()=>index,
 tourStops,geo,refresh,stop,onVisitsChanged,onRotationDurationChanged,panelHTML,visitButtonHTML,bind
};
})();
