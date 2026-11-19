// Development-only EIP-191 ownership proof for the EVM receive import.
// No transactions, typed data, permits, approvals, or private keys. No persistence.
// Trusted backend must persist challenge, compare immutable request, recheck session and consume once.
import { createHash,randomBytes } from "node:crypto";
import { verifyMessage } from "ethers";
import { prepareEvmReceivePool } from "./evm-watchonly-import.mjs";
const sha=s=>createHash("sha256").update(s,"utf8").digest("hex");
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function binding(input,ctx){
 const p=prepareEvmReceivePool(input);
 if(!p.ok||!uuid(ctx?.requestId)||!uuid(ctx?.sessionId)||!Number.isSafeInteger(ctx?.version)||ctx.version<1||typeof ctx?.adminId!=="string"||!/^[A-Za-z0-9_-]{1,80}$/.test(ctx.adminId))throw Error("INVALID_IMPORT");
 const digest=sha(JSON.stringify([input.extendedPublicKey,p.accountPath,input.start,input.count,input.anchor.index,p.entries.map(e=>[e.index,e.canonicalAddress])]));
 return {requestId:ctx.requestId,sessionId:ctx.sessionId,adminId:ctx.adminId,version:ctx.version,digest,address:input.anchor.address.toLowerCase(),path:p.accountPath+"/0/"+input.anchor.index};
}
function message(b,c){
 return ["BetInsight Pay - Empfangswallet Eigentumsnachweis","Domain: app.betinsight.club","Nur Nachricht signieren. Keine Zahlung oder Token-Freigabe.","Netzwerke: Ethereum (1), BNB Smart Chain (56), Polygon (137)","Anfrage: "+b.requestId,"Master: "+b.adminId,"Wallet-Version: "+b.version,"Adresse: "+b.address,"Pfad: "+b.path,"Import-Pruefsumme: "+b.digest,"Sitzungsbindung: "+sha(b.sessionId),"Nonce: "+c.nonce,"Gueltig bis UTC: "+new Date(c.expiresMs).toISOString()].join("\n");
}
export function createEvmImportProof(input,ctx,now=Date.now()){
 if(!Number.isSafeInteger(now)||now<0)throw Error("INVALID_TIME");
 const b=binding(input,ctx),c={nonce:randomBytes(32).toString("hex"),issuedMs:now,expiresMs:now+300000,used:false,binding:b};
 return {...c,message:message(b,c)};
}
export function verifyEvmImportProof(input,ctx,c,signature,now=Date.now()){
 try{
  const b=binding(input,ctx);
  if(!Number.isSafeInteger(now)||!c||c.used!==false||!Number.isSafeInteger(c.issuedMs)||!Number.isSafeInteger(c.expiresMs)||c.issuedMs>now||c.expiresMs<=now||c.expiresMs-c.issuedMs!==300000||!/^[a-f0-9]{64}$/.test(c.nonce??"")||JSON.stringify(c.binding)!==JSON.stringify(b)||c.message!==message(b,c))return {ok:false,reason:"CHALLENGE_MISMATCH"};
  if(typeof signature!=="string"||! /^(?:0x)?[0-9a-fA-F]{130}$/.test(signature))return {ok:false,reason:"INVALID_SIGNATURE"};
  const recovered=verifyMessage(c.message,signature.startsWith("0x")?signature:"0x"+signature).toLowerCase();
  if(recovered!==b.address)return {ok:false,reason:"SIGNER_MISMATCH"};
  return {ok:true,status:"VERIFIED_SIGNATURE_ONLY",binding:b,proofDigest:sha(c.message),authorizesAllocation:false};
 }catch{return {ok:false,reason:"PROOF_FAILED"}}
}
