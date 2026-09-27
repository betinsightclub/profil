
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const ALLOWED_ORIGINS = new Set([
  "https://app.betinsight.club",
  "https://betinsightclub.github.io",
  "https://betinsight.club",
  "https://www.betinsight.club"
]);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
let SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!SERVICE_KEY) {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    SERVICE_KEY = keys.default || Object.values(keys)[0] || "";
  } catch (_) {}
}
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase credentials unavailable");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession:false, autoRefreshToken:false } });

function cors(origin:string|null){
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary":"Origin",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Cache-Control":"no-store"
  };
}
function json(data:unknown,status=200,origin:string|null=null){
  return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}});
}
function clean(v:unknown,n=2000){ return String(v ?? "").trim().slice(0,n); }
function ip(req:Request){
  const f=req.headers.get("x-forwarded-for");
  return (f?f.split(",")[0].trim():req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown").slice(0,80);
}
async function rateAllowed(key:string,limit:number,windowSeconds:number){
  const {data,error}=await admin.rpc("betinsight_gateway_rate_check",{p_key:key,p_limit:limit,p_window_seconds:windowSeconds});
  if(error){ console.error("rate-limit",error.message); return false; }
  return data===true;
}
function ownerFromProfile(d:any){
  const ref=clean(d?.ref_code,80);
  const digits=ref.replace(/[^0-9]/g,"");
  if(digits) return "BI"+digits;
  return ref || clean(d?.user_id || d?.dashboard_token || d?.token,120);
}

const COMMUNITY_RESERVE_WEBHOOK=Deno.env.get("COMMUNITY_RESERVE_WEBHOOK")||"https://hook.eu1.make.com/6uq7y66k30i8ckarvq1q6a3drccbf1af";
const COMMUNITY_CHARGE_WEBHOOK=Deno.env.get("COMMUNITY_CHARGE_WEBHOOK")||"https://hook.eu1.make.com/bn6ympq0fa6g540cpkxsp36pqjur14i8";
const COMMUNITY_UNIT_SECRET=Deno.env.get("COMMUNITY_UNIT_SECRET")||"hI5Fe7vbwue3TooMNlsEp85UpPJCwT7xaJ3j2ISsogY";

function parseDateValue(v:any){
  const s=clean(v,80);
  if(!s)return null;
  const iso=Date.parse(s);
  if(Number.isFinite(iso))return new Date(iso);
  const m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if(m)return new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]),23,59,59));
  return null;
}
function firstProfileValue(p:any,keys:string[],fallback:any=null){
  for(const k of keys){if(p&&p[k]!==undefined&&p[k]!==null&&String(p[k]).trim()!=="")return p[k]}
  return fallback;
}
function membershipInfo(profile:any){
  const level=Number(firstProfileValue(profile,["mitgliedschaft_level","membership_level","premium_level"],0))||0;
  const effectiveTier=level>=2?"PREMIUM_PLUS":level>=1?"PREMIUM":"BASIS";
  const premiumUntil=parseDateValue(firstProfileValue(profile,["premium_bis","premium_until","periode_bis"],null));
  const graceUntil=parseDateValue(firstProfileValue(profile,["kulanz_bis","grace_until"],null));
  return {
    rawTier:effectiveTier,effectiveTier,
    effectiveStatus:effectiveTier==="BASIS"?"BASIS":"AKTIV",
    paymentConfirmed:effectiveTier!=="BASIS",
    premiumUntil:premiumUntil?premiumUntil.toISOString():null,
    graceUntil:graceUntil?graceUntil.toISOString():null,
    autoRenew:clean(firstProfileValue(profile,["auto_verlaengerung","auto_renew"],""),40),
    tariffCode:clean(firstProfileValue(profile,["tarif_code","tariff_code"],""),80),
    unitsAvailable:Number(firstProfileValue(profile,["einsetzbare_units","available_units"],0))||0
  };
}
function globalPricing(tier:string){
  if(tier==="PREMIUM_PLUS")return {unit_cost:0.10,monthly_limit:20};
  if(tier==="PREMIUM")return {unit_cost:0.25,monthly_limit:10};
  return {unit_cost:0.75,monthly_limit:null};
}
function monthKeyBerlin(d=new Date()){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit"}).formatToParts(d);
  const x:any=Object.fromEntries(p.map(z=>[z.type,z.value]));
  return String(x.year)+"-"+String(x.month);
}
async function snapshotMembership(owner:string,profile:any){
  const m=membershipInfo(profile);
  const row={
    owner_ref:owner,raw_tier:m.rawTier,effective_tier:m.effectiveTier,effective_status:m.effectiveStatus,
    payment_confirmed:m.paymentConfirmed,premium_until:m.premiumUntil,grace_until:m.graceUntil,
    auto_renew:m.autoRenew||null,tariff_code:m.tariffCode||null,units_available:m.unitsAvailable,
    profile_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()
  };
  const q=await admin.from("community_membership_state").upsert(row,{onConflict:"owner_ref"});
  if(q.error)console.error("membership snapshot",q.error.message);
  return m;
}
async function globalUsage(owner:string,monthKey:string){
  const q=await admin.from("community_posts").select("id",{count:"exact",head:true})
    .eq("owner_ref",owner).eq("distribution_scope","GLOBAL").eq("billing_month",monthKey)
    .in("unit_charge_status",["PAID","PENDING","RESERVED"]).neq("status","DELETED").neq("status","REJECTED");
  if(q.error)throw q.error;
  return Number(q.count||0);
}
async function callMake(url:string,payload:any){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,gateway_secret:COMMUNITY_UNIT_SECRET}),redirect:"follow"});
  const d:any=await r.json().catch(()=>({}));
  if(!r.ok||d.ok===false){const e:any=new Error(d.error||"UNIT_SERVICE_FAILED");e.data=d;e.status=r.status;throw e}
  return d;
}
async function reserveUnits(payload:any){return callMake(COMMUNITY_RESERVE_WEBHOOK,payload)}
async function chargeUnits(payload:any){return callMake(COMMUNITY_CHARGE_WEBHOOK,payload)}
async function verifyMember(credential:string){
  const token=clean(credential,300);
  if(!token) return null;
  const url=new URL(SUPABASE_URL+"/functions/v1/betinsight-member-gateway");
  url.searchParams.set("route","profile-read");
  url.searchParams.set("token",token);
  const r=await fetch(url.toString(),{method:"GET",headers:{"Origin":"https://app.betinsight.club","Accept":"application/json"}});
  if(!r.ok) return null;
  let d:any=null; try{d=await r.json()}catch(_){return null}
  if(!d || d.found===false) return null;
  const owner=ownerFromProfile(d);
  if(!owner) return null;
  await admin.from("community_user_state").upsert({owner_ref:owner,updated_at:new Date().toISOString()},{onConflict:"owner_ref",ignoreDuplicates:false});
  const stateQ=await admin.from("community_user_state").select("*").eq("owner_ref",owner).single();
  let state=stateQ.data;
  if(state && state.trust_level==="new" && Number(state.strikes||0)===0){
    const firstSeen=new Date(state.first_seen_at||0).getTime();
    if(firstSeen && Date.now()-firstSeen>=7*24*60*60*1000){
      const promoted=await admin.from("community_user_state").update({trust_level:"standard",status:state.status==="warned"?"warned":"active",updated_at:new Date().toISOString()}).eq("owner_ref",owner).select("*").single();
      if(!promoted.error && promoted.data)state=promoted.data;
    }
  }
  const membership=await snapshotMembership(owner,d);
  return {owner,profile:d,state,membership};
}

