// Development only. Public receive address derivation, not ownership proof or allocation.
import {HDKey} from "@scure/bip32";
import {keccak_256} from "@noble/hashes/sha3.js";
import {ECDH} from "node:crypto";
const indexOk=n=>Number.isSafeInteger(n)&&n>=0&&n<0x80000000;
const fail=code=>({ok:false,code});
const networks=["ETHEREUM","BSC","POLYGON"];
export function prepareEvmReceivePool(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).some(k=>!["extendedPublicKey","accountPath","anchor","start","count"].includes(k)))return fail("INVALID_SCHEMA");
 const {extendedPublicKey:k,accountPath,anchor,start,count}=input;
 if(typeof k!=="string"||!/^xpub[1-9A-HJ-NP-Za-km-z]{107}$/.test(k))return fail("PUBLIC_ACCOUNT_KEY_REQUIRED");
 // Standard m/44'/60'/account'/0/index only. Other OneKey account conventions need separate validation.
 const m=typeof accountPath==="string"&&/^m\/44'\/60'\/(0|[1-9]\d{0,9})'$/.exec(accountPath);
 if(!m||!indexOk(Number(m[1])))return fail("EVM_ACCOUNT_PATH_REQUIRED");
 if(!indexOk(start)||!Number.isSafeInteger(count)||count<1||count>20||!indexOk(start+count-1))return fail("BOUNDED_RANGE_REQUIRED");
 if(!anchor||Object.keys(anchor).some(k=>!["index","address"].includes(k))||!indexOk(anchor.index)||typeof anchor.address!=="string"||!/^0x[0-9a-fA-F]{40}$/.test(anchor.address))return fail("DEVICE_CONFIRMED_ADDRESS_REQUIRED");
 try{
  const key=HDKey.fromExtendedKey(k);
  if(key.privateKey!==null||!key.publicKey||key.depth!==3||key.index!==0x80000000+Number(m[1]))return fail("ACCOUNT_KEY_MISMATCH");
  const receive=key.deriveChild(0);
  if(receive.index!==0||receive.privateKey!==null)return fail("DERIVATION_FAILED");
  const at=i=>{
   const child=receive.deriveChild(i);
   if(child.index!==i||child.privateKey!==null||!child.publicKey)throw Error("DERIVATION_FAILED");
   const pub=ECDH.convertKey(Buffer.from(child.publicKey),"secp256k1",undefined,undefined,"uncompressed");
   if(pub.length!==65||pub[0]!==4)throw Error("DERIVATION_FAILED");
   const lower=Buffer.from(keccak_256(pub.subarray(1))).subarray(12).toString("hex");
   const check=Buffer.from(keccak_256(Buffer.from(lower,"ascii"))).toString("hex");
   const checksum="0x"+[...lower].map((c,j)=>parseInt(check[j],16)>=8?c.toUpperCase():c).join("");
   return {index:i,canonicalAddress:"0x"+lower,displayAddress:checksum};
  };
  const ref=at(anchor.index);
  if(anchor.address.toLowerCase()!==ref.canonicalAddress)return fail("DEVICE_ADDRESS_MISMATCH");
  const body=anchor.address.slice(2);
  if(body!==body.toLowerCase()&&body!==body.toUpperCase()&&anchor.address!==ref.displayAddress)return fail("INVALID_ADDRESS_CHECKSUM");
  const entries=Array.from({length:count},(_,i)=>at(start+i));
  if(new Set(entries.map(x=>x.canonicalAddress)).size!==count)return fail("DUPLICATE_ADDRESS");
  return {ok:true,networks,accountPath,entries,status:"UNVERIFIED_DRAFT",authorizesAllocation:false};
 }catch{return fail("INVALID_PUBLIC_KEY_OR_DERIVATION")}
}
