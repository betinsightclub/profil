
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const ALLOWED_ORIGINS=new Set(["https://app.betinsight.club","https://betinsightclub.github.io"]);
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
let SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
if(!SERVICE_KEY){try{const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");SERVICE_KEY=keys.default||Object.values(keys)[0]||""}catch(_){}}
if(!SUPABASE_URL||!SERVICE_KEY)throw new Error("Supabase credentials unavailable");
const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

const COMMUNITY_UNIT_WEBHOOK=Deno.env.get("COMMUNITY_UNIT_WEBHOOK")||"";
const COMMUNITY_UNIT_SECRET=Deno.env.get("COMMUNITY_UNIT_SECRET")||"";
function monthKeyBerlin(d=new Date()){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit"}).formatToParts(d);
  const x:any=Object.fromEntries(p.map(z=>[z.type,z.value]));
  return String(x.year)+"-"+String(x.month);
}
function globalPricing(tier:string){
  if(tier==="PREMIUM_PLUS")return {unit_cost:0.10,monthly_limit:20};
  if(tier==="PREMIUM")return {unit_cost:0.25,monthly_limit:10};
  return {unit_cost:0.50,monthly_limit:null};
}
function effectiveMember(row:any){
  const raw=String(row?.raw_tier||"BASIS").toUpperCase();
  if(raw==="BASIS")return {...row,effective_tier:"BASIS",effective_status:"BASIS",payment_confirmed:true};
  const now=Date.now(),until=row?.premium_until?new Date(row.premium_until).getTime():0,grace=row?.grace_until?new Date(row.grace_until).getTime():0;
  if(until&&until>=now)return {...row,effective_tier:raw,effective_status:"AKTIV",payment_confirmed:true};
  if(grace&&grace>=now)return {...row,effective_tier:raw,effective_status:"KULANZ",payment_confirmed:false};
  if(String(row?.effective_status||"").toUpperCase()==="AKTIV_OHNE_ENDDATUM"&&row?.payment_confirmed===true)
    return {...row,effective_tier:raw,effective_status:"AKTIV_OHNE_ENDDATUM",payment_confirmed:true};
  return {...row,effective_tier:"BASIS",effective_status:"ABGELAUFEN",payment_confirmed:false};
}
async function unitCall(payload:any){
  if(!COMMUNITY_UNIT_WEBHOOK||!COMMUNITY_UNIT_SECRET)throw new Error("BILLING_NOT_CONFIGURED");
  const r=await fetch(COMMUNITY_UNIT_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,gateway_secret:COMMUNITY_UNIT_SECRET}),redirect:"follow"});
  const d:any=await r.json().catch(()=>({}));
  if(!r.ok||d.ok===false)throw new Error(d.error||"UNIT_REFUND_FAILED");
  return d;
}

