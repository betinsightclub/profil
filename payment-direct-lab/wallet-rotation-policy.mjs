// BetInsight Pay: isolated policy simulation, NOT production authentication or persistence.
export const NETWORK_ASSETS={
  "BSC": [
    "BNB",
    "USDT",
    "USDC"
  ],
  "ETHEREUM": [
    "ETH",
    "USDT",
    "USDC"
  ],
  "TRON": [
    "TRX",
    "USDT"
  ],
  "POLYGON": [
    "POL",
    "USDT",
    "USDC"
  ],
  "SOLANA": [
    "SOL",
    "USDT",
    "USDC"
  ],
  "BITCOIN": [
    "BTC"
  ],
  "LITECOIN": [
    "LTC"
  ],
  "DOGECOIN": [
    "DOGE"
  ],
  "XRPL": [
    "XRP"
  ],
  "BITCOINCASH": [
    "BCH"
  ]
};
export function rotationPolicy(state,cmd,ctx){
 // Pure simulation: ctx must come from a trusted backend in any future integration, NOT a client.
 const fail=reason=>({ok:false,reason});
 if(!ctx?.master||ctx.stepUpVerified!==true||ctx.purpose!==cmd.type||ctx.binding!==cmd.binding||!ctx.challengeId||!Number.isSafeInteger(ctx.now)||!Number.isSafeInteger(ctx.verifiedAt)||ctx.verifiedAt>ctx.now||ctx.now-ctx.verifiedAt>300000)return fail("FRESH_BOUND_MASTER_AUTH_REQUIRED");
 if(state.usedChallenges.includes(ctx.challengeId))return fail("CHALLENGE_REPLAY");
 const next=JSON.parse(JSON.stringify(state)),e=next.networks[cmd.network];if(!e)return fail("UNKNOWN_NETWORK");
 const audit=event=>{next.usedChallenges.push(ctx.challengeId);next.audit.push({event,network:cmd.network,at:ctx.now,actor:ctx.actor,requestId:cmd.requestId});return {ok:true,state:next}};
 const owns=address=>ctx.ownershipVerified===true&&ctx.validatedAddress===address&&ctx.validatedNetwork===cmd.network;
 if(cmd.type==="propose"){
  if(e.pending)return fail("PENDING_CHANGE_EXISTS");
  if(!cmd.requestId||typeof cmd.address!=="string"||!cmd.address||cmd.address===e.active?.address||!owns(cmd.address))return fail("ADDRESS_VALIDATION_AND_OWNERSHIP_REQUIRED");
  if(cmd.expectedVersion!==e.version||cmd.binding!==JSON.stringify(["propose",cmd.network,cmd.requestId,cmd.address,e.version]))return fail("STALE_OR_WRONG_BINDING");
  e.pending={requestId:cmd.requestId,address:cmd.address,version:e.version,notBefore:ctx.now+86400000,expiresAt:ctx.now+604800000,proposalChallenge:ctx.challengeId};return audit("ROTATION_PROPOSED");
 }
 if(cmd.type==="freeze"){if(cmd.binding!==JSON.stringify(["freeze",cmd.network,e.version]))return fail("WRONG_BINDING");e.frozen=true;return audit("NETWORK_FROZEN")}
 const p=e.pending;if(!p||p.requestId!==cmd.requestId||p.version!==e.version||cmd.binding!==JSON.stringify([cmd.type,cmd.network,p.requestId,p.address,p.version]))return fail("NO_MATCHING_PROPOSAL");
 if(cmd.type==="cancel"){e.pending=null;return audit("ROTATION_CANCELLED")}
 if(cmd.type!=="activate"||ctx.now<p.notBefore||ctx.now>p.expiresAt||ctx.verifiedAt<p.notBefore||ctx.challengeId===p.proposalChallenge||ctx.alertDeliveredFor!==p.requestId||!owns(p.address)||e.frozen)return fail("ACTIVATION_BLOCKED");
 if(e.active)e.history.push({...e.active,retiredAt:ctx.now});
 e.version++;e.active={address:p.address,version:e.version,activatedAt:ctx.now};e.pending=null;return audit("ROTATION_ACTIVATED");
}
export function snapshotForOrder(state,network){const e=state.networks[network];return !e||e.frozen||!e.active?null:Object.freeze({network,address:e.active.address,walletVersion:e.active.version})}
export function fixtureTests(){
 const n=1000000000,net="BSC",req="synthetic-1",addr="new-synthetic-address",v=1;
 const s={networks:{BSC:{version:v,active:{address:"old-synthetic-address",version:v},history:[],pending:null,frozen:false}},usedChallenges:[],audit:[]};
 const c={type:"propose",network:net,requestId:req,address:addr,expectedVersion:v,binding:JSON.stringify(["propose",net,req,addr,v])};
 const x={master:true,stepUpVerified:true,purpose:"propose",binding:c.binding,challengeId:"c1",now:n,verifiedAt:n,actor:"owner",validatedNetwork:net,validatedAddress:addr,ownershipVerified:true};
 const r=rotationPolicy(s,c,x),a=r.state,act={type:"activate",network:net,requestId:req,binding:JSON.stringify(["activate",net,req,addr,v])};
 const y={...x,purpose:"activate",binding:act.binding,challengeId:"c2",now:n+86400000,verifiedAt:n+86400000,alertDeliveredFor:req};
 const old=snapshotForOrder(s,net),success=rotationPolicy(a,act,y);
 const f={type:"freeze",network:net,binding:JSON.stringify(["freeze",net,v])},fr=rotationPolicy(a,f,{...x,purpose:"freeze",binding:f.binding,challengeId:"c3"});
 return [["proposal",r.ok],["non-master",!rotationPolicy(s,c,{...x,master:false}).ok],["missing step-up",!rotationPolicy(s,c,{...x,stepUpVerified:false}).ok],["expired auth",!rotationPolicy(s,c,{...x,verifiedAt:n-300001}).ok],["wrong binding",!rotationPolicy(s,c,{...x,binding:"different"}).ok],["no ownership",!rotationPolicy(s,c,{...x,ownershipVerified:false}).ok],["wrong network",!rotationPolicy(s,c,{...x,validatedNetwork:"TRON"}).ok],["stale version",!rotationPolicy(s,{...c,expectedVersion:0},x).ok],["old address pending",snapshotForOrder(a,net).address===old.address],["replay",!rotationPolicy(a,c,x).ok],["early activation",!rotationPolicy(a,act,{...y,now:n+100,verifiedAt:n+100}).ok],["missing alert",!rotationPolicy(a,act,{...y,alertDeliveredFor:"other"}).ok],["same challenge",!rotationPolicy(a,act,{...y,challengeId:"c1"}).ok],["valid activation",success.ok],["old order immutable",old.address==="old-synthetic-address"],["new order",snapshotForOrder(success.state,net).address===addr],["history",success.state.networks.BSC.history[0].address===old.address],["freeze",fr.ok&&snapshotForOrder(fr.state,net)===null],["frozen activation",!rotationPolicy(fr.state,act,y).ok],["activation replay",!rotationPolicy(success.state,act,y).ok]].map(([name,pass])=>({name,pass:pass===true}));
}
