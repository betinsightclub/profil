/* BetInsight TIME CLASH · Stadium Universe v1 · 2026-09-29
   Parallel-safe: this module does not touch header, logo, hero wordmark or navigation. */
(function(){
"use strict";

const TC_STADIUMS=[
 {slug:"koenigsbogen-arena",name:"Königsbogen Arena",city:"München",country:"Deutschland"},
 {slug:"atlantic-riviera-stadium",name:"Atlantic Riviera Stadium",city:"Lissabon",country:"Portugal"},
 {slug:"sapphire-bay-arena",name:"Sapphire Bay Arena",city:"Istanbul",country:"Türkei"},
 {slug:"solaris-dome",name:"Solaris Dome",city:"Los Angeles",country:"USA"},
 {slug:"arena-verdanza",name:"Arena Verdanza",city:"Mailand",country:"Italien"},
 {slug:"aurora-steps-stadium",name:"Aurora Steps Stadium",city:"Stockholm",country:"Schweden"},
 {slug:"aurelia-olympic-park",name:"Aurelia Olympic Park",city:"Rom",country:"Italien"},
 {slug:"desert-crown-stadium",name:"Desert Crown Stadium",city:"Doha",country:"Katar"},
 {slug:"redstone-athletic-park",name:"Redstone Athletic Park",city:"Chicago",country:"USA"},
 {slug:"emerald-ring-stadium",name:"Emerald Ring Stadium",city:"Dublin",country:"Irland"},
 {slug:"highland-gate-arena",name:"Highland Gate Arena",city:"Edinburgh",country:"Schottland"},
 {slug:"horizon-pulse-arena",name:"Horizon Pulse Arena",city:"Tokio",country:"Japan"},
 {slug:"northgate-bowl",name:"Northgate Bowl",city:"Glasgow",country:"Schottland"},
 {slug:"arena-do-horizonte",name:"Arena do Horizonte",city:"São Paulo",country:"Brasilien"},
 {slug:"estadio-sierra-alta",name:"Estadio Sierra Alta",city:"Bogotá",country:"Kolumbien"},
 {slug:"bastion-21",name:"Bastion 21",city:"Buenos Aires",country:"Argentinien"},
 {slug:"ironbridge-ground",name:"Ironbridge Ground",city:"Liverpool",country:"England"},
 {slug:"fjordlight-park",name:"Fjordlight Park",city:"Oslo",country:"Norwegen"},
 {slug:"estadio-del-mar-norte",name:"Estadio del Mar Norte",city:"Barcelona",country:"Spanien"},
 {slug:"titan-forge-arena",name:"Titan Forge Arena",city:"Warschau",country:"Polen"}
].map(x=>({...x,image:"/time-clash/stadiums/"+x.slug+"/MASTER.webp"}));

const STORAGE_KEY="bi_tc_start_stadium_v1";
let selectedSlug="";
let patched=false;

function qs(s){return document.querySelector(s)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function stadiumBySlug(slug){return TC_STADIUMS.find(x=>x.slug===slug)||null}
function stadiumByName(name){return TC_STADIUMS.find(x=>x.name===name)||null}
function shuffle(items){
 const a=items.slice();
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
 return a
}
function claimForLength(n){
 if(n===1)return "EIN SPIEL. EIN SIEGER.";
 if(n===3)return "DREI SPIELE. EIN SERIENSIEGER.";
 if(n===5)return "FÜNF SPIELE. EIN SERIENSIEGER.";
 return "ZEHN SPIELE. EIN SERIENSIEGER."
}
function addStyles(){
 if(qs("#tcStadiumUniverseStyles"))return;
 const style=document.createElement("style");
 style.id="tcStadiumUniverseStyles";
 style.textContent=`
.tcStadiumChooser{border-bottom:1px solid #17435d;background:linear-gradient(145deg,#061d2a,#04131d);padding:16px}
.tcStadiumChooserHead{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.tcStadiumChooserHead h3{margin:0;font-size:18px}.tcStadiumChooserHead p{margin:4px 0 0;color:#9eb5c3;font-size:12px}
.tcStadiumCurrent{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:14px;margin-top:13px;border:1px solid #24516b;border-radius:15px;padding:10px;background:#03151f}
.tcStadiumCurrent img{width:112px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;border:1px solid #2a607d;background:#061b28}
.tcStadiumCurrent b{display:block;color:#fff}.tcStadiumCurrent small{display:block;color:#8fb1c2;margin-top:3px}
.tcStadiumBtn{border:1px solid #2d7194;background:#0b4f73;color:#fff;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer}
.tcStadiumBtn.secondary{background:#082638}
.tcStadiumGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px;max-height:430px;overflow:auto;padding-right:3px}
.tcStadiumGrid.hidden{display:none}
.tcStadiumCard{position:relative;overflow:hidden;border:1px solid #24516b;border-radius:13px;background:#061b28;color:#fff;padding:0;text-align:left;cursor:pointer;min-width:0}
.tcStadiumCard img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#03131d}
.tcStadiumCard span{display:block;padding:9px 10px 3px;font-weight:900;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tcStadiumCard small{display:block;padding:0 10px 10px;color:#8fb1c2;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tcStadiumCard.sel{border-color:#f7c64e;box-shadow:0 0 0 1px #f7c64e,0 0 22px #f7c64e33}
.tcStadiumCard.sel:after{content:"START";position:absolute;top:7px;right:7px;background:#f7c64e;color:#10202a;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:1000}
.tcStadiumChooser.locked .tcStadiumBtn,.tcStadiumChooser.locked .tcStadiumCard{opacity:.55;pointer-events:none}
#stadiumStage.tcHasStadiumImage{background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important}
#stadiumStage.tcStadiumFade{animation:tcStadiumIn .42s ease}
@keyframes tcStadiumIn{from{opacity:.55}to{opacity:1}}
@media(max-width:900px){.tcStadiumGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:650px){.tcStadiumCurrent{grid-template-columns:90px 1fr}.tcStadiumCurrent img{width:90px}.tcStadiumCurrent .tcStadiumBtn{grid-column:1/-1;width:100%}.tcStadiumGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
 document.head.appendChild(style)
}
function currentInfo(){
 return stadiumBySlug(selectedSlug)
}
function stagePreview(stadium,label){
 const stage=qs("#stadiumStage");if(!stage||!stadium)return;
 stage.classList.remove("tcStadiumFade");void stage.offsetWidth;stage.classList.add("tcStadiumFade","tcHasStadiumImage");
 stage.style.backgroundImage='linear-gradient(#00121b2e,#00111bc9),url("'+stadium.image+'")';
 const game=qs("#stadiumGame"),name=qs("#stadiumName"),place=qs("#stadiumPlace");
 if(game)game.textContent=label||"STARTSTADION";
 if(name)name.textContent=stadium.name;
 if(place)place.textContent=stadium.city+" · "+stadium.country;
}
function renderChooser(){
 const root=qs("#tcStadiumChooser");if(!root)return;
 const s=currentInfo();
 const img=root.querySelector("#tcStadiumCurrentImg"),title=root.querySelector("#tcStadiumCurrentName"),place=root.querySelector("#tcStadiumCurrentPlace");
 if(img){img.src=s?s.image:"";img.alt=s?s.name:"Startstadion"}
 if(title)title.textContent=s?s.name:"Noch kein Startstadion gewählt";
 if(place)place.textContent=s?(s.city+" · "+s.country):"Wähle eines der 20 TIME-CLASH-Stadien.";
 root.querySelectorAll(".tcStadiumCard").forEach(card=>card.classList.toggle("sel",card.dataset.slug===selectedSlug));
 if(s&&!running)stagePreview(s,"STARTSTADION")
}
function buildChooser(){
 const arena=qs(".arena");if(!arena||qs("#tcStadiumChooser"))return;
 const box=document.createElement("section");box.id="tcStadiumChooser";box.className="tcStadiumChooser";
 box.innerHTML=`
 <div class="tcStadiumChooserHead"><div><h3>🏟 Startstadion wählen</h3><p>Du bestimmst Spiel 1. Ab Spiel 2 wählt TIME CLASH die weiteren Stadien zufällig und ohne direkte Wiederholung.</p></div><button class="tcStadiumBtn secondary" id="tcStadiumToggle" type="button">20 STADIEN ANZEIGEN</button></div>
 <div class="tcStadiumCurrent"><img id="tcStadiumCurrentImg" alt=""><div><b id="tcStadiumCurrentName">Noch kein Startstadion gewählt</b><small id="tcStadiumCurrentPlace">Wähle eines der 20 TIME-CLASH-Stadien.</small></div><button class="tcStadiumBtn" id="tcStadiumChange" type="button">STADION WÄHLEN</button></div>
 <div class="tcStadiumGrid hidden" id="tcStadiumGrid">${TC_STADIUMS.map(s=>`<button class="tcStadiumCard" type="button" data-slug="${esc(s.slug)}"><img loading="lazy" src="${esc(s.image)}" alt="${esc(s.name)}"><span>${esc(s.name)}</span><small>${esc(s.city)} · ${esc(s.country)}</small></button>`).join("")}</div>`;
 arena.insertBefore(box,arena.firstChild);
 const grid=box.querySelector("#tcStadiumGrid");
 const toggle=()=>{const hidden=grid.classList.toggle("hidden");box.querySelector("#tcStadiumToggle").textContent=hidden?"20 STADIEN ANZEIGEN":"AUSWAHL SCHLIESSEN"};
 box.querySelector("#tcStadiumToggle").onclick=toggle;
 box.querySelector("#tcStadiumChange").onclick=()=>{if(grid.classList.contains("hidden"))toggle();grid.scrollIntoView({behavior:"smooth",block:"nearest"})};
 box.querySelectorAll(".tcStadiumCard").forEach(card=>card.onclick=()=>{
   if(running)return;
   selectedSlug=card.dataset.slug;
   try{localStorage.setItem(STORAGE_KEY,selectedSlug)}catch(_e){}
   renderChooser();
   try{makeSeries()}catch(_e){}
   grid.classList.add("hidden");box.querySelector("#tcStadiumToggle").textContent="20 STADIEN ANZEIGEN";
 });
 renderChooser()
}
function buildVenueOrder(length){
 const start=currentInfo();
 const rest=shuffle(TC_STADIUMS.filter(x=>!start||x.slug!==start.slug));
 const ordered=start?[start,...rest]:rest;
 return ordered.slice(0,Math.max(1,length))
}
function patchGlobals(){
 if(patched)return true;
 try{
  if(typeof makeSeries!=="function"||typeof setStadium!=="function"||typeof buildGame!=="function"||typeof venues==="undefined"||typeof seriesLen==="undefined")return false;
  patched=true;
  venues.splice(0,venues.length,...TC_STADIUMS.map(s=>s.name));

  makeSeries=function(){
    seriesDecision=null;
    const ordered=buildVenueOrder(seriesLen);
    seriesVenueOrder=ordered.map(s=>s.name);
    games=Array.from({length:seriesLen},(_,x)=>buildGame(x));
    const seriesEl=qs("#series");if(seriesEl)seriesEl.dataset.long=seriesLen>5?"1":"0";
    renderTabs();renderHistory()
  };

  setStadium=function(){
    if(!games[g])return;
    const stadium=stadiumByName(games[g].venue);
    const label="SPIEL "+(g+1)+" VON "+seriesLen;
    const gameEl=qs("#stadiumGame"),nameEl=qs("#stadiumName"),placeEl=qs("#stadiumPlace");
    if(gameEl)gameEl.textContent=label;
    if(nameEl)nameEl.textContent=games[g].venue;
    if(placeEl)placeEl.textContent=(stadium?stadium.city+" · "+stadium.country+" · ":"")+games[g].weather;
    const city=qs("#infoCity");if(city)city.textContent=stadium?stadium.city+", "+stadium.country:"Virtuell";
    if(stadium)stagePreview(stadium,label);
    const next=games[g+1]&&stadiumByName(games[g+1].venue);
    if(next){const preload=new Image();preload.src=next.image}
    const chooser=qs("#tcStadiumChooser");if(chooser)chooser.classList.toggle("locked",!!running)
  };

  const originalFinishGame=finishGame;
  finishGame=function(){
    originalFinishGame();
    const chooser=qs("#tcStadiumChooser");if(chooser)chooser.classList.toggle("locked",g<seriesLen)
  };

  const originalFinishSeries=finishSeries;
  finishSeries=function(){
    originalFinishSeries();
    const chooser=qs("#tcStadiumChooser");if(chooser)chooser.classList.remove("locked")
  };

  return true
 }catch(e){console.warn("TIME CLASH stadium patch",e);return false}
}
function addSingleMatch(){
 const wrap=qs(".lengthpick");if(!wrap||wrap.querySelector('[data-len="1"]'))return;
 const b=document.createElement("button");b.type="button";b.dataset.len="1";b.textContent="1 SPIEL";
 wrap.insertBefore(b,wrap.firstChild);
 b.onclick=()=>{
   if(running)return;
   seriesLen=1;
   const claim=qs("#heroClaim");if(claim)claim.textContent=claimForLength(1);
   document.querySelectorAll("[data-len]").forEach(x=>x.classList.toggle("sel",Number(x.dataset.len)===1));
   makeSeries()
 };
}
function gateStart(){
 const start=qs("#start");if(!start||start.dataset.tcStadiumGate)return;
 start.dataset.tcStadiumGate="1";
 start.addEventListener("click",e=>{
   if(running)return;
   if(!currentInfo()){
     e.preventDefault();e.stopImmediatePropagation();
     const n=qs("#next");if(n)n.textContent="Bitte zuerst dein Startstadion auswählen.";
     const grid=qs("#tcStadiumGrid");if(grid)grid.classList.remove("hidden");
     qs("#tcStadiumChooser")?.scrollIntoView({behavior:"smooth",block:"center"});
   }
 },true)
}
function init(){
 addStyles();
 try{selectedSlug=localStorage.getItem(STORAGE_KEY)||""}catch(_e){}
 if(selectedSlug&&!stadiumBySlug(selectedSlug))selectedSlug="";
 buildChooser();
 let tries=0;
 const timer=setInterval(()=>{
   tries++;
   if(patchGlobals()){
     clearInterval(timer);addSingleMatch();gateStart();renderChooser();makeSeries();
   }else if(tries>120)clearInterval(timer)
 },50);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();

window.TC_STADIUMS=TC_STADIUMS;
window.TC_STADIUM_UNIVERSE_VERSION="2026-09-29-v1";
})();