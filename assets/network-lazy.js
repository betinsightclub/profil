/* BetInsight Netzwerk Lazy Loading · 2026-09-01-01
   Ziel: Netzwerkebenen 1–3 nur bei tatsächlichem Öffnen laden.
   Keine Unit-, Referral-, Zahlungs-, FIFO- oder Premium-Bestände werden geschrieben. */
(() => {
  "use strict";

  const LEVEL_WEBHOOK_URL = "https://hook.eu1.make.com/yli7txai951a1huc8707xovumwomi2wz";
  const levelState = new Map([1,2,3].map(level => [level,{loaded:false,loading:false,partners:[],summary:null}]));

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

  function styleOnce(){
    if(document.getElementById("bi-network-lazy-style")) return;
    const style=document.createElement("style");
    style.id="bi-network-lazy-style";
    style.textContent=`
      .bi-lazy-level-note{padding:16px;color:#83abc0;font-size:12px;line-height:1.5;text-align:center}
      .bi-lazy-level-note strong{color:#dff5ff}
      .bi-lazy-loading{opacity:.72;pointer-events:none}
      .bi-lazy-refresh{display:inline-flex;width:auto;min-height:34px;margin:10px 12px 12px;padding:7px 11px;border:1px solid rgba(22,156,255,.25);border-radius:10px;background:rgba(22,156,255,.10);color:#9fd8ff;font-size:10px;font-weight:900;cursor:pointer}
      .bi-lazy-refresh:hover{background:rgba(22,156,255,.16)}
    `;
    document.head.appendChild(style);
  }

  function privacyActive(){
    return document.getElementById("referralPrivacyButton")?.classList.contains("active") === true;
  }

  function applyPrivacy(card){
    if(!card || !privacyActive()) return;
    card.querySelectorAll(".level-metric-value,.level-body").forEach(el=>el.classList.add("private-value-hidden"));
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
      <div class="level-body"><div class="bi-lazy-level-note"><strong>Noch nicht geladen.</strong><br>Diese Ebene wird erst jetzt abgefragt, wenn du sie öffnest.</div></div>
    </article>`;
  }

  function ensureCards(reset=false){
    const list=document.getElementById("levelList");
    if(!list) return;
    if(reset || !list.querySelector("[data-bi-lazy-level]")){
      list.innerHTML=[1,2,3].map(placeholderCard).join("");
    }
    styleOnce();
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

  function renderLoadedLevel(level,partners,open=true){
    const state=levelState.get(level);
    const summary=partnerSummary(partners);
    state.loaded=true; state.loading=false; state.partners=partners; state.summary=summary;
    const card=document.getElementById("levelCard"+level);
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
      <div class="level-body"><button class="bi-lazy-refresh" type="button" onclick="event.stopPropagation();refreshSingleNetworkLevel(${level},this)">↻ Nur diese Ebene aktualisieren</button><div class="table-wrap"><table class="network-table"><thead><tr><th>BI-Nummer</th><th>Sponsor</th><th>Gekaufte Units</th><th>Verbrauchte Kauf-Units</th><th>Erwartete Referral Units</th><th>Freigegebene Referral Units</th></tr></thead><tbody>${loadedRows(partners)}</tbody></table></div></div>`;
    const top=document.getElementById("networkLevel"+level); if(top) top.textContent=fmt(summary.partnerCount);
    applyPrivacy(card);
    updateTotals();
  }

  function updateTotals(){
    const allLoaded=[1,2,3].every(level=>levelState.get(level).loaded);
    const totalEl=document.getElementById("referralAllUnits"), pendingEl=document.getElementById("referralPendingUnits");
    if(!totalEl||!pendingEl) return;
    if(!allLoaded){ totalEl.textContent="–"; pendingEl.textContent="–"; return; }
    const summaries=[1,2,3].map(level=>levelState.get(level).summary||{expected:0,released:0});
    const pending=summaries.reduce((s,x)=>s+x.expected,0);
    const released=summaries.reduce((s,x)=>s+x.released,0);
    totalEl.textContent=fmt(pending+released); pendingEl.textContent=fmt(pending);
  }

  async function requestLevel(level){
    const token=typeof window.getConfirmedDashboardToken === "function" ? window.getConfirmedDashboardToken() : "";
    if(!token) throw new Error("dashboard_token fehlt");
    const url=new URL(LEVEL_WEBHOOK_URL);
    url.searchParams.set("id",token);
    url.searchParams.set("level",String(level));
    const response=await fetch(url.toString(),{cache:"no-store",credentials:"omit"});
    if(!response.ok) throw new Error("HTTP "+response.status);
    const raw=String(await response.text()||"").replace(/^\uFEFF/,"").trim();
    if(!raw || raw.toLowerCase()==="accepted") return [];
    const data=JSON.parse(raw);
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.partners)) return data.partners;
    return [];
  }

  async function loadLevel(level,force=false,sourceButton=null){
    if(![1,2,3].includes(Number(level))) return;
    level=Number(level);
    const state=levelState.get(level), card=document.getElementById("levelCard"+level), status=document.getElementById("referralStatus");
    if(state.loading) return;
    if(state.loaded && !force){ renderLoadedLevel(level,state.partners,true); return; }
    state.loading=true;
    card?.classList.add("bi-lazy-loading");
    const old=sourceButton?.innerText;
    if(sourceButton){sourceButton.disabled=true;sourceButton.innerText="⏳ Lädt...";}
    if(status) status.textContent=`Ebene ${level} wird geladen. Die anderen Ebenen verursachen keine Make-Abfrage.`;
    try{
      const partners=await requestLevel(level);
      renderLoadedLevel(level,partners,true);
      if(status) status.textContent=`Ebene ${level} wurde geladen. Andere Ebenen werden erst beim Öffnen abgefragt.`;
    }catch(error){
      console.error("Netzwerk-Ebene konnte nicht geladen werden:",error);
      state.loading=false;
      card?.classList.remove("bi-lazy-loading");
      if(status) status.textContent=`Ebene ${level} konnte nicht geladen werden. Bitte versuche es erneut.`;
    }finally{
      if(sourceButton){sourceButton.disabled=false;sourceButton.innerText=old||"↻ Nur diese Ebene aktualisieren";}
    }
  }

  window.refreshSingleNetworkLevel=(level,button)=>loadLevel(level,true,button);

  window.toggleLevel=async level=>{
    level=Number(level);
    const card=document.getElementById("levelCard"+level), state=levelState.get(level);
    if(!card||!state) return;
    if(card.classList.contains("open")){card.classList.remove("open");const arrow=card.querySelector(".level-arrow");if(arrow)arrow.textContent="⌄";return;}
    if(!state.loaded){await loadLevel(level,false);return;}
    card.classList.add("open");const arrow=card.querySelector(".level-arrow");if(arrow)arrow.textContent="⌃";
  };

  window.refreshNetworkData=async (showFeedback=false,sourceButton=null)=>{
    ensureCards(false);
    const status=document.getElementById("referralStatus"),old=sourceButton?.innerText;
    const open=[1,2,3].find(level=>document.getElementById("levelCard"+level)?.classList.contains("open"));
    if(open){await loadLevel(open,true,sourceButton);return;}
    if(sourceButton&&showFeedback){sourceButton.disabled=true;sourceButton.innerText="✅ Bereit";setTimeout(()=>{sourceButton.disabled=false;sourceButton.innerText=old;},1200);}
    if(status) status.textContent="Tippe Ebene 1, 2 oder 3 an. Nur die ausgewählte Ebene wird geladen und verbraucht Make-Credits.";
  };

  window.prepareNetworkSection=()=>{
    const section=document.getElementById("referralSection");if(section)section.style.display="block";
    if(typeof window.setReferralLinks === "function") window.setReferralLinks({});
    [1,2,3].forEach(level=>{levelState.set(level,{loaded:false,loading:false,partners:[],summary:null});const el=document.getElementById("networkLevel"+level);if(el)el.textContent="–";});
    const all=document.getElementById("referralAllUnits"),pending=document.getElementById("referralPendingUnits");if(all)all.textContent="–";if(pending)pending.textContent="–";
    ensureCards(true);
    const status=document.getElementById("referralStatus");if(status)status.textContent="Sparmodus aktiv: Tippe eine Ebene an. Nur diese Ebene wird geladen.";
  };

  function install(){
    styleOnce();
    ensureCards(false);
    const section=document.getElementById("referralSection");
    if(section && getComputedStyle(section).display!=="none") window.prepareNetworkSection();
    const observer=new MutationObserver(()=>{
      if(section && getComputedStyle(section).display!=="none" && !document.getElementById("levelList")?.querySelector("[data-bi-lazy-level]")) window.prepareNetworkSection();
    });
    if(section) observer.observe(section,{attributes:true,attributeFilter:["style","class"]});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
