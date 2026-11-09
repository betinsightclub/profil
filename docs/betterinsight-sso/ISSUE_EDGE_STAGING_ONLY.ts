// STAGING SOURCE ONLY - NOT DEPLOYED. Deploy only after security review.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const src = Deno.env.get("SUPABASE_URL") || "";
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const callback = Deno.env.get("BETTERINSIGHT_SSO_CALLBACK_URL") || "";
const db = key && src ? createClient(src, key, {auth:{persistSession:false,autoRefreshToken:false}}) : null;
const SOURCE = "https://app.betinsight.club";
function respond(payload:unknown,status=200) {
  return new Response(JSON.stringify(payload),{
    status,headers:{"Content-Type":"application/json;charset=utf-8",
      "Access-Control-Allow-Origin":SOURCE,"Access-Control-Allow-Headers":"content-type",
      "Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store","Referrer-Policy":"no-referrer",
      "Vary":"Origin"}
  });
}
async function sha(value:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))
    .map(b=>b.toString(16).padStart(2,"0")).join("");
}
function newCode() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let raw = ""; for (const n of b) raw += String.fromCharCode(n);
  return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
Deno.serve(async request => {
  if(request.headers.get("origin") !== SOURCE) return respond({success:false,error:"FORBIDDEN"},403);
  if(request.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Origin":SOURCE,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
  if(request.method!=="POST")return respond({success:false,error:"METHOD_NOT_ALLOWED"},405);
  if(!db||!callback.startsWith("https://")||!callback.endsWith("/api/betterinsight/auth/callback"))
    return respond({success:false,error:"NOT_CONFIGURED"},503);
  try {
    const { dashboard_token, audience, redirect_uri } = await request.json();
    if(audience!=="betterinsight"||redirect_uri!==callback
        ||typeof dashboard_token!=="string"
        ||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(dashboard_token))
      return respond({success:false,error:"INVALID_REQUEST"},400);
    // Rate limit on both address and token; failure is closed.
    const ip=(request.headers.get("cf-connecting-ip")||"unknown").slice(0,64);
    const [{data:ipOK,error:ipErr},{data:userOK,error:userErr}] = await Promise.all([
      db.rpc("betinsight_gateway_rate_check",{p_key:"betterinsight-sso:ip:"+ip,p_limit:15,p_window_seconds:300}),
      db.rpc("betinsight_gateway_rate_check",{p_key:"betterinsight-sso:subject:"+await sha(dashboard_token),p_limit:5,p_window_seconds:300})
    ]);
    if(ipErr||userErr||ipOK!==true||userOK!==true)return respond({success:false,error:"RATE_LIMITED"},429);
    const {data:user,error:lookupErr}=await db.from("betinsight_profile_read_shadow")
      .select("user_id").eq("dashboard_token_hash",await sha(dashboard_token)).maybeSingle();
    if(lookupErr||!user?.user_id)return respond({success:false,error:"INVALID_ACCESS"},401);
    const code=newCode();
    const {error:insertError}=await db.from("betinsight_betterinsight_sso_codes").insert({
      code_hash:await sha(code),user_id:String(user.user_id),
      audience:"betterinsight",redirect_uri:callback,
      expires_at:new Date(Date.now()+90000).toISOString()
    });
    if(insertError){console.error("SSO issuance database failure");return respond({success:false,error:"UNAVAILABLE"},503)}
    return respond({success:true,code,expires_in_seconds:90});
  }catch {
    return respond({success:false,error:"INVALID_REQUEST"},400);
  }
});
