/* BetInsight compact community tiles v1 – presentation only; billing and publishing unchanged. */
(function(){
  "use strict";
  if(window.__biCommunityTilesV1)return;
  window.__biCommunityTilesV1=true;
  const css = String.raw`
    #homeTrainerFeed.bi-tile-grid,#dashboardFeedList.bi-tile-grid,#publicFeed.bi-tile-grid,
    #feed.bi-tile-grid,#postFeed.bi-tile-grid{
      display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:12px!important;align-items:stretch!important;max-height:none!important;overflow:visible!important;
    }
    #homeTrainerFeed.bi-tile-grid .trainer-post:last-child{display:flex!important}
    .bi-tile-grid .bi-tile{
      display:flex!important;flex-direction:column!important;min-width:0!important;
      min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;
      border-radius:16px!important;border:1px solid rgba(108,190,235,.22)!important;
      background:linear-gradient(155deg,#0b2336,#081724)!important;box-shadow:none!important;
    }
    .bi-tile-grid .bi-tile:hover{border-color:rgba(80,177,242,.55)!important}
    .bi-tile-grid .bi-tile.bi-open{grid-column:1/-1!important;border-color:rgba(73,185,245,.62)!important}
    .bi-tile-grid .bi-tile:not(.bi-open)>:not(.bi-tile-toggle){display:none!important}
    .bi-tile-grid .bi-tile .bi-tile-toggle{
      display:flex;flex:0 0 auto;flex-direction:column;align-items:flex-start;text-align:left;gap:9px;
      width:100%;min-height:109px;border:0;color:#f0f7ff;background:transparent;
      font:inherit;padding:15px 17px;cursor:pointer;white-space:normal;
    }
    .bi-tile-grid .bi-tile .bi-tile-toggle:focus-visible{outline:2px solid #48c4ff;outline-offset:-3px}
    .bi-tile-grid .bi-tile .bi-tile-tag{
      color:#9dbfd4;font-size:10px!important;font-weight:800;line-height:1.4;letter-spacing:.045em;
      text-transform:uppercase;word-break:break-word;
    }
    .bi-tile-grid .bi-tile .bi-tile-tag.bi-tile-paid{color:#ffd992}
    .bi-tile-grid .bi-tile .bi-tile-tag.bi-tile-official{color:#75e0ff}
    .bi-tile-grid .bi-tile .bi-tile-headline{
      font-size:clamp(13px,1.25vw,16px)!important;line-height:1.38;font-weight:850!important;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
    }
    .bi-tile-grid .bi-tile .bi-tile-more{font-size:11px;color:#80c9f5;margin-top:auto;font-weight:750}
    .bi-tile-grid .bi-tile.bi-open .bi-tile-toggle{min-height:auto;background:rgba(56,163,224,.08)}
    .bi-tile-grid .bi-tile.bi-open .bi-tile-headline{font-size:18px!important;-webkit-line-clamp:unset}
    .bi-tile-grid .bi-tile.bi-open > .post-inner,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-head,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-text,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-media,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-foot,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-author,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-text,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-image,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-link-slot,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-meta{max-width:100%}
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-head,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-text,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-media,
    .bi-tile-grid .bi-tile.bi-open > .trainer-post-foot,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-author,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-text,
    .bi-tile-grid .bi-tile.bi-open > .dashboard-feed-meta{margin:12px 16px}
    .bi-tile-grid .bi-tile.bi-open > .post-inner{padding:15px!important}
    .bi-tile-grid .bi-tile.bi-open > .post-foot{padding:12px 15px!important}
    .bi-tile-grid .bi-tile.bi-open > .post-head{padding:15px!important}
    .bi-tile-grid .bi-tile.bi-open > .post-body{padding:10px 15px!important}
    .bi-tile-grid .bi-tile.bi-open > .post-metrics,
    .bi-tile-grid .bi-tile.bi-open > .post-actions,
    .bi-tile-grid .bi-tile.bi-open > .comment-list,
    .bi-tile-grid .bi-tile.bi-open > .comment-compose{max-width:100%}
    #dashboardFeedList.bi-tile-grid .dashboard-feed-post.bi-open{padding-bottom:12px!important}
    .bi-tile-load-more{display:block;margin:18px auto 25px;border:1px solid rgba(109,192,243,.38);
      background:#0d2b40;color:#dff5ff;padding:11px 20px;border-radius:12px;cursor:pointer;font:inherit;font-weight:750}
    .bi-tile-load-more:hover{background:#164560}
    @media(max-width:900px){
      #homeTrainerFeed.bi-tile-grid,#dashboardFeedList.bi-tile-grid,#publicFeed.bi-tile-grid,
      #feed.bi-tile-grid,#postFeed.bi-tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:520px){
      #homeTrainerFeed.bi-tile-grid,#dashboardFeedList.bi-tile-grid,#publicFeed.bi-tile-grid,
      #feed.bi-tile-grid,#postFeed.bi-tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      .bi-tile-grid .bi-tile .bi-tile-toggle{padding:12px;min-height:112px}
      .bi-tile-grid .bi-tile .bi-tile-headline{font-size:13px!important}
    }
  `;
  const style=document.createElement("style");style.id="bi-community-tiles-css";style.textContent=css;document.head.appendChild(style);
  const configs=[
    {id:"homeTrainerFeed",item:".trainer-post",max:6},
    {id:"dashboardFeedList",item:".dashboard-feed-post",max:6},
    {id:"publicFeed",item:".post",page:12},
    {id:"feed",item:".post",page:12},
    {id:"postFeed",item:".post",page:12}
  ];
  function headline(item){
    const body=item.querySelector(".trainer-post-text,.dashboard-feed-text,.post-text,.body");
    const raw=(body?body.textContent:"").trim();
    const line=(raw.split(/\n+/).find(s=>s.trim())||raw||"Community-Beitrag").trim();
    return line.length>125?line.slice(0,122).trimEnd()+"…":line;
  }
  function label(item){
    if(item.dataset.unitPaid==="true") return {text:"Community · Globaler Beitragsplatz",type:"paid"};
    if(item.dataset.official==="true") return {text:"BetInsight · Offizielle Meldung",type:"official"};
    const author=item.querySelector(".trainer-author strong,.dashboard-feed-author-copy strong,.author strong,.post-author strong");
    return {text:(author?.textContent||"Community-Beitrag").trim(),type:"normal"};
  }
  function enhance(item){
    if(item.classList.contains("bi-tile"))return;
    const tag=label(item),button=document.createElement("button");
    button.type="button";button.className="bi-tile-toggle";button.setAttribute("aria-expanded","false");
    const mark=document.createElement("span");mark.className="bi-tile-tag bi-tile-"+tag.type;mark.textContent=tag.text;
    const title=document.createElement("span");title.className="bi-tile-headline";title.textContent=headline(item);
    const more=document.createElement("span");more.className="bi-tile-more";more.textContent="Beitrag öffnen ↓";
    button.append(mark,title,more);
    item.classList.add("bi-tile");item.insertBefore(button,item.firstChild);
    button.addEventListener("click",function(){
      const open=item.classList.contains("bi-open");
      if(!open){
        item.parentElement?.querySelectorAll(".bi-tile.bi-open").forEach(other=>{
          if(other===item)return;
          other.classList.remove("bi-open");
          const b=other.querySelector(".bi-tile-toggle");if(b){b.setAttribute("aria-expanded","false");const m=b.querySelector(".bi-tile-more");if(m)m.textContent="Beitrag öffnen ↓";}
        });
      }
      item.classList.toggle("bi-open",!open);
      button.setAttribute("aria-expanded",String(!open));
      more.textContent=open?"Beitrag öffnen ↓":"Beitrag schließen ↑";
    });
  }
  function applyPaging(box,config,items){
    if(!config.page)return;
    const size=config.page;
    const visible=Number(box.dataset.tilesVisible||size);
    items.forEach((item,i)=>{item.style.display=i<visible?"":"none"});
    let more=box.nextElementSibling;
    if(!more||!more.classList.contains("bi-tile-load-more")){
      more=document.createElement("button");more.type="button";more.className="bi-tile-load-more";
      box.insertAdjacentElement("afterend",more);
      more.addEventListener("click",()=>{box.dataset.tilesVisible=String(Number(box.dataset.tilesVisible||size)+size);sync(config);});
    }
    more.hidden=items.length<=visible;
    if(!more.hidden)more.textContent="Weitere Beiträge anzeigen ("+Math.max(0,items.length-visible)+")";
  }
  function sync(config){
    const box=document.getElementById(config.id);if(!box)return;
    const posts=[...box.querySelectorAll(":scope > "+config.item)];
    if(!posts.length)return;
    box.classList.add("bi-tile-grid");
    posts.forEach(enhance);
    if(config.page)applyPaging(box,config,posts);
  }
  function mount(config){
    const box=document.getElementById(config.id);if(!box)return;
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;sync(config)});
    });
    observer.observe(box,{childList:true,subtree:false});
    sync(config);
  }
  function start(){configs.forEach(mount)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();