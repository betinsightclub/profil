(()=>{"use strict";
const storageKey="betinsight_admin_session_v1";
let session;try{session=JSON.parse(sessionStorage.getItem(storageKey)||"null")}catch{return}
const id=String(session?.adminId||"");
if(id!=="ADM-003"&&id!=="ADM-001")return;
function addScoreTestLink(){
  const actions=document.querySelector(".top-actions");
  if(!actions||document.getElementById("frankScoreTestQuickLink"))return;
  const link=document.createElement("a");
  link.id="frankScoreTestQuickLink";
  link.href="/admin/test-ergebnisse/";
  link.textContent="🎯 Bundesliga-Ergebnistest · Ergebnisse eingeben";
  link.setAttribute("aria-label","Privaten Bundesliga-Ergebnistest öffnen");
  link.style.cssText="display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:11px 16px;margin:5px;border-radius:10px;border:1px solid #62bea6;background:#073d3e;color:#eefff8;text-decoration:none;font-weight:800;font-size:13px;white-space:normal";
  actions.appendChild(link);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addScoreTestLink,{once:true});
else addScoreTestLink();
})();
