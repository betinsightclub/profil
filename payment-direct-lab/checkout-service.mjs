// Server-side checkout application service. No client-supplied price, address, or units.
// Adapter contracts: authenticate dashboard UUID, read authoritative package, verified registry,
// market source, atomic reserve_fixed_order, and owner-scoped lookup. No production deployment.
import {makeQuote,formatRaw} from "./quote-policy.mjs";
const publicPackages=new Set(["starter","basic","pro","elite","starter_bonus","basic_bonus","pro_bonus","elite_bonus"]);
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const positive=s=>typeof s==="string"&&/^[1-9]\d*$/.test(s);
function cents(value){
 const m=/^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(String(value));
 if(!m)throw Error("INVALID_CATALOG_PRICE");
 const result=BigInt(m[1])*100n+BigInt((m[2]||"").padEnd(2,"0"));
 if(result<=0n)throw Error("INVALID_CATALOG_PRICE");
 return result.toString();
}
export async function createCheckoutOrder({request,dashboardToken,adapters,now=Date.now()}){
 if(!request||Object.keys(request).some(k=>!["packageCode","network","asset","idempotencyKey"].includes(k))||!publicPackages.has(request.packageCode)||!uuid(request.idempotencyKey)||!uuid(dashboardToken))throw Error("INVALID_REQUEST");
 const member=await adapters.authenticate(dashboardToken);
 if(!member?.verified||!member.id||!member.email||member.email!==member.email.toLowerCase().trim())throw Error("MEMBER_AUTH_REQUIRED");
 // Retry returns the original order; do not recalculate an already reserved amount.
 const previous=await adapters.findOrder(member.id,request.idempotencyKey);
 if(previous){
  if(previous.memberId!==member.id||previous.packageCode!==request.packageCode||previous.network!==request.network||previous.asset!==request.asset)throw Error("IDEMPOTENCY_CONFLICT");
  return response(previous);
 }
 const pkg=await adapters.getPackage(request.packageCode);
 if(!pkg||pkg.code!==request.packageCode||pkg.active!==true||!positive(String(pkg.units)))throw Error("PACKAGE_UNAVAILABLE");
 const entry=await adapters.getEnabledAsset(request.network,request.asset);
 if(!entry?.enabled||!entry.verified||entry.network!==request.network||entry.asset!==request.asset||entry.network==="DOGECOIN")throw Error("PAYMENT_METHOD_UNAVAILABLE");
 const market=await adapters.getMarket(request.asset);
 const quote=makeQuote({pkg:{code:pkg.code,active:pkg.active,eurCents:cents(pkg.price_eur)},network:request.network,asset:request.asset,registry:{[request.network+":"+request.asset]:entry},market,now});
 // Reserve with no more than EUR0.05 extra, using the registry's payment precision.
 const step=10n**BigInt(entry.decimals-entry.payDecimals);
 const maxOffset=999; // DB enforces the fiat cap; adapter may choose a smaller range.
 const order=await adapters.reserve({member,packageSnapshot:pkg,quote,stepRaw:step.toString(),maxOffset,idempotencyKey:request.idempotencyKey});
 if(!order||order.memberId!==member.id||order.packageCode!==pkg.code||order.network!==request.network||order.asset!==request.asset||order.assetIdentity!==entry.assetIdentity||order.decimals!==entry.decimals||order.units!==String(pkg.units)||order.invoiceEurCents!==quote.eurCents||!positive(order.amountRaw)||BigInt(order.amountRaw)<BigInt(quote.amountRaw)||BigInt(order.amountRaw)>BigInt(quote.amountRaw)+step*BigInt(maxOffset))throw Error("RESERVATION_MISMATCH");
 return response(order);
}
function response(o){
 if(!uuid(o.id)||!positive(o.amountRaw)||!Number.isInteger(o.decimals)||o.decimals<0||o.decimals>18||typeof o.recipient!=="string"||!o.recipient||!Number.isSafeInteger(o.expiresMs)||!positive(o.units)||!positive(o.invoiceEurCents)||!(o.network==="XRPL"?Number.isSafeInteger(o.tag)&&o.tag>=1&&o.tag<=4294967295:o.tag===null))throw Error("INVALID_ORDER");
 return {orderId:o.id,packageCode:o.packageCode,units:o.units,invoiceEurCents:o.invoiceEurCents,network:o.network,asset:o.asset,amountRaw:o.amountRaw,amount:formatRaw(o.amountRaw,o.decimals),recipient:o.recipient,destinationTag:o.tag,expiresMs:o.expiresMs,status:o.status};
}
