// Development only; normalized trusted Core-style RPC evidence. No wallets, actual node URLs, secrets, settlement or discovery implementation.
// Verify each network genesis and RPC dialect before enabling. Confirmation minima are provisional risk settings.
// Never accept firstObservation from client; persist an exact matched output observed by the trusted scanner.
// See https://developer.bitcoin.org/reference/rpc/getrawtransaction.html and https://docs.bitcoincashnode.org/doc/json-rpc/getrawtransaction/.
export const POLICY={
  "BITCOIN": {
    "asset": "BTC",
    "minConfirmations": 6
  },
  "BITCOINCASH": {
    "asset": "BCH",
    "minConfirmations": 6
  },
  "LITECOIN": {
    "asset": "LTC",
    "minConfirmations": 6
  },
  "DOGECOIN": {
    "asset": "DOGE",
    "minConfirmations": 20
  }
};
function toAtomic(value){
 const s=String(value),m=/^(\d{1,16})(?:\.(\d{1,8}))?(?:e([+-]?\d{1,2}))?$/i.exec(s);
 if(!m)throw Error("INVALID_COIN_VALUE");
 const n=BigInt(m[1]+(m[2]||"")),scale=8-(m[2]||"").length+Number(m[3]||0);
 if(Math.abs(scale)>24)throw Error("INVALID_SCALE");
 if(scale>=0)return n*10n**BigInt(scale);
 const d=10n**BigInt(-scale);if(n%d!==0n)throw Error("FRACTIONAL_ATOMIC_UNIT");return n/d;
}
export function verifyUtxoPayment(order,txid,evidence,registry){
 const review=reason=>({status:"MANUAL_REVIEW",reason}),pending=reason=>({status:"PAYMENT_SEEN",reason}),retry=reason=>({status:"RETRY",reason});
 const hash=v=>typeof v==="string"&&/^[0-9a-f]{64}$/.test(v),script=v=>typeof v==="string"&&/^(?:[0-9a-f]{2}){4,100}$/.test(v);
 const p=POLICY[order?.network],cfg=registry?.[order?.network];
 if(!p||!cfg||cfg.enabled!==true||cfg.verified!==true||cfg.asset!==p.asset||!hash(cfg.genesisHash)||order.asset!==p.asset||order.assetIdentity!==order.network+":native"||order.allocationKind!=="unique-address"||order.ownerVerified!==true||!order.id||!script(order.scriptPubKey)||!hash(txid)||typeof order.amountRaw!=="string"||!/^[1-9]\d{0,19}$/.test(order.amountRaw)||!Number.isSafeInteger(order.createdMs)||!Number.isSafeInteger(order.expiresMs)||order.expiresMs<=order.createdMs||!Number.isInteger(cfg.confirmations)||cfg.confirmations<p.minConfirmations||cfg.confirmations>1000)return review("UNSAFE_ORDER_OR_CHAIN_POLICY");
 if(evidence?.genesisHash!==cfg.genesisHash)return review("WRONG_CHAIN");
 const tx=evidence.tx;if(!tx)return retry("TRANSACTION_UNAVAILABLE");
 if(tx.txid!==txid||!Array.isArray(tx.vout)||!Array.isArray(tx.vin)||!tx.vin.length||tx.vin.some(v=>v.coinbase!==undefined))return review("UNSUPPORTED_TRANSACTION");
 const outputs=tx.vout.filter(v=>v?.scriptPubKey?.hex===order.scriptPubKey);
 if(outputs.length!==1)return review("MISSING_OR_MULTIPLE_OUTPUTS");
 const output=outputs[0];if(!Number.isSafeInteger(output.n)||output.n<0||tx.vout.filter(v=>v.n===output.n).length!==1)return review("INVALID_OUTPUT_INDEX");
 let amount;try{amount=toAtomic(output.value)}catch{return review("INVALID_VALUE")}
 if(amount!==BigInt(order.amountRaw))return review("AMOUNT_MISMATCH");
 if(!tx.blockhash)return pending("MEMPOOL");
 const block=evidence.block;
 if(!block||!hash(evidence.canonicalHash))return retry("CANONICAL_BLOCK_UNAVAILABLE");
 if(!hash(tx.blockhash)||block.hash!==tx.blockhash||evidence.canonicalHash!==block.hash||!Number.isSafeInteger(block.height)||block.height<1||!Array.isArray(block.tx)||!block.tx.includes(txid)||!Number.isSafeInteger(block.confirmations)||block.confirmations<1)return review("NONCANONICAL_OR_INCONSISTENT_BLOCK");
 if(!Number.isSafeInteger(block.time)||block.time<0||!Number.isSafeInteger(block.time*1000))return review("INVALID_BLOCK_TIME");
 // Header timestamps do not establish exact send times. Require a persisted, server-observed matching output in the quote window.
 const first=evidence.firstObservation;
 if(!first||first.txid!==txid||first.vout!==output.n||first.scriptPubKey!==order.scriptPubKey||first.amountRaw!==order.amountRaw||!Number.isSafeInteger(first.atMs)||first.atMs<order.createdMs||first.atMs>order.expiresMs)return review("TIMELY_PAYMENT_NOT_PROVEN");
 if(block.confirmations<cfg.confirmations)return pending("WAITING_CONFIRMATIONS");
 return {status:"VERIFIED_CANDIDATE",orderId:order.id,network:order.network,asset:order.asset,txid,vout:output.n,eventKey:order.network+":"+txid+":"+output.n,amountRaw:amount.toString(),scriptPubKey:order.scriptPubKey,confirmations:block.confirmations,blockHash:block.hash,firstSeenMs:first.atMs};
}
export async function inspectUtxoPayment(order,txid,{rpc,registry,firstObservation}){
 try{
 if(typeof rpc!=="function"||!order||!POLICY[order.network]||!/^[0-9a-f]{64}$/.test(txid))return {status:"MANUAL_REVIEW",reason:"INVALID_REQUEST"};
 const genesisHash=await rpc("getblockhash",[0]);
 if(genesisHash!==registry?.[order.network]?.genesisHash)return {status:"MANUAL_REVIEW",reason:"WRONG_CHAIN"};
 const tx=await rpc("getrawtransaction",[txid,true]);
 if(!tx?.blockhash)return verifyUtxoPayment(order,txid,{genesisHash,tx,firstObservation},registry);
 const block=await rpc("getblock",[tx.blockhash,1]);
 if(!block||!Number.isSafeInteger(block.height))return {status:"RETRY",reason:"BLOCK_UNAVAILABLE"};
 const canonicalHash=await rpc("getblockhash",[block.height]);
 return verifyUtxoPayment(order,txid,{genesisHash,tx,block,canonicalHash,firstObservation},registry);
 }catch{return {status:"RETRY",reason:"RPC_UNAVAILABLE"}}
}
export function fixtureTests(){
 const tests=[],txid="a".repeat(64),bh="b".repeat(64),gen="c".repeat(64),spk="76a914"+"d".repeat(40)+"88ac";
 for(const [network,p] of Object.entries(POLICY)){
 const order={id:"demo",network,asset:p.asset,assetIdentity:network+":native",scriptPubKey:spk,amountRaw:"12345678",allocationKind:"unique-address",ownerVerified:true,createdMs:1000,expiresMs:2000};
 const out={n:0,value:"0.12345678",scriptPubKey:{hex:spk}},tx={txid,blockhash:bh,vin:[{txid:"e".repeat(64),vout:0}],vout:[out]};
 const block={hash:bh,height:123,confirmations:p.minConfirmations,time:3,tx:[txid]},firstObservation={txid,vout:0,scriptPubKey:spk,amountRaw:order.amountRaw,atMs:1500};
 const cfg={asset:p.asset,genesisHash:gen,verified:true,enabled:true,confirmations:p.minConfirmations},registry={[network]:cfg},e={genesisHash:gen,tx,block,canonicalHash:bh,firstObservation};
 const test=(name,want,o=order,ev=e,r=registry)=>tests.push({name:network+" "+name,pass:verifyUtxoPayment(o,txid,ev,r).status===want});
 test("exact confirmed","VERIFIED_CANDIDATE");test("mempool","PAYMENT_SEEN",order,{...e,tx:{...tx,blockhash:null}});test("low confirmations","PAYMENT_SEEN",order,{...e,block:{...block,confirmations:p.minConfirmations-1}});test("wrong chain","MANUAL_REVIEW",order,{...e,genesisHash:bh});test("reorg","MANUAL_REVIEW",order,{...e,canonicalHash:gen});test("missing block","RETRY",order,{...e,block:null});test("wrong amount","MANUAL_REVIEW",{...order,amountRaw:"12345679"});test("wrong script","MANUAL_REVIEW",{...order,scriptPubKey:"0014"+"f".repeat(40)});test("duplicate output","MANUAL_REVIEW",order,{...e,tx:{...tx,vout:[out,{...out,n:1}]}});test("missing timely observation","MANUAL_REVIEW",order,{...e,firstObservation:null});test("late observation","MANUAL_REVIEW",order,{...e,firstObservation:{...firstObservation,atMs:2001}});test("wrong first observed output","MANUAL_REVIEW",order,{...e,firstObservation:{...firstObservation,vout:1}});test("shared address","MANUAL_REVIEW",{...order,allocationKind:"shared-address"});test("unverified configuration","MANUAL_REVIEW",order,e,{[network]:{...cfg,verified:false}});test("too few configured confirmations","MANUAL_REVIEW",order,e,{[network]:{...cfg,confirmations:1}});test("coinbase","MANUAL_REVIEW",order,{...e,tx:{...tx,vin:[{coinbase:"abc"}]}});test("fractional atomic unit","MANUAL_REVIEW",order,{...e,tx:{...tx,vout:[{...out,value:"0.123456789"}]}});
 }
 tests.push({name:"one satoshi",pass:toAtomic(1e-8)===1n},{name:"whole coin",pass:toAtomic("1")===100000000n},{name:"decimal exact",pass:toAtomic("0.00000123")===123n});return tests;
}