const URL_RE=/(?:https?:\/\/|www\.|(?:^|[\s(])(?:[a-z0-9-]+\.)+(?:com|net|org|club|io|gg|de|fr|it|es|pt|br|co|uk|us|me|info|biz|app|ai)(?=[\/\s,.;:!?)]|$)|t\.me\/|wa\.me\/)/i;
const EMAIL_RE=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE=/(?:^|\s)(?:\+?\d[\d\s().-]{7,}\d)(?:\s|$)/;
const SCRIPT_RE=/<\s*script|javascript:|onerror\s*=|onload\s*=/i;
const SPAM_RE=/(.)\1{12,}|(?:FREE|GRATIS|CLICK|KLICK|BONUS|GEWINN).*(?:FREE|GRATIS|CLICK|KLICK|BONUS|GEWINN)/i;
const THREAT_RE=/(ich\s+(?:bring|töte|erschieße)\s+dich|kill\s+you|i\s+will\s+kill|te\s+voy\s+a\s+matar|vou\s+te\s+matar)/i;
const SEXUAL_RE=/(kinderporn|child\s*porn|nacktbilder\s+von\s+kind|sexual\s+minor)/i;
const FRAUD_RE=/(seed\s*phrase|wallet\s*phrase|passwort\s+senden|send\s+password|garantierter\s+gewinn|guaranteed\s+profit)/i;
const ABUSE_RE=/(hurensohn|arschloch|wichser|fotze|cunt|motherfucker|puta\s+madre|filho\s+da\s+puta|vaffanculo)/i;
const EXTREMIST_RE=/(heil\s+hitler|white\s+power|sieg\s+heil)/i;

