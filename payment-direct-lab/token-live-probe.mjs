// Read-only token contract checks using established endpoints. No wallet secrets or transmissions.
import {readFile} from "node:fs/promises";
const registry=JSON.parse(await readFile(new URL("./asset-registry-review.json",import.meta.url),"utf8"));
const providers={ETHEREUM:["0x1","https://ethereum-rpc.publicnode.com"],BSC:["0x38","https://bsc-rpc.publicnode.com"],POLYGON:["0x89","https://polygon-bor-rpc.publicnode.com"]};
const need=(x,m)=>{if(!x)throw Error(m)};
let id=0;
async function post(url,body){
 const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(18000)});
 need(r.ok,"HTTP_"+r.status);const raw=await r.text();need(raw.length<2000000,"RESPONSE_TOO_LARGE");return JSON.parse(raw);
}
async function rpc(url,method,params){
 const i=++id,r=await post(url,{jsonrpc:"2.0",id:i,method,params});
 need(r.id===i&&!r.error&&"result" in r,method+":RPC_"+(r.error?.code??"INVALID"));return r.result;
}
const word=x=>{need(typeof x==="string"&&/^0x[0-9a-f]{64}$/i.test(x),"INVALID_ABI_WORD");return BigInt(x)};
async function checkEvm(a){
 const [chain,url]=providers[a.network];need(await rpc(url,"eth_chainId",[])===chain,"WRONG_CHAIN");
 const fin=await rpc(url,"eth_getBlockByNumber",["finalized",false]);need(/^0x[0-9a-f]+$/i.test(fin?.number??""),"FINALITY_UNAVAILABLE");
 const code=await rpc(url,"eth_getCode",[a.contract,fin.number]);need(typeof code==="string"&&/^0x(?:[0-9a-f]{2})+$/i.test(code),"NO_CONTRACT_BYTECODE");
 const d=word(await rpc(url,"eth_call",[{to:a.contract,data:"0x313ce567"},fin.number]));
 need(d===BigInt(a.decimals),"DECIMALS_MISMATCH");
 const supply=word(await rpc(url,"eth_call",[{to:a.contract,data:"0x18160ddd"},fin.number]));need(supply>0n,"NO_SUPPLY");
 return {decimals:Number(d),block:BigInt(fin.number).toString(),positiveSupply:true};
}
async function checkSol(a){
 const url="https://api.mainnet-beta.solana.com";
 need(await rpc(url,"getGenesisHash",[])==="5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d","WRONG_GENESIS");
 const r=await rpc(url,"getAccountInfo",[a.contract,{commitment:"finalized",encoding:"jsonParsed"}]);
 const v=r?.value,info=v?.data?.parsed?.info;
 need(v?.owner==="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"&&v.data.parsed.type==="mint"&&info?.isInitialized===true,"NOT_INITIALIZED_SPL_MINT");
 need(info.decimals===a.decimals,"DECIMALS_MISMATCH");need(/^\d+$/.test(info.supply)&&BigInt(info.supply)>0n,"NO_SUPPLY");
 return {decimals:info.decimals,slot:r.context.slot,positiveSupply:true};
}
async function checkTron(a){
 const url="https://tron-solidity-rpc.publicnode.com/walletsolidity/triggerconstantcontract";
 async function read(fn){
 const r=await post(url,{owner_address:a.contract,contract_address:a.contract,function_selector:fn,visible:true});
 need(r.result?.result===true&&Array.isArray(r.constant_result)&&r.constant_result.length===1,"TRON_CONSTANT_CALL_FAILED");
 return word("0x"+r.constant_result[0]);
 }
 const d=await read("decimals()");need(d===BigInt(a.decimals),"DECIMALS_MISMATCH");
 need(await read("totalSupply()")>0n,"NO_SUPPLY");return {decimals:Number(d),positiveSupply:true,commitment:"solidified"};
}
const targets=registry.assets.filter(a=>a.launchCandidate&&a.contract);
need(registry.bankMethods.length===2&&registry.bankMethods.every(x=>x.enabled===false)&&registry.assets.every(x=>!x.enabled&&!x.verified),"UNSAFE_REGISTRY");
need(targets.length===9,"UNEXPECTED_TOKEN_COUNT");
let passed=0;
for(const a of targets){
 try{const r=await (providers[a.network]?checkEvm(a):a.network==="SOLANA"?checkSol(a):checkTron(a));console.log(a.network,a.asset,JSON.stringify({status:"PASS",...r}));passed++}
 catch(e){console.log(a.network,a.asset,JSON.stringify({status:"FAIL",reason:String(e.message).slice(0,180)}))}
}
console.log("TOKEN CHECKS "+passed+"/"+targets.length+" passed. Contract metadata only; no payment authorization.");
process.exitCode=passed===targets.length?0:1;
