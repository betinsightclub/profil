(() => {
  "use strict";

  const API_URL = "https://hook.eu1.make.com/cr3ta42x45kji6jt82sa4zcrcj5yvntb";
  const SESSION_KEY = "betinsight_admin_session_v1";
  const GROUPS_PER_PAGE = 20;

  let allRows = [];
  let currentPage = 1;
  let currentQuery = "";

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function num(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const parsed = Number(String(value ?? "0").trim().replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fmt(value, digits = 2) {
    return num(value).toLocaleString("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function shortUserId(value) {
    const raw = String(value ?? "").replace(/\D/g, "");
    if (!raw) return "------";
    return raw.slice(-6).padStart(6, "0");
  }

  function normalizeDate(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "–";
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return raw;
  }

  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(String(text || ""));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.token || !session.adminId) return null;
      return session;
    } catch (_) {
      return null;
    }
  }

  function ensureStyles() {
    if (document.getElementById("referralUnitHistoryStyles")) return;
    const style = document.createElement("style");
    style.id = "referralUnitHistoryStyles";
    style.textContent = `
      #referralUnitHistorySection { margin-top: 18px; }
      .ruh-shell { border:1px solid rgba(0,218,255,.28); border-radius:18px; background:rgba(9,45,64,.96); box-shadow:0 18px 48px rgba(0,0,0,.28); overflow:hidden; }
      .ruh-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:20px; border-bottom:1px solid rgba(185,216,232,.15); }
      .ruh-head h2 { margin:0 0 6px; font-size:22px; }
      .ruh-sub { color:#b9d8e8; font-size:13px; line-height:1.5; }
      .ruh-controls { display:flex; gap:9px; flex-wrap:wrap; padding:14px 20px; border-bottom:1px solid rgba(185,216,232,.12); background:rgba(3,19,28,.35); }
      .ruh-input { flex:1 1 250px; min-height:42px; border:1px solid rgba(0,218,255,.24); border-radius:11px; background:#03131c; color:#fff; padding:10px 12px; outline:none; }
      .ruh-input:focus { border-color:rgba(0,218,255,.62); }
      .ruh-btn { min-height:42px; border:0; border-radius:11px; padding:10px 14px; cursor:pointer; color:#fff; font-weight:800; background:linear-gradient(135deg,#16a8f5,#0879bb); }
      .ruh-btn:disabled { opacity:.55; cursor:not-allowed; }
      .ruh-summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; padding:14px 20px; }
      .ruh-stat { padding:12px; border:1px solid rgba(185,216,232,.13); border-radius:12px; background:rgba(255,255,255,.035); }
      .ruh-stat-label { color:#b9d8e8; font-size:11px; margin-bottom:5px; }
      .ruh-stat-value { font-size:18px; font-weight:900; }
      .ruh-status { padding:0 20px 12px; color:#b9d8e8; font-size:13px; }
      .ruh-groups { display:grid; gap:10px; padding:0 20px 18px; }
      .ruh-user { border:1px solid rgba(185,216,232,.16); border-radius:13px; background:rgba(255,255,255,.035); overflow:hidden; }
      .ruh-user summary { list-style:none; cursor:pointer; padding:14px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; }
      .ruh-user summary::-webkit-details-marker { display:none; }
      .ruh-user-title { font-weight:900; color:#fff; }
      .ruh-user-meta { margin-top:4px; color:#9bcfe4; font-size:12px; overflow-wrap:anywhere; }
      .ruh-user-total { text-align:right; font-weight:900; color:#82f5c8; white-space:nowrap; }
      .ruh-levels { display:flex; gap:7px; flex-wrap:wrap; margin-top:7px; }
      .ruh-chip { padding:4px 8px; border-radius:999px; background:rgba(22,168,245,.12); border:1px solid rgba(22,168,245,.24); color:#c8edff; font-size:11px; font-weight:800; }
      .ruh-detail { border-top:1px solid rgba(185,216,232,.12); overflow-x:auto; }
      .ruh-table { width:100%; border-collapse:collapse; min-width:1040px; font-size:12px; }
      .ruh-table th, .ruh-table td { padding:10px 11px; border-bottom:1px solid rgba(185,216,232,.09); text-align:left; vertical-align:top; }
      .ruh-table th { color:#9bcfe4; font-size:11px; text-transform:uppercase; letter-spacing:.04em; background:rgba(1,12,19,.34); }
      .ruh-table td { color:#fff; }
      .ruh-mono { font-family:Consolas,Monaco,monospace; font-size:11px; overflow-wrap:anywhere; }
      .ruh-positive { color:#82f5c8; font-weight:900; }
      .ruh-pagination { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:0 20px 20px; }
      .ruh-page-info { color:#b9d8e8; font-size:12px; }
      .ruh-page-buttons { display:flex; gap:8px; }
      .ruh-page-btn { border:1px solid rgba(185,216,232,.2); border-radius:9px; padding:8px 11px; background:rgba(255,255,255,.05); color:#fff; cursor:pointer; font-weight:800; }
      .ruh-page-btn:disabled { opacity:.4; cursor:not-allowed; }
      .ruh-empty { padding:22px; color:#b9d8e8; text-align:center; }
      @media (max-width:760px) {
        .ruh-head { flex-direction:column; }
        .ruh-summary { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .ruh-user summary { grid-template-columns:1fr; }
        .ruh-user-total { text-align:left; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSection() {
    let section = document.getElementById("referralUnitHistorySection");
    if (section) return section;

    const host = document.querySelector("main") || document.querySelector(".app") || document.body;
    section = document.createElement("section");
    section.id = "referralUnitHistorySection";
    section.innerHTML = `
      <div class="ruh-shell">
        <div class="ruh-head">
          <div>
            <h2>Referral-Unit-Verdienste</h2>
            <div class="ruh-sub">Nachvollziehbare Freigaben aus tatsächlich verbrauchten Kauf-Units. Gruppiert nach Upline-User. Geschenk-Units werden hier nicht vergütet.</div>
          </div>
          <button type="button" class="ruh-btn" id="ruhReload">Aktualisieren</button>
        </div>
        <div class="ruh-controls">
          <input id="ruhSearch" class="ruh-input" type="search" placeholder="User-Nr., BI-Code, E-Mail, Downline oder Tipp-ID suchen …" autocomplete="off">
        </div>
        <div class="ruh-summary" id="ruhSummary"></div>
        <div class="ruh-status" id="ruhStatus">Referral-Verlauf wird geladen …</div>
        <div class="ruh-groups" id="ruhGroups"></div>
        <div class="ruh-pagination" id="ruhPagination"></div>
      </div>
    `;

    host.appendChild(section);
    section.querySelector("#ruhReload")?.addEventListener("click", loadRows);
    section.querySelector("#ruhSearch")?.addEventListener("input", (event) => {
      currentQuery = String(event.target.value || "").trim().toLowerCase();
      currentPage = 1;
      render();
    });
    return section;
  }

  function groupRows(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      const id = String(row.sponsor_user_id || "").trim() || "0";
      if (!groups.has(id)) {
        groups.set(id, {
          sponsor_user_id: id,
          sponsor_ref_code: String(row.sponsor_ref_code || ""),
          sponsor_email: String(row.sponsor_email || ""),
          rows: [],
          total: 0,
          l1: 0,
          l2: 0,
          l3: 0
        });
      }
      const g = groups.get(id);
      const earned = num(row.referral_units);
      const level = Number(row.ebene || 0);
      g.rows.push(row);
      g.total += earned;
      if (level === 1) g.l1 += earned;
      if (level === 2) g.l2 += earned;
      if (level === 3) g.l3 += earned;
    });
    return Array.from(groups.values()).sort((a, b) => Number(a.sponsor_user_id || 0) - Number(b.sponsor_user_id || 0));
  }

  function filteredRows() {
    if (!currentQuery) return allRows;
    return allRows.filter((row) => {
      const blob = [
        row.sponsor_user_id,
        row.sponsor_ref_code,
        row.sponsor_email,
        row.downline_user_id,
        row.downline_ref_code,
        row.downline_email,
        row.tipp_id,
        row.kauf_id,
        row.paket,
        row.ebene
      ].join(" ").toLowerCase();
      return blob.includes(currentQuery);
    });
  }

  function renderSummary(rows, groups) {
    const section = ensureSection();
    const total = rows.reduce((sum, r) => sum + num(r.referral_units), 0);
    const consumed = rows.reduce((sum, r) => sum + num(r.verbrauchte_kauf_units), 0);
    const summary = section.querySelector("#ruhSummary");
    summary.innerHTML = `
      <div class="ruh-stat"><div class="ruh-stat-label">Upline-User mit Verdienst</div><div class="ruh-stat-value">${groups.length}</div></div>
      <div class="ruh-stat"><div class="ruh-stat-label">Freigegebene Buchungen</div><div class="ruh-stat-value">${rows.length}</div></div>
      <div class="ruh-stat"><div class="ruh-stat-label">Referral-Units freigegeben</div><div class="ruh-stat-value">${fmt(total)}</div></div>
      <div class="ruh-stat"><div class="ruh-stat-label">Kauf-Units als Basis</div><div class="ruh-stat-value">${fmt(consumed)}</div></div>
    `;
  }

  function rowHtml(row) {
    const downlineId = shortUserId(row.downline_user_id);
    return `
      <tr>
        <td>${esc(normalizeDate(row.datum || row.verarbeitet_am))}</td>
        <td><strong>User ${esc(downlineId)}</strong><br><span class="ruh-mono">${esc(row.downline_ref_code || "")}</span><br>${esc(row.downline_email || "")}</td>
        <td>L${esc(row.ebene || "–")}</td>
        <td>${fmt(row.verbrauchte_kauf_units)}</td>
        <td>${fmt(row.referral_prozent)} %</td>
        <td class="ruh-positive">+${fmt(row.referral_units)}</td>
        <td class="ruh-mono">${esc(row.tipp_id || "–")}</td>
        <td class="ruh-mono">${esc(row.kauf_id || "–")}</td>
      </tr>
    `;
  }

  function groupHtml(group) {
    const userNo = shortUserId(group.sponsor_user_id);
    const rows = [...group.rows].sort((a, b) => String(b.datum || b.verarbeitet_am || "").localeCompare(String(a.datum || a.verarbeitet_am || "")));
    return `
      <details class="ruh-user">
        <summary>
          <div>
            <div class="ruh-user-title">User ${esc(userNo)} · ${esc(group.sponsor_ref_code || ("BI" + group.sponsor_user_id))}</div>
            <div class="ruh-user-meta">${esc(group.sponsor_email || "Keine E-Mail")}</div>
            <div class="ruh-levels">
              <span class="ruh-chip">L1 ${fmt(group.l1)}</span>
              <span class="ruh-chip">L2 ${fmt(group.l2)}</span>
              <span class="ruh-chip">L3 ${fmt(group.l3)}</span>
              <span class="ruh-chip">${rows.length} Buchung${rows.length === 1 ? "" : "en"}</span>
            </div>
          </div>
          <div class="ruh-user-total">+${fmt(group.total)} Units</div>
        </summary>
        <div class="ruh-detail">
          <table class="ruh-table">
            <thead><tr><th>Datum</th><th>Downline</th><th>Ebene</th><th>Kauf-Units verbraucht</th><th>Satz</th><th>Verdient</th><th>Tipp-ID</th><th>Kaufcharge</th></tr></thead>
            <tbody>${rows.map(rowHtml).join("")}</tbody>
          </table>
        </div>
      </details>
    `;
  }

  function renderPagination(totalGroups) {
    const section = ensureSection();
    const pages = Math.max(1, Math.ceil(totalGroups / GROUPS_PER_PAGE));
    currentPage = Math.min(Math.max(1, currentPage), pages);
    const box = section.querySelector("#ruhPagination");
    if (totalGroups <= GROUPS_PER_PAGE) {
      box.innerHTML = `<div class="ruh-page-info">${totalGroups} User-Block${totalGroups === 1 ? "" : "s"}</div>`;
      return;
    }
    box.innerHTML = `
      <div class="ruh-page-info">Seite ${currentPage} von ${pages} · ${totalGroups} User-Blöcke</div>
      <div class="ruh-page-buttons">
        <button class="ruh-page-btn" id="ruhPrev" ${currentPage <= 1 ? "disabled" : ""}>Zurück</button>
        <button class="ruh-page-btn" id="ruhNext" ${currentPage >= pages ? "disabled" : ""}>Weiter</button>
      </div>
    `;
    box.querySelector("#ruhPrev")?.addEventListener("click", () => { currentPage--; render(); section.scrollIntoView({behavior:"smooth", block:"start"}); });
    box.querySelector("#ruhNext")?.addEventListener("click", () => { currentPage++; render(); section.scrollIntoView({behavior:"smooth", block:"start"}); });
  }

  function render() {
    const section = ensureSection();
    const rows = filteredRows();
    const groups = groupRows(rows);
    renderSummary(rows, groups);
    const start = (currentPage - 1) * GROUPS_PER_PAGE;
    const visible = groups.slice(start, start + GROUPS_PER_PAGE);
    section.querySelector("#ruhGroups").innerHTML = visible.length
      ? visible.map(groupHtml).join("")
      : `<div class="ruh-empty">Keine passenden Referral-Unit-Buchungen gefunden.</div>`;
    renderPagination(groups.length);
  }

  async function loadRows() {
    const section = ensureSection();
    const button = section.querySelector("#ruhReload");
    const status = section.querySelector("#ruhStatus");
    const session = readSession();
    if (!session) {
      status.textContent = "Keine gültige Admin-Session gefunden. Bitte neu einloggen.";
      return;
    }

    button.disabled = true;
    status.textContent = "Referral-Unit-Verlauf wird geladen …";
    try {
      const sessionHash = await sha256Hex(session.token);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        body: JSON.stringify({ action: "referral_history", session_hash: sessionHash })
      });
      const raw = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data;
      try { data = JSON.parse(raw); } catch (_) { throw new Error("Ungültige Antwort vom Referral-Verlauf."); }
      if (!data || data.ok !== true || !Array.isArray(data.rows)) throw new Error("Referral-Verlauf konnte nicht gelesen werden.");
      allRows = data.rows;
      currentPage = 1;
      render();
      status.textContent = `${allRows.length} freigegebene Referral-Buchung${allRows.length === 1 ? "" : "en"} geladen. Vollständiges Ledger: REF_BEWEGUNGEN; Anzeige lädt maximal 1.000 aktuelle Buchungen.`;
    } catch (error) {
      console.error("Referral-Unit-Verlauf:", error);
      status.textContent = `Referral-Verlauf konnte nicht geladen werden: ${error && error.message ? error.message : error}`;
      allRows = [];
      render();
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    ensureStyles();
    ensureSection();
    loadRows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