function screenText(raw:string,kind:"post"|"comment"|"profile",allowExternalLink=false){
  const text=clean(raw,kind==="comment"?500:kind==="post"?1600:600);
  const flags:string[]=[];
  let severity=0;
  if(SCRIPT_RE.test(text)){flags.push("unsafe_markup");severity=Math.max(severity,100)}
  if(THREAT_RE.test(text)){flags.push("threat");severity=Math.max(severity,100)}
  if(SEXUAL_RE.test(text)){flags.push("sexual_minor");severity=Math.max(severity,100)}
  if(EXTREMIST_RE.test(text)){flags.push("extremist");severity=Math.max(severity,100)}
  if(FRAUD_RE.test(text)){flags.push("fraud");severity=Math.max(severity,90)}
  if(ABUSE_RE.test(text)){flags.push("abuse");severity=Math.max(severity,65)}
  if(SPAM_RE.test(text)){flags.push("spam");severity=Math.max(severity,55)}
  if(EMAIL_RE.test(text)||PHONE_RE.test(text)){flags.push("personal_contact");severity=Math.max(severity,90)}
  if(URL_RE.test(text)&&!allowExternalLink){flags.push("external_link_in_text");severity=Math.max(severity,100)}
  const hasAutoRejectFlag=flags.some(x=>["external_link_in_text","abuse","spam","fraud","unsafe_markup","threat","sexual_minor","extremist","personal_contact"].includes(x));
  const decision=(severity>=90||hasAutoRejectFlag)?"REJECTED":"PUBLISHED";
  return {text,flags,score:severity,decision};
}
function validatedExternalUrl(raw:any){
  const value=clean(raw,1000);
  if(!value)return "";
  let u:URL;
  try{u=new URL(value)}catch(_){throw new Error("INVALID_EXTERNAL_URL")}
  if(!["https:","http:"].includes(u.protocol))throw new Error("INVALID_EXTERNAL_URL");
  if(!u.hostname||u.username||u.password)throw new Error("INVALID_EXTERNAL_URL");
  return u.toString().slice(0,1000);
}
async function clubFor(owner:string,clubId?:string){
  let q=admin.from("time_clash_user_clubs").select("id,owner_ref,club_name,status,visibility").eq("owner_ref",owner).eq("status","active");
  if(clubId) q=q.eq("id",clubId);
  const {data,error}=await q.order("updated_at",{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  return data;
}

function teamInitials(name:string){
  return clean(name,120).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0).toUpperCase()).join("") || "BI";
}
function publicMediaUrl(path:string){
  return path ? SUPABASE_URL+"/storage/v1/object/public/community-media/"+path : "";
}
async function getProfileRowByClubId(clubId:string){
  const q=await admin.from("community_trainer_profiles").select("*").eq("club_id",clubId).maybeSingle();
  if(q.error) throw q.error;
  return q.data;
}
async function getProfileRowPublic(slug:string,clubId:string){
  let q=admin.from("community_trainer_profiles").select("*");
  if(slug) q=q.eq("public_slug",slug).in("visibility",["public","unlisted"]);
  else if(clubId) q=q.eq("club_id",clubId).eq("visibility","public");
  else return null;
  const r=await q.maybeSingle();
  if(r.error) throw r.error;
  return r.data;
}
async function mediaForProfile(profile:any,ownerView=false){
  const ids=[profile?.avatar_media_id,profile?.cover_media_id].filter(Boolean);
  if(!ids.length) return {avatar:null,cover:null};
  let q=admin.from("community_media").select("id,storage_path,mime_type,width,height,purpose,status").in("id",ids);
  if(!ownerView) q=q.eq("status","PUBLISHED");
  const r=await q;
  if(r.error) throw r.error;
  const rows=r.data||[];
  const mapped=(id:any)=>{
    const m=rows.find((x:any)=>x.id===id);
    return m?{...m,public_url:publicMediaUrl(m.storage_path)}:null;
  };
  return {avatar:mapped(profile?.avatar_media_id),cover:mapped(profile?.cover_media_id)};
}
async function profileBundle(profile:any,ownerView=false){
  if(!profile) return null;
  const cq=await admin.from("time_clash_user_clubs")
    .select("id,owner_ref,club_name,coach,players,field_player_kit,goalkeeper_kit,primary_color,secondary_color,accent_color,league,wins_total,rating_points,ranking_position,previous_ranking_position,ranking_updated_at,visibility,status,created_at,updated_at")
    .eq("id",profile.club_id).maybeSingle();
  if(cq.error) throw cq.error;
  const club=cq.data;
  if(!club || club.status!=="active") return null;

  const mq=await admin.from("time_clash_club_matches")
    .select("id,clash_id,opponent_name,won,own_series_wins,opponent_series_wins,own_series_points,opponent_series_points,own_goals,opponent_goals,series_length,points_awarded,scorers,scorer_refs,created_at")
    .eq("club_id",club.id).order("created_at",{ascending:false}).limit(250);
  if(mq.error) throw mq.error;
  const matches=mq.data||[];
  const total=matches.length;
  const wins=matches.filter((m:any)=>m.won===true).length;
  const goalsFor=matches.reduce((z:number,m:any)=>z+Number(m.own_goals||0),0);
  const goalsAgainst=matches.reduce((z:number,m:any)=>z+Number(m.opponent_goals||0),0);

  const clashIds=matches.map((m:any)=>m.clash_id).filter(Boolean);
  let clashes:any[]=[];
  if(clashIds.length){
    const tq=await admin.from("time_clashes")
      .select("id,public_slug,team_a,team_b,series_length,series_a,series_b,winner,report_ready,status,created_at")
      .in("id",clashIds);
    if(tq.error) throw tq.error;
    clashes=tq.data||[];
  }
  const clashMap=new Map(clashes.map((x:any)=>[x.id,x]));
  const matchReports=matches.map((m:any)=>{
    const clash:any=clashMap.get(m.clash_id)||null;
    return {
      ...m,
      public_slug:clash?.public_slug||null,
      team_a:clash?.team_a||club.club_name,
      team_b:clash?.team_b||m.opponent_name,
      winner:clash?.winner||null,
      report_ready:Boolean(clash?.report_ready),
      report_created_at:clash?.created_at||m.created_at
    };
  });

  const scorerCountsById=new Map<string,number>(),scorerCountsByName=new Map<string,number>();
  for(const m of matches){
    const refs=Array.isArray(m.scorer_refs)?m.scorer_refs:[];
    if(refs.length){
      for(const ref of refs){
        const playerId=clean(ref?.player_id,80),name=clean(ref?.player_name,80);
        if(playerId) scorerCountsById.set(playerId,(scorerCountsById.get(playerId)||0)+1);
        else if(name) scorerCountsByName.set(name,(scorerCountsByName.get(name)||0)+1);
      }
    }else{
      const list=Array.isArray(m.scorers)?m.scorers:[];
      for(const raw of list){const name=clean(raw,80);if(name) scorerCountsByName.set(name,(scorerCountsByName.get(name)||0)+1)}
    }
  }

  const avq=await admin.from("time_clash_player_avatars")
    .select("player_id,player_name,avatar,configured,updated_at")
    .eq("club_id",club.id).eq("configured",true);
  if(avq.error) throw avq.error;
  const avatarById=new Map((avq.data||[]).filter((a:any)=>a.player_id).map((a:any)=>[clean(a.player_id,80),a]));
  const avatarByName=new Map((avq.data||[]).map((a:any)=>[clean(a.player_name,80),a]));
  const players=Array.isArray(club.players)?club.players:[];
  const squad=players.map((p:any,index:number)=>{
    const name=clean(p?.name,80),playerId=clean(p?.player_id,80);
    const saved:any=avatarById.get(playerId)||avatarByName.get(name)||null;
    const goals=playerId&&scorerCountsById.has(playerId)?Number(scorerCountsById.get(playerId)||0):Number(scorerCountsByName.get(name)||0);
    return {
      index:index+1,
      player_id:playerId||null,
      name,
      role:clean(p?.prole||p?.role,60),
      trait:clean(p?.trait,60),
      shirt_no:Number(p?.shirtNo||p?.shirt_no||index+1),
      strength:Number(p?.strength||0),
      starter:index<11,
      goals,
      avatar:saved?.avatar||null,
      portrait_url:saved?.avatar?.portraitPath ? (publicMediaUrl(saved.avatar.portraitPath)+"?v="+encodeURIComponent(String(saved.updated_at||""))) : null,
      avatar_configured:Boolean(saved?.configured)
    };
  });

  const topq=await admin.from("time_clash_user_clubs")
    .select("id,club_name,coach,rating_points,wins_total,ranking_position,previous_ranking_position")
    .eq("visibility","community").eq("status","active")
    .order("rating_points",{ascending:false})
    .order("wins_total",{ascending:false})
    .order("created_at",{ascending:true})
    .limit(3);
  if(topq.error) throw topq.error;
  const countq=await admin.from("time_clash_user_clubs")
    .select("id",{count:"exact",head:true})
    .eq("visibility","community").eq("status","active");
  if(countq.error) throw countq.error;

  const topIds=(topq.data||[]).map((x:any)=>x.id);
  let topProfiles:any[]=[];
  if(topIds.length){
    const pq=await admin.from("community_trainer_profiles")
      .select("club_id,display_name,public_slug,visibility")
      .in("club_id",topIds);
    if(pq.error) throw pq.error;
    topProfiles=pq.data||[];
  }
  const topProfileMap=new Map(topProfiles.map((p:any)=>[p.club_id,p]));
  const top3=(topq.data||[]).map((x:any,index:number)=>{
    const pp:any=topProfileMap.get(x.id)||null;
    const publicName=pp&&pp.visibility==="public"?clean(pp.display_name,80):"";
    return {
      position:index+1,
      club_id:x.id,
      team_name:x.club_name,
      trainer_name:publicName||clean(x.coach?.name,80)||"Trainer",
      points:Number(x.rating_points||0),
      wins:Number(x.wins_total||0),
      public_slug:pp&&pp.visibility==="public"?pp.public_slug:null
    };
  });
  const curPos=Number(club.ranking_position||0)||null;
  const prevPos=Number(club.previous_ranking_position||0)||curPos;
  let trend="same",rankDelta=0;
  if(curPos&&prevPos){
    rankDelta=Math.abs(prevPos-curPos);
    if(curPos<prevPos) trend="up";
    else if(curPos>prevPos) trend="down";
  }
  const ranking={
    position:curPos,
    previous_position:prevPos,
    trend,
    delta:rankDelta,
    total:Number(countq.count||0),
    points:Number(club.rating_points||0),
    top3,
    updated_at:club.ranking_updated_at||null
  };

  const trq=await admin.from("time_clash_trophies")
    .select("id,trophy_type,title,place,period_key,icon,metadata,awarded_at")
    .eq("club_id",club.id).order("awarded_at",{ascending:false}).limit(50);
  if(trq.error) throw trq.error;
  const trophies=trq.data||[];

  const cmq=await admin.from("community_media")
    .select("id,storage_path,mime_type,width,height,purpose,created_at")
    .eq("club_id",club.id).eq("status","PUBLISHED").eq("purpose","post")
    .order("created_at",{ascending:false}).limit(60);
  if(cmq.error) throw cmq.error;
  const uploadedGallery=(cmq.data||[]).map((m:any)=>({
    id:m.id,
    type:"image",
    purpose:m.purpose,
    created_at:m.created_at,
    width:m.width,
    height:m.height,
    public_url:publicMediaUrl(m.storage_path)
  }));

  let sceneGallery:any[]=[];
  if(clashIds.length){
    const sgq=await admin.from("time_clash_media_assets")
      .select("id,clash_id,scene_game,scene_minute,scene_type,scene_variant,scene_focus,player_id,player_name,team_name,event_text,title,published_at,created_at")
      .in("clash_id",clashIds).eq("published",true)
      .order("created_at",{ascending:false}).limit(60);
    if(sgq.error) throw sgq.error;
    sceneGallery=(sgq.data||[]).map((m:any)=>({
      ...m,
      type:"scene",
      public_slug:(clashMap.get(m.clash_id) as any)?.public_slug||null
    }));
  }

  const media=await mediaForProfile(profile,ownerView);
  const configuredCoach=clean(club.coach?.name,80);
  const displayName=clean(profile.display_name,80) || configuredCoach || "";

  return {
    profile_id:profile.id,
    club_id:club.id,
    owner_ref:ownerView?club.owner_ref:undefined,
    public_slug:profile.public_slug,
    public_ref_code:clean(profile.public_ref_code,80),
    visibility:profile.visibility,
    display_name:displayName,
    custom_display_name:clean(profile.display_name,80),
    configured_coach_name:configuredCoach,
    coach_style:clean(club.coach?.style,40),
    coach_appearance:(club.coach?.appearance && typeof club.coach.appearance==="object") ? club.coach.appearance : null,
    bio:clean(profile.bio,600),
    country:clean(profile.country,80),
    city:clean(profile.city,80),
    team_name:club.club_name,
    team_initials:teamInitials(club.club_name),
    league:club.league,
    rating_points:Number(club.rating_points||0),
    colors:{primary:club.primary_color,secondary:club.secondary_color,accent:club.accent_color},
    stats:{
      matches:total,
      wins,
      losses:Math.max(0,total-wins),
      win_rate:total?Math.round((wins/total)*100):0,
      goals_for:goalsFor,
      goals_against:goalsAgainst
    },
    ranking,
    trophies,
    squad,
    match_reports:matchReports,
    recent_matches:matchReports.slice(0,5),
    gallery_media:[...uploadedGallery,...sceneGallery].sort((a:any,b:any)=>new Date(b.created_at||b.published_at||0).getTime()-new Date(a.created_at||a.published_at||0).getTime()),
    media,
    club_created_at:club.created_at,
    created_at:profile.created_at,
    updated_at:profile.updated_at,
    is_owner:ownerView
  };
}
async function ensureProfileForClub(club:any){
  if(!club) return null;
  let profile=await getProfileRowByClubId(club.id);
  if(profile) return profile;
  const slug="team-"+String(club.id).replace(/-/g,"").slice(0,10);
  const ins=await admin.from("community_trainer_profiles").insert({
    club_id:club.id,owner_ref:club.owner_ref,public_slug:slug,visibility:"public"
  }).select().single();
  if(ins.error) throw ins.error;
  return ins.data;
}
async function assertOwnedMedia(owner:string,clubId:string,mediaId:string,purpose:string){
  if(!mediaId) return null;
  const q=await admin.from("community_media").select("id,purpose,status").eq("id",mediaId).eq("owner_ref",owner).eq("club_id",clubId).maybeSingle();
  if(q.error) throw q.error;
  if(!q.data || q.data.purpose!==purpose) return null;
  return q.data;
}
function trustNeedsReview(state:any){
  if(!state) return true;
  if(state.status==="suspended" || state.status==="banned") return true;
  if(state.trust_level==="restricted") return true;
  const first=new Date(state.first_seen_at||0).getTime();
  if(!first || (Date.now()-first)<7*24*60*60*1000) return true;
  return false;
}
async function postCount(owner:string){
  const {count}=await admin.from("community_posts").select("id",{count:"exact",head:true}).eq("owner_ref",owner);
  return count||0;
}
async function commentCount(owner:string){
  const {count}=await admin.from("community_comments").select("id",{count:"exact",head:true}).eq("owner_ref",owner);
  return count||0;
}
function reactionCode(v:string){
  const allowed=new Set(["LIKE","LIVE_ALARM","HEART","CHEER","HOT_TIP","WON","OK","THANKS"]);
  return allowed.has(v)?v:"LIKE";
}
function base64Bytes(dataUrl:string){
  const m=/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
  if(!m) return null;
  const bin=atob(m[2]);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return {mime:m[1].toLowerCase(),bytes};
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS"){
    if(!origin||!ALLOWED_ORIGINS.has(origin)) return json({ok:false},403,origin);
    return new Response("ok",{headers:cors(origin)});
  }
  if(!origin||!ALLOWED_ORIGINS.has(origin)) return json({ok:false,error:"ORIGIN_NOT_ALLOWED"},403,origin);
  const ok=await rateAllowed("community:"+ip(req),220,300);
  if(!ok) return json({ok:false,error:"RATE_LIMITED"},429,origin);

  const url=new URL(req.url);
  const action=clean(url.searchParams.get("action"),40);

  try{
    if(req.method==="GET" && action==="profile"){
      const slug=clean(url.searchParams.get("p")||url.searchParams.get("slug"),120);
      const clubId=clean(url.searchParams.get("club_id"),80);
      if(!slug&&!clubId) return json({ok:false,error:"PROFILE_REQUIRED"},400,origin);
      const profile=await getProfileRowPublic(slug,clubId);
      const bundle=await profileBundle(profile,false);
      if(!bundle) return json({ok:false,error:"PROFILE_NOT_FOUND"},404,origin);
      return json({ok:true,profile:bundle},200,origin);
    }

    if(req.method==="GET" && action==="profiles"){
      const q=await admin.from("community_trainer_profiles")
        .select("id,club_id,public_slug,display_name,country,city,avatar_media_id,updated_at")
        .eq("visibility","public").order("updated_at",{ascending:false}).limit(100);
      if(q.error) throw q.error;
      const out:any[]=[];
      for(const p of (q.data||[])){
        const b=await profileBundle(p,false);
        if(b) out.push(b);
      }
      return json({ok:true,profiles:out},200,origin);
    }

    if(req.method==="GET" && action==="feed"){
      const clubId=clean(url.searchParams.get("club_id"),80);
      const scope=clean(url.searchParams.get("scope"),20).toLowerCase();
      if(!clubId&&scope!=="global") return json({ok:false,error:"club_id_required"},400,origin);
      let pq=admin.from("community_posts")
        .select("id,club_id,owner_ref,body,emotion,media_id,external_url,is_official,comments_enabled,distribution_scope,billing_tier,unit_cost,unit_charge_status,published_at,created_at")
        .eq("status","PUBLISHED");
      if(scope==="global")pq=pq.eq("distribution_scope","GLOBAL");
      else pq=pq.or("and(club_id.eq."+clubId+",distribution_scope.eq.PROFILE),distribution_scope.eq.GLOBAL");
      const {data:posts,error}=await pq.order("created_at",{ascending:false}).limit(80);
      if(error) throw error;
      const ids=(posts||[]).map((p:any)=>p.id);
      let comments:any[]=[]; let reactions:any[]=[]; let media:any[]=[];
      if(ids.length){
        const cq=await admin.from("community_comments").select("id,post_id,parent_comment_id,owner_ref,body,created_at").in("post_id",ids).eq("status","PUBLISHED").order("created_at",{ascending:true});
        if(cq.error) throw cq.error; comments=cq.data||[];
        const rq=await admin.from("community_reactions").select("post_id,reaction,owner_ref").in("post_id",ids);
        if(rq.error) throw rq.error; reactions=rq.data||[];
        const mediaIds=(posts||[]).map((p:any)=>p.media_id).filter(Boolean);
        if(mediaIds.length){
          const mq=await admin.from("community_media").select("id,storage_path,mime_type,width,height").in("id",mediaIds).eq("status","PUBLISHED");
          if(mq.error) throw mq.error; media=mq.data||[];
        }
      }
      const mediaMap=new Map(media.map((m:any)=>[m.id,m]));
      const clubIds=[...new Set((posts||[]).map((p:any)=>p.club_id).filter(Boolean))];
      let profileRows:any[]=[],clubRows:any[]=[];
      if(clubIds.length){
        const [pp,cc]=await Promise.all([
          admin.from("community_trainer_profiles").select("club_id,display_name,public_slug").in("club_id",clubIds),
          admin.from("time_clash_user_clubs").select("id,club_name,coach").in("id",clubIds)
        ]);
        if(pp.error)throw pp.error;if(cc.error)throw cc.error;profileRows=pp.data||[];clubRows=cc.data||[];
      }
      const profileMap=new Map(profileRows.map((x:any)=>[x.club_id,x])),clubMap=new Map(clubRows.map((x:any)=>[x.id,x]));
      const out=(posts||[]).map((p:any)=>{
        const pp:any=profileMap.get(p.club_id)||{},cc:any=clubMap.get(p.club_id)||{};
        return {
        ...p,
        author:clean(pp.display_name||cc.coach?.name||"Trainer",80),
        team_name:clean(cc.club_name||"Mannschaft",120),
        public_slug:pp.public_slug||null,
        comments:comments.filter((x:any)=>x.post_id===p.id),
        reactions:reactions.filter((x:any)=>x.post_id===p.id),
        media:p.media_id&&mediaMap.has(p.media_id)?{
          ...mediaMap.get(p.media_id),
          public_url:SUPABASE_URL+"/storage/v1/object/public/community-media/"+mediaMap.get(p.media_id).storage_path
        }:null
      }});
      return json({ok:true,posts:out},200,origin);
    }

    if(req.method!=="POST") return json({ok:false,error:"METHOD_NOT_ALLOWED"},405,origin);
    const raw=await req.text();
    if(raw.length>2_500_000) return json({ok:false,error:"PAYLOAD_TOO_LARGE"},413,origin);
    let body:any={}; try{body=raw?JSON.parse(raw):{}}catch(_){return json({ok:false,error:"INVALID_JSON"},400,origin)}

    if(action==="screen"){
      const kind=(body.kind==="comment"||body.kind==="profile")?body.kind:"post";
      const result=screenText(body.text||"",kind,false);
      return json({ok:true,...result},200,origin);
    }

    const who=await verifyMember(body.credential||body.token||"");
    if(!who) return json({ok:false,error:"INVALID_IDENTITY"},401,origin);
    if(who.state?.status==="banned") return json({ok:false,error:"ACCOUNT_BANNED"},403,origin);
    if(who.state?.status==="suspended" && (!who.state.suspended_until || new Date(who.state.suspended_until).getTime()>Date.now()))
      return json({ok:false,error:"ACCOUNT_SUSPENDED"},403,origin);

    if(action==="my_profile"){
      const club=await clubFor(who.owner,clean(body.club_id,80)||undefined);
      if(!club) return json({ok:false,error:"TEAM_REQUIRED"},404,origin);
      const profile=await ensureProfileForClub(club);
      const refCode=clean(who.profile?.ref_code,80);
      if(refCode && refCode!==profile.public_ref_code){
        const up=await admin.from("community_trainer_profiles").update({public_ref_code:refCode,updated_at:new Date().toISOString()}).eq("id",profile.id).select().single();
        if(up.error) throw up.error;
        Object.assign(profile,up.data);
      }
      const bundle=await profileBundle(profile,true);
      return json({ok:true,profile:bundle},200,origin);
    }

    if(action==="pricing"){
      const m=who.membership||membershipInfo(who.profile);
      const price=globalPricing(m.effectiveTier);
      const month=monthKeyBerlin();
      const used=await globalUsage(who.owner,month);
      const remaining=price.monthly_limit==null?null:Math.max(0,price.monthly_limit-used);
      return json({ok:true,membership:m,pricing:{...price,month_key:month,used,remaining}},200,origin);
    }

    if(action==="update_profile"){
      const club=await clubFor(who.owner,clean(body.club_id,80)||undefined);
      if(!club) return json({ok:false,error:"TEAM_REQUIRED"},404,origin);
      const profile=await ensureProfileForClub(club);

      const patch:any={
        public_ref_code:clean(who.profile?.ref_code,80)||profile.public_ref_code||null,
        updated_at:new Date().toISOString()
      };

      for(const field of ["display_name","bio","country","city"]){
        if(!Object.prototype.hasOwnProperty.call(body,field)) continue;
        const max=field==="bio"?600:80;
        const value=clean(body[field],max);
        if(value){
          const screened=screenText(value,"profile",false);
          if(screened.decision!=="PUBLISHED") return json({ok:false,error:"PROFILE_TEXT_REVIEW",field,flags:screened.flags},422,origin);
        }
        patch[field]=value||null;
      }

      if(Object.prototype.hasOwnProperty.call(body,"visibility")){
        const visibility=new Set(["public","unlisted","private"]).has(String(body.visibility))?String(body.visibility):profile.visibility;
        patch.visibility=visibility;
      }

      if(Object.prototype.hasOwnProperty.call(body,"avatar_media_id")){
        const id=clean(body.avatar_media_id,80);
        if(!id) patch.avatar_media_id=null;
        else{
          const media=await assertOwnedMedia(who.owner,club.id,id,"avatar");
          if(!media) return json({ok:false,error:"INVALID_AVATAR_MEDIA"},422,origin);
          patch.avatar_media_id=id;
        }
      }
      if(Object.prototype.hasOwnProperty.call(body,"cover_media_id")){
        const id=clean(body.cover_media_id,80);
        if(!id) patch.cover_media_id=null;
        else{
          const media=await assertOwnedMedia(who.owner,club.id,id,"cover");
          if(!media) return json({ok:false,error:"INVALID_COVER_MEDIA"},422,origin);
          patch.cover_media_id=id;
        }
      }

      const up=await admin.from("community_trainer_profiles").update(patch).eq("id",profile.id).select().single();
      if(up.error) throw up.error;
      const bundle=await profileBundle(up.data,true);
      return json({ok:true,profile:bundle},200,origin);
    }

    if(action==="upload_media"){
      const purpose=new Set(["avatar","cover","post"]).has(String(body.purpose))?String(body.purpose):"post";
      const club=await clubFor(who.owner,clean(body.club_id,80)||undefined);
      if(!club) return json({ok:false,error:"TEAM_REQUIRED"},403,origin);
      const parsed=base64Bytes(String(body.data_url||""));
      if(!parsed) return json({ok:false,error:"INVALID_IMAGE"},400,origin);
      if(parsed.bytes.byteLength>700000) return json({ok:false,error:"IMAGE_TOO_LARGE_AFTER_COMPRESSION",max_bytes:700000},413,origin);
      const ext=parsed.mime==="image/webp"?"webp":parsed.mime==="image/png"?"png":"jpg";
      const path=who.owner+"/"+purpose+"/"+crypto.randomUUID()+"."+ext;
      const up=await admin.storage.from("community-media").upload(path,parsed.bytes,{contentType:parsed.mime,upsert:false});
      if(up.error) throw up.error;
      const row=await admin.from("community_media").insert({
        owner_ref:who.owner,club_id:club.id,storage_path:path,mime_type:parsed.mime,bytes:parsed.bytes.byteLength,
        width:Number(body.width)||null,height:Number(body.height)||null,purpose,status:"PUBLISHED",
        moderation_flags:[]
      }).select("id,status,bytes,purpose").single();
      if(row.error) throw row.error;
      return json({ok:true,media:row.data,message:"Bild veröffentlicht."},201,origin);
    }

    if(action==="create_post"){
      const club=await clubFor(who.owner,clean(body.club_id,80)||undefined);
      if(!club) return json({ok:false,error:"TEAM_REQUIRED"},403,origin);

      const scope=String(body.distribution_scope||"PROFILE").toUpperCase()==="GLOBAL"?"GLOBAL":"PROFILE";
      const textResult=screenText(body.text||"","post",false);
      if(textResult.decision==="REJECTED"){
        const error=textResult.flags.includes("external_link_in_text")?"LINK_IN_TEXT_NOT_ALLOWED":"CONTENT_REJECTED";
        return json({ok:false,error,flags:textResult.flags},422,origin);
      }

      let mediaId=clean(body.media_id,80)||null;
      if(mediaId){
        const mq=await admin.from("community_media").select("id,status,owner_ref").eq("id",mediaId).eq("owner_ref",who.owner).maybeSingle();
        if(mq.error) throw mq.error;
        if(!mq.data) return json({ok:false,error:"MEDIA_NOT_FOUND"},404,origin);
        if(mq.data.status!=="PUBLISHED")return json({ok:false,error:"MEDIA_NOT_READY"},409,origin);
      }

      const linkEnabled=body.link_enabled===true||String(body.link_enabled||"").toLowerCase()==="true";
      let externalUrl="";
      try{externalUrl=validatedExternalUrl(body.external_url||"")}catch(_){return json({ok:false,error:"INVALID_EXTERNAL_URL"},400,origin)}
      if(linkEnabled&&scope!=="GLOBAL")return json({ok:false,error:"LINK_GLOBAL_ONLY"},400,origin);
      if(externalUrl&&!linkEnabled)return json({ok:false,error:"LINK_CHECK_REQUIRED"},400,origin);
      if(linkEnabled&&!externalUrl)return json({ok:false,error:"LINK_REQUIRED"},400,origin);

      const m=who.membership||membershipInfo(who.profile),month=monthKeyBerlin();
      const price=scope==="GLOBAL"?globalPricing(m.effectiveTier):{unit_cost:0,monthly_limit:null};
      const used=scope==="GLOBAL"?await globalUsage(who.owner,month):0;
      if(scope==="GLOBAL"&&price.monthly_limit!=null&&used>=price.monthly_limit)
        return json({ok:false,error:"MONTHLY_GLOBAL_LIMIT",limit:price.monthly_limit,used},429,origin);
      if(scope==="GLOBAL"&&Number(m.unitsAvailable||0)+1e-9<Number(price.unit_cost))
        return json({ok:false,error:"INSUFFICIENT_UNITS",required:price.unit_cost,available:m.unitsAvailable},402,origin);

      const postId=crypto.randomUUID(),requestId="COMMUNITY_POST:"+postId;
      const initialStatus=scope==="GLOBAL"?(linkEnabled?"PENDING_REVIEW":"PAYMENT_PENDING"):"PUBLISHED";
      const initialChargeStatus=scope==="GLOBAL"?(linkEnabled?"PENDING":"PENDING"):"NOT_REQUIRED";
      const baseRow:any={
        id:postId,club_id:club.id,owner_ref:who.owner,body:textResult.text,emotion:clean(body.emotion,40)||null,
        media_id:mediaId,external_url:externalUrl||null,distribution_scope:scope,billing_tier:m.effectiveTier,
        unit_cost:Number(price.unit_cost||0),unit_charge_status:initialChargeStatus,billing_month:scope==="GLOBAL"?month:null,
        billing_reference:scope==="GLOBAL"?requestId:null,paid_at:null,
        membership_status_snapshot:m.effectiveStatus,premium_until_snapshot:m.premiumUntil,status:initialStatus,
        moderation_flags:linkEnabled?["external_link_review"]:[],moderation_score:linkEnabled?55:0,
        published_at:scope==="PROFILE"?new Date().toISOString():null
      };
      const ins=await admin.from("community_posts").insert(baseRow).select().single();
      if(ins.error)throw ins.error;

      let billing:any=null,finalPost:any=ins.data,chargeStatus=initialChargeStatus;
      if(scope==="GLOBAL"&&linkEnabled){
        try{
          billing=await reserveUnits({
            action:"reserve",credential:clean(body.credential||body.token,300),request_id:requestId,
            units:price.unit_cost,post_id:postId,reason:"community_global_link_post"
          });
          chargeStatus="RESERVED";
          const up=await admin.from("community_posts").update({
            unit_charge_status:"RESERVED",updated_at:new Date().toISOString()
          }).eq("id",postId).select().single();
          if(up.error)throw up.error;finalPost=up.data;
        }catch(e:any){
          await admin.from("community_posts").update({status:"PAYMENT_FAILED",unit_charge_status:"FAILED",updated_at:new Date().toISOString()}).eq("id",postId);
          try{await reserveUnits({action:"release",credential:who.owner,request_id:requestId,units:price.unit_cost,post_id:postId,reason:"reservation_failed_cleanup"})}catch(_){}
          return json({ok:false,error:e?.message||"UNIT_RESERVE_FAILED",detail:e?.data||null},e?.status||502,origin);
        }
      }else if(scope==="GLOBAL"){
        try{
          billing=await chargeUnits({
            action:"charge",credential:clean(body.credential||body.token,300),request_id:requestId,
            units:price.unit_cost,post_id:postId,reason:"community_global_post",tier:m.effectiveTier,month_key:month
          });
          chargeStatus="PAID";
          const paidAt=new Date().toISOString();
          const up=await admin.from("community_posts").update({
            status:"PUBLISHED",unit_charge_status:"PAID",paid_at:paidAt,published_at:paidAt,updated_at:paidAt
          }).eq("id",postId).select().single();
          if(up.error)throw up.error;finalPost=up.data;
        }catch(e:any){
          await admin.from("community_posts").update({status:"PAYMENT_FAILED",unit_charge_status:"FAILED",updated_at:new Date().toISOString()}).eq("id",postId);
          return json({ok:false,error:e?.message||"UNIT_CHARGE_FAILED",detail:e?.data||null},e?.status||502,origin);
        }
      }

      if(scope==="GLOBAL"&&chargeStatus==="PAID"){
        const aq=await admin.from("community_post_charges").insert({
          post_id:postId,owner_ref:who.owner,club_id:club.id,distribution_scope:"GLOBAL",
          tier_snapshot:m.effectiveTier,membership_status_snapshot:m.effectiveStatus,premium_until_snapshot:m.premiumUntil,
          month_key:month,unit_cost:price.unit_cost,charge_status:"PAID",external_reference:requestId,
          balance_before:Number(billing?.balance_before??m.unitsAvailable),
          balance_after:Number(billing?.balance_after??(m.unitsAvailable-price.unit_cost)),
          charged_at:new Date().toISOString(),updated_at:new Date().toISOString()
        });
        if(aq.error)console.error("post charge audit",aq.error.message);
      }

      await admin.from("community_user_state").update({last_post_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("owner_ref",who.owner);
      return json({ok:true,post:finalPost,moderation:{status:String(finalPost?.status||initialStatus),flags:baseRow.moderation_flags},billing:{
        scope,tier:m.effectiveTier,status:chargeStatus,unit_cost:Number(price.unit_cost||0),
        monthly_limit:price.monthly_limit,used_after:scope==="GLOBAL"?used+1:used,
        remaining:scope==="GLOBAL"&&price.monthly_limit!=null?Math.max(0,price.monthly_limit-used-1):null,
        balance_after:Number(billing?.available??billing?.balance_after??m.unitsAvailable),
        link_reserved:scope==="GLOBAL"&&linkEnabled
      }},201,origin);
    }

    if(action==="create_comment"){
      const postId=clean(body.post_id,80);
      const post=await admin.from("community_posts").select("id,status,comments_enabled").eq("id",postId).maybeSingle();
      if(post.error) throw post.error;
      if(!post.data||post.data.status!=="PUBLISHED"||!post.data.comments_enabled) return json({ok:false,error:"COMMENTS_NOT_AVAILABLE"},409,origin);
      const textResult=screenText(body.text||"","comment",false);
      if(!textResult.text) return json({ok:false,error:"COMMENT_REQUIRED"},400,origin);
      if(textResult.decision==="REJECTED") return json({ok:false,error:"CONTENT_REJECTED",flags:textResult.flags},422,origin);
      let status=textResult.decision; const flags=[...textResult.flags]
      const ins=await admin.from("community_comments").insert({
        post_id:postId,parent_comment_id:body.parent_comment_id||null,owner_ref:who.owner,body:textResult.text,
        status,moderation_flags:flags,moderation_score:textResult.score
      }).select().single();
      if(ins.error) throw ins.error;
      await admin.from("community_user_state").update({last_comment_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("owner_ref",who.owner);
      return json({ok:true,comment:ins.data,moderation:{status,flags}},201,origin);
    }

    if(action==="react"){
      const postId=clean(body.post_id,80);
      const reaction=reactionCode(clean(body.reaction,30));
      const pq=await admin.from("community_posts").select("id").eq("id",postId).eq("status","PUBLISHED").maybeSingle();
      if(pq.error) throw pq.error; if(!pq.data) return json({ok:false,error:"POST_NOT_AVAILABLE"},404,origin);
      const up=await admin.from("community_reactions").upsert({post_id:postId,owner_ref:who.owner,reaction,updated_at:new Date().toISOString()},{onConflict:"post_id,owner_ref"}).select().single();
      if(up.error) throw up.error;
      return json({ok:true,reaction:up.data},200,origin);
    }

    if(action==="follow"){
      const clubId=clean(body.club_id,80);
      if(!clubId) return json({ok:false,error:"club_id_required"},400,origin);
      if(body.follow===false){
        const d=await admin.from("community_follows").delete().eq("club_id",clubId).eq("owner_ref",who.owner);
        if(d.error) throw d.error;
        return json({ok:true,following:false},200,origin);
      }
      const up=await admin.from("community_follows").upsert({club_id:clubId,owner_ref:who.owner},{onConflict:"club_id,owner_ref"});
      if(up.error) throw up.error;
      return json({ok:true,following:true},200,origin);
    }

    if(action==="report"){
      const type=new Set(["post","comment","profile","media"]).has(String(body.target_type))?String(body.target_type):"post";
      const targetId=clean(body.target_id,80);
      const reason=new Set(["spam","harassment","hate","sexual","violence","fraud","personal_data","illegal","other"]).has(String(body.reason))?String(body.reason):"other";
      if(!targetId) return json({ok:false,error:"target_required"},400,origin);
      const ins=await admin.from("community_reports").insert({
        target_type:type,target_id:targetId,reporter_ref:who.owner,reason,details:clean(body.details,700)||null
      });
      if(ins.error && !String(ins.error.code||"").includes("23505")) throw ins.error;
      const c=await admin.from("community_reports").select("id",{count:"exact",head:true}).eq("target_type",type).eq("target_id",targetId).eq("status","OPEN");
      if(c.error) throw c.error;
      const reportCount=c.count||0;
      if(reportCount>=3 && (type==="post"||type==="comment")){
        const table=type==="post"?"community_posts":"community_comments";
        await admin.from(table).update({status:"HIDDEN",updated_at:new Date().toISOString()}).eq("id",targetId).eq("status","PUBLISHED");
      }
      return json({ok:true,report_count:reportCount,temporarily_hidden:reportCount>=3},201,origin);
    }

    return json({ok:false,error:"UNKNOWN_ACTION"},404,origin);
  }catch(e){
    console.error("community-api",e);
    return json({ok:false,error:"SERVER_ERROR"},500,origin);
  }
});
