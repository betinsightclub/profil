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
const status=document.createElement("p");status.className="bi-pay-note";status.setAttribute("aria-live","polite");pay.after(status);
const details=document.createElement("section");details.style.cssText="margin-top:12px;text-align:left;overflow-wrap:anywhere";status.after(details);
function syncButton(){
 const available=!!packageSelect.value&&routeAvailable()&&!busy&&!order;
 pay.disabled=!available;pay.setAttribute("aria-disabled",String(!available));
 pay.title=available?"Sicheren Zahlungsauftrag erstellen":"Zahlungsweg derzeit nicht verfügbar";
 pay.textContent=order?"Zahlungsauftrag erstellt":busy?"Zahlungsauftrag wird vorbereitet …":available?"Zahlung starten":!packageSelect.value?"Bitte Paket auswählen":"Zahlung noch nicht verfügbar";
}
async function api(action,extra={}){
 const t=token();if(!window.BetInsightSession?.isUuid?.(t))throw Error("MEMBER_AUTH_REQUIRED");
 const res=await fetch("https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-pay-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t,action,...extra}),cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(15000)});
 const v=await res.json();if(token()!==t)throw Error("SESSION_CHANGED");
 if(!res.ok||!v.ok)throw Error(v.reason||"CHECKOUT_UNAVAILABLE");return v;
}
function line(label,value,copy=false,copyValue=value){
 const p=document.createElement("p");p.textContent=label+value;details.append(p);
 if(copy){const b=document.createElement("button");b.type="button";b.className="field";b.style.minHeight="34px";b.textContent=label.replace(/: $/,"")+" kopieren";b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(String(copyValue));b.textContent="Kopiert"}catch{b.textContent="Bitte manuell kopieren"}});details.append(b);}
}
function showOrder(o){
 order=o;details.replaceChildren();
 line("Auftrag: ",o.orderId);line("Paket: ",o.units+" Units");line("Status: ",o.status);
 if(o.recipient&&["UNPAID","PAYMENT_SEEN"].includes(o.status)){
 line("Netzwerk: ",networkLabel({network:o.network,asset:o.asset}));
 line("Betrag: ",o.amount+" "+o.asset,true,o.amount);
 line("Empfangsadresse: ",o.recipient,true);
 if(o.destinationTag!==null){line("Destination Tag (PFLICHT): ",String(o.destinationTag),true);line("Wichtig: ","Adresse UND Destination Tag im Wallet angeben.");}
 line("Gültig bis: ",new Date(o.expiresAt).toLocaleString());
 status.textContent=o.status==="UNPAID"?"Einmalig den exakten Betrag senden. Gebühren trägt der Sender. Status wird automatisch aktualisiert.":"Zahlung erkannt. Bitte nicht erneut senden.";
 }else if(o.status==="SETTLED"){status.textContent="Zahlung bestätigt. Units gutgeschrieben.";}
 else{status.textContent="Auftrag wird geprüft oder ist abgelaufen. Bitte nicht erneut überweisen.";}
 clearTimeout(poll);
 if(!["SETTLED","MANUAL_REVIEW","STOPPED","EXPIRED"].includes(o.status)){poll=setTimeout(refresh,15000);}
 else if(o.status==="SETTLED"){const b=document.createElement("button");b.type="button";b.className="field";b.textContent="Weiteren Kauf starten";b.onclick=()=>{order=null;request=null;sessionStorage.removeItem(storageKey);details.replaceChildren();status.textContent="";syncButton();};details.append(b);}
 syncButton();
}
async function refresh(){if(!order)return;try{const v=await api("status",{orderId:order.orderId});showOrder(v.order);}catch{status.textContent="Status derzeit nicht erreichbar. Bitte nicht erneut bezahlen.";poll=setTimeout(refresh,30000);}}
pay.addEventListener("click",async()=>{
 if(busy||order||!routeAvailable()||!packageSelect.value)return;
 busy=true;syncButton();status.textContent="Auftrag wird erstellt ...";
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
window.addEventListener("pagehide",()=>clearTimeout(poll));
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
