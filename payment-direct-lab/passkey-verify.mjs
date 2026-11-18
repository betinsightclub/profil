// Development only. No API route, enrollment, session storage, grant issuance or wallet changes.
// The only caller must load challenge and registered credential from protected storage.
// Pin @simplewebauthn/server 14.1.0; production dependency lock and review required.
import {verifyAuthenticationResponse,generateAuthenticationOptions} from "@simplewebauthn/server";
const origin="https://app.betinsight.club",rpID="app.betinsight.club";
const purposes=new Set(["WALLET_PROPOSE","WALLET_ACTIVATE","WALLET_FREEZE","MANUAL_SETTLEMENT"]);
const b64=s=>typeof s==="string"&&/^[A-Za-z0-9_-]+$/.test(s)&&s.length<=65536;
const invalid=reason=>({ok:false,reason});
function validSession(s,now){return s?.active===true&&s.role==="MASTER"&&typeof s.adminId==="string"&&s.adminId.length>0&&typeof s.sessionId==="string"&&s.sessionId.length>0&&Number.isSafeInteger(s.expiresMs)&&s.expiresMs>now}
function validCredential(c,s){return c?.active===true&&c.adminId===s.adminId&&b64(c.id)&&c.publicKey instanceof Uint8Array&&c.publicKey.length>0&&c.publicKey.length<=8192&&Number.isSafeInteger(c.counter)&&c.counter>=0&&c.counter<=4294967295}
export async function newStepUpOptions(session,credential,purpose,now){
 if(!Number.isSafeInteger(now)||!validSession(session,now)||!validCredential(credential,session)||!purposes.has(purpose))throw Error("MASTER_CREDENTIAL_REQUIRED");
 const opts=await generateAuthenticationOptions({rpID,allowCredentials:[{id:credential.id}],userVerification:"required",timeout:120000});
 // Caller must persist a random challenge with immutable action binding, session, master, expiration.
 return opts;
}
export async function verifyStepUpCryptography({session,credential,challenge,response,now}){
 if(!Number.isSafeInteger(now)||!validSession(session,now)||!validCredential(credential,session))return invalid("MASTER_CREDENTIAL_REQUIRED");
 if(!challenge||challenge.used===true||challenge.sessionId!==session.sessionId||challenge.adminId!==session.adminId||challenge.credentialId!==credential.id||!purposes.has(challenge.purpose)||!challenge.binding||typeof challenge.binding!=="object"||Array.isArray(challenge.binding)||!b64(challenge.value)||challenge.value.length<43||!Number.isSafeInteger(challenge.issuedMs)||!Number.isSafeInteger(challenge.expiresMs)||challenge.issuedMs>now||challenge.expiresMs<=now||challenge.expiresMs-challenge.issuedMs>120000)return invalid("CHALLENGE_INVALID");
 if(response?.id!==credential.id||response.rawId!==credential.id||response.type!=="public-key"||!b64(response.response?.clientDataJSON)||!b64(response.response?.authenticatorData)||!b64(response.response?.signature))return invalid("ASSERTION_INVALID");
 try{
  const data=JSON.parse(Buffer.from(response.response.clientDataJSON,"base64url").toString("utf8"));
  if(data.type!=="webauthn.get"||data.origin!==origin||data.challenge!==challenge.value||data.crossOrigin===true)return invalid("CLIENT_DATA_MISMATCH");
  const r=await verifyAuthenticationResponse({response,expectedChallenge:challenge.value,expectedOrigin:origin,expectedRPID:rpID,expectedType:"webauthn.get",requireUserVerification:true,credential:{id:credential.id,publicKey:credential.publicKey,counter:credential.counter}});
  const a=r.authenticationInfo;
  if(r.verified!==true||a?.userVerified!==true||a.credentialID!==credential.id||a.origin!==origin||a.rpID!==rpID||!Number.isSafeInteger(a.newCounter)||a.newCounter<0||a.newCounter>4294967295)return invalid("ASSERTION_NOT_VERIFIED");
  return {ok:true,credentialId:credential.id,previousCounter:credential.counter,newCounter:a.newCounter,sessionId:session.sessionId,adminId:session.adminId,challenge:challenge.value,purpose:challenge.purpose,binding:challenge.binding,verifiedMs:now};
  // Atomic DB transaction MUST recheck current session, credential/counter, challenge and action,
  // consume challenge once, update counter and issue bound grant. This result itself is not a grant.
 }catch{return invalid("CRYPTOGRAPHIC_VERIFICATION_FAILED")}
}
