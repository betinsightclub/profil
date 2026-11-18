// Development-only bounded discovery, not final payment verification. Never advances a durable cursor or posts funds.
// Native internal transfers are not covered. Provider completeness and canonical cursor anchoring must be enforced by the eventual worker.
export async function scanEvmRange(order,range,rpc){
 const fail=reason=>({status:"RETRY",reason});
 const chains={ETHEREUM:"0x1",BSC:"0x38",POLYGON:"0x89"};
 const hash=x=>typeof x==="string"&&/^0x[0-9a-f]{64}$/i.test(x);
 const address=x=>typeof x==="string"&&/^0x[0-9a-f]{40}$/i.test(x);
 const quantity=x=>typeof x==="string"&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(x)&&x.length<=66;
 const eq=(a,b)=>typeof a==="string"&&typeof b==="string"&&a.toLowerCase()===b.toLowerCase();
 const hex=x=>"0x"+x.toString(16);
 const topic="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
 const chain=chains[order?.network];
 if(!chain||!address(order?.recipient)||order.allocationKind!=="unique-address"||order.ownerVerified!==true||!["native","erc20"].includes(order.kind)||(order.kind==="erc20"&&!address(order.contract))||typeof rpc!=="function")return fail("UNSAFE_ORDER");
 if(typeof range?.from!=="bigint"||typeof range?.to!=="bigint"||range.from<0n||range.to<range.from||range.to-range.from>=(order.kind==="native"?12n:128n))return fail("INVALID_OR_OVERSIZE_RANGE");
 try{
  if(await rpc("eth_chainId",[])!==chain)return fail("WRONG_CHAIN");
  const finalized=await rpc("eth_getBlockByNumber",["finalized",false]);
  if(!quantity(finalized?.number)||!hash(finalized?.hash)||range.to>BigInt(finalized.number))return fail("FINALITY_UNAVAILABLE");
  const boundary=await rpc("eth_getBlockByNumber",[hex(range.to),false]);
  if(!hash(boundary?.hash)||!quantity(boundary?.number)||BigInt(boundary.number)!==range.to)return fail("BOUNDARY_UNAVAILABLE");
  const ids=new Set();
  if(order.kind==="erc20"){
   const logs=await rpc("eth_getLogs",[{fromBlock:hex(range.from),toBlock:hex(range.to),address:order.contract,topics:[topic,null,"0x"+"0".repeat(24)+order.recipient.slice(2).toLowerCase()]}]);
   // Large/full responses fail closed; provider responses cannot establish completeness beyond provider guarantees.
   if(!Array.isArray(logs)||logs.length>=1000)return fail("LOG_RESULT_UNCERTAIN");
   for(const l of logs){
    if(!eq(l?.address,order.contract)||!Array.isArray(l.topics)||l.topics.length!==3||!eq(l.topics[0],topic)||!eq(l.topics[2],"0x"+"0".repeat(24)+order.recipient.slice(2))||!hash(l.transactionHash)||!hash(l.blockHash)||!quantity(l.blockNumber)||BigInt(l.blockNumber)<range.from||BigInt(l.blockNumber)>range.to||l.removed!==false||!quantity(l.logIndex))return fail("INVALID_LOG");
    ids.add(l.transactionHash.toLowerCase());
   }
  }else{
   let previous=null;
   for(let n=range.from;n<=range.to;n++){
    const b=await rpc("eth_getBlockByNumber",[hex(n),true]);
    if(!hash(b?.hash)||!hash(b.parentHash)||!quantity(b.number)||BigInt(b.number)!==n||!Array.isArray(b.transactions)||(previous&&!eq(previous,b.parentHash)))return fail("INVALID_BLOCK");
    previous=b.hash;
    for(const tx of b.transactions){
     if(!hash(tx?.hash)||!quantity(tx.value)||!eq(tx.blockHash,b.hash))return fail("INVALID_TRANSACTION");
     if(eq(tx.to,order.recipient)&&BigInt(tx.value)>0n)ids.add(tx.hash.toLowerCase());
    }
   }
   if(!eq(previous,boundary.hash))return fail("CANONICAL_CHANGED");
  }
  const again=await rpc("eth_getBlockByNumber",[hex(range.to),false]);
  if(!eq(again?.hash,boundary.hash))return fail("CANONICAL_CHANGED");
  return {status:"COMPLETE_RANGE",txids:[...ids],nextBlock:(range.to+1n).toString(),lastBlockHash:boundary.hash.toLowerCase(),scope:order.kind==="native"?"direct_native_only":"contract_transfer_logs"};
 }catch{return fail("RPC_FAILURE")}
}
