// Development: public read-only RPC diagnostic. No wallet addresses, keys, payments, or database access.
export async function rpcProbe(rpc,expectedChain,nowMs){
 const hash=v=>typeof v==="string"&&/^0x[0-9a-f]{64}$/i.test(v);
 const quantity=v=>typeof v==="string"&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(v)&&v.length<=66;
 const assert=(v,m)=>{if(!v)throw Error(m)};
 assert(await rpc("eth_chainId",[])===expectedChain,"WRONG_CHAIN");
 const latest=await rpc("eth_getBlockByNumber",["latest",false]),fin=await rpc("eth_getBlockByNumber",["finalized",false]);
 assert(latest&&fin&&quantity(latest.number)&&quantity(fin.number)&&hash(fin.hash)&&quantity(fin.timestamp),"FINALITY_UNAVAILABLE");
 assert(BigInt(latest.number)>=BigInt(fin.number),"HEAD_ORDER");
 const age=nowMs-Number(BigInt(fin.timestamp))*1000;
 assert(age>=-120000&&age<=3600000,"STALE_OR_FUTURE_FINALITY");
 const canon=await rpc("eth_getBlockByNumber",[fin.number,false]);
 assert(canon?.hash?.toLowerCase()===fin.hash.toLowerCase(),"CANONICAL_MISMATCH");
 const txids=canon.transactions;
 assert(Array.isArray(txids)&&txids.every(hash),"INVALID_TX_LIST");
 // Use a public historical tx from the finalized block, never a real customer wallet.
 if(!txids.length)return {status:"LIMITED",reason:"EMPTY_FINALIZED_BLOCK",finalized:BigInt(fin.number).toString()};
 const id=txids[0],tx=await rpc("eth_getTransactionByHash",[id]),receipt=await rpc("eth_getTransactionReceipt",[id]);
 assert(tx?.hash?.toLowerCase()===id.toLowerCase()&&receipt?.transactionHash?.toLowerCase()===id.toLowerCase()&&receipt?.blockHash?.toLowerCase()===fin.hash.toLowerCase()&&tx?.blockHash?.toLowerCase()===fin.hash.toLowerCase(),"RECEIPT_MISMATCH");
 assert(receipt.status==="0x0"||receipt.status==="0x1","BAD_RECEIPT_STATUS");
 // A narrow eth_getLogs request proves the provider supports log queries, not an address index.
 const logs=await rpc("eth_getLogs",[{fromBlock:fin.number,toBlock:fin.number,topics:["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]}]);
 assert(Array.isArray(logs)&&logs.every(l=>l.blockHash?.toLowerCase()===fin.hash.toLowerCase()&&l.removed===false),"LOG_QUERY_MISMATCH");
 return {status:"PASS",finalized:BigInt(fin.number).toString(),head:BigInt(latest.number).toString(),finalityAgeSeconds:Math.round(age/1000),receipt:"OK",transferLogs:logs.length};
}
const providers=[["Ethereum","0x1","https://ethereum-rpc.publicnode.com"],["BNB Chain","0x38","https://bsc-rpc.publicnode.com"],["Polygon","0x89","https://polygon-bor-rpc.publicnode.com"]];
const allowed=new Set(["eth_chainId","eth_getBlockByNumber","eth_getTransactionByHash","eth_getTransactionReceipt","eth_getLogs"]);
function createRpc(url){
 let id=0;
 return async(method,params)=>{
 if(!allowed.has(method))throw Error("METHOD_NOT_ALLOWED");
 const reqId=++id;
 const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:reqId,method,params}),redirect:"error",signal:AbortSignal.timeout(16000)});
 if(!res.ok)throw Error("HTTP_"+res.status);
 const body=await res.text();if(body.length>8000000)throw Error("RESPONSE_TOO_LARGE");
 const obj=JSON.parse(body);if(obj.jsonrpc!=="2.0"||obj.id!==reqId||obj.error||!("result" in obj))throw Error(method+": RPC_"+(obj.error?.code??"INVALID"));
 return obj.result;
 };
}
let failures=0;
for(const [name,chain,url] of providers){
 if(process.argv.includes("--bsc-only")&&chain!=="0x38")continue;
 try{const r=await rpcProbe(createRpc(url),chain,Date.now());console.log(name,JSON.stringify(r));if(r.status!=="PASS")failures++;}
 catch(e){console.log(name,JSON.stringify({status:"FAIL",reason:String(e.message).slice(0,180)}));failures++;}
}
console.log("EVM RPC probe completed; no transactions sent; no balance changes.");
process.exitCode=failures?1:0;
