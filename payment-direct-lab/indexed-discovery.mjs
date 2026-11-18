// Development-only address history candidate discovery. Never credit or infer absence of payment from index results. Live provider adapters, durable anchors and receipt verification still required.
export async function discoverIndexed(order,range,deps){
 const fail=reason=>({status:"RETRY",reason});
 const hash=x=>typeof x==="string"&&/^[a-f0-9]{64}$/i.test(x);
 const pub=x=>typeof x==="string"&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(x);
 const sig=x=>typeof x==="string"&&/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(x);
 const height=x=>Number.isSafeInteger(x)&&x>=0;
 const ids=new Set(),seen=new Set(),net=order?.network;
 if(!order?.id||order.ownerVerified!==true||!range||!height(range.from)||!height(range.to)||range.to<range.from)return fail("UNSAFE_INPUT");
 const complete=()=>({status:"INDEX_CANDIDATES",txids:[...ids],scope:"index_only",authorizesCredit:false});
 try{
 if(net==="SOLANA"){
  if(order.allocationKind!=="unique-address"||!pub(order.address)||!["SOL","USDT","USDC"].includes(order.asset)||order.asset!=="SOL"&&(!pub(order.tokenAccount)||order.tokenAccountVerified!==true))return fail("UNSAFE_SOL_ACCOUNT");
  if(await deps.rpc("getGenesisHash",[])!=="5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d")return fail("WRONG_CHAIN");
  const top=await deps.rpc("getSlot",[{commitment:"finalized"}]);
  if(!height(top)||top<range.to)return fail("FINALITY_UNAVAILABLE");
  let before,lastSlot=Infinity;
  for(let page=0;page<8;page++){
   const rows=await deps.rpc("getSignaturesForAddress",[order.asset==="SOL"?order.address:order.tokenAccount,{commitment:"finalized",minContextSlot:range.to,limit:100,...(before?{before}:{})}]);
   if(!Array.isArray(rows)||rows.length>100)return fail("BAD_PAGE");
   let past=false;
   for(const r of rows){
    if(!sig(r?.signature)||!height(r.slot)||r.slot>lastSlot||r.confirmationStatus!=="finalized"||seen.has(r.signature))return fail("BAD_SIGNATURE");
    seen.add(r.signature);lastSlot=r.slot;
    if(r.slot<range.from)past=true;
    else if(r.slot<=range.to)ids.add(r.signature);
   }
   if(past||rows.length===0)return complete();
   before=rows.at(-1).signature;
  }
  return fail("PAGE_LIMIT");
 }
 if(net==="XRPL"){
  if(order.allocationKind!=="xrpl-tag"||typeof order.address!=="string"||!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(order.address)||!height(order.tag)||order.tag<1||order.tag>4294967295||order.asset!=="XRP")return fail("UNSAFE_XRP_ACCOUNT");
  // Network ID must be established independently by the trusted adapter; not inferred from address.
  if(await deps.networkIdentity()!=="XRPL:0")return fail("WRONG_CHAIN");
  let marker;
  for(let page=0;page<10;page++){
   const r=await deps.rpc("account_tx",[{account:order.address,ledger_index_min:range.from,ledger_index_max:range.to,binary:false,forward:true,limit:100,api_version:2,...(marker!==undefined?{marker}:{})}]);
   if(r?.validated!==true||r.account!==order.address||r.ledger_index_min!==range.from||r.ledger_index_max!==range.to||!Array.isArray(r.transactions)||r.transactions.length>1000)return fail("INCOMPLETE_LEDGER_RANGE");
   for(const x of r.transactions){
    const t=x.tx_json;
    if(x.validated!==true||!t||!height(x.ledger_index)||x.ledger_index<range.from||x.ledger_index>range.to||!hash(x.hash))return fail("BAD_LEDGER_ENTRY");
    if(t.TransactionType==="Payment"&&t.Destination===order.address&&t.DestinationTag===order.tag)ids.add(x.hash.toUpperCase());
   }
   if(r.marker===undefined)return complete();
   const key=JSON.stringify(r.marker);if(!key||key.length>2048||seen.has(key))return fail("PAGINATION_LOOP");seen.add(key);marker=r.marker;
  }
  return fail("PAGE_LIMIT");
 }
 if(!["BITCOIN","LITECOIN","BITCOINCASH"].includes(net)||order.allocationKind!=="unique-address"||typeof order.address!=="string"||!/^[A-Za-z0-9:]{14,100}$/.test(order.address)||typeof order.scriptPubKey!=="string"||!/^(?:[a-f0-9]{2}){4,100}$/.test(order.scriptPubKey))return fail("UNSAFE_UTXO_ACCOUNT");
 if(net==="BITCOINCASH"){
  // Bitcore coin history endpoint: candidate-only, no claim of complete pagination.
  const rows=await deps.get("https://api.bitcore.io/api/BCH/mainnet/address/"+encodeURIComponent(order.address)+"/txs");
  if(!Array.isArray(rows)||rows.length>500)return fail("BCH_HISTORY_UNCERTAIN");
  for(const r of rows){
   if(r.chain!=="BCH"||r.network!=="mainnet"||r.address!==order.address||r.script!==order.scriptPubKey||!hash(r.mintTxid)||!Number.isSafeInteger(r.mintHeight)||!height(r.mintIndex)||!height(r.value))return fail("BCH_COIN_MISMATCH");
   if(r.value>0&&(r.mintHeight<0||r.mintHeight>=range.from&&r.mintHeight<=range.to))ids.add(r.mintTxid.toLowerCase());
  }
  return {...complete(),status:"PARTIAL_INDEX",reason:"BCH_PAGINATION_NOT_PROVEN"};
 }
 const coin=net==="BITCOIN"?"btc":"ltc",root="https://api.blockcypher.com/v1/"+coin+"/main";
 const info=await deps.get(root);
 if(info?.name!==coin.toUpperCase()+".main"||!height(info.height)||info.height<range.to)return fail("WRONG_CHAIN_OR_STALE_HEAD");
 let before=range.to+1;
 for(let page=0;page<8;page++){
  const r=await deps.get(root+"/addrs/"+encodeURIComponent(order.address)+"?limit=100&before="+before);
  if(r?.address!==order.address||!height(r.n_tx)||!height(r.unconfirmed_n_tx)||r.hasMore!==undefined&&typeof r.hasMore!=="boolean")return fail("BAD_ADDRESS_HISTORY");
  const rows=r.txrefs??[],unconfirmed=r.unconfirmed_txrefs??[];
  if(!Array.isArray(rows)||!Array.isArray(unconfirmed)||rows.length>2000||unconfirmed.length>2000||r.unconfirmed_n_tx>0&&!unconfirmed.length)return fail("INCOMPLETE_INDEX");
  let min=before;
  for(const x of [...rows,...unconfirmed]){
   if(!hash(x.tx_hash)||!Number.isSafeInteger(x.block_height)||!Number.isInteger(x.tx_output_n)||!height(x.value))return fail("BAD_TXREF");
   if(x.block_height>=0){if(x.block_height>=before)return fail("PAGE_OUTSIDE_RANGE");min=Math.min(min,x.block_height)}
   if(x.tx_output_n>=0&&x.value>0&&(x.block_height<0||x.block_height>=range.from))ids.add(x.tx_hash.toLowerCase());
  }
  if(!r.hasMore||min<range.from)return complete();
  if(min>=before)return fail("PAGINATION_STALLED");before=min;
 }
 return fail("PAGE_LIMIT");
 }catch{return fail("PROVIDER_FAILURE")}
}
