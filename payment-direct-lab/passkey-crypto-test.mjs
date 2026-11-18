// Real signed synthetic P-256 assertions. No genuine passkeys, user wallet, or network calls.
import {generateKeyPairSync,randomBytes,createHash,sign} from "node:crypto";
import {newStepUpOptions,verifyStepUpCryptography} from "./passkey-verify.mjs";
import assert from "node:assert/strict";
const b64=x=>Buffer.from(x).toString("base64url"),buf=x=>Buffer.from(x,"base64url"),hash=x=>createHash("sha256").update(x).digest();
const key=generateKeyPairSync("ec",{namedCurve:"prime256v1"}),j=key.publicKey.export({format:"jwk"});
// COSE EC2 ES256 map: kty=EC2, alg=ES256, crv=P256, x, y.
const cose=Buffer.concat([Buffer.from("a5010203262001215820","hex"),buf(j.x),Buffer.from("225820","hex"),buf(j.y)]);
const now=Date.now(),session={active:true,role:"MASTER",adminId:"fixture-master",sessionId:"fixture-session",expiresMs:now+600000},credential={active:true,adminId:session.adminId,id:b64(randomBytes(32)),publicKey:new Uint8Array(cose),counter:0};
const opts=await newStepUpOptions(session,credential,"WALLET_PROPOSE",now);
assert.equal(opts.userVerification,"required");
const challenge={value:opts.challenge,sessionId:session.sessionId,adminId:session.adminId,credentialId:credential.id,purpose:"WALLET_PROPOSE",binding:{network:"BSC",version:1,recipient:"fixture"},issuedMs:now,expiresMs:now+120000,used:false};
function response({origin="https://app.betinsight.club",rp="app.betinsight.club",value=challenge.value,flags=5,counter=1,otherKey=false,crossOrigin=false}={}){
 const client=Buffer.from(JSON.stringify({type:"webauthn.get",origin,challenge:value,crossOrigin}));
 const end=Buffer.alloc(5);end[0]=flags;end.writeUInt32BE(counter,1);
 const auth=Buffer.concat([hash(rp),end]);
 const signature=sign("sha256",Buffer.concat([auth,hash(client)]),otherKey?generateKeyPairSync("ec",{namedCurve:"prime256v1"}).privateKey:key.privateKey);
 return {id:credential.id,rawId:credential.id,type:"public-key",response:{clientDataJSON:b64(client),authenticatorData:b64(auth),signature:b64(signature)},clientExtensionResults:{}};
}
const input={session,credential,challenge,response:response(),now};
const cases=[
 ["valid ES256 assertion",input,true],
 ["wrong origin",{...input,response:response({origin:"https://evil.example"})},false],
 ["wrong RP",{...input,response:response({rp:"evil.example"})},false],
 ["wrong challenge",{...input,response:response({value:b64(randomBytes(32))})},false],
 ["no user verification",{...input,response:response({flags:1})},false],
 ["wrong signing key",{...input,response:response({otherKey:true})},false],
 ["cross-origin iframe",{...input,response:response({crossOrigin:true})},false],
 ["repeated counter",{...input,credential:{...credential,counter:1}},false],
 ["expired challenge",{...input,now:now+120000},false],
 ["other session",{...input,session:{...session,sessionId:"other"}},false],
 ["not master",{...input,session:{...session,role:"ADMIN"}},false],
 ["used challenge",{...input,challenge:{...challenge,used:true}},false],
 ["revoked credential",{...input,credential:{...credential,active:false}},false]
];
let passed=0;
for(const [name,args,want] of cases){const r=await verifyStepUpCryptography(args);assert.equal(r.ok,want,name+" "+JSON.stringify(r));console.log("PASS",name);passed++}
console.log("PASSKEY CRYPTOGRAPHY "+passed+"/"+cases.length+" passed; synthetic signed assertions only; no user enrollment or live activation.");
