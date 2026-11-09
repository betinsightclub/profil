// STAGING SOURCE ONLY - NOT DEPLOYED. Strict server-to-server redemption.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const src=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const clientSecret=Deno.env.get("BETTERINSIGHT_SSO_CLIENT_SECRET")||"";
const callback=Deno.env.get("BETTERINSIGHT_SSO_CALLBACK_URL")||"";
const db=src&&key?createClient(src,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
function reply(value:unknown,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json;charset=utf-8","Cache-Control":"no-store",
    "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"
  }});
}
function safeEqual(a:string,b:string) {
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function sha(value:string){
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))
    .map(b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async request=>{
  if(request.method!=="POST")return reply({success:false},405);
  if(!db||clientSecret.length<32||!callback.startsWith("https://")
     ||!callback.endsWith("/api/betterinsight/auth/callback"))
    return reply({success:false,error:"NOT_CONFIGURED"},503);
  const bearer=request.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer ")||!safeEqual(bearer.slice(7),clientSecret))
    return reply({success:false,error:"UNAUTHORIZED"},401);
  try {
    const data=await request.json();
    if(data.audience!=="betterinsight"||data.redirect_uri!==callback
        ||typeof data.code!=="string"||!/^[A-Za-z0-9_-]{32,128}$/.test(data.code))
      return reply({success:false,error:"INVALID_REQUEST"},400);
    const {data:rows,error}=await db.rpc("betinsight_betterinsight_sso_redeem_v1",{
      p_code_hash:await sha(data.code),p_redirect_uri:callback
    });
    if(error){console.error("SSO redeem database failure");return reply({success:false,error:"UNAVAILABLE"},503)}
    const userId=Array.isArray(rows)?rows[0]?.user_id:null;
    if(typeof userId!=="string"||!/^[A-Za-z0-9]{9}$/.test(userId))
      return reply({success:false,error:"INVALID_OR_EXPIRED_CODE"},401);
    return reply({success:true,audience:"betterinsight",user_id:userId});
  }catch{return reply({success:false,error:"INVALID_REQUEST"},400)}
});
