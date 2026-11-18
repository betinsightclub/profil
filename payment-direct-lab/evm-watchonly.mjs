// Development-only EVM receipt verifier. RPC and registry must be trusted, independently verified mainnet configuration; no auto-credit or private keys.
// Direct native transfers and exact ERC-20 Transfer logs only; internal native transfers require manual review.
// Finalized head and canonical block must be fetched from trusted RPC; do not silently substitute latest.
const CHAINS={"ETHEREUM":{"id":"0x1","native":"ETH"},"BSC":{"id":"0x38","native":"BNB"},"POLYGON":{"id":"0x89","native":"POL"}};
const TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export function verifyEvmReceipt(order,txid,evidence,registry){
 const review=reason=>({status:"REVIEW",reason}),pending=reason=>({status:"PENDING",reason}),retry=reason=>({status:"RETRY",reason});
 const hash=x=>typeof x==="string"&&/^0x[0-9a-f]{64}$/i.test(x),addr=x=>typeof x==="string"&&/^0x[0-9a-f]{40}$/i.test(x),quantity=x=>typeof x==="string"&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(x)&&x.length<=66;
 const lower=x=>typeof x==="string"?x.toLowerCase():"",eq=(a,b)=>lower(a)===lower(b);
 const chain=CHAINS[order?.network],asset=registry?.[order?.network+":"+order?.asset];
 if(!chain||!asset||asset.verified!==true||asset.enabled!==true||asset.chainId!==chain.id||asset.asset!==order.asset||order.assetIdentity!==asset.identity||!order.id||order.allocationKind!=="unique-address"||order.ownerVerified!==true||!addr(order.address)||!hash(txid)||typeof order.amountRaw!=="string"||!/^[1-9]\d{0,77}$/.test(order.amountRaw)||BigInt(order.amountRaw)>=2n**256n||!Number.isSafeInteger(order.createdMs)||!Number.isSafeInteger(order.expiresMs)||order.expiresMs<=order.createdMs)return review("UNSAFE_ORDER_OR_REGISTRY");
 if(asset.kind==="native"?(order.asset!==chain.native||asset.identity!=="native:"+chain.id):!(asset.kind==="erc20"&&["USDT","USDC"].includes(order.asset)&&addr(asset.contract)&&asset.identity===lower(asset.contract)))return review("UNSAFE_ASSET");
 if(!evidence||!eq(evidence.chainId,chain.id))return review("WRONG_CHAIN_ID");
 const {tx,receipt,block,finalized}=evidence;
 if(!tx||!receipt)return pending("RECEIPT_NOT_AVAILABLE");
 if(!block||!finalized)return retry("FINALITY_UNAVAILABLE");
 if(!hash(tx.hash)||!hash(receipt.transactionHash)||!eq(tx.hash,txid)||!eq(receipt.transactionHash,txid)||!hash(receipt.blockHash)||!hash(block.hash)||!eq(block.hash,receipt.blockHash)||!eq(tx.blockHash,receipt.blockHash)||!quantity(block.number)||!quantity(receipt.blockNumber)||!quantity(tx.blockNumber)||BigInt(block.number)!==BigInt(receipt.blockNumber)||BigInt(tx.blockNumber)!==BigInt(block.number)||!quantity(finalized.number)||!hash(finalized.hash))return review("BLOCK_OR_TX_MISMATCH");
 if(!Array.isArray(block.transactions)||!block.transactions.some(t=>typeof t==="string"&&eq(t,txid)))return review("TX_NOT_IN_CANONICAL_BLOCK");
 if(BigInt(finalized.number)<BigInt(block.number))return pending("NOT_FINALIZED");
 if(BigInt(finalized.number)===BigInt(block.number)&&!eq(finalized.hash,block.hash))return review("FINALIZED_BLOCK_MISMATCH");
 if(receipt.status!=="0x1")return review("FAILED_TRANSACTION");
 if(!quantity(block.timestamp))return review("BAD_BLOCK_TIMESTAMP");
 const time=BigInt(block.timestamp)*1000n;if(time<BigInt(order.createdMs)||time>BigInt(order.expiresMs))return review("TRANSFER_OUTSIDE_WINDOW");
 let eventIndex="native",amount;
 if(asset.kind==="native"){
  if(!addr(tx.to)||!eq(tx.to,order.address)||!eq(receipt.to,order.address)||!quantity(tx.value)||tx.input!=="0x")return review("NOT_DIRECT_NATIVE_TRANSFER");
  amount=BigInt(tx.value);
 }else{
  if(!Array.isArray(receipt.logs))return review("MISSING_LOGS");
  const matching=receipt.logs.filter(l=>eq(l.address,asset.contract)&&Array.isArray(l.topics)&&l.topics.length===3&&eq(l.topics[0],TRANSFER)&&eq(l.topics[2],"0x"+"0".repeat(24)+lower(order.address).slice(2)));
  if(matching.length!==1)return review("MISSING_OR_MULTIPLE_TRANSFERS");
  const l=matching[0];if(l.removed!==false||!eq(l.transactionHash,txid)||!eq(l.blockHash,block.hash)||!quantity(l.blockNumber)||BigInt(l.blockNumber)!==BigInt(block.number)||!/^0x0{24}[0-9a-f]{40}$/i.test(l.topics[1])||!hash(l.data)||!quantity(l.logIndex))return review("INVALID_TRANSFER_LOG");
  amount=BigInt(l.data);eventIndex=BigInt(l.logIndex).toString();
 }
 if(amount!==BigInt(order.amountRaw))return review("AMOUNT_MISMATCH");
 return {status:"CANDIDATE",orderId:order.id,network:order.network,chainId:chain.id,assetIdentity:asset.identity,txid:lower(txid),eventIndex,amountRaw:amount.toString(),recipient:lower(order.address),blockTimeMs:Number(time),blockHash:lower(block.hash),eventKey:chain.id+":"+lower(txid)+":"+eventIndex};
}
export async function inspectEvmPayment(order,txid,{rpc,registry}){
 if(typeof rpc!=="function"||!/^0x[0-9a-f]{64}$/i.test(txid))return {status:"REVIEW",reason:"INVALID_RPC_OR_TXID"};
 try{
 const chainId=await rpc("eth_chainId",[]);if(chainId!==CHAINS[order?.network]?.id)return {status:"REVIEW",reason:"WRONG_CHAIN_ID"};
 const [tx,receipt]=await Promise.all([rpc("eth_getTransactionByHash",[txid]),rpc("eth_getTransactionReceipt",[txid])]);
 if(!receipt||!tx)return {status:"PENDING",reason:"RECEIPT_NOT_AVAILABLE"};
 const [block,finalized]=await Promise.all([rpc("eth_getBlockByNumber",[receipt.blockNumber,false]),rpc("eth_getBlockByNumber",["finalized",false])]);
 return verifyEvmReceipt(order,txid,{chainId,tx,receipt,block,finalized},registry);
 }catch{return {status:"RETRY",reason:"RPC_OR_FINALITY_UNAVAILABLE"}}
}
export function fixtureTests(){
 const result=[],a="0x"+"a".repeat(40),token="0x"+"c".repeat(40),txid="0x"+"b".repeat(64),bh="0x"+"d".repeat(64),fh="0x"+"e".repeat(64);
 for(const [network,chain] of Object.entries(CHAINS)){
 const base={id:"synthetic",network,address:a,amountRaw:"123",allocationKind:"unique-address",ownerVerified:true,createdMs:1000,expiresMs:3000};
 const registry={},native={...base,asset:chain.native,assetIdentity:"native:"+chain.id};registry[network+":"+chain.native]={verified:true,enabled:true,kind:"native",identity:native.assetIdentity,chainId:chain.id,asset:chain.native};
 const tx={hash:txid,blockHash:bh,blockNumber:"0x10",to:a,value:"0x7b",input:"0x"},receipt={transactionHash:txid,blockHash:bh,blockNumber:"0x10",status:"0x1",to:a,logs:[]},block={number:"0x10",timestamp:"0x2",hash:bh,transactions:[txid]},finalized={number:"0x11",hash:fh},e={chainId:chain.id,tx,receipt,block,finalized};
 const test=(n,expected,o=native,ev=e,r=registry)=>result.push({name:network+" "+n,pass:verifyEvmReceipt(o,txid,ev,r).status===expected});
 test("native","CANDIDATE");test("unconfirmed","PENDING",native,{...e,finalized:{number:"0xf",hash:fh}});test("wrong chain","REVIEW",native,{...e,chainId:"0x0"});test("failed","REVIEW",native,{...e,receipt:{...receipt,status:"0x0"}});test("reorg","REVIEW",native,{...e,block:{...block,hash:fh}});test("missing tx","REVIEW",native,{...e,block:{...block,transactions:[]}});test("underpayment","REVIEW",{...native,amountRaw:"124"});test("expired","REVIEW",{...native,expiresMs:1999});test("wrong recipient","REVIEW",native,{...e,tx:{...tx,to:token}});test("shared wallet","REVIEW",{...native,allocationKind:"shared-address"});test("missing finality","RETRY",native,{...e,finalized:null});test("unverified asset","REVIEW",native,e,{});
 for(const symbol of ["USDT","USDC"]){
 const o={...base,asset:symbol,assetIdentity:token};registry[network+":"+symbol]={verified:true,enabled:true,kind:"erc20",identity:token,contract:token,chainId:chain.id,asset:symbol};
 const log={address:token,topics:[TRANSFER,"0x"+"0".repeat(24)+"f".repeat(40),"0x"+"0".repeat(24)+a.slice(2)],data:"0x"+"7b".padStart(64,"0"),logIndex:"0x0",removed:false,transactionHash:txid,blockHash:bh,blockNumber:"0x10"},erc={...e,receipt:{...receipt,logs:[log]}};
 test(symbol+" exact","CANDIDATE",o,erc);test(symbol+" spoofed contract","REVIEW",o,{...erc,receipt:{...receipt,logs:[{...log,address:a}]}});test(symbol+" duplicate log","REVIEW",o,{...erc,receipt:{...receipt,logs:[log,log]}});test(symbol+" removed log","REVIEW",o,{...erc,receipt:{...receipt,logs:[{...log,removed:true}]}});test(symbol+" wrong amount","REVIEW",{...o,amountRaw:"122"},erc);
 }
 }
 return result;
}
