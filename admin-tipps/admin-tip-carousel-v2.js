/* BetInsight Admin-Tippkarten v2 · manuelle Navigation · geschützte Tippdetails */
(() => {
  "use strict";
  const KEY = "betinsight_admin_session_v1";
  const API = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-tip-ticker";
  const ID = "bi-admin-tip-carousel";
  let tips = [], selectedId = "", expanded = true, loadState = "loading", warning = "";
  let refreshInterval = 0, pruneInterval = 0;

  function session() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      return s && s.token && Number(s.expiresMs) > Date.now() ? s : null;
    } catch (_) { return null; }
  }
  async function sessionHash(token) {
    const bytes = new TextEncoder().encode(token);
    const data = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(data), v => v.toString(16).padStart(2, "0")).join("");
  }
  function headingTarget() {
    const h = Array.from(document.querySelectorAll("h1,h2,h3"))
      .find(x => /Odds-fähigen Tipp vorbereiten/i.test(x.textContent || ""));
    if (!h) return null;
    const wrapper = h.closest("section,article,.card,.panel") || h.parentElement;
    return wrapper && wrapper.parentNode ? wrapper : null;
  }
  function addStyles() {
    if (document.getElementById("bi-admin-tip-carousel-style")) return;
    const st = document.createElement("style");
    st.id = "bi-admin-tip-carousel-style";
    st.textContent = [
      "#bi-admin-tip-carousel{box-sizing:border-box;width:min(100%,1020px);margin:16px auto 20px;border-radius:20px;border:1px solid rgba(66,195,235,.31);background:linear-gradient(150deg,#0c3146,#061b2a 75%);box-shadow:0 12px 30px rgba(0,0,0,.24);color:#f1f9ff;font:14px/1.5 Arial,Helvetica,sans-serif;text-align:left;overflow:hidden}",
      "#bi-admin-tip-carousel *{box-sizing:border-box}",
      "#bi-admin-tip-carousel button{font:inherit;cursor:pointer}",
      "#bi-admin-tip-carousel button:focus-visible{outline:3px solid #ffd37e;outline-offset:3px}",
      "#bi-admin-tip-carousel .btc-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.12)}",
      "#bi-admin-tip-carousel .btc-eyebrow{display:block;color:#71d7f2;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}",
      "#bi-admin-tip-carousel h3{margin:3px 0 0;color:#fff;font-size:19px;line-height:1.25;font-weight:800}",
      "#bi-admin-tip-carousel .btc-headright{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
      "#bi-admin-tip-carousel .btc-count{border:1px solid rgba(101,225,179,.25);border-radius:99px;padding:5px 11px;background:rgba(62,164,130,.10);color:#90f6cb;font-size:12px;font-weight:800}",
      "#bi-admin-tip-carousel .btc-updated{font-size:11px;color:#aac7d4}",
      "#bi-admin-tip-carousel .btc-main{padding:17px 20px 14px}",
      "#bi-admin-tip-carousel .btc-message{color:#a9cadb;padding:20px 8px;text-align:center}",
      "#bi-admin-tip-carousel .btc-card{border:1px solid rgba(110,178,213,.24);background:rgba(2,20,33,.58);border-radius:16px;overflow:hidden}",
      "#bi-admin-tip-carousel .btc-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:15px 16px 0}",
      "#bi-admin-tip-carousel .btc-tipster{display:inline-flex;align-items:center;border-radius:99px;padding:4px 11px;font-size:12px;font-weight:800;border:1px solid rgba(130,204,245,.32);color:#95daff;background:rgba(29,106,147,.22)}",
      "#bi-admin-tip-carousel .btc-tipster[data-group=frank]{color:#72efbd;border-color:rgba(97,227,168,.45);background:rgba(25,122,89,.2)}",
      "#bi-admin-tip-carousel .btc-tipster[data-group=martin]{color:#9ad3ff;border-color:rgba(130,197,255,.45);background:rgba(42,100,164,.22)}",
      "#bi-admin-tip-carousel .btc-tipster[data-group=system]{color:#ffdf9a;border-color:rgba(255,211,126,.42);background:rgba(125,91,33,.2)}",
      "#bi-admin-tip-carousel .btc-when{color:#b7d6e4;font-size:12px}",
      "#bi-admin-tip-carousel .btc-game{padding:9px 16px 4px;font-weight:800;font-size:clamp(16px,2.6vw,21px);line-height:1.32;overflow-wrap:anywhere}",
      "#bi-admin-tip-carousel .btc-league{padding:0 16px 14px;color:#a4c7d8;font-size:12px}",
      "#bi-admin-tip-carousel .btc-expander{display:flex;align-items:center;justify-content:space-between;width:100%;padding:11px 16px;border:0;border-top:1px solid rgba(255,255,255,.09);background:rgba(20,91,123,.25);color:#aeeaff;text-align:left;font-weight:800}",
      "#bi-admin-tip-carousel .btc-expander:hover{background:rgba(26,120,155,.32)}",
      "#bi-admin-tip-carousel .btc-detail{padding:14px 16px 17px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}",
      "#bi-admin-tip-carousel .btc-detail[hidden]{display:none}",
      "#bi-admin-tip-carousel .btc-cell{padding:12px 13px;border-radius:11px;border:1px solid rgba(125,183,213,.16);background:rgba(6,43,65,.7);min-width:0}",
      "#bi-admin-tip-carousel .btc-cell.full{grid-column:1/-1;border-color:rgba(79,221,175,.24);background:rgba(25,93,78,.17)}",
      "#bi-admin-tip-carousel .btc-lbl{display:block;color:#93b9ca;font-size:11px;font-weight:700;margin-bottom:5px}",
      "#bi-admin-tip-carousel .btc-val{display:block;color:#f0f8ff;font-weight:800;font-size:15px;overflow-wrap:anywhere;white-space:pre-wrap}",
      "#bi-admin-tip-carousel .btc-cell.full .btc-val{color:#a5f2c9;font-size:17px}",
      "#bi-admin-tip-carousel .btc-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 3px 1px}",
      "#bi-admin-tip-carousel .btc-counter{font-weight:900;color:#eaf7ff;min-width:75px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums}",
      "#bi-admin-tip-carousel .btc-nav{min-width:46px;min-height:42px;border:1px solid rgba(76,190,240,.4);border-radius:12px;background:#12445f;color:white;font-size:22px;font-weight:800;transition:background .16s ease}",
      "#bi-admin-tip-carousel .btc-nav:hover:not(:disabled){background:#176e98}",
      "#bi-admin-tip-carousel .btc-nav:disabled{opacity:.3;cursor:default}",
      "#bi-admin-tip-carousel .btc-dots{display:flex;justify-content:center;align-items:center;gap:7px;flex:1;flex-wrap:wrap}",
      "#bi-admin-tip-carousel .btc-dot{height:9px;width:9px;min-height:9px;border-radius:50%;padding:0;border:1px solid #84cde8;background:rgba(94,164,194,.15)}",
      "#bi-admin-tip-carousel .btc-dot[aria-current=true]{background:#51dcae;border-color:#51dcae;width:24px;border-radius:9px}",
      "#bi-admin-tip-carousel .btc-foot{border-top:1px solid rgba(255,255,255,.08);padding:9px 20px 12px;color:#809eaf;font-size:11px}",
      "@media(max-width:560px){#bi-admin-tip-carousel{border-radius:16px}#bi-admin-tip-carousel .btc-head{padding:13px 14px}#bi-admin-tip-carousel h3{font-size:17px}#bi-admin-tip-carousel .btc-main{padding:13px 12px}#bi-admin-tip-carousel .btc-detail{grid-template-columns:1fr}#bi-admin-tip-carousel .btc-cell.full{grid-column:1}#bi-admin-tip-carousel .btc-foot{padding:9px 14px 11px}}",
      "@media(prefers-reduced-motion:reduce){#bi-admin-tip-carousel .btc-nav{transition:none}}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function mount() {
    const target = headingTarget();
    if (!target) return false;
    let root = document.getElementById(ID);
    if (!root) {
      root = document.createElement("section");
      root.id = ID;
      root.setAttribute("aria-label", "Aktuelle veröffentlichte Tipps im Adminbereich");
      root.innerHTML =
        '<header class="btc-head"><div><span class="btc-eyebrow">Admin-Tippübersicht</span><h3>⚽ Aktuelle Tipps im System</h3></div>' +
        '<div class="btc-headright"><span class="btc-updated">Aktualisierung jede Minute</span><span class="btc-count" id="btc-total">–</span></div></header>' +
        '<div class="btc-main"><div id="btc-stage"></div>' +
        '<nav class="btc-controls" aria-label="Zwischen Tipps wechseln">' +
        '<button type="button" class="btc-nav" id="btc-prev" aria-label="Vorheriger Tipp">‹</button>' +
        '<div class="btc-counter" id="btc-position" aria-live="polite"></div>' +
        '<div class="btc-dots" id="btc-dots"></div>' +
        '<button type="button" class="btc-nav" id="btc-next" aria-label="Nächster Tipp">›</button></nav></div>' +
        '<footer class="btc-foot">Nur im geschützten Admin-Tippterminal · Anpfiff in deutscher Zeit</footer>';
      root.querySelector("#btc-prev").addEventListener("click", () => move(-1));
      root.querySelector("#btc-next").addEventListener("click", () => move(1));
    }
    if (root.parentNode !== target.parentNode || root.nextElementSibling !== target)
      target.parentNode.insertBefore(root, target);
    addStyles();
    render();
    return true;
  }
  function e(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }
  function formatNumber(value, places) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "–";
    return n.toLocaleString("de-DE", {maximumFractionDigits:places});
  }
  function getItems() {
    const s = session();
    if (!s) return [];
    return tips.filter(t => Number(t.kickoff_ms) > Date.now());
  }
  function choose(id, openDetails) {
    selectedId = id;
    expanded = openDetails;
    render();
  }
  function move(delta) {
    const current = getItems();
    if (current.length < 2) return;
    let index = current.findIndex(t => t.id === selectedId);
    if (index < 0) index = 0;
    const nextIndex = (index + delta + current.length) % current.length;
    choose(current[nextIndex].id, true);
  }
  function addCell(parent, label, value, full) {
    const cell = e("div", "btc-cell" + (full ? " full" : ""));
    cell.append(e("span", "btc-lbl", label), e("span", "btc-val", value || "Nicht eingetragen"));
    parent.appendChild(cell);
  }
  function render() {
    const root = document.getElementById(ID);
    if (!root) return;
    const stage = root.querySelector("#btc-stage");
    const prev = root.querySelector("#btc-prev"), next = root.querySelector("#btc-next");
    const pos = root.querySelector("#btc-position"), dots = root.querySelector("#btc-dots");
    const total = root.querySelector("#btc-total");
    const visible = getItems();
    total.textContent = visible.length === 1 ? "1 Tipp" : visible.length + " Tipps";
    if (!visible.find(t => t.id === selectedId)) selectedId = visible[0] ? visible[0].id : "";
    const index = visible.findIndex(t => t.id === selectedId);
    stage.replaceChildren();
    dots.replaceChildren();
    pos.textContent = visible.length ? (index + 1) + " von " + visible.length : "0 von 0";
    prev.disabled = next.disabled = visible.length < 2;
    if (!visible.length) {
      stage.append(e("div", "btc-message",
        !session() ? "Bitte im Admin Center anmelden, um die Tipps zu sehen." :
        warning ? "Tipps konnten nicht geladen werden. " + warning :
        loadState === "loading" ? "Aktuelle Tipps werden geladen …" :
        "Zurzeit keine veröffentlichten Tipps vor dem Anpfiff."));
      return;
    }
    const t = visible[index];
    const card = e("article", "btc-card");
    const metadata = e("div", "btc-meta");
    const name = e("span", "btc-tipster", t.tippgeber || "Tippgeber");
    name.dataset.group = t.group || "weitere";
    metadata.append(name, e("span", "btc-when", (t.spiel_datum || "–") + " · " + (t.anpfiff || "–") + " Uhr"));
    card.append(metadata, e("div", "btc-game", t.spiel || "Unbekannte Begegnung"));
    const subtitle = [t.sportart, t.liga].filter(Boolean).join(" · ");
    if (subtitle) card.appendChild(e("div", "btc-league", subtitle));
    const expandButton = e("button", "btc-expander", expanded ? "− Tippdetails ausblenden" : "＋ Tippdetails anzeigen");
    expandButton.type = "button";
    expandButton.setAttribute("aria-controls", "btc-details");
    expandButton.setAttribute("aria-expanded", String(expanded));
    expandButton.addEventListener("click", () => { expanded = !expanded; render(); });
    card.appendChild(expandButton);
    const details = e("div", "btc-detail");
    details.id = "btc-details";
    details.hidden = !expanded;
    addCell(details, "Wettmarkt / Ausgang", t.markt, false);
    addCell(details, "Quote", t.quote == null ? "–" : formatNumber(t.quote, 3), false);
    addCell(details, "Konkrete Wettauswahl · Tipp", t.tipp, true);
    addCell(details, "Preis in Units", t.preis_units == null ? "–" : formatNumber(t.preis_units, 2), false);
    card.appendChild(details);
    stage.appendChild(card);
    if (visible.length >= 2 && visible.length <= 8) {
      visible.forEach((tip, i) => {
        const btn = e("button", "btc-dot");
        btn.type = "button";
        btn.setAttribute("aria-label", "Tipp " + (i + 1) + " anzeigen");
        btn.setAttribute("aria-current", String(i === index));
        btn.addEventListener("click", () => choose(tip.id, true));
        dots.appendChild(btn);
      });
    }
  }
  async function load() {
    const s = session();
    if (!s) {
      tips = []; loadState = "done"; warning = ""; render(); return;
    }
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({session_hash: await sessionHash(s.token)}),
        cache: "no-store",
        credentials: "omit"
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !Array.isArray(result.items))
        throw Error(response.status === 401 || response.status === 403 ? "Admin-Sitzung überprüfen." : "Bitte später erneut versuchen.");
      tips = result.items.filter(t =>
        t && typeof t.id === "string" &&
        Number.isFinite(Number(t.kickoff_ms)) && Number(t.kickoff_ms) > Date.now()
      ).sort((a, b) => Number(a.kickoff_ms) - Number(b.kickoff_ms) || String(a.id).localeCompare(String(b.id)));
      loadState = "done"; warning = "";
    } catch (err) {
      if (!session()) tips = [];
      loadState = "done";
      warning = err && err.message ? err.message : "Verbindung nicht verfügbar.";
    }
    render();
  }
  function boot() {
    mount();
    const mo = new MutationObserver(() => {
      const target = headingTarget(), root = document.getElementById(ID);
      if (target && (!root || root.nextElementSibling !== target || root.parentNode !== target.parentNode))
        mount();
    });
    mo.observe(document.documentElement, {childList:true, subtree:true});
    load();
    if (!refreshInterval) refreshInterval = setInterval(load, 60000);
    if (!pruneInterval) pruneInterval = setInterval(render, 30000);
    window.addEventListener("focus", () => { mount(); load(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();