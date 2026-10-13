/* BetInsight dashboard Community reactions and comments – existing secured community-api. */
(function(){
  "use strict";
  if(window.__biDashboardCommunityActionsV1)return;
  window.__biDashboardCommunityActionsV1=true;
  const css=String.raw`
    .bi-dash-social{padding:13px 16px 17px;border-top:1px solid rgba(130,208,255,.13)}
    .bi-dash-social-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .bi-dash-social button{cursor:pointer;font:inherit}
    .bi-dash-heart{border:1px solid rgba(255,121,143,.27);border-radius:10px;
       color:#ffd1da;background:rgba(225,82,103,.09);padding:8px 12px;font-size:13px;font-weight:750}
    .bi-dash-heart[aria-pressed="true"]{color:#fff;background:rgba(225,82,103,.28);border-color:#f784a4}
    .bi-dash-heart:disabled{opacity:.6;cursor:wait}
    .bi-dash-social-count{color:#b3c7d2;font-size:12px}
    .bi-dash-comments{margin-top:12px;display:grid;gap:7px}
    .bi-dash-comment{color:#dae8ef;border-radius:10px;background:rgba(255,255,255,.04);padding:9px 12px;font-size:12px;overflow-wrap:anywhere}
    .bi-dash-comment strong{color:#8dd1ff;margin-right:7px}
    .bi-dash-comment-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:13px}
    .bi-dash-comment-input{width:100%;min-width:0;resize:vertical;min-height:66px;max-height:180px;
      background:#071b2a;color:#f5fbff;border:1px solid rgba(117,185,224,.25);border-radius:10px;
      padding:10px 12px;font:inherit;font-size:13px}
    .bi-dash-comment-submit{align-self:end;padding:11px 14px;border:1px solid rgba(39,153,237,.4);
      border-radius:10px;background:#1263a7;color:#fff;font-size:12px;font-weight:750}
    .bi-dash-comment-submit:disabled{opacity:.55;cursor:wait}
    .bi-dash-social-status{min-height:18px;margin-top:9px;font-size:11px;color:#abd2ee}
    .bi-dash-signin-note{color:#a5bccd;font-size:12px;margin-top:10px}
    @media(max-width:520px){.bi-dash-comment-form{grid-template-columns:1fr}.bi-dash-comment-submit{justify-self:end}}
  `;
  const style=document.createElement("style");style.textContent=css;document.head.append(style);

  function credential(){
    try{
      if(typeof getConfirmedDashboardToken==="function"){
        const t=String(getConfirmedDashboardToken()||"").trim();
        if(t)return t;
      }
      if(typeof getActiveToken==="function")return String(getActiveToken()||"").trim();
    }catch(_){}
    return "";
  }
  async function send(action,payload){
    const token=credential();
    if(!token)throw new Error("Bitte melde dich im BetInsight-Dashboard an.");
    const resp=await fetch("https://lszlaglwlixejzytrurg.supabase.co/functions/v1/community-api?action="+encodeURIComponent(action),{
      method:"POST",cache:"no-store",credentials:"omit",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({...payload,credential:token})
    });
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok||data.ok!==true){
      const message=data.error==="INVALID_IDENTITY"?"Deine Anmeldung ist abgelaufen. Bitte erneut anmelden.":
        data.error==="CONTENT_REJECTED"?"Der Kommentar entspricht nicht den Community-Regeln.":
        data.error==="COMMENTS_NOT_AVAILABLE"?"Für diesen Beitrag sind Kommentare nicht freigegeben.":
        data.error==="RATE_LIMITED"?"Bitte versuche es später erneut.":
        "Die Aktion konnte nicht abgeschlossen werden.";
      throw new Error(message);
    }
    return data;
  }
  async function refreshOne(item){
    try{
      const r=await fetch("https://lszlaglwlixejzytrurg.supabase.co/functions/v1/community-api?action=feed&scope=global",{
        cache:"no-store",credentials:"omit",headers:{Accept:"application/json"}
      });
      const data=await r.json();
      const fresh=Array.isArray(data.posts)?data.posts.find(p=>p.id===item.dataset.postId):null;
      if(fresh){
        const cache=window.__biDashboardFeedPosts;
        if(cache&&typeof cache.set==="function")cache.set(fresh.id,fresh);
        showCounts(item,fresh);
        showComments(item,fresh);
      }
    }catch(_){}
  }
  function showCounts(item,post){
    const count=(post.reactions||[]).length;
    const comments=(post.comments||[]).length;
    const b=item.querySelector(".bi-dash-heart");
    const label=item.querySelector(".bi-dash-social-count");
    if(b)b.textContent="❤️ Herz ("+count+")";
    if(label)label.textContent="💬 "+comments+" Kommentare";
  }
  function showComments(item,post){
    const host=item.querySelector(".bi-dash-comments");
    if(!host)return;
    host.replaceChildren();
    const comments=Array.isArray(post.comments)?post.comments:[];
    if(!comments.length){
      const empty=document.createElement("div");empty.className="bi-dash-signin-note";
      empty.textContent="Noch keine Kommentare. Starte die Diskussion.";host.append(empty);return;
    }
    comments.slice(-8).forEach(comment=>{
      const box=document.createElement("div");box.className="bi-dash-comment";
      const who=document.createElement("strong");
      who.textContent=comment.owner_ref?"Mitglied":"Community";
      const message=document.createElement("span");message.textContent=String(comment.body||"");
      box.append(who,message);host.append(box);
    });
    if(comments.length>8){
      const hint=document.createElement("div");hint.className="bi-dash-signin-note";
      hint.textContent="Die acht neuesten Kommentare werden angezeigt.";host.append(hint);
    }
  }
  function enhance(item){
    if(item.dataset.biInteractionReady==="true")return;
    const id=item.dataset.postId;
    const cache=window.__biDashboardFeedPosts;
    if(!id||!cache||!cache.has(id))return;
    item.dataset.biInteractionReady="true";
    const post=cache.get(id);
    const host=document.createElement("section");host.className="bi-dash-social";
    host.setAttribute("aria-label","Reaktionen und Kommentare");
    const top=document.createElement("div");top.className="bi-dash-social-toolbar";
    const heart=document.createElement("button");heart.type="button";heart.className="bi-dash-heart";
    heart.setAttribute("aria-pressed","false");
    const count=document.createElement("span");count.className="bi-dash-social-count";
    top.append(heart,count);host.append(top);
    const comments=document.createElement("div");comments.className="bi-dash-comments";host.append(comments);
    const form=document.createElement("form");form.className="bi-dash-comment-form";
    const field=document.createElement("textarea");field.className="bi-dash-comment-input";
    field.maxLength=1500;field.required=true;field.placeholder="Deinen Kommentar schreiben …";
    field.setAttribute("aria-label","Kommentar");
    const submit=document.createElement("button");submit.type="submit";submit.className="bi-dash-comment-submit";
    submit.textContent="Kommentieren";form.append(field,submit);
    const status=document.createElement("div");status.className="bi-dash-social-status";
    status.setAttribute("role","status");host.append(form,status);
    const note=document.createElement("p");note.className="bi-dash-signin-note";
    note.textContent="Reaktionen und Kommentare sind nur für eingeloggte Mitglieder verfügbar.";
    host.append(note);
    item.append(host);
    showCounts(item,post);showComments(item,post);
    function refreshAuthentication(){
      const loggedIn=Boolean(credential());
      note.hidden=loggedIn;
      if(!heart.dataset.busy)heart.disabled=!loggedIn;
      if(!submit.dataset.busy)submit.disabled=!loggedIn;
      field.disabled=!loggedIn;
    }
    refreshAuthentication();
    const tileToggle=item.querySelector(".bi-tile-toggle");
    if(tileToggle)tileToggle.addEventListener("click",refreshAuthentication);
    heart.addEventListener("click",async()=>{
      if(heart.disabled)return;
      heart.dataset.busy="1";heart.disabled=true;status.textContent="Herz wird gespeichert …";
      try{
        await send("react",{post_id:id,reaction:"HEART"});
        heart.setAttribute("aria-pressed","true");
        status.textContent="❤️ Dein Herz wurde gespeichert.";
        await refreshOne(item);
      }catch(e){status.textContent=e.message||"Reaktion nicht möglich."}
      finally{delete heart.dataset.busy;refreshAuthentication()}
    });
    form.addEventListener("submit",async ev=>{
      ev.preventDefault();
      const text=field.value.trim();
      if(!text)return;
      submit.dataset.busy="1";submit.disabled=true;status.textContent="Kommentar wird geprüft …";
      try{
        const result=await send("create_comment",{post_id:id,text});
        field.value="";
        if(result.moderation&&result.moderation.status==="PENDING_REVIEW"){
          status.textContent="Kommentar gespeichert – Veröffentlichung nach Moderationsprüfung.";
        }else{
          status.textContent="Kommentar veröffentlicht.";
        }
        await refreshOne(item);
      }catch(e){status.textContent=e.message||"Kommentar konnte nicht gespeichert werden."}
      finally{delete submit.dataset.busy;refreshAuthentication()}
    });
  }
  function attach(){
    const feed=document.getElementById("dashboardFeedList");
    if(!feed)return;
    function sync(){feed.querySelectorAll(".dashboard-feed-post").forEach(enhance)}
    new MutationObserver(sync).observe(feed,{childList:true});
    sync();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
  else attach();
})();