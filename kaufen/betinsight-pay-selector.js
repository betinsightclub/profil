// BetInsight Pay purchase-page integration, development branch only.
// Selection is presentation only, never a quote, payment authorization or verified order.
(() => {
"use strict";
const root=document.getElementById("biPaySelector");if(!root)return;
const routes=[{"network":"ETHEREUM","asset":"ETH","label":"ETH"},{"network":"ETHEREUM","asset":"USDT","label":"USDT"},{"network":"ETHEREUM","asset":"USDC","label":"USDC"},{"network":"BSC","asset":"BNB","label":"BNB"},{"network":"BSC","asset":"USDT","label":"Binance-Peg USDT"},{"network":"BSC","asset":"USDC","label":"Binance-Peg USDC"},{"network":"POLYGON","asset":"POL","label":"POL"},{"network":"POLYGON","asset":"USDT","label":"USDT0"},{"network":"POLYGON","asset":"USDC","label":"USDC"},{"network":"TRON","asset":"TRX","label":"TRX"},{"network":"TRON","asset":"USDT","label":"USDT"},{"network":"SOLANA","asset":"SOL","label":"SOL"},{"network":"SOLANA","asset":"USDT","label":"USDT"},{"network":"SOLANA","asset":"USDC","label":"USDC"},{"network":"BITCOIN","asset":"BTC","label":"BTC"},{"network":"BITCOINCASH","asset":"BCH","label":"BCH"},{"network":"LITECOIN","asset":"LTC","label":"LTC"},{"network":"XRPL","asset":"XRP","label":"XRP"}];
const names={"BSC":"BNB Smart Chain","ETHEREUM":"Ethereum","TRON":"TRON","POLYGON":"Polygon PoS","SOLANA":"Solana","BITCOIN":"Bitcoin","LITECOIN":"Litecoin","DOGECOIN":"Dogecoin","XRPL":"XRP Ledger","BITCOINCASH":"Bitcoin Cash"},coins=[["USDT","Tether","#26a17b","₮"],["USDC","USD Coin","#2775ca","$"],["BTC","Bitcoin","#f7931a","₿"],["BNB","BNB","#f3ba2f","⬖"],["TRX","TRON","#ec193a","△"],["ETH","Ethereum","#6579b9","♦"],["SOL","Solana","#171725","≋"],["POL","Polygon","#8247e5","∞"],["LTC","Litecoin","#345d9d","Ł"],["DOGE","Dogecoin","#c4a247","Ð"],["XRP","XRP","#222831","✕"],["BCH","Bitcoin Cash","#0ac18e","₿"]];
const tokenStandards={ETHEREUM:"ERC20",BSC:"BEP20",POLYGON:"Polygon / ERC20",TRON:"TRC20",SOLANA:"SPL"};
const nativeLabels={ETHEREUM:"ETH",BSC:"BNB",POLYGON:"POL",TRON:"TRX",SOLANA:"SOL",BITCOIN:"BTC",LITECOIN:"LTC",BITCOINCASH:"BCH",XRPL:"XRP"};
function networkLabel(route){
 const standard=["USDT","USDC"].includes(route.asset)?tokenStandards[route.network]:nativeLabels[route.network];
 return names[route.network]+(standard?" ("+standard+")":"");
}
const el=id=>document.getElementById(id);
const token=()=>window.BetInsightSession?.getDashboardUuid?.();
const packageSelect=el("packageSelect"),pay=el("payButton");
let released=new Set(),busy=false,order=null,request=null,poll=null;
const routeKey=(n,a)=>n+":"+a;
const routeAvailable=()=>released.has(routeKey(network,coin));
const storageKey="bi_direct_checkout_current_v1";
const status=document.createElement("p");status.setAttribute("aria-live","polite");
const pageStatus=status;
const dialog=document.createElement("dialog");dialog.className="bi-checkout-dialog";dialog.setAttribute("aria-labelledby","biCheckoutHeading");
const header=document.createElement("header");header.className="bi-checkout-header";
const brand=document.createElement("div");const brandWord=document.createElement("strong");brandWord.id="biCheckoutHeading";brandWord.textContent="BetInsight Pay";const subtitle=document.createElement("small");subtitle.textContent="SICHERE DIREKTZAHLUNG";brand.append(brandWord,subtitle);
const close=document.createElement("button");close.type="button";close.className="bi-checkout-close";close.setAttribute("aria-label","Zahlungsfenster schließen");close.textContent="×";close.onclick=()=>dialog.close();header.append(brand,close);
const body=document.createElement("div");body.className="bi-checkout-content";
const details=document.createElement("section");body.append(details);body.append(pageStatus);pageStatus.className="bi-checkout-state";dialog.append(header,body);document.body.append(dialog);
let countdown=null,seenRendered=false,renderedKey="",animatedOrder="";
function openPayment(){if(!dialog.open){if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");}}
function node(tag,cls,txt,parent=details){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;parent.append(n);return n;}
function copyRow(label,value,shown=value){node("span","bi-checkout-label",label);const row=node("div","bi-checkout-copyrow");node("code","",String(shown),row);const b=node("button","bi-checkout-copy","Kopieren",row);b.type="button";b.onclick=async()=>{try{await navigator.clipboard.writeText(String(value));b.textContent="Kopiert ✓";}catch{b.textContent="Manuell kopieren";}};}
function qrAddress(address){const wrap=node("div","bi-checkout-qr");try{if(typeof window.qrcode!=="function")throw Error("QR unavailable");const q=window.qrcode(0,"M");q.addData(address);q.make();const n=q.getModuleCount(),scale=8,margin=4;const canvas=node("canvas","",undefined,wrap);canvas.width=canvas.height=(n+2*margin)*scale;canvas.setAttribute("role","img");canvas.setAttribute("aria-label","QR-Code der Empfangsadresse");const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas unavailable");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#000";for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))ctx.fillRect((x+margin)*scale,(y+margin)*scale,scale,scale);}
catch{wrap.remove();node("p","bi-checkout-caption","QR-Code nicht verfügbar. Bitte die Adresse unten kopieren.");}}
function updateClock(o,clock){clearInterval(countdown);const tick=()=>{const ms=Math.max(0,Date.parse(o.expiresAt)-Date.now());const sec=Math.ceil(ms/1000);clock.textContent=ms>0?"Noch "+String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")+" Minuten":"Zahlungsfrist abgelaufen";if(ms<=0){clearInterval(countdown);if(order?.orderId===o.orderId&&order?.status==="UNPAID"){renderedKey="";showOrder({...o,recipient:null,status:"EXPIRED"});}}};tick();if(Date.parse(o.expiresAt)>Date.now())countdown=setInterval(tick,1000);}
function celebrate(o){if(animatedOrder===o.orderId)return;animatedOrder=o.orderId;try{const k="bi_pay_gold_"+o.orderId;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");}catch{}if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const rain=node("div","bi-checkout-coins",undefined,dialog);rain.setAttribute("aria-hidden","true");for(let i=0;i<52;i++){const c=node("i","","✦",rain);c.style.setProperty("--x",Math.random()*100+"%");c.style.setProperty("--d",(2.2+Math.random()*2)+"s");c.style.setProperty("--delay",Math.random()*1.7+"s");c.style.setProperty("--drift",(Math.random()*150-75)+"px");}setTimeout(()=>rain.remove(),6500);}

function syncButton(){
 const available=!!packageSelect.value&&routeAvailable()&&!busy&&!order;
 pay.disabled=!available&&!order;pay.setAttribute("aria-disabled",String(pay.disabled));
 pay.title=available?"Sicheren Zahlungsauftrag erstellen":"Zahlungsweg derzeit nicht verfügbar";
 pay.textContent=order?"Zahlungsfenster öffnen":busy?"Zahlungsauftrag wird vorbereitet …":available?"Zahlung starten":!packageSelect.value?"Bitte Paket auswählen":"Zahlung noch nicht verfügbar";
}
async function api(action,extra={}){
 const t=token();if(!window.BetInsightSession?.isUuid?.(t))throw Error("MEMBER_AUTH_REQUIRED");
 const res=await fetch("https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-pay-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t,action,...extra}),cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(15000)});
 const v=await res.json();if(token()!==t)throw Error("SESSION_CHANGED");
 if(!res.ok||!v.ok)throw Error(v.reason||"CHECKOUT_UNAVAILABLE");return v;
}
function showOrder(o){
 const prior=order?.status;order=o;const key=[o.orderId,o.status,o.amount,o.recipient,o.destinationTag,o.expiresAt].join("|");
 if(key!==renderedKey){
  renderedKey=key;clearInterval(countdown);details.replaceChildren();
  const summary=node("div","bi-checkout-summary");node("strong","",o.units+" Units",summary);node("span","",Number(o.priceEur).toLocaleString("de-DE",{style:"currency",currency:"EUR"}),summary);
  if(o.recipient&&o.status==="UNPAID"&&Date.parse(o.expiresAt)>Date.now()){
   node("div","bi-checkout-network",networkLabel({network:o.network,asset:o.asset}));
   node("div","bi-checkout-amount",o.amount+" "+o.asset);
   qrAddress(o.recipient);
   node("p","bi-checkout-caption","QR-Code enthält nur die Empfangsadresse. Betrag und Netzwerk bitte exakt übernehmen.");
   copyRow("Exakter Betrag ("+o.asset+")",o.amount);
   copyRow("Empfangsadresse",o.recipient);
   if(o.destinationTag!==null&&o.destinationTag!==undefined){copyRow("Destination Tag – unbedingt angeben!",String(o.destinationTag));}
   if(o.status==="UNPAID"){const clock=node("div","bi-checkout-clock","");updateClock(o,clock);}
   status.textContent=o.status==="UNPAID"?"Bitte einmalig exakt diesen Betrag senden. Netzwerkgebühren zusätzlich tragen. Wir prüfen die Blockchain automatisch.":"Zahlung erkannt. Bitte nicht erneut senden.";
  }else if(o.status==="SETTLED"){
   const success=node("div","bi-checkout-success");node("div","bi-checkout-success-mark","✓",success);node("h2","","Zahlung erfolgreich!",success);node("p","",o.units+" Kauf-Units wurden gutgeschrieben.",success);
   status.textContent="Dein Kauf ist abgeschlossen.";
   const b=node("button","bi-checkout-next","Weiteren Kauf starten");b.type="button";b.onclick=()=>{dialog.close();order=null;request=null;renderedKey="";sessionStorage.removeItem(storageKey);details.replaceChildren();status.textContent="";syncButton();};
   openPayment();celebrate(o);
  }else{
   node("div","bi-checkout-network",o.status==="EXPIRED"?"Zahlungsfrist abgelaufen":o.status==="STOPPED"?"Zahlungsfrist beendet":o.status==="PAYMENT_SEEN"?"Zahlung erkannt":o.status==="MANUAL_REVIEW"?"Zahlung wird geprüft":"Auftrag wird geprüft");
   status.textContent="Bitte nicht erneut überweisen. Wenn du bereits bezahlt hast, behalte diesen Auftrag als Referenz.";
   if(["EXPIRED","STOPPED"].includes(o.status)){
    const check=node("button","bi-checkout-copy","Zahlungsstatus erneut prüfen");check.type="button";check.onclick=()=>refresh();
    const b=node("button","bi-checkout-next","Ich habe nicht bezahlt – neuen Auftrag starten");b.type="button";b.onclick=()=>{clearTimeout(poll);clearInterval(countdown);dialog.close();order=null;request=null;renderedKey="";seenRendered=false;sessionStorage.removeItem(storageKey);details.replaceChildren();status.textContent="";syncButton();};
   }
  }
  node("p","bi-checkout-ref","Auftrag: "+o.orderId);
 }
 if(!seenRendered||prior!==o.status&&o.status==="SETTLED"){openPayment();seenRendered=true;}
 clearTimeout(poll);
 if(!["SETTLED","MANUAL_REVIEW","STOPPED","EXPIRED"].includes(o.status)){poll=setTimeout(refresh,15000);}
 syncButton();
}
async function refresh(){if(!order)return;const id=order.orderId;try{const v=await api("status",{orderId:id});if(order?.orderId===id)showOrder(v.order);}catch{if(order?.orderId!==id)return;status.textContent="Status derzeit nicht erreichbar. Bitte nicht erneut bezahlen.";if(!["EXPIRED","STOPPED","MANUAL_REVIEW","SETTLED"].includes(order.status))poll=setTimeout(refresh,30000);}}
pay.addEventListener("click",async()=>{
 if(order){openPayment();return;}
 if(busy||!routeAvailable()||!packageSelect.value)return;
 busy=true;seenRendered=false;renderedKey="";details.replaceChildren();openPayment();syncButton();status.textContent="Auftrag wird erstellt ...";
 try{
 const choice={packageCode:packageSelect.value,network,asset:coin};
 if(!request){request={...choice,idempotencyKey:crypto.randomUUID()};sessionStorage.setItem(storageKey,JSON.stringify({request}));}
 if(request.packageCode!==choice.packageCode||request.network!==choice.network||request.asset!==choice.asset)throw Error("PENDING_REQUEST");
 let v;
 const deadline=Date.now()+150000,initialToken=token();
 for(;;){
   try{v=await api("create",request);break;}
   catch(e){
     if(e.message!=="PAYMENT_PREPARING"||Date.now()>=deadline||token()!==initialToken)throw e;
     status.textContent="Zahlungsdienst wird für deinen Auftrag gestartet. Kurs und Blockchain werden geprüft ...";
     await new Promise(resolve=>setTimeout(resolve,10000));
     if(token()!==initialToken)throw Error("SESSION_CHANGED");
   }
 }
 order=v.order;sessionStorage.setItem(storageKey,JSON.stringify({orderId:order.orderId}));showOrder(order);
 }catch(e){status.textContent="Auftrag nicht bestätigt ("+String(e.message).slice(0,90)+"). Bitte nicht überweisen. Bei erneutem Klick wird derselbe Auftrag abgefragt.";}
 finally{busy=false;syncButton();}
});
packageSelect.addEventListener("change",syncButton);
window.addEventListener("pagehide",()=>{clearTimeout(poll);clearInterval(countdown);});
async function startCheckout(){
 try{
 const v=await api("routes");released=new Set((v.routes||[]).map(r=>routeKey(r.network,r.asset)));
 const previous=JSON.parse(sessionStorage.getItem(storageKey)||"null");
 if(v.activeOrder){const o=v.activeOrder;packageSelect.value=o.packageCode;coin=o.asset;network=o.network;sessionStorage.setItem(storageKey,JSON.stringify({orderId:o.orderId}));showOrder(o);render();return;}
 const first=routes.find(r=>released.has(routeKey(r.network,r.asset))&&r.asset===coin)||routes.find(r=>released.has(routeKey(r.network,r.asset)));if(first&&!routeAvailable()){coin=first.asset;network=first.network;}
 if(previous?.orderId){const v=await api("status",{orderId:previous.orderId});showOrder(v.order);}
 else if(previous?.request){request=previous.request;packageSelect.value=request.packageCode;coin=request.asset;network=request.network;}
 }catch{status.textContent="Zahlungsdienst momentan nicht verfügbar.";}
 render();
}

let coin="USDT",network="BSC";
const allowed=()=>routes.filter(r=>r.asset===coin);
function render(){
 const query=el("biPaySearch").value.trim().toLowerCase();
 const grid=el("biPayCoins");grid.replaceChildren();
 for(const [symbol,name,color,glyph] of coins){
  if(query&&!(symbol+" "+name).toLowerCase().includes(query))continue;
  const b=document.createElement("button");b.type="button";b.className="bi-pay-coin";
  b.setAttribute("aria-pressed",String(coin===symbol));
  const icon=document.createElement("span");icon.className="bi-pay-icon";icon.style.background=color;icon.textContent=glyph;icon.setAttribute("aria-hidden","true");
  const title=document.createElement("b");title.textContent=symbol;
  const text=document.createElement("small");text.textContent=name;
  b.append(icon,title,text);
  if(symbol==="DOGE"){b.disabled=true;const soon=document.createElement("small");soon.textContent="Folgt in Kürze";b.append(soon);}
  else b.addEventListener("click",()=>{coin=symbol;network=(allowed().find(r=>released.has(routeKey(r.network,r.asset)))||allowed()[0]).network;render();});
  grid.append(b);
 }
 if(!grid.children.length){const msg=document.createElement("p");msg.textContent="Keine passende Kryptowährung.";grid.append(msg);}
 const list=el("biPayNetworks");list.replaceChildren();
 for(const route of allowed()){
  const b=document.createElement("button");b.type="button";b.textContent=networkLabel(route);
  b.setAttribute("aria-pressed",String(network===route.network)); if(!released.has(routeKey(route.network,route.asset)))b.textContent+=" · noch nicht verfügbar";
  b.addEventListener("click",()=>{network=route.network;render();});list.append(b);
 }
 const selected=allowed().find(r=>r.network===network);
 el("biPayHint").textContent=selected?selected.label+" · "+networkLabel(selected)+(network==="XRPL"?" · Destination Tag erforderlich":""):"";
 syncButton();
}
el("biPaySearch").addEventListener("input",render);render();startCheckout();
})();
