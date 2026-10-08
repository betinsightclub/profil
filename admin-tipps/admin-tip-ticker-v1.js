/* BetInsight Admin-Tippmonitor v1 - read-only, 3 kompakte Zeilen */
(()=>{
"use strict";
const KEY="betinsight_admin_session_v1";
const URL="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-tip-ticker";
const LABELS=[["frank","Frank"],["martin","Martin"],["system","System / Schulung"]];
let rows=[],timer=0,refreshTimer=0;
function session(){try{const s=JSON.parse(sessionStorage.getItem(KEY)||"null");return s&&s.token&&Number(s.expiresMs)>Date.now()?s:null}catch(_){return null}}
async function hash(token){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function mount(){
 if(document.getElementById("bi-tip-ticker"))return;
 const el=document.createElement("section");el.id="bi-tip-ticker";el.setAttribute("aria-label","Veröffentlichte, bevorstehende Tipps der Administratoren");
 el.innerHTML='<div class="bi-ticker-title"><span>⚽ Aktuelle Tipps im System</span><span class="bi-ticker-live">● LIVE</span></div><div class="bi-ticker-rows"></div>';
 const css=document.createElement("style");css.textContent=`
 #bi-tip-ticker{box-sizing:border-box;width:min(100%,1020px);margin:12px auto 16px;padding:10px 12px;color:#eef8ff;background:#09273a;border:1px solid rgba(34,185,230,.33);border-radius:12px;font:12px/1.35 Arial,sans-serif;text-align:left;box-shadow:0 8px 22px rgba(0,0,0,.12)}
 #bi-tip-ticker *{box-sizing:border-box}
 .bi-ticker-title{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:700;margin-bottom:7px;font-size:13px}
 .bi-ticker-live{color:#4de4a7;font-size:10px;letter-spacing:.07em}
 .bi-ticker-row{display:flex;align-items:center;gap:8px;min-height:27px;padding:2px 0;border-top:1px solid rgba(210,239,255,.12)}
 .bi-ticker-name{flex:0 0 103px;font-size:11px;font-weight:800;white-space:nowrap}
 .bi-ticker-row[data-who="frank"] .bi-ticker-name{color:#61e3a8}
 .bi-ticker-row[data-who="martin"] .bi-ticker-name{color:#82c5ff}
 .bi-ticker-row[data-who="system"] .bi-ticker-name{color:#ffd37e}
 .bi-ticker-track{flex:1;min-width:0;overflow:hidden;white-space:nowrap;border-radius:5px;background:rgba(255,255,255,.045);height:23px;display:flex;align-items:center}
 .bi-ticker-moving{display:inline-block;white-space:nowrap;padding-left:8px;animation:bi-tip-move 24s linear infinite}
 .bi-ticker-track:hover .bi-ticker-moving{animation-play-state:paused}
 .bi-ticker-empty{color:#93adc0;font-style:italic;padding:0 8px}
 @keyframes bi-tip-move{from{transform:translateX(-100%)}to{transform:translateX(110%)}}
 @media(max-width:600px){#bi-tip-ticker{padding:8px;margin:8px auto 12px}.bi-ticker-name{flex-basis:90px;font-size:10px}.bi-ticker-title{font-size:12px}}
 @media(prefers-reduced-motion:reduce){.bi-ticker-moving{animation:none}}
 `;
 document.head.appendChild(css);
 // Das Terminal verwendet verschiedene Wrapper-Versionen: vor dem ersten Eingabeformular einfügen.
 const form=document.querySelector("form");const parent=form?.closest("main,article,.card,.panel,.container")||form;
 if(parent&&parent.parentNode)parent.parentNode.insertBefore(el,parent);
 else document.body.insertBefore(el,document.body.firstChild);
 LABELS.forEach(([id,label])=>{
  const line=document.createElement("div");line.className="bi-ticker-row";line.dataset.who=id;
  const name=document.createElement("span");name.className="bi-ticker-name";name.textContent=label;
  const track=document.createElement("div");track.className="bi-ticker-track";
  line.append(name,track);el.querySelector(".bi-ticker-rows").appendChild(line);
 });
 render();
}
function render(){
 const now=Date.now();
 for(const [id] of LABELS){
  const track=document.querySelector('#bi-tip-ticker .bi-ticker-row[data-who="'+id+'"] .bi-ticker-track');if(!track)continue;
  const matches=rows.filter(x=>x.group===id&&Number(x.kickoff_ms)>now);
  const signature=matches.map(x=>x.id+"@"+x.kickoff_ms).join("|");
  if(track.dataset.signature===signature)continue;
  track.dataset.signature=signature;track.replaceChildren();
  if(!matches.length){const e=document.createElement("span");e.className="bi-ticker-empty";e.textContent="Keine bevorstehenden Tipps";track.appendChild(e);continue}
  const span=document.createElement("span");span.className="bi-ticker-moving";
  span.textContent=matches.map(x=>x.spiel+" · "+x.spiel_datum+" · "+x.anpfiff+" Uhr").join("     ⚽     ");
  span.style.animationDuration=Math.max(20,10+matches.length*9)+"s";
  track.appendChild(span);
 }
}
async function load(){
 const s=session();if(!s){rows=[];render();return}
 try{
  const response=await fetch(URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({session_hash:await hash(s.token)}),cache:"no-store",credentials:"omit"});
  const d=await response.json();if(!response.ok||d.ok!==true||!Array.isArray(d.items))throw Error("not available");
  rows=d.items.filter(x=>["frank","martin","system"].includes(x.group)&&Number.isFinite(Number(x.kickoff_ms)));
 }catch(_){rows=[]}
 render();
}
function boot(){mount();load();if(!timer)timer=setInterval(render,1000);if(!refreshTimer)refreshTimer=setInterval(load,60000);window.addEventListener("focus",load)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();