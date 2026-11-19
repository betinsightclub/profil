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
  else b.addEventListener("click",()=>{coin=symbol;network=allowed()[0].network;render();});
  grid.append(b);
 }
 if(!grid.children.length){const msg=document.createElement("p");msg.textContent="Keine passende Kryptowährung.";grid.append(msg);}
 const list=el("biPayNetworks");list.replaceChildren();
 for(const route of allowed()){
  const b=document.createElement("button");b.type="button";b.textContent=networkLabel(route);
  b.setAttribute("aria-pressed",String(network===route.network));
  b.addEventListener("click",()=>{network=route.network;render();});list.append(b);
 }
 const selected=allowed().find(r=>r.network===network);
 el("biPayHint").textContent=selected?selected.label+" · "+networkLabel(selected)+(network==="XRPL"?" · Destination Tag erforderlich":""):"";
 // No network call, no address display, no stored credentials and no payment initiation.
}
el("biPaySearch").addEventListener("input",render);render();
})();
