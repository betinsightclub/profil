// Disposable read-only discovery diagnostic, deliberately no real customer orders, wallets or payments.
import {scanEvmRange} from "./evm-discovery.mjs";
import {discoverIndexed} from "./indexed-discovery.mjs";
import {scanDirectBlockRange,normalizeTronBlock} from "./direct-block-discovery.mjs";
import {readFile} from "node:fs/promises";
const reg=JSON.parse(await readFile(new URL("./asset-registry-review.json",import.meta.url),"utf8"));
const assert=(x,m)=>{if(!x)throw Error(m)};
let id=0;
async function http(url,body){
 const r=await fetch(url,{...(body===undefined?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),redirect:"error",signal:AbortSignal.timeout(18000)});
 assert(r.ok,"HTTP_"+r.status);const s=await r.text();assert(s.length<24000000,"RESPONSE_TOO_LARGE");return JSON.parse(s);
}
function rpc(url){return async(m,p)=>{const n=++id,r=await http(url,{jsonrpc:"2.0",id:n,method:m,params:p});assert(r.id===n&&!r.error&&"result" in r,m+":RPC_"+(r.error?.code??"INVALID"));return r.result}}
const topic="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const base={id:"PUBLIC_DIAGNOSTIC_ONLY",ownerVerified:true,allocationKind:"unique-address"};
const hx=n=>"0x"+n.toString(16);
async function evm(network,url){
 const call=rpc(url),fin=await call("eth_getBlockByNumber",["finalized",false]),n=BigInt(fin.number), block=await call("eth_getBlockByNumber",[fin.number,true]);
 const t=block.transactions.find(t=>t.to&&BigInt(t.value)>0n&&t.from.toLowerCase()!==t.to.toLowerCase());
 const out={native:"NO_SAMPLE",tokens:{}};
 if(t){const a=await scanEvmRange({...base,network,kind:"native",recipient:t.to},{from:n,to:n},call);assert(a.status==="COMPLETE_RANGE"&&a.txids.includes(t.hash.toLowerCase()),"NATIVE_"+(a.reason??"NOT_FOUND"));out.native="FOUND";}
 for(const a of reg.assets.filter(a=>a.network===network&&a.contract)){
  const logs=await call("eth_getLogs",[{address:a.contract,fromBlock:hx(n>3n?n-3n:n),toBlock:hx(n),topics:[topic]}]);
  const l=logs.find(l=>l.topics?.length===3&&/^0x[0-9a-f]{64}$/i.test(l.topics[2])&&!/^0x0+$/i.test(l.topics[2])&&/^0x[0-9a-f]+$/i.test(l.data)&&BigInt(l.data)>0n);
  if(!l){out.tokens[a.asset]="NO_SAMPLE";continue;}
  const h=BigInt(l.blockNumber),r=await scanEvmRange({...base,network,kind:"erc20",contract:a.contract,recipient:"0x"+l.topics[2].slice(-40)},{from:h,to:h},call);
  assert(r.status==="COMPLETE_RANGE"&&r.txids.includes(l.transactionHash.toLowerCase()),a.asset+"_"+(r.reason??"NOT_FOUND"));out.tokens[a.asset]="FOUND";
 }
 return {status:out.native==="FOUND"&&Object.values(out.tokens).every(x=>x==="FOUND")?"PASS":"LIMITED",...out};
}
async function sol(){
 const call=rpc("https://api.mainnet-beta.solana.com"),slot=await call("getSlot",[{commitment:"finalized"}]);
 const b=await call("getBlock",[slot,{commitment:"finalized",transactionDetails:"full",encoding:"jsonParsed",rewards:false,maxSupportedTransactionVersion:1}]);
 const entries=(b?.transactions??[]).filter(t=>t.meta?.err===null);
 const pick=entries.flatMap(t=>(t.transaction.message.instructions??[]).filter(i=>i.program==="system"&&i.parsed?.type==="transfer"&&i.parsed.info?.lamports>0).map(i=>({sig:t.transaction.signatures[0],address:i.parsed.info.destination})))[0];
 const samples=[];
 if(pick)samples.push({asset:"SOL",...pick});
 for(const a of reg.assets.filter(x=>x.network==="SOLANA"&&x.contract)){
  let found;
  for(const t of entries){
   const post=t.meta.postTokenBalances??[],pre=t.meta.preTokenBalances??[];
   for(const p of post){
    if(p.mint!==a.contract||p.programId!=="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"||!p.owner||p.uiTokenAmount?.decimals!==a.decimals)continue;
    const prev=pre.find(x=>x.accountIndex===p.accountIndex);
    if(prev&&prev.mint!==p.mint)continue;
    const account=t.transaction.message.accountKeys?.[p.accountIndex]?.pubkey;
    if(!account||BigInt(p.uiTokenAmount.amount)<=BigInt(prev?.uiTokenAmount?.amount??"0"))continue;
    found={asset:a.asset,sig:t.transaction.signatures[0],address:p.owner,tokenAccount:account,tokenAccountVerified:true};break;
   }
   if(found)break;
  }
  if(found)samples.push(found);
 }
 const result={SOL:"NO_SAMPLE",USDT:"NO_SAMPLE",USDC:"NO_SAMPLE"};
 for(const s of samples){
  const r=await discoverIndexed({...base,network:"SOLANA",...s},{from:slot,to:slot},{rpc:call});
  assert(r.status==="INDEX_CANDIDATES"&&r.txids.includes(s.sig),s.asset+"_INDEX_"+(r.reason??"NOT_FOUND"));
  const tx=await call("getTransaction",[s.sig,{commitment:"finalized",encoding:"jsonParsed",maxSupportedTransactionVersion:1}]);
  assert(tx?.slot===slot&&tx.meta?.err===null&&tx.transaction?.signatures?.[0]===s.sig,s.asset+"_RECEIPT_MISMATCH");
  result[s.asset]="FOUND";
 }
 return {status:Object.values(result).every(x=>x==="FOUND")?"PASS":"LIMITED",scope:"public address/ token-account history and sample receipt only",slot,assets:result};
}
// Targeted diagnostic: SOL and USDC already found; no need to query them again.
async function solUsdtOnly(){
 const call=rpc("https://api.mainnet-beta.solana.com");
 const a=reg.assets.find(x=>x.network==="SOLANA"&&x.asset==="USDT");
 assert(a?.contract==="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","USDT_REGISTRY_MISMATCH");
 const latest=await call("getSlot",[{commitment:"finalized"}]);
 const slots=await call("getBlocks",[Math.max(0,latest-32),latest,{commitment:"finalized"}]);
 assert(Array.isArray(slots)&&slots.every(s=>Number.isSafeInteger(s)&&s<=latest&&s>=latest-32),"INVALID_SLOTS");
 let inspected=0;
 for(const slot of [...new Set(slots)].sort((a,b)=>b-a).slice(0,12)){
  const b=await call("getBlock",[slot,{commitment:"finalized",transactionDetails:"full",encoding:"jsonParsed",rewards:false,maxSupportedTransactionVersion:1}]);
  if(!b||!Array.isArray(b.transactions))continue;
  inspected++;
  for(const t of b.transactions){
   if(t.meta?.err!==null)continue;
   const pre=t.meta.preTokenBalances??[];
   for(const p of t.meta.postTokenBalances??[]){
    if(p.mint!==a.contract||p.programId!=="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"||!p.owner||p.uiTokenAmount?.decimals!==a.decimals)continue;
    const prev=pre.find(x=>x.accountIndex===p.accountIndex);
    if(prev&&(prev.mint!==p.mint||prev.owner!==p.owner))continue;
    const account=t.transaction.message.accountKeys?.[p.accountIndex]?.pubkey,sig=t.transaction.signatures?.[0];
    if(!account||!sig||!/^\d+$/.test(p.uiTokenAmount.amount??"")||BigInt(p.uiTokenAmount.amount)<=BigInt(prev?.uiTokenAmount?.amount??"0"))continue;
    const d=await discoverIndexed({...base,network:"SOLANA",asset:"USDT",address:p.owner,tokenAccount:account,tokenAccountVerified:true},{from:slot,to:slot},{rpc:call});
    assert(d.status==="INDEX_CANDIDATES"&&d.txids.includes(sig),"USDT_INDEX_"+(d.reason??"NOT_FOUND"));
    const tx=await call("getTransaction",[sig,{commitment:"finalized",encoding:"jsonParsed",maxSupportedTransactionVersion:1}]);
    assert(tx?.slot===slot&&tx.meta?.err===null&&tx.transaction?.signatures?.[0]===sig,"RECEIPT_MISMATCH");
    return {status:"PASS",asset:"USDT",discovery:"FOUND",slot,inspected,scope:"public token-account history and sample receipt only"};
   }
  }
 }
 return {status:"LIMITED",asset:"USDT",reason:"NO_SAMPLE_IN_BOUNDED_SEARCH",inspected};
}
async function xrp(){
 const call=async(m,p)=>{const x=await http("https://xrplcluster.com/",{method:m,params:p});assert(x.result?.status==="success",m+":"+(x.result?.error??"INVALID"));return x.result};
 const s=await call("server_info",[{}]);const ni=s.info?.network_id;
 // Omitted network ID is not proof of mainnet. This probe uses the known mainnet endpoint only;
 // production adapter must establish identity independently.
 if(ni!==undefined&&ni!==0)throw Error("WRONG_NETWORK");
 const l=await call("ledger",[{ledger_index:"validated",transactions:true,expand:true,api_version:1}]);
 const n=Number(l.ledger?.ledger_index);
 assert(l.validated===true&&Number.isSafeInteger(n),"LEDGER");
 const t=l.ledger.transactions?.find(t=>t.TransactionType==="Payment"&&typeof t.Destination==="string"&&Number.isInteger(t.DestinationTag)&&t.DestinationTag>0&&typeof t.hash==="string");
 if(!t)return {status:"LIMITED",reason:"NO_TAGGED_PAYMENT_SAMPLE"};
 const r=await discoverIndexed({...base,network:"XRPL",asset:"XRP",address:t.Destination,tag:t.DestinationTag,allocationKind:"xrpl-tag"},{from:n,to:n},{rpc:call,networkIdentity:async()=>"XRPL:0"});
 assert(r.status==="INDEX_CANDIDATES"&&r.txids.includes(t.hash.toUpperCase()),"INDEX_"+(r.reason??"NOT_FOUND"));
 return {status:ni===0?"PASS":"LIMITED",scope:"tagged payment discovery",networkId:ni??"not reported",ledger:n};
}
async function utxo(network,coin){
 const root="https://api.blockcypher.com/v1/"+coin+"/main",s=await http(root),n=s.height-5;
 const b=await http(root+"/blocks/"+n+"?txstart=1&limit=1");
 if(!b.txids?.length)return {status:"LIMITED",reason:"NO_SAMPLE"};
 const t=await http(root+"/txs/"+b.txids[0]+"?limit=20");
 const o=t.outputs?.find(o=>o.value>0&&o.addresses?.length===1&&/^(?:[a-f0-9]{2}){4,100}$/.test(o.script??""));
 if(!o)return {status:"LIMITED",reason:"NO_OUTPUT_SAMPLE"};
 const r=await discoverIndexed({...base,network,asset:coin.toUpperCase(),address:o.addresses[0],scriptPubKey:o.script},{from:n,to:n},{get:http});
 assert(r.status==="INDEX_CANDIDATES"&&r.txids.includes(t.hash.toLowerCase()),"INDEX_"+(r.reason??"NOT_FOUND"));
 return {status:"PASS",scope:"address index only",block:n};
}
async function tron(){
 const url="https://tron-solidity-rpc.publicnode.com/walletsolidity/",call=(m,p)=>http(url+m,p);
 const top=await call("getnowblock",{}),n=top.block_header?.raw_data?.number;
 assert(Number.isSafeInteger(n),"HEAD");
 const b=normalizeTronBlock(await call("getblockbynum",{num:n,visible:false}));
 const cand=b.transactions.flatMap(t=>t.outputs.map(o=>({txid:t.txid,...o})))[0];
 if(!cand)return {status:"LIMITED",reason:"NO_DIRECT_TRX_SAMPLE"};
 // Compare genesis to the independently pinned mainnet block ID in the diagnostic runner.
 // Genesis is read here only to test consistency; do not infer a trusted registry from this response.
 const g=(await call("getblockbynum",{num:0,visible:false})).blockID;
 assert(/^[a-f0-9]{64}$/i.test(g??""),"GENESIS_UNAVAILABLE");
 const p=normalizeTronBlock(await call("getblockbynum",{num:n-1,visible:false}));
 const r=await scanDirectBlockRange({...base,network:"TRON",asset:"TRX",addressHex:cand.recipient},{from:n,to:n,previousHash:p.hash},{expectedGenesisHash:g,genesis:async()=>(await call("getblockbynum",{num:0,visible:false})).blockID,head:async()=>n,block:async j=>normalizeTronBlock(await call("getblockbynum",{num:j,visible:false})),canonicalHash:async j=>(await call("getblockbynum",{num:j,visible:false})).blockID});
 assert(r.status==="COMPLETE_RANGE"&&r.txids.includes(cand.txid),"SCAN_"+(r.reason??"NOT_FOUND"));
 return {status:"PASS",scope:"direct TRX discovery; genesis consistency only",block:n,genesis:g};
}
async function bch(){
 // Use documented transaction/coin index. No complete block pagination or full-node claim.
 const root="https://api.bitcore.io/api/BCH/mainnet",s=await http(root+"/block/tip"),n=s.height-5;
 const ts=await http(root+"/tx?blockHeight="+n+"&limit=5");
 const t=ts.find(x=>!x.coinbase&&typeof x.txid==="string");
 if(!t)return {status:"LIMITED",reason:"NO_TX_SAMPLE"};
 const q=await http(root+"/tx/"+t.txid+"/coins"),o=q.outputs?.find(x=>x.value>0&&typeof x.address==="string"&&/^(?:[a-f0-9]{2}){4,100}$/.test(x.script??""));
 if(!o)return {status:"LIMITED",reason:"NO_OUTPUT_SAMPLE"};
 const r=await discoverIndexed({...base,network:"BITCOINCASH",asset:"BCH",address:o.address,scriptPubKey:o.script},{from:n,to:n},{get:http});
 assert(r.status==="PARTIAL_INDEX"&&r.txids.includes(t.txid.toLowerCase()),"INDEX_"+(r.reason??"NOT_FOUND"));
 return {status:"LIMITED",scope:"sample found; complete BCH scan not proven",block:n};
}
const cases=process.argv.includes("--sol-usdt-only")?[["Solana USDT",solUsdtOnly]]:[["Ethereum",()=>evm("ETHEREUM","https://ethereum-rpc.publicnode.com")],["BNB Chain",()=>evm("BSC","https://bsc-rpc.publicnode.com")],["Polygon",()=>evm("POLYGON","https://polygon-bor-rpc.publicnode.com")],["Solana",sol],["XRP",xrp],["Bitcoin",()=>utxo("BITCOIN","btc")],["Litecoin",()=>utxo("LITECOIN","ltc")],["TRON",tron],["Bitcoin Cash",bch]];
const counts={PASS:0,LIMITED:0,FAIL:0};
for(const [name,run] of cases){if(process.argv.includes('--sol-only')&&name!=='Solana')continue;try{const r=await run();counts[r.status]++;console.log(name,JSON.stringify(r));}catch(e){counts.FAIL++;console.log(name,JSON.stringify({status:"FAIL",reason:String(e.message).slice(0,180)}))}}
console.log("DISCOVERY DIAGNOSTIC",JSON.stringify(counts),"Read only. No production authorization; public samples are not our wallets.");
process.exitCode=counts.FAIL?1:0;
