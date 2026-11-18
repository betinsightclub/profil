// Development-only TRON discovery and orchestration. No automatic credit, private keys or production cron.
// Use server-side trusted orders and adapters. Discovery index is not finality.
// Requires canonical persisted wallet allocation and assetIdentity, and atomic DB lease and event uniqueness before production.
// References: https://developers.tron.network/reference/get-trc20-transaction-info-by-account-address ; https://developers.tron.network/docs/confirmation-semantics
import {inspectTronPayment} from './tron-watchonly.mjs';
import {nextCheck,NETWORK_POLICY} from './poll-policy.mjs';
const TOKEN="a614f803b6fd780986a42c78ec9c7f77e6ded13c";
export async function discoverTron({recipientHex,createdMs,scanUntilMs,apiKey="",fetchImpl,maxPages=5,timeoutSignal}){
 const retry=reason=>({status:"RETRY",reason});
 if(!/^[0-9a-f]{40}$/i.test(recipientHex)||!Number.isSafeInteger(createdMs)||createdMs<0||!Number.isSafeInteger(scanUntilMs)||scanUntilMs<createdMs||!Number.isInteger(maxPages)||maxPages<1||maxPages>20)return retry("INVALID_SCAN_INPUT");
 const address="41"+recipientHex.toLowerCase(),ids=new Set(),seen=new Set();let fingerprint="";
 try{
 for(let page=0;page<maxPages;page++){
 const params={only_confirmed:"false",only_to:"true",contract_address:"41"+TOKEN,min_timestamp:String(createdMs),max_timestamp:String(scanUntilMs),order_by:"block_timestamp,asc",limit:"200",...(fingerprint?{fingerprint}:{})};
 const q=Object.entries(params).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&");
 const response=await fetchImpl("https://api.trongrid.io/v1/accounts/"+address+"/transactions/trc20?"+q,{headers:{accept:"application/json",...(apiKey?{"TRON-PRO-API-KEY":apiKey}:{})},redirect:"error",signal:timeoutSignal()});
 if(!response.ok)return retry("INDEX_HTTP_ERROR");
 const data=await response.json();
 if(data?.success!==true||!Array.isArray(data.data)||data.data.length>200)return retry("INVALID_INDEX_DATA");
 for(const row of data.data){
 if(!row||!["Transfer","Approval"].includes(row.type))return retry("UNSUPPORTED_INDEX_RECORD");
 if(row.type==="Approval")continue;
 if(!/^[0-9a-f]{64}$/i.test(row.transaction_id)||!Number.isSafeInteger(row.block_timestamp)||row.block_timestamp<createdMs||row.block_timestamp>scanUntilMs)return retry("INVALID_INDEX_RECORD");
 ids.add(row.transaction_id.toLowerCase());
 }
 const next=data.meta?.fingerprint;
 if(next==null||next===""){if(data.data.length===200||data.meta?.links?.next)return retry("PAGINATION_UNCERTAIN");return {status:"COMPLETE",txids:[...ids]}}
 if(typeof next!=="string"||next.length>2048||seen.has(next))return retry("BAD_PAGINATION");
 seen.add(next);fingerprint=next;
 }
 return retry("PAGE_LIMIT_REACHED");
 }catch{return retry("INDEX_UNAVAILABLE")}
}
export async function scanTronOrder(order,context,deps){
 const retry=reason=>({status:"RETRY",reason}),review=reason=>({status:"MANUAL_REVIEW",reason});
 if(!order||order.network!=="TRON"||order.asset!=="USDT"||order.assetIdentity!=="41"+TOKEN||order.allocationKind!=="unique-address"||order.ownerVerified!==true||!/^[0-9a-f]{40}$/i.test(order.recipientHex)||!order.id||!Number.isSafeInteger(order.walletVersion)||order.walletVersion<1||!/^[1-9]\d*$/.test(order.amountRaw)||!Number.isSafeInteger(order.createdMs)||!Number.isSafeInteger(order.expiresMs)||order.expiresMs<=order.createdMs)return review("UNSAFE_ORDER");
 if(!Number.isSafeInteger(context.now)||context.now<order.createdMs)return retry("INVALID_CLOCK");
 try{
 const discovery=await deps.discover({recipientHex:order.recipientHex,createdMs:order.createdMs,scanUntilMs:context.now});
 if(discovery.status!=="COMPLETE"||!Array.isArray(discovery.txids))return retry(discovery.reason||"DISCOVERY_FAILED");
 const txids=[...new Set([...discovery.txids,...(context.previouslySeenTxids||[])])];
 if(txids.some(t=>!/^[0-9a-f]{64}$/i.test(t)))return retry("INVALID_TXID");
 if(txids.length>20)return review("TOO_MANY_MATCHES");
 if(!txids.length)return {status:"UNPAID",seenTxids:[]};
 const input={network:"tron-mainnet",asset:"USDT",recipientHex:order.recipientHex,amountRaw:order.amountRaw,createdMs:order.createdMs,expiresMs:order.expiresMs};
 const results=[];for(const txid of txids)results.push(await deps.inspect(input,txid));
 if(results.some(r=>r.status==="REVIEW"))return {...review("TRANSFER_REQUIRES_REVIEW"),seenTxids:txids};
 if(results.some(r=>r.status==="RETRY"))return {...retry("RECEIPT_UNAVAILABLE"),seenTxids:txids};
 if(results.some(r=>r.status==="PENDING"))return {status:"PAYMENT_SEEN",seenTxids:txids};
 if(results.length!==1||results[0].status!=="CANDIDATE")return {...review("AMBIGUOUS_TRANSFERS"),seenTxids:txids};
 const c=results[0];if(c.network!=="tron-mainnet"||c.txid!==txids[0]||c.recipient!==order.recipientHex.toLowerCase()||c.amountRaw!==order.amountRaw||c.token!==TOKEN||c.finality!=="solidified"||!Number.isInteger(c.eventIndex)||c.eventIndex<0||c.eventKey!=="tron-mainnet:"+c.txid+":"+c.eventIndex||!Number.isSafeInteger(c.blockTimeMs)||c.blockTimeMs<order.createdMs||c.blockTimeMs>order.expiresMs)return review("CANDIDATE_MISMATCH");
 return {status:"VERIFIED_CANDIDATE",orderId:order.id,walletVersion:order.walletVersion,eventKey:c.eventKey,candidate:c,seenTxids:txids};
 }catch{return retry("SCAN_EXCEPTION")}
}
export function applyScanResult(job,result,now,scheduler){
 if(!Number.isSafeInteger(now)||now<job.createdMs||now<job.nextCheckMs||job.nextCheckMs===null)return {ok:false,reason:"NOT_DUE"};
 if(job.status!=="UNPAID"&&job.status!=="PAYMENT_SEEN")return {ok:false,reason:"TERMINAL"};
 if(!["UNPAID","RETRY","PAYMENT_SEEN","MANUAL_REVIEW","VERIFIED_CANDIDATE"].includes(result.status))return {ok:false,reason:"UNKNOWN_RESULT"};
 const j={...job,lastCheckMs:now,seenTxids:[...new Set([...(job.seenTxids||[]),...(result.seenTxids||[])])]};
 if(result.status==="MANUAL_REVIEW"||result.status==="VERIFIED_CANDIDATE"){j.status=result.status;j.nextCheckMs=null;return {ok:true,job:j}}
 if(result.status==="RETRY"){j.lastError=result.reason||"UNKNOWN_RPC_ERROR"; if(j.seenTxids.length)j.status="PAYMENT_SEEN";
  // API failure is never a successful empty scan. Retry at network cadence, capped at 24h after day one for unpaid jobs.
  const day=86400000; if(j.status==="UNPAID"&&now>=j.createdMs+7*day){j.status="MANUAL_REVIEW";j.nextCheckMs=null;}else{j.nextCheckMs=now+(j.status==="UNPAID"&&now>=j.createdMs+day?day:scheduler.policy[j.network].poll*60000);}return {ok:true,job:j};
 }
 j.lastError=null;j.status=result.status==="UNPAID"&&j.seenTxids.length?"PAYMENT_SEEN":result.status;
 if(j.status==="UNPAID")j.emptyChecks++;
 j.nextCheckMs=scheduler.nextCheck({network:j.network,createdMs:j.createdMs,lastCheckMs:now,emptyChecks:j.emptyChecks,status:j.status});
 if(j.nextCheckMs===null)j.status="STOPPED";return {ok:true,job:j};
}
export async function testScanner(){
 const a="b".repeat(40),tx="a".repeat(64),tx2="c".repeat(64),order={id:"demo",network:"TRON",asset:"USDT",assetIdentity:"41"+TOKEN,allocationKind:"unique-address",ownerVerified:true,recipientHex:a,createdMs:1000,expiresMs:2000,amountRaw:"123",walletVersion:1},ctx={now:3000},cand={status:"CANDIDATE",network:"tron-mainnet",recipient:a,txid:tx,amountRaw:"123",token:TOKEN,finality:"solidified",eventIndex:0,eventKey:"tron-mainnet:"+tx+":0",blockTimeMs:1500};
 const run=(d,i,o=order,c=ctx)=>scanTronOrder(o,c,{discover:async()=>d,inspect:async()=>i});
 const found={status:"COMPLETE",txids:[tx]},empty={status:"COMPLETE",txids:[]};
 const rows=[["empty",(await run(empty,null)).status==="UNPAID"],["api failure",(await run({status:"RETRY"},null)).status==="RETRY"],["pending",(await run(found,{status:"PENDING"})).status==="PAYMENT_SEEN"],["receipt failure",(await run(found,{status:"RETRY"})).status==="RETRY"],["wrong amount",(await run(found,{...cand,amountRaw:"999"})).status==="MANUAL_REVIEW"],["valid solidified",(await run(found,cand)).status==="VERIFIED_CANDIDATE"],["late transfer",(await run(found,{...cand,blockTimeMs:2001})).status==="MANUAL_REVIEW"],["shared address refused",(await run(found,cand,{...order,allocationKind:"shared-address"})).status==="MANUAL_REVIEW"],["wrong token",(await run(found,{...cand,token:"bad"})).status==="MANUAL_REVIEW"],["wrong contract snapshot",(await run(found,cand,{...order,assetIdentity:"bad"})).status==="MANUAL_REVIEW"],["wrong event key",(await run(found,{...cand,eventKey:"bad"})).status==="MANUAL_REVIEW"],["multiple tx",(await run({status:"COMPLETE",txids:[tx,tx2]},cand)).status==="MANUAL_REVIEW"],["known tx preserved",(await run(empty,cand,order,{...ctx,previouslySeenTxids:[tx]})).status==="VERIFIED_CANDIDATE"]];
 const mock=pages=>{let i=0;return async()=>({ok:true,json:async()=>pages[i++]})},record={type:"Transfer",transaction_id:tx,block_timestamp:1500},scan=(pages,maxPages=5)=>discoverTron({recipientHex:a,createdMs:1000,scanUntilMs:3000,fetchImpl:mock(pages),maxPages,timeoutSignal:()=>undefined});
 rows.push(["empty scan",(await scan([{success:true,data:[]}])).status==="COMPLETE"],["malformed response",(await scan([{success:false,data:[]}])).status==="RETRY"],["pagination",(await scan([{success:true,data:[record],meta:{fingerprint:"a"}},{success:true,data:[{...record,transaction_id:tx2}]}])).txids?.length===2],["page limit not empty",(await scan([{success:true,data:[record],meta:{fingerprint:"a"}}],1)).status==="RETRY"],["duplicate cursor",(await scan([{success:true,data:[],meta:{fingerprint:"a"}},{success:true,data:[],meta:{fingerprint:"a"}}])).status==="RETRY"],["deduplicate tx",(await scan([{success:true,data:[record,record]}])).txids?.length===1]);
 const scheduler={policy:{TRON:{poll:3}},nextCheck:({lastCheckMs})=>lastCheckMs+180000},job={createdMs:0,nextCheckMs:180000,network:"TRON",status:"UNPAID",emptyChecks:0,seenTxids:[]};
 rows.push(["not due refused",!applyScanResult(job,{status:"UNPAID"},179999,scheduler).ok],["failed API does not increment",applyScanResult(job,{status:"RETRY"},180000,scheduler).job.emptyChecks===0],["empty scan increments",applyScanResult(job,{status:"UNPAID"},180000,scheduler).job.emptyChecks===1],["candidate stops scanning but not settled",applyScanResult(job,{status:"VERIFIED_CANDIDATE"},180000,scheduler).job.status==="VERIFIED_CANDIDATE"],["review stops",applyScanResult(job,{status:"MANUAL_REVIEW"},180000,scheduler).job.nextCheckMs===null],["seen tx remembered",applyScanResult(job,{status:"PAYMENT_SEEN",seenTxids:[tx]},180000,scheduler).job.seenTxids[0]===tx],["retry after day seven enters review",applyScanResult(job,{status:"RETRY"},7*86400000,scheduler).job.status==="MANUAL_REVIEW"]);
 return rows.map(([name,pass])=>({name,pass:pass===true}));
}
export function makeWorkerAdapters(apiKey,fetchImpl=fetch){return {discover: args=>discoverTron({...args,apiKey,fetchImpl,timeoutSignal:()=>AbortSignal.timeout(12000)}), inspect:(order,txid)=>inspectTronPayment(order,txid,fetchImpl,apiKey),scheduler:{policy:NETWORK_POLICY,nextCheck}}}
