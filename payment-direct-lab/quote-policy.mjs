import {quoteExpires} from './poll-policy.mjs';
// DEVELOPMENT ONLY: server-side rates and integer quote arithmetic. No production API key, token registry, settlement, or wallet address.
export const COIN_IDS=Object.freeze({
  "BTC": "bitcoin",
  "BCH": "bitcoin-cash",
  "ETH": "ethereum",
  "BNB": "binancecoin",
  "SOL": "solana",
  "TRX": "tron",
  "POL": "polygon-ecosystem-token",
  "LTC": "litecoin",
  "DOGE": "dogecoin",
  "XRP": "ripple",
  "USDT": "tether",
  "USDC": "usd-coin"
});
function decimalFraction(value){
 // JSON number from market feed may use exponent notation. Preserve its canonical decimal representation.
 if(typeof value!=="number"&&typeof value!=="string")throw Error("INVALID_DECIMAL");
 const s=String(value);if(s.length>64)throw Error("INVALID_DECIMAL");
 const m=/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(s);if(!m)throw Error("INVALID_DECIMAL");
 const exponent=Number(m[3]||0)-(m[2]||"").length;if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>40)throw Error("INVALID_DECIMAL");
 const n=BigInt(m[1]+(m[2]||""));if(n<=0n)throw Error("INVALID_DECIMAL");
 return exponent>=0?{n:n*10n**BigInt(exponent),d:1n}:{n,d:10n**BigInt(-exponent)};
}
function ceilDiv(n,d){return (n+d-1n)/d}
export function makeQuote({pkg, network, asset, registry, market, now}){
 // Pure server-side policy. Registry must supply a verified, enabled exact chain/contract identity and decimals.
 if(!Number.isSafeInteger(now)||now<0)throw Error("INVALID_CLOCK");
 if(!pkg||pkg.active!==true||typeof pkg.eurCents!=="string"||!/^[1-9]\d{0,11}$/.test(pkg.eurCents)||typeof pkg.code!=="string"||!pkg.code)throw Error("INVALID_PACKAGE");
 const entry=registry?.[network+":"+asset];
 if(!entry||entry.network!==network||entry.asset!==asset||entry.verified!==true||entry.enabled!==true||!entry.assetIdentity||!Number.isInteger(entry.decimals)||entry.decimals<0||entry.decimals>18||!Number.isInteger(entry.payDecimals)||entry.payDecimals<0||entry.payDecimals>entry.decimals)throw Error("UNVERIFIED_ASSET");
 const id=COIN_IDS[asset];if(!id||market?.source!=="coingecko"||market.id!==id)throw Error("WRONG_RATE_SOURCE");
 if(!Number.isSafeInteger(market.updatedMs)||market.updatedMs>now||now-market.updatedMs>180000)throw Error("RATE_STALE");
 const eur=decimalFraction(market.eur),usd=decimalFraction(market.usd), cents=BigInt(pkg.eurCents);
 // Stablecoins also use actual observed price, never assume 1 USD.
 const units=ceilDiv(cents*eur.d*10n**BigInt(entry.payDecimals),100n*eur.n);
 const amountRaw=units*10n**BigInt(entry.decimals-entry.payDecimals);
 const usdCents=ceilDiv(cents*usd.n*eur.d,usd.d*eur.n);
 if(amountRaw<=0n||amountRaw>=2n**256n)throw Error("AMOUNT_OUT_OF_RANGE");
 return Object.freeze({packageCode:pkg.code,network,asset,assetIdentity:entry.assetIdentity,eurCents:pkg.eurCents,usdCents:usdCents.toString(),amountRaw:amountRaw.toString(),decimals:entry.decimals,payDecimals:entry.payDecimals,rateEur:String(market.eur),rateUsd:String(market.usd),source:market.source,rateUpdatedMs:market.updatedMs,createdMs:now,expiresMs:quoteExpires(network,now)});
}
export function formatRaw(raw,decimals){if(typeof raw!=="string"||!/^\d+$/.test(raw)||!Number.isInteger(decimals)||decimals<0||decimals>18)throw Error("INVALID_AMOUNT");const s=raw.padStart(decimals+1,"0");return decimals?s.slice(0,-decimals)+"."+s.slice(-decimals):s;}
export async function fetchMarketRates({apiKey,fetchImpl=fetch, now=Date.now}={}){
 // Server only. Do not call this from browser or embed the API key in source.
 if(typeof apiKey!=="string"||!apiKey.trim())throw Error("RATE_KEY_MISSING");
 const url="https://api.coingecko.com/api/v3/simple/price?ids="+encodeURIComponent(Object.values(COIN_IDS).join(","))+"&vs_currencies=eur%2Cusd&include_last_updated_at=true&precision=full";
 const response=await fetchImpl(url,{headers:{"x-cg-demo-api-key":apiKey,accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error("RATE_HTTP_"+response.status);
 const data=await response.json(),out={};
 for(const id of Object.values(COIN_IDS)){const p=data?.[id];if(!p||typeof p.eur!=="number"||typeof p.usd!=="number"||p.eur<=0||p.usd<=0||!Number.isFinite(p.eur)||!Number.isFinite(p.usd)||!Number.isSafeInteger(p.last_updated_at))continue;const updatedMs=p.last_updated_at*1000;if(!Number.isSafeInteger(updatedMs)||updatedMs>now()||now()-updatedMs>180000)continue;out[id]={source:"coingecko",id,eur:p.eur,usd:p.usd,updatedMs};}
 return out;
}
export function testQuote(){
 const now=1000000,pkg={active:true,code:"starter",eurCents:"4900"},entry={network:"TRON",asset:"USDT",assetIdentity:"TEST_TOKEN_ONLY",verified:true,enabled:true,decimals:6,payDecimals:6},registry={"TRON:USDT":entry},market={source:"coingecko",id:"tether",eur:"0.91",usd:"0.99",updatedMs:now-60000},c={pkg,network:"TRON",asset:"USDT",registry,market,now};
 const q=makeQuote(c), reject=x=>{try{makeQuote(x);return false}catch{return true}};
 const cases=[["exact ceiling",q.amountRaw==="53846154"],["USD conversion",q.usdCents==="5331"],["expiry",q.expiresMs===now+900000],["format",formatRaw(q.amountRaw,6)==="53.846154"],["stablecoin actual price",q.rateUsd==="0.99"],["frozen snapshot",Object.isFrozen(q)],["unknown network",reject({...c,network:"BSC"})],["unverified token",reject({...c,registry:{"TRON:USDT":{...entry,verified:false}}})],["disabled token",reject({...c,registry:{"TRON:USDT":{...entry,enabled:false}}})],["missing token identity",reject({...c,registry:{"TRON:USDT":{...entry,assetIdentity:""}}})],["bad precision",reject({...c,registry:{"TRON:USDT":{...entry,payDecimals:7}}})],["stale rate",reject({...c,market:{...market,updatedMs:now-180001}})],["future rate",reject({...c,market:{...market,updatedMs:now+1}})],["wrong coin",reject({...c,market:{...market,id:"usd-coin"}})],["zero rate",reject({...c,market:{...market,eur:0}})],["negative rate",reject({...c,market:{...market,eur:-1}})],["missing rate",reject({...c,market:null})],["bad EUR cents",reject({...c,pkg:{...pkg,eurCents:"49.00"}})],["inactive package",reject({...c,pkg:{...pkg,active:false}})],["exponential price",makeQuote({...c,market:{...market,eur:9.1e-1}}).amountRaw===q.amountRaw],["payment precision independent from chain precision",makeQuote({...c,registry:{"TRON:USDT":{...entry,payDecimals:2}}}).amountRaw==="53850000"]];return cases.map(([name,pass])=>({name,pass}));
}
