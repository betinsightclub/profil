// Watch-only Bitcoin BIP84 mainnet derivation. Never accept a private extended key.
// Dependencies for development test: @scure/bip32@2.4.0, @scure/btc-signer@2.4.1.
// No signing, network requests, persistence, address allocation, or ownership approval.
import {HDKey} from "@scure/bip32";
import {p2wpkh} from "@scure/btc-signer";
const VERSION_X={public:0x0488b21e,private:0x0488ade4},VERSION_Z={public:0x04b24746,private:0x04b2430c};
const validIndex=n=>Number.isSafeInteger(n)&&n>=0&&n<0x80000000;
const error=code=>({ok:false,code});
export function prepareBitcoinReceivePool(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).some(k=>!["extendedPublicKey","accountPath","anchor","start","count"].includes(k)))return error("INVALID_SCHEMA");
 const {extendedPublicKey:k,accountPath,anchor,start,count}=input;
 if(typeof k!=="string"||!/^(xpub|zpub)[1-9A-HJ-NP-Za-km-z]{107}$/.test(k))return error("PUBLIC_ACCOUNT_KEY_REQUIRED");
 const m=typeof accountPath==="string"&&/^m\/84'\/0'\/(0|[1-9]\d{0,9})'$/.exec(accountPath);
 if(!m||!validIndex(Number(m[1])))return error("BIP84_MAINNET_PATH_REQUIRED");
 if(!validIndex(start)||!Number.isSafeInteger(count)||count<1||count>20||!validIndex(start+count-1))return error("BOUNDED_RANGE_REQUIRED");
 if(!anchor||Object.keys(anchor).some(k=>!["index","address"].includes(k))||!validIndex(anchor.index)||typeof anchor.address!=="string"||!/^bc1q[023456789acdefghjklmnpqrstuvwxyz]{38}$/.test(anchor.address))return error("DEVICE_CONFIRMED_ADDRESS_REQUIRED");
 try{
  const key=HDKey.fromExtendedKey(k,k.startsWith("zpub")?VERSION_Z:VERSION_X);
  if(key.privateKey!==null||!key.publicKey||key.depth!==3||key.index!==0x80000000+Number(m[1]))return error("ACCOUNT_KEY_MISMATCH");
  const recv=key.deriveChild(0);
  if(recv.index!==0||recv.privateKey!==null)return error("DERIVATION_FAILED");
  function at(i){
   const child=recv.deriveChild(i);
   if(child.index!==i||child.privateKey!==null||!child.publicKey)throw Error("DERIVATION_FAILED");
   const a=p2wpkh(child.publicKey);
   if(!a.address||!a.script)throw Error("DERIVATION_FAILED");
   return {index:i,address:a.address,scriptPubKey:Buffer.from(a.script).toString("hex")};
  }
  if(at(anchor.index).address!==anchor.address)return error("DEVICE_ADDRESS_MISMATCH");
  const entries=Array.from({length:count},(_,i)=>at(start+i));
  if(new Set(entries.map(e=>e.address)).size!==count)return error("DUPLICATE_ADDRESS");
  return {ok:true,network:"BITCOIN",script:"P2WPKH",accountPath,entries,
    status:"UNVERIFIED_DRAFT",authorizesAllocation:false};
 }catch{return error("INVALID_PUBLIC_KEY_OR_DERIVATION")}
}
