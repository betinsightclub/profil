// Development only. Trusted normalized block adapter required for BCH; TRON uses SolidityNode only. No credit, no internal TRX transfers, no durable cursor writes.
export async function scanDirectBlockRange(order,range,provider){
 const retry=reason=>({status:"RETRY",reason});
 const hash=x=>typeof x==="string"&&/^[a-f0-9]{64}$/i.test(x);
 const num=x=>Number.isSafeInteger(x)&&x>=0;
 const net=order?.network,tron=net==="TRON";
 if(!order?.id||order.ownerVerified!==true||order.allocationKind!=="unique-address"||!(tron&&order.asset==="TRX"&&/^41[0-9a-f]{40}$/.test(order.addressHex??"")||net==="BITCOINCASH"&&order.asset==="BCH"&&/^(?:[0-9a-f]{2}){4,100}$/.test(order.scriptPubKey??"")))return retry("UNSAFE_ORDER");
 if(!num(range?.from)||range.from<1||!num(range.to)||range.to<range.from||range.to-range.from>=12||!hash(range.previousHash)||!hash(provider?.expectedGenesisHash))return retry("UNSAFE_RANGE_OR_ANCHOR");
 const txids=new Set(),events=[];
 try{
  if((await provider.genesis())!==provider.expectedGenesisHash)return retry("WRONG_NETWORK");
  const head=await provider.head();
  if(!num(head)||range.to>head)return retry("HEAD_UNAVAILABLE");
  let previous=range.previousHash;
  for(let n=range.from;n<=range.to;n++){
   const b=await provider.block(n);
   if(!b||b.height!==n||!hash(b.hash)||b.parentHash!==previous||!Array.isArray(b.transactions)||b.complete!==true||tron&&b.solidified!==true)return retry("INCOMPLETE_OR_NONCANONICAL_BLOCK");
   const seen=new Set();
   for(const t of b.transactions){
    if(!hash(t?.txid)||seen.has(t.txid)||!Array.isArray(t.outputs))return retry("MALFORMED_TRANSACTION");
    seen.add(t.txid);
    const indices=new Set();
    for(const o of t.outputs){
     if(!num(o.index)||indices.has(o.index)||typeof o.raw!=="string"||!/^\d{1,30}$/.test(o.raw)||typeof o.recipient!=="string")return retry("INVALID_OUTPUT");
     indices.add(o.index);
     if(o.recipient!==(tron?order.addressHex:order.scriptPubKey)||BigInt(o.raw)===0n)continue;
     txids.add(t.txid);
     events.push({txid:t.txid,index:o.index,raw:o.raw,block:n,blockHash:b.hash});
    }
   }
   previous=b.hash;
  }
  if(await provider.canonicalHash(range.to)!==previous)return retry("CANONICAL_CHANGED");
  return {status:"COMPLETE_RANGE",txids:[...txids],observations:events,nextBlock:range.to+1,lastBlockHash:previous,scope:tron?"direct_trx_only":"utxo_outputs",authorizesCredit:false};
 }catch{return retry("PROVIDER_FAILURE")}
}
export function normalizeTronBlock(b){
 const raw=b?.block_header?.raw_data;
 if(!raw||!Number.isSafeInteger(raw.number)||typeof b.blockID!=="string"||typeof raw.parentHash!=="string"||b.Error)throw Error("MALFORMED_BLOCK");
 // TRON omits transactions for empty blocks. Missing txs with a nonzero root fails closed.
 if(b.transactions===undefined&&!/^0{64}$/.test(raw.txTrieRoot??""))throw Error("TX_LIST_MISSING");
 if(b.transactions!==undefined&&!Array.isArray(b.transactions))throw Error("TX_LIST_INVALID");
 return {height:raw.number,hash:b.blockID,parentHash:raw.parentHash,complete:true,solidified:true,transactions:(b.transactions??[]).map(t=>{
  const cs=t.raw_data?.contract;if(!Array.isArray(cs)||cs.length!==1)throw Error("UNSUPPORTED_CONTRACT_LIST");
  const c=cs[0],v=c.parameter?.value;
  if(c.type==="TransferContract"&&(!v||!/^41[0-9a-f]{40}$/.test(v.to_address??"")||!Number.isSafeInteger(v.amount)||v.amount<=0))throw Error("BAD_TRX_TRANSFER");
  return {txid:t.txID,outputs:c.type==="TransferContract"?[{index:0,recipient:v.to_address,raw:String(v.amount)}]:[]};
 })};
}
