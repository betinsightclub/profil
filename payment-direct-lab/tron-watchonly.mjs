// BetInsight Pay: isolated watch-only TRC20 prototype, not deployed.
// No signing, no wallet secrets, no DB writes, no automatic credits.
// Order recipient must be an independently verified, uniquely allocated address.
// Never trust order data or blockchain responses from a browser. Only call from trusted backend.
// Mainnet USDT contract hex must be confirmed against Tether before go-live.
// Finality source: https://developers.tron.network/docs/confirmation-semantics

export function verifySolidifiedReceipt(order,txid,body,receipt){
  const hash=/^[0-9a-f]{64}$/i, address=/^[0-9a-f]{40}$/i, raw=/^[0-9a-f]{64}$/i;
  const transfer="ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const token="a614f803b6fd780986a42c78ec9c7f77e6ded13c";
  const review=reason=>({status:"REVIEW",reason});
  if(!order||order.network!=="tron-mainnet"||order.asset!=="USDT"||!address.test(order.recipientHex)||!/^[1-9][0-9]*$/.test(order.amountRaw)||!Number.isSafeInteger(order.createdMs)||!Number.isSafeInteger(order.expiresMs)||order.createdMs>=order.expiresMs||!hash.test(txid))return review("INVALID_INPUT");
  if(!body?.txID||!receipt?.id)return {status:"PENDING",reason:"SOLIDIFIED_DATA_MISSING"};
  if(body.txID.toLowerCase()!==txid.toLowerCase()||receipt.id.toLowerCase()!==txid.toLowerCase())return review("TXID_MISMATCH");
  if(!Array.isArray(body.ret)||!body.ret.length||body.ret.some(r=>r.contractRet!=="SUCCESS")||receipt.receipt?.result!=="SUCCESS")return review("EXECUTION_NOT_SUCCESSFUL");
  if(!Number.isSafeInteger(receipt.blockNumber)||receipt.blockNumber<1||!Number.isSafeInteger(receipt.blockTimeStamp)||receipt.blockTimeStamp<order.createdMs||receipt.blockTimeStamp>order.expiresMs)return review("INVALID_BLOCK_OR_TIME");
  if(!Array.isArray(receipt.log))return review("MISSING_LOGS");
  const recipient=order.recipientHex.toLowerCase();
  const candidates=receipt.log.flatMap((log,index)=>{
    if(typeof log.address!=="string"||log.address.toLowerCase()!==token||!Array.isArray(log.topics)||log.topics.length!==3||String(log.topics[0]).toLowerCase()!==transfer||!raw.test(log.topics[1])||!raw.test(log.topics[2])||!/^0{24}/.test(log.topics[1])||String(log.topics[2]).toLowerCase()!=="0".repeat(24)+recipient||!raw.test(log.data))return [];
    return [{index,amount:BigInt("0x"+log.data)}];
  });
  if(candidates.length!==1)return review("TRANSFER_MISSING_OR_AMBIGUOUS");
  const hit=candidates[0];
  if(hit.amount!==BigInt(order.amountRaw))return review("AMOUNT_MISMATCH");
  // A candidate is not a settled payment. Ownership, unique allocation and atomic replay protection remain mandatory.
  return {status:"CANDIDATE",network:order.network,txid:txid.toLowerCase(),eventIndex:hit.index,token,recipient,amountRaw:hit.amount.toString(),blockNumber:receipt.blockNumber,blockTimeMs:receipt.blockTimeStamp,finality:"solidified",eventKey:order.network+":"+txid.toLowerCase()+":"+hit.index};
}

export async function inspectTronPayment(order,txid,fetchImpl=fetch,apiKey=""){
  if(!/^[0-9a-f]{64}$/i.test(txid))return {status:"REVIEW",reason:"INVALID_TXID"};
  try{
    const request=async path=>{
      const response=await fetchImpl("https://api.trongrid.io/walletsolidity/"+path,{method:"POST",headers:{"Content-Type":"application/json",...(apiKey?{"TRON-PRO-API-KEY":apiKey}:{})},body:JSON.stringify({value:txid,visible:false}),signal:AbortSignal.timeout(12000),redirect:"error"});
      if(!response.ok)throw Error("RPC_UNAVAILABLE");
      return response.json();
    };
    const [body,receipt]=await Promise.all([request("gettransactionbyid"),request("gettransactioninfobyid")]);
    return verifySolidifiedReceipt(order,txid,body,receipt);
  }catch{return {status:"RETRY",reason:"RPC_UNAVAILABLE_OR_INVALID_RESPONSE"}}
}

export function runFixtureTests(){
  const txid="a".repeat(64),recipientHex="b".repeat(40),
  order={network:"tron-mainnet",asset:"USDT",recipientHex,amountRaw:"49000000",createdMs:1000,expiresMs:2000},body={txID:txid,ret:[{contractRet:"SUCCESS"}]},log={address:"a614f803b6fd780986a42c78ec9c7f77e6ded13c",topics:["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0".repeat(24)+"c".repeat(40),"0".repeat(24)+recipientHex],data:BigInt(order.amountRaw).toString(16).padStart(64,"0")},receipt={id:txid,blockNumber:123,blockTimeStamp:1500,receipt:{result:"SUCCESS"},log:[log]};
  const cases=[
    ["exact transfer","CANDIDATE",order,body,receipt],
    ["missing solidified receipt","PENDING",order,body,{}],
    ["wrong hash","REVIEW",order,body,{...receipt,id:"c".repeat(64)}],
    ["failed receipt","REVIEW",order,body,{...receipt,receipt:{result:"REVERT"}}],
    ["failed transaction","REVIEW",order,{...body,ret:[{contractRet:"REVERT"}]},receipt],
    ["wrong recipient","REVIEW",{...order,recipientHex:"d".repeat(40)},body,receipt],
    ["wrong token","REVIEW",order,body,{...receipt,log:[{...log,address:"d".repeat(40)}]}],
    ["wrong network","REVIEW",{...order,network:"bsc"},body,receipt],
    ["underpaid","REVIEW",{...order,amountRaw:"49000001"},body,receipt],
    ["overpaid","REVIEW",{...order,amountRaw:"48999999"},body,receipt],
    ["late payment","REVIEW",order,body,{...receipt,blockTimeStamp:2001}],
    ["before order","REVIEW",order,body,{...receipt,blockTimeStamp:999}],
    ["ambiguous event","REVIEW",order,body,{...receipt,log:[log,log]}],
    ["missing execution result","REVIEW",order,body,{...receipt,receipt:{}}],
    ["malformed amount","REVIEW",{...order,amountRaw:"1e6"},body,receipt]
  ];
  return cases.map(([name,expected,o,b,r])=>({name,expected,actual:verifySolidifiedReceipt(o,txid,b,r).status})).map(x=>({...x,pass:x.expected===x.actual}));
}
