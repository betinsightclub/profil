// Read-only public endpoint capability probe. No private wallet data, no transfers, no settlement.
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const hex=v=>typeof v==="string"&&/^[0-9a-f]{64}$/i.test(v);
const b58=v=>typeof v==="string"&&/^[1-9A-HJ-NP-Za-km-z]+$/.test(v);
const height=v=>Number.isSafeInteger(v)&&v>0;
async function http(url,body){
 const res=await fetch(url,{...(body===undefined?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),redirect:"error",signal:AbortSignal.timeout(20000)});
 check(res.ok,"HTTP_"+res.status);
 const raw=await res.text();check(raw.length<12000000,"RESPONSE_TOO_LARGE");return JSON.parse(raw);
}
let id=0;
async function rpc(url,method,params){
 const n=++id,r=await http(url,{jsonrpc:"2.0",id:n,method,params});
 check(r.id===n&&!r.error&&"result" in r,method+":RPC_"+(r.error?.code??"INVALID"));return r.result;
}
async function solana(){
 const url="https://api.mainnet-beta.solana.com",call=(m,p)=>rpc(url,m,p);
 const genesis=await call("getGenesisHash",[]);
 check(genesis==="5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d","WRONG_GENESIS");
 const slot=await call("getSlot",[{commitment:"finalized"}]);check(height(slot),"INVALID_SLOT");
 const block=await call("getBlock",[slot,{commitment:"finalized",transactionDetails:"signatures",rewards:false,maxSupportedTransactionVersion:0}]);
 check(b58(block?.blockhash)&&Array.isArray(block.signatures)&&block.signatures.length>0,"BLOCK_OR_SIGNATURES");
 const sig=block.signatures[0],tx=await call("getTransaction",[sig,{commitment:"finalized",encoding:"json",maxSupportedTransactionVersion:0}]);
 check(tx?.slot===slot&&tx.transaction?.signatures?.includes(sig)&&tx.meta&&"err" in tx.meta,"TX_MISMATCH");
 return {slot,transaction:"OK",blockTime:block.blockTime};
}
async function tron(){
 const call=(path,body)=>http((path.startsWith("/walletsolidity/")?"https://tron-solidity-rpc.publicnode.com":"https://tron-rpc.publicnode.com")+path,body);
 const a=await call("/wallet/getnowblock",{}),b=await call("/walletsolidity/getnowblock",{});
 const head=a.block_header?.raw_data?.number,solid=b.block_header?.raw_data?.number;
 check(height(head)&&height(solid)&&head>=solid&&hex(b.blockID),"INVALID_BLOCKS");
 const txid=b.transactions?.[0]?.txID;check(hex(txid),"NO_TX_IN_SOLID_BLOCK");
 const t=await call("/walletsolidity/gettransactionbyid",{value:txid}),i=await call("/walletsolidity/gettransactioninfobyid",{value:txid});
 check(t.txID===txid&&i.id===txid&&i.blockNumber===solid,"TX_RECEIPT_MISMATCH");
 return {head,solidified:solid,transaction:"OK"};
}
async function xrp(){
 const url="https://xrplcluster.com/",call=async(method,p)=>{const r=await http(url,{method,params:[{...p,api_version:1}]});check(r.result?.status==="success",method+":"+(r.result?.error??"INVALID"));return r.result};
 const r=await call("ledger",{ledger_index:"validated",transactions:true,expand:false});
 const l=r.ledger,n=Number(l?.ledger_index);check(r.validated===true&&height(n)&&hex(l.ledger_hash??r.ledger_hash),"UNVALIDATED_LEDGER");
 const hash=l.transactions?.[0];check(hex(hash),"EMPTY_LEDGER");
 const t=await call("tx",{transaction:hash,binary:false});check(t.validated===true&&t.hash===hash&&Number(t.ledger_index)===n&&t.meta&&typeof t.meta.TransactionResult==="string","TX_MISMATCH");
 return {validated:n,transaction:"OK"};
}
async function utxo(coin,required){
 const root="https://api.blockcypher.com/v1/"+coin+"/main";
 const s=await http(root);check(s.name===coin.toUpperCase()+".main"&&height(s.height),"CHAIN_MISMATCH");
 const n=s.height-required+1,b=await http(root+"/blocks/"+n+"?txstart=0&limit=1");
 check(b.height===n&&hex(b.hash)&&hex(b.txids?.[0]),"BLOCK_MISMATCH");
 const txid=b.txids[0],t=await http(root+"/txs/"+txid+"?limit=1");
 check(t.hash===txid&&t.block_hash===b.hash&&t.block_height===n&&t.confirmations>=required&&Array.isArray(t.outputs)&&t.outputs.length>0,"TX_CONFIRMATION_MISMATCH");
 return {head:s.height,block:n,confirmations:t.confirmations,transaction:"OK",scope:"explorer"};
}
async function bch(){
 const root="https://api.bitcore.io/api/BCH/mainnet",main=v=>v?.chain==="BCH"&&v?.network==="mainnet";
 const h=await http(root+"/block/tip");check(main(h)&&height(h.height)&&hex(h.hash),"CHAIN_MISMATCH");
 const n=h.height-5,b=await http(root+"/block/"+n);
 check(main(b)&&b.height===n&&hex(b.hash),"BLOCK_MISMATCH");
 const txs=await http(root+"/tx?blockHeight="+n+"&limit=1");
 check(Array.isArray(txs)&&txs.length>0,"NO_TX");
 const t=await http(root+"/tx/"+txs[0].txid);
 check(main(t)&&hex(t.txid)&&t.txid===txs[0].txid&&t.blockHeight===n&&t.blockHash===b.hash&&t.confirmations>=6,"TX_MISMATCH");
 return {head:h.height,block:n,confirmations:t.confirmations,transaction:"OK",scope:"explorer"};
}
const tests=[["TRON",tron],["Solana",solana],["XRP",xrp],["Bitcoin",()=>utxo("btc",6)],["Litecoin",()=>utxo("ltc",6)],["Dogecoin",()=>utxo("doge",20)],["Bitcoin Cash",bch]];
let ok=0;
const selected=tests.filter(([name])=>!process.argv.includes("--retry")||name!=="XRP");
for(const [name,fn] of selected){
 try{console.log(name,JSON.stringify({status:"PASS",...await fn()}));ok++}
 catch(e){console.log(name,JSON.stringify({status:"FAIL",reason:String(e.message).slice(0,200)}))}
}
console.log("NETWORK PROBES "+ok+"/"+selected.length+" passed. Read-only; no payment authorization.");
process.exitCode=ok===selected.length?0:1;
