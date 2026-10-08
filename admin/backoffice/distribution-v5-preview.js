(() => {
"use strict";
const KEY="betinsight_admin_session_v1", ID="distributionV5Preview", IRRF=25;
let view="ADM-001";
const role={
 "ADM-001":{name:"Luciano",old:40,now:40,normal:40,tennis:50,irrf:false,usage:6},
 "ADM-002":{name:"Martin",old:30,now:30,normal:30,tennis:30,irrf:true,usage:7},
 "ADM-003":{name:"Frank",old:30,now:10,normal:10,tennis:0,irrf:true,usage:8}
};
function ses(){try{return JSON.parse(sessionStorage.getItem(KEY)||"null")}catch(_){return null}}
function master(){return String(ses()?.adminId||"")==="ADM-001"}
function num(v){const s=String(v??"").replace(/\s/g,"").replace(/\./g,"").replace(",",".").replace(/[^0-9+-.]/g,"");const n=Number(s);return Number.isFinite(n)?n:0}
function eur(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:6})}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function money(g,r,isV5){
 const gross=Number(g||0);
 if(!isV5||!r.irrf) return '<strong>'+eur(gross)+'</strong><small>'+(isV5?'kein Partner-IRRF':'Altbestand · keine Rückrechnung')+'</small>';
 const tax=gross*IRRF/100, net=gross-tax;
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
 x.innerHTML='<div class="h"><div><h3>V5-Abrechnungsansicht · Vorschau</h3><p>Gleicher Aufbau wie bisher, mit alten Daten plus neuer V5-Verteilung. Nur Luciano sieht diese Vorschau.</p></div><span class="badge">MASTER · NICHT LIVE</span></div>'+
 '<div class="tabs"><button class="on" data-v="ADM-001">Meine Ansicht · Luciano</button><button data-v="ADM-002">Vorschau · Martin</button><button data-v="ADM-003">Vorschau · Frank</button></div>'+
 '<div class="sec"><h4>Abgewickelte Paketkäufe</h4><div class="note">V5-Testzeile oben, vorhandene Altbuchungen darunter unverändert.</div><div class="wrap"><table><thead id="v5ph"></thead><tbody id="v5pb"></tbody></table></div></div>'+
 '<div class="sec"><h4>Abgewickelte Kauf-Unit-Verbräuche</h4><div class="note">Normal/Fußball und Tennis als V5-Test; vorhandene Altbuchungen bleiben darunter.</div><div class="wrap"><table><thead id="v5uh"></thead><tbody id="v5ub"></tbody></table></div></div>'+
 '<div class="rule" id="v5rule"></div>';
 const h=panel.querySelector(".panel-heading"); if(h)h.insertAdjacentElement("afterend",x);else panel.prepend(x);
 x.querySelectorAll("button[data-v]").forEach(b=>b.onclick=()=>{view=b.dataset.v;x.querySelectorAll("button[data-v]").forEach(y=>y.classList.toggle("on",y===b));render()});
}
function oldPurchases(){
 const src=[...document.querySelectorAll("#provisionTableBody tr")];
 return src.filter(r=>r.children.length>=12).map(r=>[...r.children].map(c=>c.textContent.trim()));
}
function oldUsage(){
 const src=[...document.querySelectorAll("#uupBody tr")];
 return src.filter(r=>r.children.length>=11).map(r=>[...r.children].map(c=>c.textContent.trim()));
}
function renderPurchase(){
 const r=role[view], H=document.getElementById("v5ph"), B=document.getElementById("v5pb"), old=oldPurchases();
 if(view==="ADM-001"){
   H.innerHTML="<tr><th>Datum</th><th>Paket</th><th>Währung</th><th>Eingang nach Plisio</th><th>Betriebskosten</th><th>Affiliate</th><th>Verteilbarer Netto</th><th>Sofortpool</th><th>Unit-Pool</th><th>Luciano</th><th>Martin</th><th>Frank</th><th>Sondertopf</th><th>Status</th></tr>";
   let html='<tr class="testrow"><td>V5 · TEST<span class="tag">keine Buchung</span></td><td>Beispielkauf 100 €</td><td>EUR</td><td>'+eur(99.5)+'</td><td>'+eur(2.4875)+'</td><td>'+eur(9.95)+'</td><td>'+eur(87.0625)+'</td><td>'+eur(34.825)+'</td><td>'+eur(52.2375)+'</td><td>'+money(13.93,role["ADM-001"],true)+'</td><td>'+money(10.4475,role["ADM-002"],true)+'</td><td>'+money(3.4825,role["ADM-003"],true)+'</td><td>'+eur(6.965)+'</td><td>V5 Vorschau</td></tr>';
   old.forEach(a=>{const imm=num(a[7]);html+='<tr><td>'+esc(a[0])+'<small>ALT · unverändert</small></td><td>'+esc(a[1])+'</td><td>'+esc(a[2])+'</td><td>'+esc(a[3])+'</td><td>'+esc(a[4])+'</td><td>'+esc(a[5])+'</td><td>'+esc(a[6])+'</td><td>'+esc(a[7])+'</td><td>'+esc(a[8])+'</td><td>'+eur(imm*.40)+'</td><td>'+eur(imm*.30)+'</td><td>'+eur(imm*.30)+'</td><td>–</td><td>'+esc(a[11])+'</td></tr>'});
   B.innerHTML=html;
 }else{
   H.innerHTML="<tr><th>Datum</th><th>Paket</th><th>Währung</th><th>Eingang nach Plisio</th><th>Betriebskosten</th><th>Affiliate</th><th>Verteilbarer Netto</th><th>Sofortpool</th><th>Unit-Pool</th><th>Deine Sofortgutschrift</th><th>Freigegebener Unit-Anteil</th><th>Status</th></tr>";
   const gross=34.825*r.now/100, unit=52.2375*r.normal/100;
   let html='<tr class="testrow"><td>V5 · TEST<span class="tag">keine Buchung</span></td><td>Beispielkauf 100 €</td><td>EUR</td><td>'+eur(99.5)+'</td><td>'+eur(2.4875)+'</td><td>'+eur(9.95)+'</td><td>'+eur(87.0625)+'</td><td>'+eur(34.825)+'</td><td>'+eur(52.2375)+'</td><td>'+money(gross,r,true)+'</td><td>'+money(unit,r,true)+'<small>Beispiel: kompletter Unit-Pool als normaler Fußball-Tipp</small></td><td>V5 Vorschau</td></tr>';
   old.forEach(a=>{const imm=num(a[7]);html+='<tr><td>'+esc(a[0])+'<small>ALT · unverändert</small></td><td>'+esc(a[1])+'</td><td>'+esc(a[2])+'</td><td>'+esc(a[3])+'</td><td>'+esc(a[4])+'</td><td>'+esc(a[5])+'</td><td>'+esc(a[6])+'</td><td>'+esc(a[7])+'</td><td>'+esc(a[8])+'</td><td>'+money(imm*r.old/100,r,false)+'</td><td><strong>siehe Verbrauchsnachweis unten</strong><small>Altwerte werden nicht neu berechnet</small></td><td>'+esc(a[11])+'</td></tr>'});
   B.innerHTML=html;
 }
}
function renderUsage(){
 const r=role[view],H=document.getElementById("v5uh"),B=document.getElementById("v5ub"),old=oldUsage();
 if(view==="ADM-001"){
  H.innerHTML="<tr><th>Datum</th><th>User</th><th>Tipp / Spiel</th><th>Kaufcharge</th><th>Kauf-Units</th><th>Unit-Pool</th><th>Luciano</th><th>Martin</th><th>Frank</th><th>Sondertopf</th><th>Status</th></tr>";
  let html="";
  [["Normal/Fußball",.40,.30,.10],["Tennis",.50,.30,0]].forEach(x=>{html+='<tr class="testrow"><td>V5 · TEST<span class="tag">keine Buchung</span></td><td>User TEST</td><td>'+x[0]+'</td><td>V5-TEST-CHARGE</td><td>Beispiel</td><td>'+eur(52.2375)+'</td><td>'+money(52.2375*x[1],role["ADM-001"],true)+'</td><td>'+money(52.2375*x[2],role["ADM-002"],true)+'</td><td>'+money(52.2375*x[3],role["ADM-003"],true)+'</td><td>'+eur(52.2375*.20)+'</td><td>V5 Vorschau</td></tr>'});
  old.forEach(a=>{html+='<tr><td>'+esc(a[0])+'<small>ALT · unverändert</small></td><td>'+esc(a[1])+'</td><td>'+esc(a[2])+'</td><td>'+esc(a[3])+'</td><td>'+esc(a[4])+'</td><td>'+esc(a[6])+'</td><td>'+esc(a[7])+'</td><td>'+esc(a[8])+'</td><td>'+esc(a[9])+'</td><td>–</td><td>'+esc(a[11])+'</td></tr>'});
  B.innerHTML=html;
 }else{
  H.innerHTML="<tr><th>Datum</th><th>User</th><th>Tipp / Spiel</th><th>Kaufcharge</th><th>Kauf-Units</th><th>Deine Provision</th><th>Status</th></tr>";
  let html="";
  [["Normal/Fußball",r.normal],["Tennis",r.tennis]].forEach(x=>{html+='<tr class="testrow"><td>V5 · TEST<span class="tag">keine Buchung</span></td><td>User TEST</td><td>'+x[0]+'</td><td>V5-TEST-CHARGE</td><td>Beispiel</td><td>'+money(52.2375*x[1]/100,r,true)+'</td><td>'+(x[0]==="Tennis"&&view==="ADM-003"?"Tennis · kein Anteil":"V5 Vorschau")+'</td></tr>'});
  old.forEach(a=>{html+='<tr><td>'+esc(a[0])+'<small>ALT · unverändert</small></td><td>'+esc(a[1])+'</td><td>'+esc(a[2])+'</td><td>'+esc(a[3])+'</td><td>'+esc(a[4])+'</td><td>'+money(num(a[r.usage]),r,false)+'</td><td>'+esc(a[11])+'</td></tr>'});
  B.innerHTML=html;
 }
}
function render(){
 renderPurchase();renderUsage();
 const r=role[view];
 document.getElementById("v5rule").textContent=view==="ADM-001"
 ? "V5: Sofortpool 40 % → Luciano 40 % · Martin 30 % brutto · Frank 10 % brutto · Sondertopf 20 %. Normaler Unit-Verbrauch 40/30/10/20; Tennis 50/30/0/20. Altbuchungen bleiben unverändert."
 : r.name+": Sofortpool "+r.now+" %. Normaler Unit-Verbrauch "+r.normal+" %, Tennis "+r.tennis+" %. Neue V5-Ansprüche zeigen Brutto, IRRF-Reserve und Netto; Altbuchungen bleiben unverändert.";
}
function wait(n=0){
 const p=document.querySelectorAll("#provisionTableBody tr"),u=document.querySelectorAll("#uupBody tr");
 if((p.length&&u.length)||n>30){render();return}
 setTimeout(()=>wait(n+1),300);
}
function init(){if(!master())return;css();make();wait()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,500),{once:true});else setTimeout(init,500);
})();