/* BetInsight Netzwerk Cache-Sparmodus · 2026-09-02-02
   Ziel: Netzwerk-Gesamtübersicht sofort anzeigen, ohne dass zuerst eine Ebene aufgeklappt werden muss.
   Ebenen 1–3 werden einmal gemeinsam geladen, kurzzeitig im Browser-Session-Cache gehalten und danach ohne weitere Make-Abfrage geöffnet.
   Zusätzlich zeigt die obere Netzwerk-Karte die Gesamtzahl der Partner sowie Ebene 1–3.
   Keine Unit-, Referral-, Zahlungs-, FIFO- oder Premium-Bestände werden geschrieben. */
(() => {
  "use strict";

  const NETWORK_WEBHOOK_URL = "https://hook.eu1.make.com/yli7txai951a1huc8707xovumwomi2wz";
  const CACHE_PREFIX = "betinsight_network_cache_v2:";
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const AUTOLOAD_RETRY_MS = 180;
  const AUTOLOAD_MAX_TRIES = 35;
  const levelState = new Map([1,2,3].map(level => [level,{loaded:false,partners:[],summary:null}]));
  const networkState = {loaded:false,loading:false,token:"",autoLoadTimer:null,autoLoadTries:0};

  const num = value => {
    if (typeof window.safeNumber === "function") return window.safeNumber(value);
    if (value === undefined || value === null || value === "") return 0;
    const parsed = Number(String(value).replace(",","."));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const fmt = value => typeof window.formatNumber === "function"
    ? window.formatNumber(value)
    : new Intl.NumberFormat("de-DE",{maximumFractionDigits:2}).format(num(value));
  const esc = value => typeof window.escapeHtml === "function"
    ? window.escapeHtml(value)
    : String(value ?? "").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  const first = (obj,keys,fallback=0) => {
    for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    return fallback;
  };

  function getDashboardToken(){
    return typeof window.getConfirmedDashboardToken === "function"
      ? String(window.getConfirmedDashboardToken() || "").trim()
      : "";
  }

  function cacheKey(token){
    return CACHE_PREFIX + token;
  }

  function readCache(token){
    if(!token) return null;
    try{
      const raw=sessionStorage.getItem(cacheKey(token));
      if(!raw) return null;
      const cached=JSON.parse(raw);
      if(!cached || !Number.isFinite(Number(cached.savedAt)) || Date.now()-Number(cached.savedAt)>CACHE_TTL_MS){
        sessionStorage.removeItem(cacheKey(token));
        return null;
      }
      if(!Array.isArray(cached.level1) || !Array.isArray(cached.level2) || !Array.isArray(cached.level3)) return null;
      return {1:cached.level1,2:cached.level2,3:cached.level3};
    }catch(_){return null;}
  }

  function writeCache(token,levels){
    if(!token) return;
    try{
      sessionStorage.setItem(cacheKey(token),JSON.stringify({
        savedAt:Date.now(),
        level1:Array.isArray(levels?.[1])?levels[1]:[],
        level2:Array.isArray(levels?.[2])?levels[2]:[],
        level3:Array.isArray(levels?.[3])?levels[3]:[]
      }));
    }catch(_){}
  }

  function styleOnce(){
    if(document.getElementById("bi-network-lazy-style")) return;
    const style=document.createElement("style");
    style.id="bi-network-lazy-style";
    style.textContent=`
      .bi-lazy-level-note{padding:16px;color:#83abc0;font-size:12px;line-height:1.5;text-align:center}
      .bi-lazy-level-note strong{color:#dff5ff}
      .bi-lazy-loading{opacity:.72;pointer-events:none}
      #referralSection .bi-network-partner-total{display:flex;align-items:baseline;gap:6px;margin-top:7px;margin-bottom:4px;min-height:24px}
      #referralSection .bi-network-partner-total strong{color:#0edca6;font-size:22px;font-weight:950;line-height:1}
      #referralSection .bi-network-partner-total span{color:#83abc0;font-size:9px;font-weight:800;line-height:1.2}
      #referralSection .bi-network-partner-total.private-value-hidden strong,
      #referralSection .bi-network-partner-total.private-value-hidden span{filter:blur(6px);user-select:none}
    `;
    document.head.appendChild(style);
  }

  function ensurePartnerTotal(){
    const firstStat=document.querySelector("#referralSection .referral-overview .referral-stat:first-child");
    const levels=firstStat?.querySelector(".network-levels");
    if(!firstStat || !levels) return null;
    let total=firstStat.querySelector("#networkPartnerTotal");
    if(!total){
      total=document.createElement("div");
      total.id="networkPartnerTotal";
      total.className="bi-network-partner-total";
      total.innerHTML='<strong id="networkPartnerTotalValue">–</strong><span>Partner gesamt</span>';
      firstStat.insertBefore(total,levels);
    }
    return total;
  }

  function privacyActive(){
    return document.getElementById("referralPrivacyButton")?.classList.contains("active") === true;
  }

  function applyPrivacy(card){
    if(!card || !privacyActive()) return;
    card.querySelectorAll(".level-metric-value,.level-body").forEach(el=>el.classList.add("private-value-hidden"));
  }

  function applyOverviewPrivacy(){
    const total=ensurePartnerTotal();
    if(!total) return;
    total.classList.toggle("private-value-hidden",privacyActive());
  }

  function placeholderCard(level){
    const title=level===1?"Ebene 1 – direkte Partner":"Ebene "+level;
    return `<article class="level-card" id="levelCard${level}" data-bi-lazy-level="${level}">
      <div class="level-head" onclick="toggleLevel(${level})">
        <div class="level-number">${level}</div>
        <div class="level-name">${title}</div>
        <div class="level-metric"><div class="level-metric-label">Partner</div><div class="level-metric-value">–</div></div>
        <div class="level-metric"><div class="level-metric-label">Gekauft</div><div class="level-metric-value">–</div></div>
        <div class="level-metric"><div class="level-metric-label">Erwartet</div><div class="level-metric-value">–</div></div>
        <div class="level-metric"><div class="level-metric-label">Freigegeben</div><div class="level-metric-value">–</div></div>
        <div class="level-arrow">⌄</div>
      </div>
      <div class="level-body"><div class="bi-lazy-level-note"><strong>Netzwerkdaten werden geladen.</strong><br>Danach stehen alle Ebenen ohne weitere Abfrage bereit.</div></div>
    </article>`;
  }

  function ensureCards(reset=false){
    const list=document.getElementById("levelList");
    if(!list) return;
    if(reset || !list.querySelector("[data-bi-lazy-level]")) list.innerHTML=[1,2,3].map(placeholderCard).join("");
    styleOnce();
    ensurePartnerTotal();
  }

  function resetState(){
    networkState.loaded=false;
    networkState.loading=false;
    networkState.token="";
    [1,2,3].forEach(level=>{
      levelState.set(level,{loaded:false,partners:[],summary:null});
      const el=document.getElementById("networkLevel"+level);
      if(el) el.textContent="–";
    });
    const total=document.getElementById("networkPartnerTotalValue");
    const all=document.getElementById("referralAllUnits");
    const pending=document.getElementById("referralPendingUnits");
    if(total) total.textContent="–";
    if(all) all.textContent="–";
    if(pending) pending.textContent="–";
  }

  function partnerSummary(partners){
    return partners.reduce((sum,p)=>{
      sum.purchased += num(first(p,["gekaufte_units","gekaufte_units_rest","35"],0));
      sum.consumed += num(first(p,["verbrauchte_kauf_units","verbrauchte_units","consumed_units","34"],0));
      sum.expected += num(first(p,["erwartete_referral_units","ref_erwartet","expected_units"],0));
      sum.released += num(first(p,["freigegebene_referral_units","ref_verfuegbar","released_units","available_units"],0));
      return sum;
    },{partnerCount:partners.length,purchased:0,consumed:0,expected:0,released:0});
  }

  function loadedRows(partners){
    if(!partners.length) return `<tr><td colspan="6" class="empty-row">In dieser Ebene sind aktuell keine Partner vorhanden.</td></tr>`;
    return partners.map(p=>{
      const bi=first(p,["bi_nummer","bi_number","ref_code","user_id","7","6"],"-");
      const sponsor=first(p,["sponsor","sponsor_ref","sponsor_code","sponsor_ref_code","8","9"],"-");
      const purchased=first(p,["gekaufte_units","gekaufte_units_rest","purchased_units","35"],0);
      const consumed=first(p,["verbrauchte_kauf_units","verbrauchte_units","consumed_units","34"],0);
      const expected=first(p,["erwartete_referral_units","ref_erwartet","expected_units"],0);
      const released=first(p,["freigegebene_referral_units","ref_verfuegbar","released_units","available_units"],0);
      return `<tr><td class="partner-id">${esc(bi)}</td><td>${esc(sponsor)}</td><td>${fmt(purchased)}</td><td>${fmt(consumed)}</td><td>${fmt(expected)}</td><td>${fmt(released)}</td></tr>`;
    }).join("");
  }

  function renderLoadedLevel(level,partners,open=false){
    const state=levelState.get(level), summary=partnerSummary(partners), card=document.getElementById("levelCard"+level);
    state.loaded=true; state.partners=partners; state.summary=summary;
    if(!card) return;
    const title=level===1?"Ebene 1 – direkte Partner":"Ebene "+level;
    card.className="level-card"+(open?" open":"");
    card.innerHTML=`<div class="level-head" onclick="toggleLevel(${level})">
      <div class="level-number">${level}</div><div class="level-name">${title}</div>
      <div class="level-metric"><div class="level-metric-label">Partner</div><div class="level-metric-value">${fmt(summary.partnerCount)}</div></div>
      <div class="level-metric"><div class="level-metric-label">Gekauft</div><div class="level-metric-value">${fmt(summary.purchased)} Units</div></div>
      <div class="level-metric"><div class="level-metric-label">Erwartet</div><div class="level-metric-value">${fmt(summary.expected)}</div></div>
      <div class="level-metric"><div class="level-metric-label">Freigegeben</div><div class="level-metric-value">${fmt(summary.released)}</div></div>
      <div class="level-arrow">${open?"⌃":"⌄"}</div></div>
      <div class="level-body"><div class="table-wrap"><table class="network-table"><thead><tr><th>BI-Nummer</th><th>Sponsor</th><th>Gekaufte Units</th><th>Verbrauchte Kauf-Units</th><th>Erwartete Referral Units</th><th>Freigegebene Referral Units</th></tr></thead><tbody>${loadedRows(partners)}</tbody></table></div></div>`;
    const top=document.getElementById("networkLevel"+level);
    if(top) top.textContent=fmt(summary.partnerCount);
    applyPrivacy(card);
  }

  function updateTotals(){
    const totalEl=document.getElementById("referralAllUnits"), pendingEl=document.getElementById("referralPendingUnits"), partnerTotalEl=document.getElementById("networkPartnerTotalValue");
    if(!networkState.loaded){
      if(totalEl) totalEl.textContent="–";
      if(pendingEl) pendingEl.textContent="–";
      if(partnerTotalEl) partnerTotalEl.textContent="–";
      return;
    }
    const summaries=[1,2,3].map(level=>levelState.get(level).summary||{partnerCount:0,expected:0,released:0});
    const partnerTotal=summaries.reduce((s,x)=>s+x.partnerCount,0);
    const pending=summaries.reduce((s,x)=>s+x.expected,0);
    const released=summaries.reduce((s,x)=>s+x.released,0);
    if(partnerTotalEl) partnerTotalEl.textContent=fmt(partnerTotal);
    if(totalEl) totalEl.textContent=fmt(pending+released);
    if(pendingEl) pendingEl.textContent=fmt(pending);
    applyOverviewPrivacy();
  }

  function renderAll(levels,openLevel=0,token=""){
    ensureCards(false);
    [1,2,3].forEach(level=>renderLoadedLevel(level,Array.isArray(levels[level])?levels[level]:[],level===Number(openLevel)));
    networkState.loaded=true;
    networkState.loading=false;
    networkState.token=String(token||networkState.token||getDashboardToken()).trim();
    updateTotals();
  }

  function restoreCachedOverview(token){
    const cached=readCache(token);
    if(!cached) return false;
    renderAll(cached,0,token);
    return true;
  }

  async function requestAllLevels(token){
    if(!token) throw new Error("dashboard_token fehlt");
    const url=new URL(NETWORK_WEBHOOK_URL);
    url.searchParams.set("id",token);
    url.searchParams.set("level","1");
    const response=await fetch(url.toString(),{cache:"no-store",credentials:"omit"});
    if(!response.ok) throw new Error("HTTP "+response.status);
    const raw=String(await response.text()||"").replace(/^\uFEFF/,"").trim();
    if(!raw || raw.toLowerCase()==="accepted") throw new Error("Leere Netzwerk-Antwort");
    const data=JSON.parse(raw);
    if(Array.isArray(data?.level1) && Array.isArray(data?.level2) && Array.isArray(data?.level3)) return {1:data.level1,2:data.level2,3:data.level3};
    throw new Error("Netzwerk-Antwort ist unvollständig");
  }

  async function loadAll(openLevel=0,sourceButton=null){
    if(networkState.loading) return;
    const token=getDashboardToken();
    if(!token) throw new Error("dashboard_token fehlt");

    if(networkState.loaded && networkState.token===token){
      if(openLevel){
        const card=document.getElementById("levelCard"+openLevel);
        card?.classList.add("open");
        const arrow=card?.querySelector(".level-arrow");
        if(arrow) arrow.textContent="⌃";
      }
      return;
    }

    if(restoreCachedOverview(token)){
      if(openLevel){
        const card=document.getElementById("levelCard"+openLevel);
        card?.classList.add("open");
        const arrow=card?.querySelector(".level-arrow");
        if(arrow) arrow.textContent="⌃";
      }
      return;
    }

    networkState.loading=true;
    networkState.token=token;
    document.getElementById("levelList")?.classList.add("bi-lazy-loading");
    const status=document.getElementById("referralStatus"), old=sourceButton?.innerText;
    if(sourceButton){sourceButton.disabled=true;sourceButton.innerText="⏳ Netzwerk wird geladen...";}
    if(status) status.textContent="Netzwerkübersicht wird geladen.";
    try{
      const levels=await requestAllLevels(token);
      writeCache(token,levels);
      renderAll(levels,openLevel,token);
      if(status) status.textContent="Netzwerkübersicht ist aktuell.";
      if(sourceButton) sourceButton.innerText="✅ Netzwerk geladen";
    }catch(error){
      console.error("Netzwerk konnte nicht geladen werden:",error);
      networkState.loading=false;
      if(status) status.textContent="Die Netzwerkdaten konnten nicht geladen werden. Bitte versuche es erneut.";
      if(sourceButton) sourceButton.innerText="❌ Fehler";
    }finally{
      document.getElementById("levelList")?.classList.remove("bi-lazy-loading");
      if(sourceButton) setTimeout(()=>{sourceButton.disabled=false;sourceButton.innerText=old||"🔄 Netzwerk laden";},1600);
    }
  }

  function scheduleOverviewLoad(resetTries=true){
    if(resetTries) networkState.autoLoadTries=0;
    if(networkState.autoLoadTimer) clearTimeout(networkState.autoLoadTimer);
    const attempt=()=>{
      networkState.autoLoadTimer=null;
      if(networkState.loaded || networkState.loading) return;
      const token=getDashboardToken();
      if(token){
        if(restoreCachedOverview(token)) return;
        loadAll(0).catch(error=>console.warn("Netzwerkübersicht konnte noch nicht automatisch geladen werden:",error));
        return;
      }
      networkState.autoLoadTries+=1;
      if(networkState.autoLoadTries<AUTOLOAD_MAX_TRIES) networkState.autoLoadTimer=setTimeout(attempt,AUTOLOAD_RETRY_MS);
    };
    networkState.autoLoadTimer=setTimeout(attempt,60);
  }

  window.toggleLevel=async level=>{
    level=Number(level);
    const card=document.getElementById("levelCard"+level), state=levelState.get(level);
    if(!card||!state) return;
    if(card.classList.contains("open")){
      card.classList.remove("open");
      const arrow=card.querySelector(".level-arrow");
      if(arrow) arrow.textContent="⌄";
      return;
    }
    if(!networkState.loaded){await loadAll(level);return;}
    card.classList.add("open");
    const arrow=card.querySelector(".level-arrow");
    if(arrow) arrow.textContent="⌃";
  };

  window.refreshNetworkData=async (showFeedback=false,sourceButton=null)=>{
    ensureCards(false);
    const status=document.getElementById("referralStatus"), old=sourceButton?.innerText;
    const token=getDashboardToken();
    if(networkState.loaded && (!token || networkState.token===token)){
      if(status) status.textContent="Netzwerkübersicht ist bereits geladen.";
      if(sourceButton&&showFeedback){sourceButton.disabled=true;sourceButton.innerText="✅ Bereits geladen";setTimeout(()=>{sourceButton.disabled=false;sourceButton.innerText=old;},1200);}
      return;
    }
    await loadAll(0,sourceButton);
  };

  window.prepareNetworkSection=()=>{
    const section=document.getElementById("referralSection");
    if(section) section.style.display="block";
    if(typeof window.setReferralLinks === "function") window.setReferralLinks({});
    ensureCards(true);
    ensurePartnerTotal();

    const token=getDashboardToken();
    if(networkState.loaded && token && networkState.token===token){
      updateTotals();
      return;
    }

    resetState();
    if(token && restoreCachedOverview(token)) return;

    const status=document.getElementById("referralStatus");
    if(status) status.textContent="Netzwerkübersicht wird geladen.";
    scheduleOverviewLoad(true);
  };

  function install(){
    styleOnce();
    ensureCards(false);
    ensurePartnerTotal();
    const section=document.getElementById("referralSection");
    if(section && getComputedStyle(section).display!=="none") window.prepareNetworkSection();
    else scheduleOverviewLoad(true);

    const observer=new MutationObserver(()=>{
      if(section && getComputedStyle(section).display!=="none" && !document.getElementById("levelList")?.querySelector("[data-bi-lazy-level]")) window.prepareNetworkSection();
      applyOverviewPrivacy();
    });
    if(section) observer.observe(section,{attributes:true,attributeFilter:["style","class"]});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
