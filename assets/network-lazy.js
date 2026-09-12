/* BetInsight Netzwerk Cache-Sparmodus · 2026-09-12-01 STUFE-1 LAZY
   Stufe 1: Netzwerkdaten werden nicht mehr automatisch bei jedem Profilaufruf geladen.
   Make wird erst aufgerufen, wenn der Nutzer den Netzwerkbereich wirklich erreicht,
   eine Ebene oeffnet oder einen ausdruecklichen Netzwerk-Refresh ausloest.
   Ebenen 1–3 werden dann einmal gemeinsam geladen und 5 Minuten lokal gecacht.
   Keine Unit-, Referral-, Zahlungs-, FIFO- oder Premium-Bestaende werden geschrieben. */
(() => {
  "use strict";

  const NETWORK_WEBHOOK_URL = "https://hook.eu1.make.com/yli7txai951a1huc8707xovumwomi2wz";
  const CACHE_PREFIX = "betinsight_network_cache_v6:";
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const TOKEN_RETRY_MS = 250;
  const TOKEN_RETRY_MAX = 40;
  const levelState = new Map([1,2,3].map(level => [level,{loaded:false,partners:[],summary:null}]));
  const networkState = {loaded:false,loading:false,token:"",wanted:false,retryTimer:null,retryCount:0};

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
  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||"").trim());

  function getDashboardToken(){
    try{
      if(typeof window.getConfirmedDashboardToken === "function"){
        const confirmed=String(window.getConfirmedDashboardToken()||"").trim();
        if(isUuid(confirmed)) return confirmed;
      }
    }catch(_){}
    try{
      const session=String(window.BetInsightSession?.getDashboardUuid?.()||"").trim();
      if(isUuid(session)) return session;
    }catch(_){}
    try{
      const stored=String(localStorage.getItem("betinsight_dashboard_token")||"").trim();
      if(isUuid(stored)) return stored;
    }catch(_){}
    return "";
  }

  function cacheKey(token){ return CACHE_PREFIX + token; }

  function readCache(token){
    if(!token) return null;
    try{
      const raw=localStorage.getItem(cacheKey(token));
      if(!raw) return null;
      const cached=JSON.parse(raw);
      if(!cached || !Number.isFinite(Number(cached.savedAt)) || Date.now()-Number(cached.savedAt)>CACHE_TTL_MS){
        localStorage.removeItem(cacheKey(token));
        return null;
      }
      if(!Array.isArray(cached.level1) || !Array.isArray(cached.level2) || !Array.isArray(cached.level3)) return null;
      return {1:cached.level1,2:cached.level2,3:cached.level3};
    }catch(_){return null;}
  }

  function writeCache(token,levels){
    if(!token) return;
    try{
      localStorage.setItem(cacheKey(token),JSON.stringify({
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

  function setStatus(text){
    const status=document.getElementById("referralStatus");
    if(status) status.textContent=text||"";
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
      <div class="level-body"><div class="bi-lazy-level-note"><strong>Netzwerkdaten werden bei Bedarf geladen.</strong><br>Beim Öffnen werden alle drei Ebenen gemeinsam geladen.</div></div>
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
      sum.totalConsumed += num(first(p,["gesamt_verbrauchte_units","verbrauchte_units","34"],0));
      sum.consumed += num(first(p,["verbrauchte_kauf_units","consumed_units","81"],0));
      sum.expected += num(first(p,["erwartete_referral_units","ref_erwartet","expected_units"],0));
      sum.released += num(first(p,["freigegebene_referral_units","ref_verfuegbar","released_units","available_units"],0));
      return sum;
    },{partnerCount:partners.length,purchased:0,totalConsumed:0,consumed:0,expected:0,released:0});
  }

  function loadedRows(partners){
    if(!partners.length) return `<tr><td colspan="7" class="empty-row">In dieser Ebene sind aktuell keine Partner vorhanden.</td></tr>`;
    return partners.map(p=>{
      const bi=first(p,["bi_nummer","bi_number","ref_code","user_id","7","6"],"-");
      const sponsor=first(p,["sponsor","sponsor_ref","sponsor_code","sponsor_ref_code","8","9"],"-");
      const purchased=first(p,["gekaufte_units","gekaufte_units_rest","purchased_units","35"],0);
      const totalConsumed=first(p,["gesamt_verbrauchte_units","verbrauchte_units","34"],0);
      const consumed=first(p,["verbrauchte_kauf_units","consumed_units","81"],0);
      const expected=first(p,["erwartete_referral_units","ref_erwartet","expected_units"],0);
      const released=first(p,["freigegebene_referral_units","ref_verfuegbar","released_units","available_units"],0);
      return `<tr><td class="partner-id">${esc(bi)}</td><td>${esc(sponsor)}</td><td>${fmt(purchased)}</td><td>${fmt(totalConsumed)}</td><td>${fmt(consumed)}</td><td>${fmt(expected)}</td><td>${fmt(released)}</td></tr>`;
    }).join("");
  }

  function renderLoadedLevel(level,partners,open=false){
    const state=levelState.get(level), summary=partnerSummary(partners), card=document.getElementById("levelCard"+level);
    state.loaded=true;
    state.partners=partners;
    state.summary=summary;
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
      <div class="level-body"><div class="table-wrap"><table class="network-table"><thead><tr><th>BI-Nummer</th><th>Sponsor</th><th>Gekaufte Units</th><th>Gesamt verbrauchte Units</th><th>Verbrauchte Kauf-Units</th><th>Erwartete Referral Units</th><th>Freigegebene Referral Units</th></tr></thead><tbody>${loadedRows(partners)}</tbody></table></div></div>`;
    const top=document.getElementById("networkLevel"+level);
    if(top) top.textContent=fmt(summary.partnerCount);
    applyPrivacy(card);
  }

  function updateTotals(){
    const totalEl=document.getElementById("referralAllUnits");
    const pendingEl=document.getElementById("referralPendingUnits");
    const partnerTotalEl=document.getElementById("networkPartnerTotalValue");
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
    setStatus("Netzwerkübersicht aus dem 5-Minuten-Zwischenspeicher geladen.");
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
    const old=sourceButton?.innerText;
    if(sourceButton){sourceButton.disabled=true;sourceButton.innerText="⏳ Netzwerk wird geladen...";}
    setStatus("Netzwerkübersicht wird geladen.");
    try{
      const levels=await requestAllLevels(token);
      writeCache(token,levels);
      renderAll(levels,openLevel,token);
      setStatus("Netzwerkübersicht ist aktuell · 5 Minuten zwischengespeichert.");
      if(sourceButton) sourceButton.innerText="✅ Netzwerk geladen";
    }catch(error){
      console.error("Netzwerk konnte nicht geladen werden:",error);
      networkState.loading=false;
      setStatus("Die Netzwerkdaten konnten nicht geladen werden. Bitte versuche es erneut.");
      if(sourceButton) sourceButton.innerText="❌ Fehler";
      throw error;
    }finally{
      document.getElementById("levelList")?.classList.remove("bi-lazy-loading");
      if(sourceButton) setTimeout(()=>{sourceButton.disabled=false;sourceButton.innerText=old||"🔄 Netzwerk laden";},1600);
    }
  }

  function clearRetry(){
    if(networkState.retryTimer){
      clearTimeout(networkState.retryTimer);
      networkState.retryTimer=null;
    }
  }

  function requestWhenRelevant(openLevel=0){
    networkState.wanted=true;
    clearRetry();
    const attempt=()=>{
      if(networkState.loaded || networkState.loading) return;
      const token=getDashboardToken();
      if(token){
        networkState.retryCount=0;
        if(restoreCachedOverview(token)){
          if(openLevel) window.toggleLevel(openLevel);
          return;
        }
        loadAll(openLevel).catch(()=>{});
        return;
      }
      networkState.retryCount+=1;
      if(networkState.retryCount<TOKEN_RETRY_MAX && networkState.wanted){
        networkState.retryTimer=setTimeout(attempt,TOKEN_RETRY_MS);
      }else{
        networkState.retryCount=0;
        setStatus("Netzwerkdaten stehen bereit, sobald der Profilzugang vollständig geladen ist.");
      }
    };
    attempt();
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
    if(!networkState.loaded){
      requestWhenRelevant(level);
      return;
    }
    card.classList.add("open");
    const arrow=card.querySelector(".level-arrow");
    if(arrow) arrow.textContent="⌃";
  };

  window.refreshNetworkData=async (showFeedback=false,sourceButton=null)=>{
    ensureCards(false);
    const old=sourceButton?.innerText;
    const token=getDashboardToken();
    if(networkState.loaded && token && networkState.token===token){
      setStatus("Netzwerkübersicht ist bereits geladen.");
      if(sourceButton&&showFeedback){sourceButton.disabled=true;sourceButton.innerText="✅ Bereits geladen";setTimeout(()=>{sourceButton.disabled=false;sourceButton.innerText=old;},1200);}
      return;
    }
    requestWhenRelevant(0);
  };

  window.prepareNetworkSection=()=>{
    const section=document.getElementById("referralSection");
    if(section) section.style.display="block";
    ensureCards(false);
    ensurePartnerTotal();

    const token=getDashboardToken();
    if(networkState.loaded && token && networkState.token===token){
      const levels={
        1:levelState.get(1)?.partners||[],
        2:levelState.get(2)?.partners||[],
        3:levelState.get(3)?.partners||[]
      };
      renderAll(levels,0,token);
      return;
    }

    if(token && restoreCachedOverview(token)) return;
    setStatus("Netzwerkdaten werden erst beim Öffnen dieses Bereichs geladen.");
  };

  function isNetworkHash(){
    return String(location.hash||"").replace(/^#/,"").trim().toLowerCase()==="netzwerk";
  }

  function install(){
    styleOnce();
    ensureCards(false);
    ensurePartnerTotal();
    const section=document.getElementById("referralSection");
    const token=getDashboardToken();
    if(token) restoreCachedOverview(token);
    if(!networkState.loaded) setStatus("Netzwerkdaten werden erst beim Öffnen dieses Bereichs geladen.");

    if(section && "IntersectionObserver" in window){
      const observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
          observer.disconnect();
          requestWhenRelevant(0);
        }
      },{rootMargin:"160px 0px",threshold:0.01});
      observer.observe(section);
    }

    if(isNetworkHash()) requestWhenRelevant(0);
    window.addEventListener("hashchange",()=>{ if(isNetworkHash()) requestWhenRelevant(0); });

    const privacyObserver=new MutationObserver(()=>applyOverviewPrivacy());
    if(section) privacyObserver.observe(section,{attributes:true,attributeFilter:["style","class"]});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
