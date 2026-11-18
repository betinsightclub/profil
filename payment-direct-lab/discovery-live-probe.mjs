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
 const b=await call("getBlock",[slot,{commitment:"finalized",transactionDetails:"full",encoding:"jsonParsed",rewards:false,maxSupportedTransactionVersion:0}]);
 const entries=b?.transactions??[];
 const pick=entries.flatMap(t=>t.meta?.err===null?(t.transaction.message.instructions??[]).filter(i=>i.program==="system"&&i.parsed?.type==="transfer"&&i.parsed.info?.lamports>0).map(i=>({sig:t.transaction.signatures[0],address:i.parsed.info.destination})):[])[0];
 if(!pick)return {status:"LIMITED",reason:"NO_NATIVE_SAMPLE"};
 const r=await discoverIndexed({...base,network:"SOLANA",asset:"SOL",address:pick.address},{from:slot,to:slot},{rpc:call});
 assert(r.status==="INDEX_CANDIDATES"&&r.txids.includes(pick.sig),"INDEX_"+(r.reason??"NOT_FOUND"));
 return {status:"PASS",scope:"SOL address history only",slot};
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
const cases=[["Ethereum",()=>evm("ETHEREUM","https://ethereum-rpc.publicnode.com")],["BNB Chain",()=>evm("BSC","https://bsc-rpc.publicnode.com")],["Polygon",()=>evm("POLYGON","https://polygon-bor-rpc.publicnode.com")],["Solana",sol],["XRP",xrp],["Bitcoin",()=>utxo("BITCOIN","btc")],["Litecoin",()=>utxo("LITECOIN","ltc")],["TRON",tron],["Bitcoin Cash",bch]];
const counts={PASS:0,LIMITED:0,FAIL:0};
for(const [name,run] of cases){try{const r=await run();counts[r.status]++;console.log(name,JSON.stringify(r));}catch(e){counts.FAIL++;console.log(name,JSON.stringify({status:"FAIL",reason:String(e.message).slice(0,180)}))}}
console.log("DISCOVERY DIAGNOSTIC",JSON.stringify(counts),"Read only. No production authorization; public samples are not our wallets.");
process.exitCode=counts.FAIL?1:0;
