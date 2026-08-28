/* BetInsight Kontobewegungen · 2026-08-28-01
   Reine READONLY-Anzeige im Dashboard.
   Liest bestehende Bewegungs-/Tipp-/Daily-Historien über getrennte READONLY-Webhooks.
   Keine Unit-, Zahlungs-, Referral-, Tipp- oder Wechselstuben-Schreiblogik wird verändert. */
(() => {
  "use strict";

  const MOVEMENTS_URL = "https://hook.eu1.make.com/hkbe8ldgbg64t423rbfdcaayuw42wx01";
  const TIPS_URL = "https://hook.eu1.make.com/xkhzh67vdq0bn6hfu7pn97sx1i5r3jvy";
  const DAILY_URL = "https://hook.eu1.make.com/y1f4oiya4mnnr7x27uwgezdq5dkbnslt";
  const DASHBOARD_STORAGE_KEY = "betinsight_dashboard_token";
  const ROOT_PATHS = new Set(["/", "/profil/"]);
  const INITIAL_COUNT = 3;

  let items = [];
  let expanded = false;
  let loading = false;
  let lastToken = "";

  function isDashboardPage() {
    return ROOT_PATHS.has(window.location.pathname);
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
  }

  function dashboardToken() {
    try {
      if (typeof window.getConfirmedDashboardToken === "function") {
        const value = String(window.getConfirmedDashboardToken() || "").trim();
        if (isUuid(value)) return value;
      }
    } catch (_) {}
    try {
      const value = String(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "").trim();
      if (isUuid(value)) return value;
    } catch (_) {}
    return "";
  }

  function numberValue(value) {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) ? number : null;
  }

  function formatUnits(value) {
    const number = numberValue(value);
    if (number === null) return "–";
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(number);
  }

  function parseDate(value) {
    const raw = String(value || "").trim().replace(/^"|"$/g, "");
    if (!raw) return null;
    let date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
    const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})[ ,T]+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return String(value || "–").replace(/^"|"$/g, "");
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function movementLabel(item) {
    const type = String(item.type || "").trim().toLowerCase();
    if (type === "wechselstube_kauf") return "Wechselstube · Units gekauft";
    if (type === "wechselstube_verkauf") return "Wechselstube · Units verkauft";
    if (type === "referral_aufs_konto") return "Referral-Units aufs Konto";
    if (type === "kauf") return "Unit-Paket gekauft";
    if (type === "tipp_freischaltung") return "Tipp freigeschaltet";
    if (String(item.source || "") === "daily_bonus") {
      return type === "box_geoeffnet" ? "Daily Bonus · Treuebox" : "Daily Bonus";
    }
    if (type.includes("test")) return "Testbuchung";
    if (type) return type.replaceAll("_", " ");
    return "Kontobewegung";
  }

  function normalizeItem(item) {
    const delta = numberValue(item?.delta);
    const parsed = parseDate(item?.date);
    return {
      source: String(item?.source || ""),
      date: String(item?.date || ""),
      timestamp: parsed ? parsed.getTime() : 0,
      delta,
      type: String(item?.type || ""),
      reference: String(item?.reference || ""),
      label: String(item?.label || ""),
      balanceBefore: numberValue(item?.balanceBefore),
      balanceAfter: numberValue(item?.balanceAfter),
      bucket: String(item?.bucket || "")
    };
  }

  async function fetchList(url, token) {
    const target = `${url}?dashboard_token=${encodeURIComponent(token)}&_=${Date.now()}`;
    const response = await fetch(target, { method: "GET", cache: "no-store", credentials: "omit", redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = String(await response.text() || "").replace(/^\uFEFF/, "").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.array)) return parsed.array;
    return [];
  }

  function ensureStyles() {
    if (document.getElementById("bi-account-history-style")) return;
    const style = document.createElement("style");
    style.id = "bi-account-history-style";
    style.textContent = `
      .bi-account-history{margin-top:2px;padding:14px;border:1px solid rgba(126,194,220,.14);border-radius:15px;background:linear-gradient(145deg,rgba(2,21,31,.66),rgba(13,55,69,.40))}
      .bi-account-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      .bi-account-history-title{display:block;color:#fff;font-size:13px;font-weight:900}
      .bi-account-history-subtitle{display:block;margin-top:3px;color:#83abc0;font-size:10px;line-height:1.35}
      .bi-account-history-readonly{flex:0 0 auto;padding:4px 7px;border:1px solid rgba(14,220,166,.18);border-radius:999px;background:rgba(14,220,166,.06);color:#7de8cb;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.45px}
      .bi-account-history-list{display:grid;gap:7px}
      .bi-account-history-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid rgba(255,255,255,.065);border-radius:11px;background:rgba(0,0,0,.16)}
      .bi-account-history-main{min-width:0}
      .bi-account-history-label{display:block;color:#e9f8ff;font-size:11px;font-weight:900;line-height:1.25}
      .bi-account-history-meta{display:block;margin-top:3px;color:#79a9bd;font-size:9px;line-height:1.35;overflow-wrap:anywhere}
      .bi-account-history-values{text-align:right;min-width:92px}
      .bi-account-history-amount{position:relative;display:block;font-size:13px;font-weight:900;white-space:nowrap;font-variant-numeric:tabular-nums}
      .bi-account-history-amount.positive{color:#0edca6}.bi-account-history-amount.negative{color:#ffab2e}.bi-account-history-amount.neutral{color:#d7edf7}
      .bi-account-history-after{position:relative;display:block;margin-top:3px;color:#83abc0;font-size:8px;white-space:nowrap}
      .bi-account-history-empty{padding:12px;color:#83abc0;font-size:10px;line-height:1.4;text-align:center}
      .bi-account-history-more{width:100%;min-height:36px;margin-top:9px;padding:8px 10px;border:1px solid rgba(22,156,255,.22);border-radius:10px;background:rgba(22,156,255,.08);color:#a9dcff;font-size:10px;font-weight:900;cursor:pointer}
      .bi-account-history-more:hover{background:rgba(22,156,255,.13)}
      .bi-account-history .private-value-hidden{position:relative;overflow:hidden;color:transparent!important;user-select:none}
      .bi-account-history .private-value-hidden::after{content:"Geschützt";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:900;background:#061a25}
      @media(max-width:520px){.bi-account-history-row{grid-template-columns:1fr}.bi-account-history-values{text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px}.bi-account-history-after{margin-top:0}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    if (!isDashboardPage()) return null;
    const existing = document.getElementById("biAccountHistory");
    if (existing) return existing;
    const grid = document.querySelector(".account-summary .account-stat-grid");
    if (!grid) return null;
    ensureStyles();
    const panel = document.createElement("section");
    panel.id = "biAccountHistory";
    panel.className = "bi-account-history";
    panel.innerHTML = `
      <div class="bi-account-history-head">
        <div><span class="bi-account-history-title">📜 Kontobewegungen</span><span class="bi-account-history-subtitle">Die letzten Änderungen deines Unit-Kontos.</span></div>
        <span class="bi-account-history-readonly">Nur Anzeige</span>
      </div>
      <div id="biAccountHistoryList" class="bi-account-history-list"><div class="bi-account-history-empty">Kontobewegungen werden geladen …</div></div>
      <button id="biAccountHistoryMore" class="bi-account-history-more" type="button" hidden>Weitere anzeigen</button>`;
    grid.insertAdjacentElement("afterend", panel);
    panel.querySelector("#biAccountHistoryMore")?.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });
    return panel;
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    const list = panel.querySelector("#biAccountHistoryList");
    const more = panel.querySelector("#biAccountHistoryMore");
    if (!list || !more) return;
    if (!items.length) {
      list.innerHTML = `<div class="bi-account-history-empty">${loading ? "Kontobewegungen werden geladen …" : "Noch keine Kontobewegungen vorhanden."}</div>`;
      more.hidden = true;
      return;
    }
    const visible = expanded ? items : items.slice(0, INITIAL_COUNT);
    const protectedNow = document.getElementById("accountPrivacyButton")?.classList.contains("active") === true;
    list.innerHTML = visible.map(item => {
      const delta = item.delta;
      const amountClass = delta === null || delta === 0 ? "neutral" : delta > 0 ? "positive" : "negative";
      const sign = delta === null || delta === 0 ? "" : delta > 0 ? "+" : "−";
      const amount = delta === null ? "–" : `${sign}${formatUnits(Math.abs(delta))} Units`;
      let detail = formatDate(item.date);
      if (item.label) detail += ` · ${item.label}`;
      const privateClass = protectedNow ? " account-private-value private-value-hidden" : " account-private-value";
      let after = "";
      if (item.balanceAfter !== null) {
        const title = item.bucket === "geschenk_units" ? "Geschenk danach" : "Stand danach";
        after = `<span class="bi-account-history-after${privateClass}">${title}: ${formatUnits(item.balanceAfter)}</span>`;
      }
      return `<div class="bi-account-history-row"><div class="bi-account-history-main"><span class="bi-account-history-label">${escapeHtml(movementLabel(item))}</span><span class="bi-account-history-meta">${escapeHtml(detail)}</span></div><div class="bi-account-history-values"><strong class="bi-account-history-amount ${amountClass}${privateClass}">${escapeHtml(amount)}</strong>${after}</div></div>`;
    }).join("");
    more.hidden = items.length <= INITIAL_COUNT;
    more.textContent = expanded ? "Weniger anzeigen" : `Weitere anzeigen (${items.length - INITIAL_COUNT})`;
  }

  async function loadHistory(force = false) {
    const panel = ensurePanel();
    if (!panel || loading) return;
    const token = dashboardToken();
    if (!token) {
      window.setTimeout(() => loadHistory(force), 500);
      return;
    }
    if (!force && token === lastToken && items.length) return;
    loading = true;
    lastToken = token;
    render();
    const results = await Promise.allSettled([
      fetchList(MOVEMENTS_URL, token),
      fetchList(TIPS_URL, token),
      fetchList(DAILY_URL, token)
    ]);
    const merged = [];
    for (const result of results) {
      if (result.status === "fulfilled") merged.push(...result.value);
      else console.warn("BetInsight Kontobewegungen: READONLY-Quelle nicht verfügbar", result.reason);
    }
    const seen = new Set();
    items = merged
      .map(normalizeItem)
      .filter(item => item.date)
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(item => {
        const key = [item.source, item.date, item.delta, item.type, item.reference].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    loading = false;
    expanded = false;
    render();
  }

  function watchProfileRefresh() {
    const message = document.getElementById("message");
    if (!message || typeof MutationObserver !== "function") return;
    let timer = null;
    const observer = new MutationObserver(() => {
      const text = String(message.textContent || "");
      if (!/Kontostand wurde aktualisiert|Profil wurde gefunden/i.test(text)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => loadHistory(true), 350);
    });
    observer.observe(message, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    if (!isDashboardPage()) return;
    ensurePanel();
    watchProfileRefresh();
    loadHistory(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
