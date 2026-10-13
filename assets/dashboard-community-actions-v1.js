/* BetInsight Community – compact, 16-sticker social reactions, comments and sharing. */
(function(){
  "use strict";
  if(window.__biDashboardCommunityActionsV2)return;
  window.__biDashboardCommunityActionsV2=true;
  const API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/community-api";
  const EMOTIONS=[
    {code:"LIKE",label:"Like",col:0,row:0,emoji:"👍"},
    {code:"OK",label:"Okay",col:1,row:0,emoji:"👌"},
    {code:"REJECTED",label:"Abgelehnt",col:2,row:0,emoji:"👎"},
    {code:"BOOST",label:"Durchstarten",col:3,row:0,emoji:"🚀"},
    {code:"HOT_TIP",label:"Heißer Tipp",col:0,row:1,emoji:"🔥"},
    {code:"WARNING",label:"Achtung",col:1,row:1,emoji:"⚠️"},
    {code:"GOAL",label:"Tor",col:2,row:1,emoji:"⚽"},
    {code:"SORRY",label:"Schade",col:3,row:1,emoji:"😢"},
    {code:"HAHA",label:"Haha",col:0,row:2,emoji:"😂"},
    {code:"WOW",label:"Wow",col:1,row:2,emoji:"😮"},
    {code:"THANKS",label:"Danke",col:2,row:2,emoji:"🙏"},
    {code:"HEART",label:"Herz",col:3,row:2,emoji:"❤️"},
    {code:"WON",label:"Gewonnen",col:0,row:3,emoji:"🏆"},
    {code:"WELCOME",label:"Willkommen",col:1,row:3,emoji:"👋"},
    {code:"PREMIUM",label:"Premium",col:2,row:3,emoji:"💎"},
    {code:"LIVE_ALARM",label:"Live-Alarm",col:3,row:3,emoji:"🔔"}
  ];
  const css=[
    ".bi-dash-social{position:relative;padding:4px 15px 12px;border-top:1px solid rgba(130,208,255,.12);font-size:13px}",
    ".bi-dash-social-stats{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px;color:#9db7c8;font-size:11px}",
    ".bi-dash-social-stats .bi-dash-stat{display:flex;align-items:center;gap:5px}",
    ".bi-dash-social-toolbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:4px 0}",
    ".bi-dash-social-toolbar button{border:0;min-height:35px;border-radius:8px;background:transparent;color:#a9c5d5;font:inherit;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;padding:6px}",
    ".bi-dash-social-toolbar button:hover,.bi-dash-social-toolbar button:focus-visible{background:rgba(89,175,233,.1);color:#f0faff}",
    ".bi-dash-social-toolbar button[aria-pressed=true]{color:#64c6ff}",
    ".bi-dash-social-toolbar button:disabled{opacity:.45;cursor:not-allowed}",
    ".bi-dash-reaction-anchor{position:relative;min-width:0}",
    ".bi-dash-reaction-anchor>.bi-dash-reaction-trigger{width:100%}",
    ".bi-dash-reaction-menu{position:absolute;bottom:calc(100% + 6px);left:0;z-index:60;width:min(525px,calc(100vw - 36px));padding:11px;border:1px solid rgba(101,193,242,.31);border-radius:16px;background:#082332;box-shadow:0 17px 38px rgba(0,0,0,.6)}",
    ".bi-dash-reaction-menu[hidden],.bi-dash-comments-panel[hidden],.bi-dash-social-status:empty{display:none!important}",
    ".bi-dash-reaction-title{font-size:11px;font-weight:800;color:#a8cddd;margin:0 0 8px 3px}",
    ".bi-dash-reaction-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px}",
    ".bi-dash-reaction-grid button{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:10px;min-height:63px;padding:5px 2px 4px;cursor:pointer;display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;color:#a9c8d8;font-size:9px;line-height:1.1}",
    ".bi-dash-reaction-grid button:hover,.bi-dash-reaction-grid button:focus-visible{background:rgba(54,155,221,.16);border-color:#63bdea;color:#fff}",
    ".bi-dash-reaction-grid button.is-chosen{border-color:#48c4ff;background:rgba(32,135,211,.2);color:#fff}",
    ".bi-dash-sticker{display:block;width:33px;height:33px;flex:0 0 33px;aspect-ratio:1/1;background-image:url('/trainer/stickers/betinsight-stickers-sprite.webp?v=20260928-1');background-repeat:no-repeat;background-size:400% 400%}",
    ".bi-dash-comments-panel{padding:12px 2px 4px}",
    ".bi-dash-comments{display:grid;gap:6px;max-height:240px;overflow:auto}",
    ".bi-dash-comment{background:rgba(255,255,255,.04);border-radius:11px;padding:9px 11px;font-size:12px;color:#dcebf4;overflow-wrap:anywhere}",
    ".bi-dash-comment strong{color:#8fcfee;margin-right:7px}",
    ".bi-dash-comment-form{display:flex;align-items:flex-end;gap:9px;margin-top:10px}",
    ".bi-dash-comment-input{flex:1;min-width:0;resize:vertical;min-height:40px;max-height:125px;line-height:1.45;padding:10px 12px;border-radius:13px;background:#091c2b;border:1px solid rgba(130,200,241,.25);color:#f1f8ff;font:inherit;font-size:12px}",
    ".bi-dash-comment-input:focus-visible{outline:1px solid #5bb8f1}",
    ".bi-dash-comment-submit{flex:0 0 auto;min-height:39px;padding:8px 12px;background:#14629a;border:1px solid rgba(87,171,219,.34);border-radius:10px;color:#fff;font-weight:750;font-size:12px;cursor:pointer}",
    ".bi-dash-comment-submit:disabled{opacity:.5;cursor:not-allowed}",
    ".bi-dash-social-status{margin-top:9px;font-size:11px;color:#9bdefb}",
    ".bi-dash-signin-note{color:#96b6c5;font-size:11px;margin:7px 0 0}",
    "@media(max-width:700px){.bi-dash-reaction-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.bi-dash-reaction-menu{width:min(315px,calc(100vw - 40px))}.bi-dash-social-toolbar button{font-size:11px;gap:4px}.bi-dash-comment-form{flex-wrap:wrap}.bi-dash-comment-submit{margin-left:auto}}"
  ].join("\n");
  const style=document.createElement("style");style.id="bi-dashboard-social-v2";style.textContent=css;document.head.append(style);

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
    if(!token)throw new Error("Bitte melde dich im Dashboard an.");
    const r=await fetch(API+"?action="+encodeURIComponent(action),{
      method:"POST",cache:"no-store",credentials:"omit",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(Object.assign({},payload,{credential:token}))
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok!==true){
      const messages={
        INVALID_IDENTITY:"Deine Anmeldung ist abgelaufen. Bitte erneut anmelden.",
        CONTENT_REJECTED:"Dein Kommentar entspricht nicht den Community-Regeln.",
        COMMENTS_NOT_AVAILABLE:"Für diesen Beitrag sind keine Kommentare freigegeben.",
        RATE_LIMITED:"Bitte versuche es in Kürze erneut.",
        POST_NOT_AVAILABLE:"Dieser Beitrag ist nicht mehr verfügbar."
      };
      throw new Error(messages[d.error]||"Die Aktion konnte nicht gespeichert werden.");
    }
    return d;
  }
  function currentPost(id){
    const map=window.__biDashboardFeedPosts;
    return map instanceof Map?map.get(id):null;
  }
  function position(e){return (e.col*100/3).toFixed(4)+"% "+(e.row*100/3).toFixed(4)+"%"}
  function element(tag,cls,content){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(content!==undefined)n.textContent=content;
    return n;
  }
  function populateComments(host,post){
    host.replaceChildren();
    const comments=Array.isArray(post.comments)?post.comments:[];
    if(!comments.length){
      host.append(element("p","bi-dash-signin-note","Noch keine Kommentare. Schreibe den ersten."));
      return;
    }
    comments.slice(-8).forEach(comment=>{
      const box=element("div","bi-dash-comment");
      const who=element("strong","",comment.owner_ref?"Mitglied":"Community");
      const msg=element("span","",String(comment.body||""));
      box.append(who,msg);host.append(box);
    });
    if(comments.length>8)host.append(element("p","bi-dash-signin-note","Die acht neuesten Kommentare werden angezeigt."));
  }
  function renderStats(state,post){
    const reactions=Array.isArray(post.reactions)?post.reactions:[];
    const counts=new Map();
    reactions.forEach(r=>{const code=r.reaction==="CHEER"?"BOOST":r.reaction;counts.set(code,(counts.get(code)||0)+1)});
    const top=EMOTIONS.filter(e=>counts.has(e.code)).sort((a,b)=>counts.get(b.code)-counts.get(a.code)).slice(0,3);
    state.stats.textContent=(top.map(e=>e.emoji).join(" ")||"♡")+" "+reactions.length+" Reaktionen";
    state.numComments.textContent="💬 "+(Array.isArray(post.comments)?post.comments.length:0)+" Kommentare";
    populateComments(state.commentList,post);
  }
  async function updateOne(id,state){
    try{
      const r=await fetch(API+"?action=feed&scope=global",{cache:"no-store",credentials:"omit",headers:{Accept:"application/json"}});
      const d=await r.json();
      if(!r.ok||d.ok!==true||!Array.isArray(d.posts))return;
      const fresh=d.posts.find(p=>p.id===id);
      if(!fresh)return;
      window.__biDashboardFeedPosts?.set(id,fresh);
      renderStats(state,fresh);
    }catch(e){console.warn("Community stats update",e)}
  }
  function profileLink(post,id){
    if(post.public_slug){
      return location.origin+"/trainer/?p="+encodeURIComponent(post.public_slug)+"&post="+encodeURIComponent(id);
    }
    return "https://betinsight.club/trainer-feed/?lang=de";
  }
  async function shareLink(post,id,status){
    const link=profileLink(post,id);
    try{
      if(navigator.share){
        await navigator.share({title:"BetInsight Community",url:link});return;
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(link);
        status.textContent="Beitragslink kopiert.";return;
      }
      const temp=document.createElement("input");temp.value=link;temp.style.position="fixed";temp.style.opacity="0";
      document.body.append(temp);temp.select();
      if(!document.execCommand("copy"))throw new Error("copy unsupported");
      temp.remove();status.textContent="Beitragslink kopiert.";
    }catch(error){
      if(error?.name==="AbortError")return;
      status.textContent="Link konnte nicht kopiert werden.";
    }
  }
  function enhance(item){
    if(item.dataset.biInteractionReady==="true")return;
    const id=item.dataset.postId,post=currentPost(id);
    if(!id||!post)return;
    item.dataset.biInteractionReady="true";
    const root=element("section","bi-dash-social");
    root.setAttribute("aria-label","Community-Reaktionen und Kommentare");
    const statsBar=element("div","bi-dash-social-stats");
    const stats=element("span","bi-dash-stat");
    const numComments=element("span","bi-dash-stat");
    statsBar.append(stats,numComments);root.append(statsBar);

    const bar=element("div","bi-dash-social-toolbar");
    const anchor=element("div","bi-dash-reaction-anchor");
    const reactionButton=element("button","bi-dash-reaction-trigger","👍 Reagieren ▾");
    reactionButton.type="button";reactionButton.setAttribute("aria-expanded","false");
    reactionButton.setAttribute("aria-haspopup","true");
    const menu=element("div","bi-dash-reaction-menu");
    menu.hidden=true;menu.setAttribute("role","group");menu.setAttribute("aria-label","BetInsight-Reaktion wählen");
    menu.append(element("div","bi-dash-reaction-title","Wie möchtest du reagieren?"));
    const picker=element("div","bi-dash-reaction-grid");
    menu.append(picker);
    anchor.append(reactionButton,menu);

    const commentButton=element("button","bi-dash-comment-trigger","💬 Kommentieren");
    commentButton.type="button";commentButton.setAttribute("aria-expanded","false");
    const shareButton=element("button","bi-dash-share-trigger","↗ Teilen");shareButton.type="button";
    bar.append(anchor,commentButton,shareButton);root.append(bar);

    const panel=element("div","bi-dash-comments-panel");
    panel.hidden=true;
    const commentList=element("div","bi-dash-comments");panel.append(commentList);
    const form=element("form","bi-dash-comment-form");
    const field=element("textarea","bi-dash-comment-input");field.required=true;field.maxLength=500;field.rows=2;
    field.placeholder="Schreibe einen Kommentar …";field.setAttribute("aria-label","Kommentar schreiben");
    const submit=element("button","bi-dash-comment-submit","Senden");submit.type="submit";
    form.append(field,submit);panel.append(form);
    const loginNote=element("p","bi-dash-signin-note","Zum Reagieren oder Kommentieren bitte im Dashboard anmelden.");
    panel.append(loginNote);root.append(panel);
    const status=element("div","bi-dash-social-status");status.setAttribute("role","status");root.append(status);
    item.append(root);
    const state={stats,numComments,commentList};
    renderStats(state,post);

    const pickerButtons=[];
    EMOTIONS.forEach(e=>{
      const b=element("button","",undefined);
      b.type="button";b.title=e.label;b.setAttribute("aria-label",e.label);b.dataset.reaction=e.code;
      const art=element("span","bi-dash-sticker");art.style.backgroundPosition=position(e);
      art.setAttribute("aria-hidden","true");
      const label=element("span","",e.label);
      b.append(art,label);picker.append(b);pickerButtons.push(b);
      b.addEventListener("click",async()=>{
        if(b.disabled)return;
        pickerButtons.forEach(btn=>btn.disabled=true);
        status.textContent="Reaktion wird gespeichert …";
        try{
          await send("react",{post_id:id,reaction:e.code});
          reactionButton.textContent=e.emoji+" "+e.label+" ▾";
          reactionButton.setAttribute("aria-pressed","true");
          pickerButtons.forEach(btn=>btn.classList.toggle("is-chosen",btn===b));
          status.textContent=e.emoji+" Reaktion gespeichert.";
          setMenu(false);
          await updateOne(id,state);
        }catch(err){status.textContent=err.message||"Reaktion fehlgeschlagen."}
        finally{pickerButtons.forEach(btn=>btn.disabled=false);refreshAuth()}
      });
    });

    function setMenu(open){
      menu.hidden=!open;
      reactionButton.setAttribute("aria-expanded",String(open));
    }
    function refreshAuth(){
      const logged=Boolean(credential());
      reactionButton.disabled=!logged;
      field.disabled=!logged;
      submit.disabled=!logged;
      loginNote.hidden=logged;
    }
    refreshAuth();
    const tileToggle=item.querySelector(".bi-tile-toggle");
    if(tileToggle)tileToggle.addEventListener("click",refreshAuth);
    reactionButton.addEventListener("click",()=>{
      refreshAuth();if(reactionButton.disabled)return;
      setMenu(menu.hidden);
    });
    // On desktop the menu appears on hover; on mobile tapping Reagieren toggles it.
    if(window.matchMedia&&window.matchMedia("(hover:hover) and (pointer:fine)").matches){
      let closer;
      anchor.addEventListener("mouseenter",()=>{clearTimeout(closer);if(credential())setMenu(true)});
      anchor.addEventListener("mouseleave",()=>{clearTimeout(closer);closer=setTimeout(()=>setMenu(false),220)});
    }
    commentButton.addEventListener("click",()=>{
      refreshAuth();
      panel.hidden=!panel.hidden;
      commentButton.setAttribute("aria-expanded",String(!panel.hidden));
      setMenu(false);
      if(!panel.hidden&&!field.disabled)field.focus();
    });
    shareButton.addEventListener("click",()=>shareLink(post,id,status));
    form.addEventListener("submit",async ev=>{
      ev.preventDefault();const text=field.value.trim();if(!text)return;
      submit.disabled=true;status.textContent="Kommentar wird geprüft …";
      try{
        const result=await send("create_comment",{post_id:id,text});
        field.value="";
        status.textContent=result.moderation?.status==="PENDING_REVIEW"?
          "Kommentar gespeichert und zur Prüfung eingereicht.":
          "Kommentar veröffentlicht.";
        await updateOne(id,state);
      }catch(err){status.textContent=err.message||"Kommentar fehlgeschlagen."}
      finally{refreshAuth()}
    });
  }
  function attach(){
    const feed=document.getElementById("dashboardFeedList");
    if(!feed)return;
    function sync(){feed.querySelectorAll(".dashboard-feed-post").forEach(enhance)}
    new MutationObserver(sync).observe(feed,{childList:true});
    sync();
    document.addEventListener("click",event=>{
      feed.querySelectorAll(".bi-dash-reaction-menu:not([hidden])").forEach(menu=>{
        if(!menu.closest(".bi-dash-reaction-anchor")?.contains(event.target)){
          menu.hidden=true;
          const button=menu.parentElement?.querySelector(".bi-dash-reaction-trigger");
          if(button)button.setAttribute("aria-expanded","false");
        }
      });
    });
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape")feed.querySelectorAll(".bi-dash-reaction-menu:not([hidden])").forEach(menu=>{
        menu.hidden=true;const button=menu.parentElement?.querySelector(".bi-dash-reaction-trigger");
        if(button)button.setAttribute("aria-expanded","false");
      });
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
  else attach();
})();