// Development only: pure finalized receipt validators, not live RPC, not discovery or settlement.
// Trusted server must verify chain identities, wallet allocation, token mint/program/account and exact RPC dialect.
// Sources: https://xrpl.org/docs/references/protocol/transactions/metadata ; https://solana.com/docs/rpc/http/gettransaction ; https://developers.tron.network/docs/confirmation-semantics
function validateOrder(o,network,assets){
 return o?.network===network&&assets.includes(o.asset)&&o.ownerVerified===true&&typeof o.id==="string"&&o.id.length>0&&typeof o.amountRaw==="string"&&/^[1-9]\d{0,19}$/.test(o.amountRaw)&&Number.isSafeInteger(o.createdMs)&&Number.isSafeInteger(o.expiresMs)&&o.expiresMs>o.createdMs;
}
const review=reason=>({status:"MANUAL_REVIEW",reason}),pending=reason=>({status:"PAYMENT_SEEN",reason}),retry=reason=>({status:"RETRY",reason});
const within=(o,t)=>Number.isSafeInteger(t)&&t>=o.createdMs&&t<=o.expiresMs,hash=x=>typeof x==="string"&&/^[a-fA-F0-9]{64}$/.test(x),base58=x=>typeof x==="string"&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(x);
export function verifyXrp(o,txid,e,cfg){
 if(!validateOrder(o,"XRPL",["XRP"])||o.assetIdentity!=="XRPL:native"||o.allocationKind!=="xrpl-tag"||!Number.isInteger(o.tag)||o.tag<1||o.tag>4294967295||typeof o.address!=="string"||!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(o.address)||!hash(txid)||cfg?.verified!==true||cfg.enabled!==true||cfg.networkId!==0)return review("UNSAFE_ORDER_OR_CONFIG");
 if(e?.networkId!==0)return review("WRONG_NETWORK");const r=e.result;
 if(!r)return retry("TX_UNAVAILABLE");if(r.validated!==true)return pending("NOT_VALIDATED");
 const t=r.tx_json,m=r.meta;if(!t||r.hash?.toUpperCase()!==txid.toUpperCase()||!Number.isSafeInteger(r.ledger_index)||r.ledger_index<1||!m)return review("MALFORMED_TRANSACTION");
 if(t.TransactionType!=="Payment"||t.Destination!==o.address||t.DestinationTag!==o.tag||t.Account===o.address||m.TransactionResult!=="tesSUCCESS")return review("WRONG_PAYMENT");
 if(typeof m.delivered_amount!=="string"||m.delivered_amount!==o.amountRaw||typeof (t.DeliverMax??t.Amount)!=="string")return review("AMOUNT_OR_CURRENCY_MISMATCH");
 if(!Number.isSafeInteger(t.date)||!within(o,(t.date+946684800)*1000))return review("OUTSIDE_QUOTE_WINDOW");
 return {status:"VERIFIED_CANDIDATE",orderId:o.id,eventKey:"XRPL:"+txid.toUpperCase(),amountRaw:o.amountRaw,tag:o.tag};
}
export function verifyTrx(o,txid,e,cfg){
 if(!validateOrder(o,"TRON",["TRX"])||o.assetIdentity!=="TRON:native"||o.allocationKind!=="unique-address"||!/^41[0-9a-f]{40}$/.test(o.addressHex??"")||!hash(txid)||cfg?.verified!==true||cfg.enabled!==true||!hash(cfg.genesisHash))return review("UNSAFE_ORDER_OR_CONFIG");
 if(e?.genesisHash!==cfg.genesisHash)return review("WRONG_NETWORK");
 const t=e.body,r=e.receipt;if(!t?.txID||!r?.id)return pending("SOLIDIFIED_RECEIPT_MISSING");
 if(t.txID.toLowerCase()!==txid.toLowerCase()||r.id.toLowerCase()!==txid.toLowerCase()||!Number.isSafeInteger(r.blockNumber)||r.blockNumber<1||!within(o,r.blockTimeStamp))return review("BAD_RECEIPT_OR_TIME");
 if(r.result==="FAILED"||r.receipt?.result&&r.receipt.result!=="SUCCESS"||!Array.isArray(t.ret)||t.ret.length!==1||t.ret[0].contractRet!=="SUCCESS")return review("FAILED_TRANSACTION");
 const list=t.raw_data?.contract;if(!Array.isArray(list)||list.length!==1||list[0].type!=="TransferContract"||list[0].parameter?.type_url!=="type.googleapis.com/protocol.TransferContract")return review("NOT_DIRECT_TRX_TRANSFER");
 const v=list[0].parameter.value;if(!v||v.to_address?.toLowerCase()!==o.addressHex||v.owner_address?.toLowerCase()===o.addressHex||!/^41[0-9a-f]{40}$/i.test(v.owner_address??"")||!Number.isSafeInteger(v.amount)||String(v.amount)!==o.amountRaw)return review("AMOUNT_OR_RECIPIENT_MISMATCH");
 return {status:"VERIFIED_CANDIDATE",orderId:o.id,amountRaw:o.amountRaw,eventKey:"TRON:"+txid.toLowerCase()+":native"};
}
export function verifySol(o,sig,e,cfg){
 if(!validateOrder(o,"SOLANA",["SOL","USDT","USDC"])||o.allocationKind!=="unique-address"||!base58(o.address)||! /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(sig??"")||cfg?.verified!==true||cfg.enabled!==true||cfg.asset!==o.asset||!base58(cfg.genesisHash)||cfg.identity!==o.assetIdentity)return review("UNSAFE_ORDER_OR_CONFIG");
 if(e?.genesisHash!==cfg.genesisHash)return review("WRONG_NETWORK");if(e.commitment!=="finalized")return pending("NOT_FINALIZED");
 const r=e.result;if(!r)return pending("TX_UNAVAILABLE");
 if(!Number.isSafeInteger(r.slot)||r.slot<1||!Number.isSafeInteger(r.blockTime)||!within(o,r.blockTime*1000)||!r.meta||r.meta.err!==null||r.transaction?.signatures?.[0]!==sig)return review("BAD_TRANSACTION_OR_TIME");
 const keys=r.transaction.message?.accountKeys;if(!Array.isArray(keys))return review("MISSING_ACCOUNT_KEYS");
 const names=keys.map(k=>k?.pubkey);if(names.some(k=>!base58(k)&&k!=="11111111111111111111111111111111")||new Set(names).size!==names.length)return review("BAD_ACCOUNT_KEYS");
 if(o.asset==="SOL"){
  if(cfg.identity!=="SOLANA:native")return review("BAD_NATIVE_IDENTITY");
  const i=names.indexOf(o.address),pre=r.meta.preBalances?.[i],post=r.meta.postBalances?.[i];if(i<0||!Number.isSafeInteger(pre)||!Number.isSafeInteger(post)||pre<0||post<0||keys[i]?.signer!==false||keys[i]?.writable!==true)return review("UNSAFE_BALANCE");
  if(BigInt(post)-BigInt(pre)!==BigInt(o.amountRaw))return review("AMOUNT_MISMATCH");
 }else{
  const program="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  if(cfg.identity!==cfg.mint||!base58(cfg.mint)||cfg.program!==program||cfg.decimals!==6||!base58(o.tokenAccount)||o.tokenAccountVerified!==true)return review("UNSAFE_TOKEN");
  const i=names.indexOf(o.tokenAccount);if(i<0||keys[i]?.writable!==true||!Array.isArray(r.meta.preTokenBalances)||!Array.isArray(r.meta.postTokenBalances))return review("MISSING_TOKEN_BALANCE");
  const pre=r.meta.preTokenBalances.filter(b=>b.accountIndex===i),post=r.meta.postTokenBalances.filter(b=>b.accountIndex===i);
  const valid=b=>b.mint===cfg.mint&&b.owner===o.address&&b.programId===program&&b.uiTokenAmount?.decimals===cfg.decimals&&/^\d{1,20}$/.test(b.uiTokenAmount?.amount??"");
  if(pre.length>1||post.length!==1||!valid(post[0])||pre.some(b=>!valid(b)))return review("TOKEN_MINT_OWNER_OR_PROGRAM_MISMATCH");
  if(BigInt(post[0].uiTokenAmount.amount)-BigInt(pre[0]?.uiTokenAmount.amount??"0")!==BigInt(o.amountRaw))return review("AMOUNT_MISMATCH");
 }
 return {status:"VERIFIED_CANDIDATE",orderId:o.id,eventKey:"SOLANA:"+sig,amountRaw:o.amountRaw};
}
export function tests(){
 const t=[],check=(name,want,r)=>t.push({name,pass:r.status===want,actual:r.status});
 const id="a".repeat(64),gen="b".repeat(64),owner="41"+"c".repeat(40),addr="41"+"d".repeat(40),a="r"+"A".repeat(27),sig="A".repeat(88),sol="B".repeat(44),ta="C".repeat(44),mint="D".repeat(44),gh="E".repeat(44);
 const base={id:"test",ownerVerified:true,amountRaw:"123",allocationKind:"unique-address",createdMs:946684801000,expiresMs:946684805000},x={...base,network:"XRPL",asset:"XRP",assetIdentity:"XRPL:native",address:a,allocationKind:"xrpl-tag",tag:42},xc={enabled:true,verified:true,networkId:0},xt={TransactionType:"Payment",Destination:a,DestinationTag:42,Account:"other",DeliverMax:"123",date:2},xm={TransactionResult:"tesSUCCESS",delivered_amount:"123"},xr={hash:id,validated:true,ledger_index:1,tx_json:xt,meta:xm},xe={networkId:0,result:xr};
 for(const [n,w,o,e,c] of [["valid","VERIFIED_CANDIDATE",x,xe,xc],["partial amount","MANUAL_REVIEW",x,{...xe,result:{...xr,meta:{...xm,delivered_amount:"1"}}},xc],["missing tag","MANUAL_REVIEW",x,{...xe,result:{...xr,tx_json:{...xt,DestinationTag:undefined}}},xc],["wrong tag","MANUAL_REVIEW",{...x,tag:43},xe,xc],["not validated","PAYMENT_SEEN",x,{...xe,result:{...xr,validated:false}},xc],["failed","MANUAL_REVIEW",x,{...xe,result:{...xr,meta:{...xm,TransactionResult:"tecFAILED"}}},xc],["issued token","MANUAL_REVIEW",x,{...xe,result:{...xr,meta:{...xm,delivered_amount:{value:"123"}}}},xc],["wrong chain","MANUAL_REVIEW",x,{...xe,networkId:1},xc],["late","MANUAL_REVIEW",x,{...xe,result:{...xr,tx_json:{...xt,date:6}}},xc]])check("XRP "+n,w,verifyXrp(o,id,e,c));
 const tr={...base,network:"TRON",asset:"TRX",assetIdentity:"TRON:native",addressHex:addr},tc={enabled:true,verified:true,genesisHash:gen},contract={type:"TransferContract",parameter:{type_url:"type.googleapis.com/protocol.TransferContract",value:{owner_address:owner,to_address:addr,amount:123}}},tb={txID:id,ret:[{contractRet:"SUCCESS"}],raw_data:{contract:[contract]}},receipt={id,blockNumber:1,blockTimeStamp:base.createdMs+1000},te={genesisHash:gen,body:tb,receipt};
 for(const [n,w,o,e,c] of [["exact","VERIFIED_CANDIDATE",tr,te,tc],["missing receipt","PAYMENT_SEEN",tr,{...te,receipt:{}},tc],["wrong amount","MANUAL_REVIEW",{...tr,amountRaw:"124"},te,tc],["wrong recipient","MANUAL_REVIEW",{...tr,addressHex:owner},te,tc],["failed","MANUAL_REVIEW",tr,{...te,receipt:{...receipt,result:"FAILED"}},tc],["wrong chain","MANUAL_REVIEW",tr,{...te,genesisHash:id},tc],["late","MANUAL_REVIEW",tr,{...te,receipt:{...receipt,blockTimeStamp:base.expiresMs+1}},tc],["token contract","MANUAL_REVIEW",tr,{...te,body:{...tb,raw_data:{contract:[{...contract,type:"TriggerSmartContract"}]}}},tc]])check("TRX "+n,w,verifyTrx(o,id,e,c));
 const sb={...base,network:"SOLANA",address:sol,asset:"SOL",assetIdentity:"SOLANA:native"},sc={enabled:true,verified:true,asset:"SOL",identity:"SOLANA:native",genesisHash:gh},sr={slot:1,blockTime:946684802,transaction:{signatures:[sig],message:{accountKeys:[{pubkey:sol,signer:false,writable:true}]}},meta:{err:null,preBalances:[1000],postBalances:[1123]}},se={genesisHash:gh,commitment:"finalized",result:sr};
 check("SOL exact","VERIFIED_CANDIDATE",verifySol(sb,sig,se,sc));check("SOL unfinalized","PAYMENT_SEEN",verifySol(sb,sig,{...se,commitment:"confirmed"},sc));check("SOL failed","MANUAL_REVIEW",verifySol(sb,sig,{...se,result:{...sr,meta:{...sr.meta,err:"failed"}}},sc));check("SOL mismatch","MANUAL_REVIEW",verifySol({...sb,amountRaw:"124"},sig,se,sc));check("SOL wrong chain","MANUAL_REVIEW",verifySol(sb,sig,{...se,genesisHash:mint},sc));
 for(const asset of ["USDT","USDC"]){
 const program="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",o={...sb,asset,assetIdentity:mint,tokenAccount:ta,tokenAccountVerified:true},c={...sc,asset,identity:mint,mint,program,decimals:6},balance={accountIndex:0,mint,owner:sol,programId:program,uiTokenAmount:{amount:"123",decimals:6}},r={...sr,transaction:{...sr.transaction,message:{accountKeys:[{pubkey:ta,signer:false,writable:true}]}},meta:{err:null,preTokenBalances:[],postTokenBalances:[balance]}},e={...se,result:r};
 check(asset+" exact","VERIFIED_CANDIDATE",verifySol(o,sig,e,c));check(asset+" fake mint","MANUAL_REVIEW",verifySol(o,sig,{...e,result:{...r,meta:{...r.meta,postTokenBalances:[{...balance,mint:gh}]}}},c));check(asset+" wrong owner","MANUAL_REVIEW",verifySol(o,sig,{...e,result:{...r,meta:{...r.meta,postTokenBalances:[{...balance,owner:ta}]}}},c));check(asset+" pre-existing balance","MANUAL_REVIEW",verifySol(o,sig,{...e,result:{...r,meta:{...r.meta,preTokenBalances:[balance]}}},c));check(asset+" unverified account","MANUAL_REVIEW",verifySol({...o,tokenAccountVerified:false},sig,e,c));
 }return t;
}