function cors(origin:string|null){const allowed=origin&&ALLOWED_ORIGINS.has(origin)?origin:"";return{"Access-Control-Allow-Origin":allowed,"Vary":"Origin","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"}}
function j(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}})}
function clean(v:unknown,n=1000){return String(v??"").trim().slice(0,n)}
function ip(req:Request){const f=req.headers.get("x-forwarded-for");return(f?f.split(",")[0].trim():req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown").slice(0,80)}
async function rateAllowed(key:string,limit:number,windowSeconds:number){const{data,error}=await admin.rpc("betinsight_gateway_rate_check",{p_key:key,p_limit:limit,p_window_seconds:windowSeconds});if(error)return false;return data===true}

async function verifyAdmin(sessionHash:string){
  const hash=clean(sessionHash,200);
  if(!hash)return null;
  const u=new URL(SUPABASE_URL+"/functions/v1/betinsight-admin-gateway");
  u.searchParams.set("route","admin-auth");
  const r=await fetch(u.toString(),{
    method:"POST",
    headers:{"Origin":"https://app.betinsight.club","Content-Type":"application/json"},
    body:JSON.stringify({action:"verify",session_hash:hash})
  });
  if(!r.ok)return null;
  let d:any=null;try{d=await r.json()}catch(_){return null}
  if(!d||d.ok!==true||!d.admin_id)return null;
  return {adminId:String(d.admin_id),name:String(d.name||"Admin"),role:String(d.role||"ADMIN"),master:String(d.master||"NEIN"),expiresMs:Number(d.expires_ms||0)};
}

async function reportCount(type:string,id:string){
  const q=await admin.from("community_reports").select("id",{count:"exact",head:true}).eq("target_type",type).eq("target_id",id).eq("status","OPEN");
  if(q.error)throw q.error;return q.count||0;
}
async function queue(){
  const [p,c,m,r]=await Promise.all([
    admin.from("community_posts").select("id,club_id,owner_ref,body,emotion,status,moderation_flags,moderation_score,media_id,created_at").in("status",["PENDING_REVIEW","HIDDEN"]).order("created_at",{ascending:true}).limit(80),
    admin.from("community_comments").select("id,post_id,owner_ref,body,status,moderation_flags,moderation_score,created_at").in("status",["PENDING_REVIEW","HIDDEN"]).order("created_at",{ascending:true}).limit(80),
    admin.from("community_media").select("id,owner_ref,club_id,storage_path,mime_type,bytes,width,height,purpose,status,moderation_flags,created_at").in("status",["PENDING_REVIEW","HIDDEN"]).order("created_at",{ascending:true}).limit(80),
    admin.from("community_reports").select("id,target_type,target_id,reporter_ref,reason,details,status,created_at").eq("status","OPEN").order("created_at",{ascending:true}).limit(150)
  ]);
  for(const x of [p,c,m,r])if(x.error)throw x.error;
  const reports=r.data||[];
  const repMap=new Map<string,number>();
  for(const x of reports){const k=x.target_type+":"+x.target_id;repMap.set(k,(repMap.get(k)||0)+1)}
  const decorate=(type:string,x:any)=>({...x,target_type:type,report_count:repMap.get(type+":"+x.id)||0});
  const byType:any={post:new Map(),comment:new Map(),media:new Map(),profile:new Map()};
  const fetchTargets=async(type:string,table:string,ids:string[],fields:string)=>{
    if(!ids.length)return;
    const q=await admin.from(table).select(fields).in("id",ids);
    if(q.error)throw q.error;
    (q.data||[]).forEach((x:any)=>byType[type].set(x.id,x));
  };
  await Promise.all([
    fetchTargets("post","community_posts",[...new Set(reports.filter((x:any)=>x.target_type==="post").map((x:any)=>x.target_id))],"id,owner_ref,body,status,distribution_scope,unit_cost,unit_charge_status,created_at"),
    fetchTargets("comment","community_comments",[...new Set(reports.filter((x:any)=>x.target_type==="comment").map((x:any)=>x.target_id))],"id,owner_ref,body,status,created_at"),
    fetchTargets("media","community_media",[...new Set(reports.filter((x:any)=>x.target_type==="media").map((x:any)=>x.target_id))],"id,owner_ref,storage_path,status,created_at"),
    fetchTargets("profile","community_trainer_profiles",[...new Set(reports.filter((x:any)=>x.target_type==="profile").map((x:any)=>x.target_id))],"id,owner_ref,display_name,bio,visibility,created_at")
  ]);
  const reportRows=reports.map((x:any)=>{
    const target=byType[x.target_type]?.get(x.target_id)||null;
    if(target&&x.target_type==="media"&&target.storage_path)target.public_url=SUPABASE_URL+"/storage/v1/object/public/community-media/"+target.storage_path;
    return {...x,target};
  });
  return {
    posts:(p.data||[]).map((x:any)=>decorate("post",x)),
    comments:(c.data||[]).map((x:any)=>decorate("comment",x)),
    media:(m.data||[]).map((x:any)=>({...decorate("media",x),public_url:SUPABASE_URL+"/storage/v1/object/public/community-media/"+x.storage_path})),
    reports:reportRows
  };
}
function targetTable(type:string){return type==="post"?"community_posts":type==="comment"?"community_comments":type==="media"?"community_media":""}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS"){if(!origin||!ALLOWED_ORIGINS.has(origin))return j({ok:false},403,origin);return new Response("ok",{headers:cors(origin)})}
  if(req.method!=="POST")return j({ok:false,error:"METHOD_NOT_ALLOWED"},405,origin);
  if(!origin||!ALLOWED_ORIGINS.has(origin))return j({ok:false,error:"ORIGIN_NOT_ALLOWED"},403,origin);
  if(!await rateAllowed("community-admin:"+ip(req),140,300))return j({ok:false,error:"RATE_LIMITED"},429,origin);

  let b:any={};try{const raw=await req.text();if(raw.length>65536)return j({ok:false,error:"PAYLOAD_TOO_LARGE"},413,origin);b=raw?JSON.parse(raw):{}}catch(_){return j({ok:false,error:"INVALID_JSON"},400,origin)}
  const who=await verifyAdmin(b.session_hash||"");
  if(!who)return j({ok:false,error:"INVALID_ADMIN_SESSION"},401,origin);
  const action=clean(b.action,40);

  try{
    if(action==="dashboard"){
      const q=await queue();
      const month=monthKeyBerlin();
      const [membersQ,chargesQ,globalPostsQ]=await Promise.all([
        admin.from("community_membership_state").select("*").order("updated_at",{ascending:false}).limit(500),
        admin.from("community_post_charges").select("*").eq("month_key",month).order("created_at",{ascending:false}).limit(1000),
        admin.from("community_posts").select("id,owner_ref,status,unit_cost,unit_charge_status,billing_tier,billing_month,created_at").eq("distribution_scope","GLOBAL").eq("billing_month",month).order("created_at",{ascending:false}).limit(1000)
      ]);
      for(const x of [membersQ,chargesQ,globalPostsQ])if(x.error)throw x.error;
      const chargeRows=chargesQ.data||[],globalRows=globalPostsQ.data||[];
      const members=(membersQ.data||[]).map((raw:any)=>{
        const m=effectiveMember(raw),mine=globalRows.filter((x:any)=>x.owner_ref===raw.owner_ref&&x.status!=="DELETED"&&x.status!=="REJECTED"),
          charges=chargeRows.filter((x:any)=>x.owner_ref===raw.owner_ref),
          paid=charges.filter((x:any)=>x.charge_status==="PAID").reduce((z:number,x:any)=>z+Number(x.unit_cost||0),0),
          refunded=charges.filter((x:any)=>x.charge_status==="REFUNDED").reduce((z:number,x:any)=>z+Number(x.unit_cost||0),0);
        const limit=m.effective_tier==="PREMIUM_PLUS"?20:m.effective_tier==="PREMIUM"?10:null;
        return {...m,month_key:month,global_posts_month:mine.length,monthly_limit:limit,global_units_paid:Number((paid-refunded).toFixed(2)),last_global_post_at:mine[0]?.created_at||null};
      });
      const [openReports,pendingPosts,pendingComments,pendingMedia]=await Promise.all([
        admin.from("community_reports").select("id",{count:"exact",head:true}).eq("status","OPEN"),
        admin.from("community_posts").select("id",{count:"exact",head:true}).in("status",["PENDING_REVIEW","HIDDEN"]),
        admin.from("community_comments").select("id",{count:"exact",head:true}).in("status",["PENDING_REVIEW","HIDDEN"]),
        admin.from("community_media").select("id",{count:"exact",head:true}).in("status",["PENDING_REVIEW","HIDDEN"])
      ]);
      return j({ok:true,admin:who,month_key:month,counts:{reports:openReports.count||0,posts:pendingPosts.count||0,comments:pendingComments.count||0,media:pendingMedia.count||0},queue:q,members,charges:chargeRows},200,origin);
    }

    if(action==="decide"){
      const type=clean(b.target_type,20);
      const id=clean(b.target_id,120);
      const decision=clean(b.decision,30).toUpperCase();
      const reason=clean(b.reason,1000)||null;
      if(!type||!id)return j({ok:false,error:"TARGET_REQUIRED"},400,origin);

      if(type==="user"){
        const userAction=decision;
        const current=await admin.from("community_user_state").select("*").eq("owner_ref",id).maybeSingle();
        if(current.error)throw current.error;
        if(!current.data)return j({ok:false,error:"USER_STATE_NOT_FOUND"},404,origin);
        const patch:any={updated_at:new Date().toISOString()};
        let logAction="";
        if(userAction==="WARN"){patch.status="warned";patch.strikes=Number(current.data.strikes||0)+1;logAction="WARN"}
        else if(userAction==="SUSPEND"){const days=Math.max(1,Math.min(90,Number(b.days)||7));patch.status="suspended";patch.trust_level="restricted";patch.strikes=Number(current.data.strikes||0)+1;patch.suspended_until=new Date(Date.now()+days*86400000).toISOString();logAction="SUSPEND"}
        else if(userAction==="BAN"){patch.status="banned";patch.trust_level="restricted";patch.strikes=Number(current.data.strikes||0)+1;patch.suspended_until=null;logAction="BAN"}
        else if(userAction==="RESTORE"){patch.status="active";patch.trust_level="standard";patch.suspended_until=null;logAction="RESTORE"}
        else return j({ok:false,error:"INVALID_USER_DECISION"},400,origin);
        const up=await admin.from("community_user_state").update(patch).eq("owner_ref",id);if(up.error)throw up.error;
        await admin.from("community_moderation_actions").insert({target_type:"user",target_id:id,action:logAction,admin_ref:who.adminId,reason,metadata:{days:b.days||null}});
        return j({ok:true},200,origin);
      }

      const table=targetTable(type);
      if(!table)return j({ok:false,error:"INVALID_TARGET_TYPE"},400,origin);
      let status="";let logAction="";
      if(decision==="PUBLISH"){status="PUBLISHED";logAction="PUBLISH"}
      else if(decision==="HIDE"){status="HIDDEN";logAction="HIDE"}
      else if(decision==="REJECT"){status="REJECTED";logAction="REJECT"}
      else if(decision==="DELETE"){status="DELETED";logAction="DELETE"}
      else if(decision==="RESTORE"){status="PUBLISHED";logAction="RESTORE"}
      else return j({ok:false,error:"INVALID_DECISION"},400,origin);

      const patch:any={status};
      if(table!=="community_media")patch.updated_at=new Date().toISOString();
      if(table==="community_posts"&&status==="PUBLISHED")patch.published_at=new Date().toISOString();
      if(table==="community_media"){patch.reviewed_at=new Date().toISOString();patch.reviewed_by=who.adminId}

      let billingMeta:any=null;
      if(type==="post"&&(decision==="PUBLISH"||decision==="RESTORE")){
        const pq=await admin.from("community_posts").select("id,owner_ref,club_id,distribution_scope,unit_cost,unit_charge_status,billing_reference").eq("id",id).maybeSingle();
        if(pq.error)throw pq.error;
        if(pq.data&&pq.data.distribution_scope==="GLOBAL"&&pq.data.unit_charge_status!=="PAID"){
          const ms=await admin.from("community_membership_state").select("*").eq("owner_ref",pq.data.owner_ref).maybeSingle();
          if(ms.error)throw ms.error;
          const member=effectiveMember(ms.data||{owner_ref:pq.data.owner_ref}),price=globalPricing(member.effective_tier),month=monthKeyBerlin();
          const usedQ=await admin.from("community_posts").select("id",{count:"exact",head:true})
            .eq("owner_ref",pq.data.owner_ref).eq("distribution_scope","GLOBAL").eq("billing_month",month)
            .eq("unit_charge_status","PAID").neq("status","DELETED").neq("status","REJECTED");
          if(usedQ.error)throw usedQ.error;
          const used=Number(usedQ.count||0);
          if(price.monthly_limit!=null&&used>=price.monthly_limit)
            return j({ok:false,error:"MONTHLY_GLOBAL_LIMIT",limit:price.monthly_limit,used},409,origin);
          const charge=await unitCall({action:"charge",owner_ref:pq.data.owner_ref,units:price.unit_cost,request_id:"COMMUNITY_POST:"+id,reason:"community_global_post_after_link_approval",tier:member.effective_tier,month_key:month});
          patch.unit_charge_status="PAID";patch.unit_cost=price.unit_cost;patch.billing_tier=member.effective_tier;
          patch.billing_month=month;patch.membership_status_snapshot=member.effective_status;patch.premium_until_snapshot=member.premium_until||null;
          patch.billing_reference=clean(charge?.reference||charge?.transaction_id||"",160)||null;patch.paid_at=new Date().toISOString();
          billingMeta={member,price,month,charge};
        }
      }
      const up=await admin.from(table).update(patch).eq("id",id);if(up.error)throw up.error;
      if(billingMeta&&type==="post"){
        const charge=billingMeta.charge,member=billingMeta.member,price=billingMeta.price,month=billingMeta.month;
        const aq=await admin.from("community_post_charges").upsert({
          post_id:id,owner_ref:(await admin.from("community_posts").select("owner_ref,club_id").eq("id",id).single()).data?.owner_ref,
          club_id:(await admin.from("community_posts").select("owner_ref,club_id").eq("id",id).single()).data?.club_id,
          distribution_scope:"GLOBAL",tier_snapshot:member.effective_tier,membership_status_snapshot:member.effective_status,
          premium_until_snapshot:member.premium_until||null,month_key:month,unit_cost:price.unit_cost,charge_status:"PAID",
          external_reference:clean(charge?.reference||charge?.transaction_id||"",160)||null,
          balance_before:Number(charge?.balance_before||0),balance_after:Number(charge?.balance_after||0),
          charged_at:new Date().toISOString(),updated_at:new Date().toISOString()
        },{onConflict:"post_id"});
        if(aq.error)console.error("admin charge audit",aq.error.message);
      }
      const reports=await reportCount(type,id);
      await admin.from("community_reports").update({status:status==="PUBLISHED"?"DISMISSED":"ACTIONED",reviewed_at:new Date().toISOString(),reviewed_by:who.adminId}).eq("target_type",type).eq("target_id",id).eq("status","OPEN");
      await admin.from("community_moderation_actions").insert({target_type:type,target_id:id,action:logAction,admin_ref:who.adminId,reason,metadata:{reports}});
      return j({ok:true,status},200,origin);
    }

    if(action==="dismiss_reports"){
      const type=clean(b.target_type,20),id=clean(b.target_id,120);
      await admin.from("community_reports").update({status:"DISMISSED",reviewed_at:new Date().toISOString(),reviewed_by:who.adminId}).eq("target_type",type).eq("target_id",id).eq("status","OPEN");
      await admin.from("community_moderation_actions").insert({target_type:type,target_id:id,action:"DISMISS_REPORTS",admin_ref:who.adminId,reason:clean(b.reason,1000)||null});
      return j({ok:true},200,origin);
    }

    return j({ok:false,error:"UNKNOWN_ACTION"},404,origin);
  }catch(e){console.error("community-admin",e);return j({ok:false,error:"SERVER_ERROR"},500,origin)}
});
