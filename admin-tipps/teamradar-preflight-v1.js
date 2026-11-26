/* BetInsight TeamRadar v1 · live terminal preflight adapter
   Scope: football, new tips, nonhistorical. Client-side controlled rollout.
   The central DB publish gate remains unchanged until live source coverage is verified.
*/
(()=>{
  "use strict";
  if(window.__betInsightTeamRadarPreflightV1)return;
  window.__betInsightTeamRadarPreflightV1=true;

  const API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-teamradar-preflight";
  const SESSION_KEY="betinsight_admin_session_v1";
  const upstreamFetch=window.fetch.bind(window);
  let active=false;
  let statusBox=null;

  function panel(){
    if(statusBox?.isConnected)return statusBox;
    statusBox=document.getElementById("biTeamRadarPreflightStatus");
    if(statusBox)return statusBox;
    const el=document.createElement("aside");
    el.id="biTeamRadarPreflightStatus";
    el.setAttribute("role","status");
    el.setAttribute("aria-live","polite");
    el.style.cssText="position:fixed;right:12px;bottom:12px;z-index:99990;box-sizing:border-box;max-width:min(330px,calc(100vw - 24px));padding:10px 13px;border-radius:13px;border:1px solid rgba(65,185,231,.48);background:#092a3a;color:#ecf9ff;font:13px/1.35 Arial,sans-serif;box-shadow:0 5px 22px rgba(0,0,0,.42);";
    const heading=document.createElement("div");
    heading.textContent="🛡️ TeamRadar · Tippfreigabe";
    heading.style.cssText="font-weight:800;margin-bottom:3px";
    const info=document.createElement("div");
    info.id="biTeamRadarPreflightInfo";
    info.textContent="Bereit für die Prüfung beim Veröffentlichen.";
    info.style.cssText="font-size:12px;color:#cce7ef";
    el.append(heading,info);
    document.body.appendChild(el);
    statusBox=el;
    return el;
  }
  function show(message,tone="neutral"){
    panel();
    const info=document.getElementById("biTeamRadarPreflightInfo");
    if(info)info.textContent=message;
    statusBox.style.borderColor=tone==="alert"?"#f3a75c":tone==="clear"?"#3ccc95":"rgba(65,185,231,.48)";
  }
  function isPublish(url){
    return /(?:route=tip-historical-publish|\/rpc\/betinsight_admin_tip_publish_v1|\/betinsight-admin-tip-publish)/i.test(url);
  }
  function bodyData(v){
    try{
      if(typeof v==="string"){
        const t=v.trim();
        if(t.startsWith("{"))return JSON.parse(t);
        return Object.fromEntries(new URLSearchParams(t).entries());
      }
      if(typeof URLSearchParams!=="undefined"&&v instanceof URLSearchParams)return Object.fromEntries(v.entries());
      if(typeof FormData!=="undefined"&&v instanceof FormData)return Object.fromEntries(v.entries());
    }catch(_){}
    return null;
  }
  async function hashSession(){
    const session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
    if(!session?.token||Number(session.expiresMs||0)<=Date.now())throw new Error("SESSION_EXPIRED");
    const data=new TextEncoder().encode(String(session.token));
    const dig=await crypto.subtle.digest("SHA-256",data);
    return Array.from(new Uint8Array(dig),x=>x.toString(16).padStart(2,"0")).join("");
  }
  function isFootballNewTip(tip){
    if(!tip||typeof tip!=="object")return false;
    if(String(tip.status||"").trim().toLowerCase()==="historisch")return false;
    const sport=String(tip.sportart||"Fussball").trim().toLowerCase();
    return ["fussball","fußball","football","soccer"].includes(sport);
  }
  function cancelled(reason){
    return new Response(JSON.stringify({ok:false,error:"TEAMRADAR_REVIEW_REQUIRED",message:reason}),{
      status:409,
      headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
    });
  }
  async function run(tip){
    const sessionHash=await hashSession();
    const response=await upstreamFetch(API,{
      method:"POST",
      headers:{"content-type":"application/json"},
      cache:"no-store",
      body:JSON.stringify({action:"preflight",session_hash:sessionHash,tip})
    });
    if(!response.ok)throw new Error("RADAR_HTTP_"+response.status);
    const result=await response.json();
    if(result?.ok!==true)throw new Error(String(result?.error||"RADAR_NOT_READY"));
    return result;
  }

  window.fetch=async function(input,init){
    const url=typeof input==="string"?input:(input?.url?String(input.url):"");
    if(!isPublish(url)||active)return upstreamFetch(input,init);
    const raw=bodyData(init?.body);
    const tip=raw?.p_payload && typeof raw.p_payload==="object"?raw.p_payload:
      raw?.tip&&typeof raw.tip==="object"?raw.tip:raw;
    if(!isFootballNewTip(tip))return upstreamFetch(input,init);

    active=true;
    try{
      show("Aktueller Karten- und Verletzungscheck läuft …");
      let result;
      try{result=await run(tip);}
      catch(e){
        show("Prüfung nicht erreichbar. Keine automatische Radar-Freigabe.", "alert");
        if(!window.confirm("Der TeamRadar-Check konnte nicht abgeschlossen werden. Es gibt keine geprüften Karten-/Verletzungsdaten. Möchtest du den Tipp ausdrücklich ohne diesen Check veröffentlichen?"))return cancelled("TEAMRADAR_UNAVAILABLE");
        return upstreamFetch(input,init);
      }
      const state=String(result.check_status||"").toUpperCase();
      const action=String(result.proposed_action||"").toUpperCase();
      if(result.applicable===false){
        show("Diese Eingabe ist keine neue Fußball-Einzelprognose.");
        return upstreamFetch(input,init);
      }
      if(state==="CLEAR"&&action==="PUBLISH"){
        show("Prüfung grün: Quellenlage vollständig; keine offenen Ereignisse. Freigabe im Testmodus.", "clear");
        return upstreamFetch(input,init);
      }
      if(state==="REVIEW"||state==="BLOCK"){
        show("Karten-/Verletzungsereignis erkannt: Tipp prüfen oder ändern. Veröffentlichung angehalten.", "alert");
        window.alert("TeamRadar: Relevante Ereignisse gefunden. Bitte den Tipp prüfen oder ändern. Kein Tipp wurde über diesen Vorgang veröffentlicht.");
        return cancelled("TEAMRADAR_REASSESS_REQUIRED");
      }
      const missing=(result.missing_sources||[]).join(", ");
      show("Datenlage nicht vollständig: "+(missing||"keine bestätigte Abdeckung")+".", "alert");
      if(!window.confirm("TeamRadar: Karten-/Verletzungsdaten sind für dieses Spiel nicht vollständig verifiziert.\n\nDies ist keine grüne Freigabe. Möchtest du den Tipp ausnahmsweise manuell veröffentlichen?"))return cancelled("TEAMRADAR_DATA_MISSING");
      return upstreamFetch(input,init);
    }finally{
      active=false;
    }
  };
  const mount=()=>panel();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
  else mount();
})();
