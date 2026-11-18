// Development-only settlement orchestration contract. All methods must use the same real SQL transaction.
// The transaction double tests rollback logic, not actual PostgreSQL locks or canonical financial writes.
// No live DB adapter, no live balance changes. Finance calculation supplied by trusted server.
export async function settleDirectOrder(db,orderId,request,calculateFinance){
 const fail=reason=>{throw Error(reason)}, positive=v=>typeof v==="string"&&/^[1-9]\d{0,77}$/.test(v);
 if(!orderId||!["EXACT_AUTO","MASTER_MANUAL"].includes(request?.mode))fail("INVALID_REQUEST");
 return db.transaction(async tx=>{
 const o=await tx.lockOrder(orderId);if(!o||o.id!==orderId)fail("ORDER_NOT_FOUND");
 const existing=await tx.findSettlement(orderId);
 if(existing){if(o.status!=="SETTLED"||existing.orderId!==orderId||existing.mode!==request.mode||(request.mode==="MASTER_MANUAL"&&existing.approvalReference!==request.approvalReference))fail("ALREADY_SETTLED_OR_INCONSISTENT");return {status:"ALREADY_SETTLED",receipt:existing}}
 if(!["VERIFIED_CANDIDATE","MANUAL_REVIEW"].includes(o.status)||!Number.isSafeInteger(o.revision)||o.revision<1||o.refundPending||!positive(o.expectedRaw)||!positive(o.invoiceEurMicro)||!positive(o.orderedUnits)||!o.memberId||!o.network||!o.assetIdentity||!o.recipient||!Number.isSafeInteger(o.createdMs)||!Number.isSafeInteger(o.expiresMs)||o.expiresMs<=o.createdMs)fail("ORDER_NOT_READY");
 const events=await tx.lockVerifiedEvents(orderId);if(!Array.isArray(events)||!events.length)fail("NO_VERIFIED_FUNDS");
 const keys=new Set();let raw=0n,gross=0n;
 for(const e of events){if(!e.eventKey||keys.has(e.eventKey)||e.orderId!==orderId||e.network!==o.network||e.assetIdentity!==o.assetIdentity||e.recipient!==o.recipient||e.tag!==o.tag||e.finalityVerified!==true||e.assignmentVerified!==true||e.valuationVerified!==true||e.consumedBy||!positive(e.raw)||!positive(e.eurMicro)||!Number.isSafeInteger(e.paymentMs)||e.paymentMs<o.createdMs)fail("UNSAFE_EVENT");keys.add(e.eventKey);raw+=BigInt(e.raw);gross+=BigInt(e.eurMicro)}
 const eventKeys=[...keys].sort(),snapshot={orderId,revision:o.revision,eventKeys,raw:raw.toString(),grossEurMicro:gross.toString()};let units=o.orderedUnits,approvalReference=null;
 if(request.mode==="EXACT_AUTO"){if(o.status!=="VERIFIED_CANDIDATE"||raw!==BigInt(o.expectedRaw)||events.some(e=>e.paymentMs>o.expiresMs))fail("MANUAL_REVIEW_REQUIRED")}
 else{const a=await tx.lockAndValidateMasterApproval(request.approvalReference,snapshot);if(!a||!a.reference||a.reference!==request.approvalReference||a.verified!==true||a.consumed||!positive(a.creditedUnits)||!a.reason)fail("APPROVAL_REQUIRED");units=a.creditedUnits;approvalReference=a.reference}
 const member=await tx.lockMemberAndSponsorSnapshot(o.memberId);if(!member||member.id!==o.memberId||!member.ownerRef||!Array.isArray(member.sponsors))fail("MEMBER_NOT_FOUND");
 const settlementKey="direct-payment:"+orderId;
 const f=calculateFinance({orderId,memberId:member.id,settlementKey,eventKeys,valuationVerified:true,assignmentVerified:true,finalityVerified:true,provider:"direct_crypto",grossEurMicro:gross.toString(),providerFeeEurMicro:"0",invoiceEurMicro:o.invoiceEurMicro,orderedUnits:o.orderedUnits,creditedUnits:units,ruleVersion:o.ruleVersion,referralBasisPoints:o.referralBasisPoints,sponsors:member.sponsors});
 if(f?.ok!==true||!f.finance)fail("FINANCE_REJECTED");
 const receipt={orderId,settlementKey,mode:request.mode,approvalReference,eventKeys,creditedUnits:units,actualEurMicro:gross.toString(),unitClass:"PURCHASE",movementType:"PURCHASE_CREDIT",sourceTag:request.mode==="EXACT_AUTO"?"DIRECT_CRYPTO_PURCHASE":"DIRECT_CRYPTO_MANUAL_ACCEPTANCE",orderedUnits:o.orderedUnits,invoiceEurMicro:o.invoiceEurMicro};
 const posted=await tx.postCanonicalPurchase({order:o,member,finance:f.finance,receipt});if(posted?.ok!==true||posted.settlementKey!==settlementKey||posted.creditedUnits!==units||posted.ownerRef!==member.ownerRef)fail("CANONICAL_POST_FAILED");
 if(await tx.consumeEvents(eventKeys,settlementKey)!==eventKeys.length)fail("EVENT_CONSUMPTION_FAILED");
 if(approvalReference&&await tx.consumeApproval(approvalReference,settlementKey)!==true)fail("APPROVAL_CONSUMPTION_FAILED");
 if(await tx.insertSettlement(receipt)!==true)fail("SETTLEMENT_INSERT_FAILED");
 if(await tx.markOrderSettled(orderId,o.revision,settlementKey)!==true)fail("ORDER_UPDATE_FAILED");
 return {status:"SETTLED",receipt};
 });
}
export async function runTransactionFixtures(){
 const o={id:"demo",memberId:"member",network:"TRON",assetIdentity:"synthetic",recipient:"synthetic",tag:null,status:"VERIFIED_CANDIDATE",revision:1,expectedRaw:"49000000",invoiceEurMicro:"49000000",orderedUnits:"50",createdMs:1000,expiresMs:2000},e={eventKey:"demo-event",orderId:o.id,network:o.network,assetIdentity:o.assetIdentity,recipient:o.recipient,tag:null,finalityVerified:true,assignmentVerified:true,valuationVerified:true,raw:o.expectedRaw,eurMicro:o.invoiceEurMicro,paymentMs:1500},auto={mode:"EXACT_AUTO"},manual={mode:"MASTER_MANUAL",approvalReference:"demo-approval"};
 function makeDb(options={}){
 let persisted={order:{...o,...options.order},events:[{...e,...options.event}],balance:0,ledger:[],settlement:null,approvalUsed:false};
 return {read:()=>JSON.parse(JSON.stringify(persisted)),transaction:async fn=>{
 const s=JSON.parse(JSON.stringify(persisted)),tx={lockOrder:async()=>s.order,findSettlement:async()=>s.settlement,lockVerifiedEvents:async()=>s.events,lockMemberAndSponsorSnapshot:async()=>({id:"member",ownerRef:"BI-DEMO",sponsors:[null,null,null]}),lockAndValidateMasterApproval:async(ref,snapshot)=>options.approved&&snapshot.revision===1?{reference:ref,verified:true,creditedUnits:"49",reason:"demo"}:null,postCanonicalPurchase:async({receipt})=>{s.balance+=Number(receipt.creditedUnits);s.ledger.push(receipt);return {ok:!options.postFail,settlementKey:receipt.settlementKey,creditedUnits:receipt.creditedUnits,ownerRef:"BI-DEMO"}},consumeEvents:async(keys,key)=>{if(options.consumeFail)return 0;s.events.forEach(x=>x.consumedBy=key);return keys.length},consumeApproval:async()=>{s.approvalUsed=true;return !options.approvalFail},insertSettlement:async r=>{s.settlement=r;return !options.insertFail},markOrderSettled:async()=>{if(options.markFail)return false;s.order.status="SETTLED";return true}};
 const r=await fn(tx);persisted=s;return r;
 }};
 }
 const finance=x=>({ok:true,finance:{netEurMicro:x.grossEurMicro,creditedUnits:x.creditedUnits}}),t=[],assert=(name,pass)=>t.push({name,pass:!!pass});
 const fails=async(db,req=auto,calc=finance)=>{const before=JSON.stringify(db.read());try{await settleDirectOrder(db,o.id,req,calc);return false}catch{return JSON.stringify(db.read())===before}};
 const a=makeDb(),r=await settleDirectOrder(a,o.id,auto,finance);assert("canonical success",r.status==="SETTLED"&&a.read().balance===50);assert("repeat no double credit",(await settleDirectOrder(a,o.id,auto,finance)).status==="ALREADY_SETTLED"&&a.read().balance===50);assert("one movement",a.read().ledger.length===1);assert("event consumed",a.read().events[0].consumedBy===r.receipt.settlementKey);
 for(const [name,opts] of [["posting failure",{postFail:true}],["consumption failure",{consumeFail:true}],["settlement insert failure",{insertFail:true}],["order update failure",{markFail:true}],["wrong token",{event:{assetIdentity:"wrong"}}],["unfinalized",{event:{finalityVerified:false}}],["already used",{event:{consumedBy:"other"}}],["late",{event:{paymentMs:2001}}],["underpaid",{event:{raw:"48000000"}}],["refund pending",{order:{refundPending:true}}]])assert(name,await fails(makeDb(opts)));
 assert("finance failure",await fails(makeDb(),auto,()=>({ok:false})));
 const mopts={order:{status:"MANUAL_REVIEW"},event:{raw:"48000000",eurMicro:"48000000"},approved:true},m=makeDb(mopts),mr=await settleDirectOrder(m,o.id,manual,finance);
 assert("manual adjusted credit",m.read().balance===49&&mr.receipt.actualEurMicro==="48000000");assert("purchase unit class",mr.receipt.unitClass==="PURCHASE");assert("approval consumed",m.read().approvalUsed);assert("manual retry idempotent",(await settleDirectOrder(m,o.id,manual,finance)).status==="ALREADY_SETTLED"&&m.read().balance===49);assert("missing approval denied",await fails(makeDb({...mopts,approved:false}),manual));assert("approval failure rolls back",await fails(makeDb({...mopts,approvalFail:true}),manual));assert("cannot replace prior approval",await fails(m,auto));return t;
}
