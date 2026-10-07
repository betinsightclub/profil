(function(){
  "use strict";
  const SESSION_KEY="betinsight_admin_session_v1";
  function readSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);
      if(!raw)return null;
      const s=JSON.parse(raw);
      return s&&s.token?s:null;
    }catch(_){return null}
  }
  function isMaster(s){
    const master=String(s?.master||"").trim().toUpperCase();
    const role=String(s?.role||"").trim().toUpperCase();
    return master==="JA"||role==="MASTER"||String(s?.adminId||"")==="ADM-001";
  }
  function addLink(){
    if(document.getElementById("memberPerformancePresentationLink"))return;
    const s=readSession();
    if(!isMaster(s))return;
    const host=document.querySelector(".top-actions");
    if(!host)return;
    const a=document.createElement("a");
    a.id="memberPerformancePresentationLink";
    a.className="link-button";
    a.href="/admin/performance/";
    a.textContent="📈 Workshop-Ansicht";
    a.title="Nutzer-Performance ohne andere Backoffice-Daten öffnen";
    host.insertBefore(a,host.firstChild);
  }
  function init(){
    addLink();
    let tries=0;
    const timer=setInterval(()=>{
      addLink();
      tries++;
      if(document.getElementById("memberPerformancePresentationLink")||tries>20)clearInterval(timer);
    },250);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();