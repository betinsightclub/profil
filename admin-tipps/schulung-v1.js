/* BetInsight Schulungstipp V1 · Only the checked admin publication is tagged.
   Deliberately keeps the normal booking/unlock route and all other tips unchanged. */
(function(){
  "use strict";
  const FLAG="SCHULUNGSTIPP";
  const TITLE="🎓 SCHULUNGSTIPP – WORKSHOP MITTWOCH, 20 UHR";
  const ID="biSchulungTipCheckbox";
  function isEnabled(){ return document.getElementById(ID)?.checked===true; }
  function mount(){
    if(document.getElementById(ID)) return;
    const btn=Array.from(document.querySelectorAll("button,input[type=submit]")).find(el=>
      /veröffentlichen|veroeffentlichen/i.test(String(el.textContent||el.value||""))
    );
    const analysis=document.getElementById("analyse")||
      document.querySelector('textarea[name="analyse"],textarea[id*="analyse" i]');
    const anchor=btn||analysis;
    if(!anchor||!anchor.parentElement) return;
    const panel=document.createElement("div");
    panel.id="biSchulungTipPanel";
    panel.style.cssText="box-sizing:border-box;display:block;flex:1 0 100%;width:100%;margin:12px 0;padding:13px 15px;border:1px solid rgba(66,166,255,.66);border-radius:12px;background:#0b2e49;color:#f1f9ff;box-shadow:inset 0 0 0 1px rgba(66,166,255,.08)";
    const label=document.createElement("label");
    label.htmlFor=ID;
    label.style.cssText="display:flex;gap:11px;align-items:center;font-weight:800;cursor:pointer;font-size:15px";
    const checkbox=document.createElement("input");
    checkbox.id=ID; checkbox.type="checkbox"; checkbox.checked=false;
    checkbox.style.cssText="width:21px;height:21px;accent-color:#268fff;flex:0 0 auto";
    const title=document.createElement("span"); title.textContent=TITLE;
    label.append(checkbox,title);
    const note=document.createElement("div");
    note.style.cssText="font-size:12px;color:#bedced;line-height:1.5;margin:7px 0 0 32px";
    note.textContent="Nur für diesen Tipp aktivieren. Preis bitte auf 1 Unit setzen. Begegnung/Quote/Auswahl bleiben bis zur normalen Freischaltung verborgen; keine offizielle Trefferwertung.";
    panel.append(label,note);
    anchor.parentElement.insertBefore(panel,anchor);
  }
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==="string"?input:(input&&input.url?String(input.url):"");
    const publish=url.includes("route=tip-historical-publish")||
      url.includes("jnj854h9aeg5iqny6prd3owgt4mpcd51");
    if(!publish||!isEnabled()) return originalFetch(input,init);
    const opts=init?{...init}:{};
    try{
      let obj=null,kind="";
      if(typeof opts.body==="string"){
        try{obj=JSON.parse(opts.body);kind="json"}catch(_){
          const p=new URLSearchParams(opts.body);
          if(p.has("tipp_id")){obj=p;kind="params"}
        }
      }else if(opts.body instanceof URLSearchParams){
        obj=new URLSearchParams(opts.body);kind="params";
      }
      if(obj){
        if(kind==="json"&&obj&&typeof obj==="object"&&obj.tipp_id&&
            String(obj.status||"").toLowerCase()!=="historisch"){
          obj.tipp_quelle=FLAG;
          const original=String(obj.analyse||"");
          if(!original.includes(TITLE))obj.analyse=TITLE+"\nNicht Bestandteil der offiziellen Trefferwertung.\n\n"+original;
          opts.body=JSON.stringify(obj);
        }else if(kind==="params"&&obj.has("tipp_id")&&
            String(obj.get("status")||"").toLowerCase()!=="historisch"){
          obj.set("tipp_quelle",FLAG);
          const original=String(obj.get("analyse")||"");
          if(!original.includes(TITLE))obj.set("analyse",TITLE+"\nNicht Bestandteil der offiziellen Trefferwertung.\n\n"+original);
          opts.body=obj.toString();
        }
      }
    }catch(e){console.error("Schulungstipp-Kennzeichnung konnte nicht gesetzt werden",e);}
    return originalFetch(input,opts);
  };
  const start=()=>{
    mount();
    const observer=new MutationObserver(mount);
    observer.observe(document.body,{subtree:true,childList:true});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
