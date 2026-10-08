(() => {
"use strict";
const KEY="betinsight_admin_session_v1", ID="distributionV5Preview", IRRF=25;
const LIVE_API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-gateway?route=backoffice-read-shadow";
let view="ADM-001", livePurchases=[], liveUsages=[];
const role={
 "ADM-001":{name:"Luciano",old:40,now:40,normal:40,tennis:50,irrf:false,usage:7},
 "ADM-002":{name:"Martin",old:30,now:30,normal:30,tennis:30,irrf:true,usage:8},
 "ADM-003":{name:"Frank",old:30,now:10,normal:10,tennis:0,irrf:true,usage:9}
};
function ses(){try{return JSON.parse(sessionStorage.getItem(KEY)||"null")}catch(_){return null}}
function master(){return String(ses()?.adminId||"")==="ADM-001"}
async function sha256Hex(text){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(text||"")));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function loadLive(){const s=ses();if(!s?.token)throw new Error("Keine aktive Admin-Session.");const session_hash=await sha256Hex(s.token);const r=await fetch(LIVE_API,{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",credentials:"omit",body:JSON.stringify({action:"load",session_hash})});const raw=await r.text();let j={};try{j=raw?JSON.parse(raw):{}}catch(_){throw new Error("Ungültige V5-Antwort.");}if(!r.ok||j.ok!==true)throw new Error(j.message||j.error||("HTTP "+r.status));livePurchases=Array.isArray(j.settlement_v5_purchases)?j.settlement_v5_purchases:[];liveUsages=Array.isArray(j.settlement_v5_usages)?j.settlement_v5_usages:[];}
function num(v){
 if(typeof v==="number") return Number.isFinite(v)?v:0;
 let s=String(v??"").trim().replace(/\s/g,"").replace(/[^0-9+.,-]/g,"");
 if(!s)return 0;
 if(s.includes(",")&&s.includes(".")){
   if(s.lastIndexOf(",")>s.lastIndexOf(".")) s=s.replace(/\./g,"").replace(",",".");
   else s=s.replace(/,/g,"");
 }else if(s.includes(",")){
   s=s.replace(",",".");
 }
 const n=Number(s);
 return Number.isFinite(n)?n:0;
}
function eur(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:6})}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function money(g,r,isV5,partnerView=false){
 const gross=Number(g||0);
 if(!isV5||!r.irrf) return '<strong>'+eur(gross)+'</strong><small>'+(isV5?'Netto':'Altbestand · keine Rückrechnung')+'</small>';
 const tax=gross*IRRF/100, net=gross-tax;
 if(partnerView){
   return '<strong class="v5net">'+eur(net)+' netto</strong><small>Gesetzlich erforderliche Einbehalte werden von LucMedia direkt abgeführt.</small>';
 }
 return '<strong class="v5net">'+eur(net)+' netto</strong><small>'+eur(gross)+' brutto · '+eur(tax)+' IRRF-Reserve</small>';
}
function css(){
 if(document.getElementById("v5PreviewCss"))return;
 const s=document.createElement("style");s.id="v5PreviewCss";
 s.textContent=
 "#"+ID+"{margin:0 0 22px;border:1px solid rgba(255,218,118,.34);border-radius:18px;background:rgba(5,30,43,.98);overflow:hidden}"+
 "#"+ID+" .h{display:flex;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid rgba(185,216,232,.13)}"+
 "#"+ID+" h3{margin:0 0 6px;color:#fff}#"+ID+" p{margin:0;color:#a9cbd9;font-size:13px}"+
 "#"+ID+" .badge{padding:6px 10px;border:1px solid rgba(255,218,118,.35);border-radius:999px;color:#ffe59b;height:max-content;font-size:11px;font-weight:900}"+
 "#"+ID+" .tabs{display:flex;gap:8px;flex-wrap:wrap;padding:14px 20px}#"+ID+" button{padding:9px 13px;border:1px solid rgba(185,216,232,.2);border-radius:10px;background:rgba(255,255,255,.05);color:#cbe7f3;font-weight:900;cursor:pointer}"+
 "#"+ID+" button.on{border-color:rgba(0,212,138,.45);color:#91f5cf;background:rgba(0,212,138,.1)}"+
 "#"+ID+" .sec{padding:0 20px 20px}#"+ID+" h4{margin:12px 0 8px;color:#fff}#"+ID+" .note{color:#82aabb;font-size:11px;margin-bottom:9px}"+
 "#"+ID+" .wrap{overflow:auto;border:1px solid rgba(185,216,232,.13);border-radius:12px}#"+ID+" table{width:100%;min-width:1050px;border-collapse:collapse;font-size:12px}"+
 "#"+ID+" th,#"+ID+" td{padding:10px 11px;border-bottom:1px solid rgba(185,216,232,.09);text-align:left;vertical-align:top}#"+ID+" th{background:#082a3b;color:#9fd7e9;font-size:10px;text-transform:uppercase}"+
 "#"+ID+" small{display:block;color:#83b8ca;margin-top:3px}.v5net{color:#82f5c8}.testrow{background:rgba(255,218,118,.05)}"+
 "#"+ID+" .tag{display:inline-block;margin-top:3px;padding:3px 6px;border-radius:999px;font-size:9px;font-weight:900;background:rgba(0,212,138,.08);color:#91f5cf;border:1px solid rgba(0,212,138,.23)}"+
 "#"+ID+" .rule{margin:0 20px 18px;padding:12px;border:1px solid rgba(255,218,118,.2);border-radius:11px;color:#eadca9;font-size:12px;line-height:1.5}";
 document.head.appendChild(s);
}
function make(){
 const panel=document.getElementById("tab-provisions"); if(!panel||document.getElementById(ID))return;
 const x=document.createElement("article");x.id=ID;
 x.innerHTML='<div class="h"><div><h3>Abrechnung · V5-Liveansicht</h3><p>Altbestand 1:1 übernommen. Neue Paketkäufe und neue Kauf-Unit-Verbräuche werden automatisch ergänzt. Martin und Frank sehen diese neue Ansicht noch nicht.</p></div><span class="badge">LIVE-ERFASSUNG · MASTER</span></div>'+
 '<div class="tabs"><button class="on" data-v="ADM-001">Meine Ansicht · Luciano</button><button data-v="ADM-002">Vorschau · Martin</button><button data-v="ADM-003">Vorschau · Frank</button></div>'+
 '<div class="sec"><h4>Abgewickelte Paketkäufe</h4><div class="note">Musterdaten entfernt. Altbestand bleibt unverändert; neue V5-Käufe erscheinen automatisch.</div><div class="wrap"><table><thead id="v5ph"></thead><tbody id="v5pb"></tbody></table></div></div>'+
 '<div class="sec"><h4>Abgewickelte Kauf-Unit-Verbräuche</h4><div class="note">Musterdaten entfernt. Bestehende Verbrauchsdaten bleiben unverändert; neue V5-Vorgänge erscheinen automatisch.</div><div class="wrap"><table><thead id="v5uh"></thead><tbody id="v5ub"></tbody></table></div></div>'+
 '<div class="rule" id="v5rule"></div>';
 const h=panel.querySelector(".panel-heading"); if(h)h.insertAdjacentElement("afterend",x);else panel.prepend(x);
 x.querySelectorAll("button[data-v]").forEach(b=>b.onclick=()=>{view=b.dataset.v;x.querySelectorAll("button[data-v]").forEach(y=>y.classList.toggle("on",y===b));render()});
}

function paidDate(v){
 const raw=String(v??"").trim(); if(!raw)return "–";
 const d=new Date(raw); if(Number.isNaN(d.getTime()))return raw;
 return d.toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function partnerNet(net,legacy){
 return legacy
  ? '<strong>'+eur(net)+'</strong>'
  : '<strong class="v5net">'+eur(net)+' netto</strong>';
}
function masterPartner(net,gross,tax,legacy){
 return legacy
  ? '<strong>'+eur(net)+'</strong>'
  : '<strong class="v5net">'+eur(net)+' netto</strong><small>'+eur(gross)+' brutto · '+eur(tax)+' IRRF-Reserve</small>';
}
function renderPurchase(){
 const H=document.getElementById("v5ph"),B=document.getElementById("v5pb");
 const rows=livePurchases.slice().sort((a,b)=>Number(b.settlement_id||0)-Number(a.settlement_id||0));
 if(view==="ADM-001"){
  H.innerHTML="<tr><th>Datum</th><th>Paket</th><th>Währung</th><th>Eingang nach Plisio</th><th>Betriebskosten</th><th>Affiliate</th><th>Verteilbarer Netto</th><th>Sofortpool</th><th>Unit-Pool</th><th>Luciano</th><th>Martin</th><th>Frank</th><th>Sondertopf</th><th>Freigegebener Unit-Anteil</th><th>Status</th></tr>";
  B.innerHTML=rows.length?rows.map(r=>{
   const legacy=!!r.is_legacy;
   return '<tr>'+
    '<td>'+esc(paidDate(r.paid_at_text))+'</td>'+
    '<td>'+esc(r.package_code||"–")+'</td>'+
    '<td>'+esc(r.payment_currency||"–")+'</td>'+
    '<td>'+eur(r.incoming_after_plisio_eur)+'</td>'+
    '<td>'+eur(r.operating_cost_eur)+'</td>'+
    '<td>'+eur(r.affiliate_budget_eur)+'</td>'+
    '<td>'+eur(r.distributable_net_eur)+'</td>'+
    '<td>'+eur(r.immediate_pool_eur)+'</td>'+
    '<td>'+eur(r.usage_pool_eur)+'</td>'+
    '<td>'+eur(r.luciano_immediate_eur)+'</td>'+
    '<td>'+masterPartner(r.martin_immediate_net_eur,r.martin_immediate_gross_eur,r.martin_irrf_reserve_eur,legacy)+'</td>'+
    '<td>'+masterPartner(r.frank_immediate_net_eur,r.frank_immediate_gross_eur,r.frank_irrf_reserve_eur,legacy)+'</td>'+
    '<td>'+(legacy?'–':eur(r.special_reserve_eur))+'</td>'+
    '<td>'+eur(r.luciano_usage_released_eur)+'</td>'+
    '<td>'+esc(r.status||"–")+'<small>'+esc(r.rule_version||"")+'</small></td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="15">Noch keine Abrechnungen vorhanden.</td></tr>';
 }else{
  const isM=view==="ADM-002";
  H.innerHTML="<tr><th>Datum</th><th>Paket</th><th>Währung</th><th>Eingang nach Plisio</th><th>Betriebskosten</th><th>Affiliate</th><th>Verteilbarer Netto</th><th>Sofortpool</th><th>Unit-Pool</th><th>Deine Sofortgutschrift</th><th>Freigegebener Unit-Anteil</th><th>Status</th></tr>";
  B.innerHTML=rows.length?rows.map(r=>{
   const legacy=!!r.is_legacy;
   const imm=isM?r.martin_immediate_net_eur:r.frank_immediate_net_eur;
   const rel=isM?r.martin_usage_released_eur:r.frank_usage_released_eur;
   return '<tr>'+
    '<td>'+esc(paidDate(r.paid_at_text))+'</td>'+
    '<td>'+esc(r.package_code||"–")+'</td>'+
    '<td>'+esc(r.payment_currency||"–")+'</td>'+
    '<td>'+eur(r.incoming_after_plisio_eur)+'</td>'+
    '<td>'+eur(r.operating_cost_eur)+'</td>'+
    '<td>'+eur(r.affiliate_budget_eur)+'</td>'+
    '<td>'+eur(r.distributable_net_eur)+'</td>'+
    '<td>'+eur(r.immediate_pool_eur)+'</td>'+
    '<td>'+eur(r.usage_pool_eur)+'</td>'+
    '<td>'+partnerNet(imm,legacy)+'</td>'+
    '<td>'+partnerNet(rel,legacy)+'</td>'+
    '<td>'+esc(r.status||"–")+'</td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="12">Noch keine Abrechnungen vorhanden.</td></tr>';
 }
}
function renderUsage(){
 const H=document.getElementById("v5uh"),B=document.getElementById("v5ub");
 const rows=liveUsages.slice().sort((a,b)=>Number(b.audit_seq||0)-Number(a.audit_seq||0));
 if(view==="ADM-001"){
  H.innerHTML="<tr><th>Datum</th><th>User</th><th>Sport / Tipp / Spiel</th><th>Kaufcharge</th><th>Kauf-Units</th><th>Unit-Pool</th><th>Luciano</th><th>Martin</th><th>Frank</th><th>Sondertopf</th><th>Status</th></tr>";
  B.innerHTML=rows.length?rows.map(r=>{
   const live=String(r.regelversion||"").includes("IRRF25-v5");
   return '<tr>'+
    '<td>'+esc(paidDate(r.freigeschaltet_am))+'<small>'+(live?'V5 · live':'ALT · unverändert')+'</small></td>'+
    '<td>'+esc(r.user_id||"–")+'</td>'+
    '<td><strong>'+esc(r.sportart||"Fussball")+'</strong><small>'+esc(r.tipp_id||"–")+' · '+esc(r.spiel||"")+'</small></td>'+
    '<td>'+esc(r.paket_kauf_id||"–")+'</td>'+
    '<td>'+num(r.kauf_units_verbraucht).toLocaleString("de-DE",{maximumFractionDigits:2})+' Units</td>'+
    '<td>'+eur(r.nutzungspool_zugeordnet_eur)+'</td>'+
    '<td>'+eur(r.luciano_freigegeben_eur)+'</td>'+
    '<td>'+masterPartner(r.martin_freigegeben_eur,r.martin_brutto_eur,r.martin_irrf_eur,!live)+'</td>'+
    '<td>'+masterPartner(r.frank_freigegeben_eur,r.frank_brutto_eur,r.frank_irrf_eur,!live)+'</td>'+
    '<td>'+(live?eur(r.sondertopf_eur):'–')+'</td>'+
    '<td>'+esc(r.abrechnungsstatus||"–")+'<small>'+esc(r.regelversion||"")+'</small></td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="11">Noch keine Kauf-Unit-Verbräuche vorhanden.</td></tr>';
 }else{
  const isM=view==="ADM-002";
  H.innerHTML="<tr><th>Datum</th><th>User</th><th>Sport / Tipp / Spiel</th><th>Kaufcharge</th><th>Kauf-Units</th><th>Deine Provision</th><th>Status</th></tr>";
  B.innerHTML=rows.length?rows.map(r=>{
   const live=String(r.regelversion||"").includes("IRRF25-v5");
   const net=isM?r.martin_freigegeben_eur:r.frank_freigegeben_eur;
   return '<tr>'+
    '<td>'+esc(paidDate(r.freigeschaltet_am))+'<small>'+(live?'V5 · live':'ALT · unverändert')+'</small></td>'+
    '<td>'+esc(r.user_id||"–")+'</td>'+
    '<td><strong>'+esc(r.sportart||"Fussball")+'</strong><small>'+esc(r.tipp_id||"–")+' · '+esc(r.spiel||"")+'</small></td>'+
    '<td>'+esc(r.paket_kauf_id||"–")+'</td>'+
    '<td>'+num(r.kauf_units_verbraucht).toLocaleString("de-DE",{maximumFractionDigits:2})+' Units</td>'+
    '<td>'+partnerNet(net,!live)+'</td>'+
    '<td>'+esc(r.abrechnungsstatus||"–")+'</td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="7">Noch keine Kauf-Unit-Verbräuche vorhanden.</td></tr>';
 }
}
function render(){
 renderPurchase();renderUsage();
 const r=role[view];
 document.getElementById("v5rule").textContent=view==="ADM-001"
 ? "V5: Sofortpool 40 % → Luciano 40 % · Martin 30 % brutto · Frank 10 % brutto · Sondertopf 20 %. Normaler Unit-Verbrauch 40/30/10/20; Tennis 50/30/0/20. Altbuchungen bleiben unverändert."
 : r.name+": Angezeigt wird dein Nettoanteil. Gesetzlich erforderliche Einbehalte werden von LucMedia direkt abgeführt. Altbuchungen bleiben unverändert.";
}

async function init(){
 if(!master())return;
 css();make();
 try{
  await loadLive();
  render();
  const badge=document.querySelector("#"+ID+" .badge");
  if(badge)badge.textContent="LIVE-ERFASSUNG · MASTER · Musterdaten 0";
 }catch(e){
  const rule=document.getElementById("v5rule");
  if(rule)rule.textContent="Live-Abrechnung konnte nicht geladen werden: "+(e?.message||e);
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,500),{once:true});else setTimeout(init,500);
})();