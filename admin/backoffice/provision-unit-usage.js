(() => {
  "use strict";

  const API_URL = "https://hook.eu1.make.com/za1tggiwy1ffdm6ro28p2eqf1ci7tqx9";
  const SESSION_KEY = "betinsight_admin_session_v1";
  const PAGE_SIZE = 100;

  let loadedRows = [];
  let nextCursor = 999999999;
  let hasMore = true;
  let loading = false;

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
    const raw = String(value ?? "0").trim();
    if (!raw) return 0;
    const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
    const parsed = Number(normalized.replace(/[^0-9+\-.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fmt(value, digits = 2) {
    return num(value).toLocaleString("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function fmtEur(value) {
    return num(value).toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  function fmtCrypto(value) {
    return num(value).toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10
    });
  }

  function shortUserId(value) {
    const raw = String(value ?? "").replace(/\D/g, "");
    return raw ? raw.slice(-6).padStart(6, "0") : "------";
  }

  function fmtDate(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "–";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function cryptoLine(row, field) {
    const currency = String(row.abrechnungs_waehrung || "").trim();
    const network = String(row.abrechnungs_network || "").trim();
    const amount = num(row[field]);
    if (!currency || !amount) return "";
    return `<div class="uup-crypto">${esc(fmtCrypto(amount))} ${esc(currency)}${network ? ` · ${esc(network)}` : ""}</div>`;
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
    if (document.getElementById("unitUsageProvisionStyles")) return;
    const style = document.createElement("style");
    style.id = "unitUsageProvisionStyles";
    style.textContent = `
      .uup-card{margin-top:22px;border:1px solid rgba(0,218,255,.28);border-radius:18px;background:rgba(9,45,64,.96);overflow:hidden;box-shadow:0 16px 38px rgba(0,0,0,.22)}
      .uup-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:18px 20px;border-bottom:1px solid rgba(185,216,232,.14)}
      .uup-head h3{margin:0 0 6px;font-size:20px}.uup-sub{color:#b9d8e8;font-size:13px;line-height:1.5;max-width:850px}
      .uup-actions{display:flex;gap:8px;flex-wrap:wrap}.uup-btn{min-height:40px;border:0;border-radius:10px;padding:9px 13px;cursor:pointer;color:#fff;font-weight:800;background:linear-gradient(135deg,#16a8f5,#0879bb)}
      .uup-btn.secondary{border:1px solid rgba(185,216,232,.22);background:rgba(255,255,255,.06)}.uup-btn:disabled{opacity:.45;cursor:not-allowed}
      .uup-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px 20px;border-bottom:1px solid rgba(185,216,232,.10)}
      .uup-stat{padding:12px;border:1px solid rgba(185,216,232,.13);border-radius:12px;background:rgba(255,255,255,.035)}
      .uup-stat-label{color:#9fc7d8;font-size:11px;text-transform:uppercase;font-weight:800}.uup-stat-value{margin-top:5px;color:#fff;font-size:20px;font-weight:900}
      .uup-status{padding:12px 20px;color:#b9d8e8;font-size:13px}.uup-table-wrap{overflow-x:auto;border-top:1px solid rgba(185,216,232,.08)}
      .uup-table{width:100%;min-width:1580px;border-collapse:collapse;font-size:12px}.uup-table th,.uup-table td{padding:10px 11px;text-align:left;vertical-align:top;border-bottom:1px solid rgba(185,216,232,.09)}
      .uup-table th{position:sticky;top:0;background:#082a3b;color:#9fd7e9;font-size:11px;text-transform:uppercase;letter-spacing:.03em;z-index:1}.uup-table td{color:#fff}
      .uup-positive{color:#82f5c8;font-weight:900}.uup-units{color:#ffda76;font-weight:900}.uup-mono{font-family:Consolas,Monaco,monospace;font-size:11px;overflow-wrap:anywhere}.uup-muted{color:#9fc7d8;font-size:11px;margin-top:3px}.uup-crypto{margin-top:4px;color:#8fdcff;font-size:11px;font-weight:800;white-space:nowrap}
      .uup-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px}.uup-empty{padding:24px;text-align:center;color:#b9d8e8}
      @media(max-width:760px){.uup-head{flex-direction:column}.uup-stats{grid-template-columns:1fr}.uup-footer{flex-direction:column;align-items:stretch}.uup-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureBlock() {
    let block = document.getElementById("unitUsageProvisionBlock");
    if (block) return block;

    const panel = document.getElementById("tab-provisions");
    if (!panel) return null;

    block = document.createElement("article");
    block.id = "unitUsageProvisionBlock";
    block.className = "uup-card";
    block.innerHTML = `
      <div class="uup-head">
        <div>
          <h3>Nachweis verbrauchter Kauf-Units · systemweit</h3>
          <div class="uup-sub">Jede tatsächlich verbrauchte Kaufcharge wird als eigener Block dokumentiert. So ist dauerhaft nachvollziehbar, welcher User wie viele gekaufte Units verbraucht hat und welche Provision daraus für Luciano, Martin und Frank freigegeben wurde. EUR und die tatsächlich verwendete Abrechnungs-Kryptowährung werden gemeinsam angezeigt.</div>
        </div>
        <div class="uup-actions"><button type="button" class="uup-btn secondary" id="uupReload">Neu laden</button></div>
      </div>
      <div class="uup-stats" id="uupStats"></div>
      <div class="uup-status" id="uupStatus">Verbrauchsnachweise werden geladen …</div>
      <div class="uup-table-wrap">
        <table class="uup-table" aria-label="Systemweiter Nachweis verbrauchter Kauf-Units">
          <thead><tr>
            <th>Datum</th><th>User</th><th>Tipp / Spiel</th><th>Kaufcharge</th><th>Kauf-Units verbraucht</th><th>Netto zugeordnet</th><th>Unit-Pool freigegeben</th><th>Luciano</th><th>Martin</th><th>Frank</th><th>Tippgeber extra</th><th>Status</th>
          </tr></thead>
          <tbody id="uupBody"><tr><td colspan="12"><div class="uup-empty">Lade Daten …</div></td></tr></tbody>
        </table>
      </div>
      <div class="uup-footer">
        <div class="uup-status" id="uupFooterText" style="padding:0">Es werden immer 100 Buchungsblöcke nachgeladen.</div>
        <button type="button" class="uup-btn" id="uupMore">Weitere 100 laden</button>
      </div>
    `;
    panel.appendChild(block);
    block.querySelector("#uupReload")?.addEventListener("click", resetAndLoad);
    block.querySelector("#uupMore")?.addEventListener("click", loadNext);
    return block;
  }

  function renderStats() {
    const block = ensureBlock();
    if (!block) return;
    const consumed = loadedRows.reduce((sum, row) => sum + num(row.kauf_units_verbraucht), 0);
    const pool = loadedRows.reduce((sum, row) => sum + num(row.nutzungspool_zugeordnet_eur), 0);
    block.querySelector("#uupStats").innerHTML = `
      <div class="uup-stat"><div class="uup-stat-label">Geladene Verbrauchsblöcke</div><div class="uup-stat-value">${loadedRows.length}</div></div>
      <div class="uup-stat"><div class="uup-stat-label">Kauf-Units verbraucht · geladen</div><div class="uup-stat-value">${fmt(consumed)}</div></div>
      <div class="uup-stat"><div class="uup-stat-label">Unit-Pool freigegeben · geladen</div><div class="uup-stat-value">${fmtEur(pool)}</div></div>
    `;
  }

  function rowHtml(row) {
    const userLabel = `User ${shortUserId(row.user_id)}`;
    const charge = String(row.paket_kauf_id || "–");
    const tip = String(row.tipp_id || "–");
    const game = String(row.spiel || "");
    return `
      <tr>
        <td>${esc(fmtDate(row.freigeschaltet_am))}</td>
        <td><strong>${esc(userLabel)}</strong><div class="uup-muted">${esc(row.user_id || "")}</div></td>
        <td><strong>${esc(tip)}</strong>${game ? `<div class="uup-muted">${esc(game)}</div>` : ""}<div class="uup-muted">Tippgeber: ${esc(row.tippgeber_name || "–")}</div></td>
        <td><span class="uup-mono">${esc(charge)}</span><div class="uup-muted">${esc(row.paket_code || "")}</div></td>
        <td class="uup-units">${fmt(row.kauf_units_verbraucht)} Units</td>
        <td>${fmtEur(row.zugeordneter_netto_eur)}${cryptoLine(row, "zugeordneter_netto_crypto")}</td>
        <td class="uup-positive">${fmtEur(row.nutzungspool_zugeordnet_eur)}${cryptoLine(row, "nutzungspool_zugeordnet_crypto")}</td>
        <td>${fmtEur(row.luciano_freigegeben_eur)}${cryptoLine(row, "luciano_freigegeben_crypto")}</td>
        <td>${fmtEur(row.martin_freigegeben_eur)}${cryptoLine(row, "martin_freigegeben_crypto")}</td>
        <td>${fmtEur(row.frank_freigegeben_eur)}${cryptoLine(row, "frank_freigegeben_crypto")}</td>
        <td>${fmtEur(row.tippgeber_freigegeben_eur)}${cryptoLine(row, "tippgeber_freigegeben_crypto")}</td>
        <td><strong>${esc(row.abrechnungsstatus || "–")}</strong><div class="uup-muted">Prüfung: ${esc(row.pruefstatus || "–")}</div><div class="uup-muted">${esc(row.abrechnungsmonat || "")}</div></td>
      </tr>
    `;
  }

  function renderRows() {
    const block = ensureBlock();
    if (!block) return;
    const body = block.querySelector("#uupBody");
    body.innerHTML = loadedRows.length
      ? loadedRows.map(rowHtml).join("")
      : `<tr><td colspan="12"><div class="uup-empty">Noch keine verbrauchten Kauf-Unit-Blöcke vorhanden.</div></td></tr>`;
    renderStats();
    const more = block.querySelector("#uupMore");
    more.disabled = loading || !hasMore;
    more.textContent = hasMore ? "Weitere 100 laden" : "Alle geladen";
    block.querySelector("#uupFooterText").textContent = hasMore
      ? `${loadedRows.length} Blöcke geladen · weitere 100 können nachgeladen werden.`
      : `${loadedRows.length} Blöcke geladen · aktuell sind alle vorhandenen Nachweise sichtbar.`;
  }

  async function fetchPage(cursor) {
    const session = readSession();
    if (!session) throw new Error("Keine gültige Admin-Session. Bitte über das Admin Center neu einloggen.");
    const sessionHash = await sha256Hex(session.token);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "omit",
      body: JSON.stringify({
        action: "unit_usage_history",
        session_hash: sessionHash,
        cursor: Number(cursor || 999999999)
      })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw new Error("Ungültige Antwort vom Verbrauchsnachweis."); }
    if (!data || data.ok !== true || !Array.isArray(data.rows)) throw new Error("Verbrauchsnachweis konnte nicht gelesen werden.");
    return data.rows;
  }

  async function loadNext() {
    if (loading || !hasMore) return;
    const block = ensureBlock();
    if (!block) return;
    loading = true;
    block.querySelector("#uupStatus").textContent = loadedRows.length ? "Weitere 100 Verbrauchsblöcke werden geladen …" : "Verbrauchsnachweise werden geladen …";
    renderRows();
    try {
      const resultRows = await fetchPage(nextCursor);
      const visible = resultRows.slice(0, PAGE_SIZE);
      const known = new Set(loadedRows.map((row) => String(row.nutzungs_id || `${row.audit_seq}`)));
      visible.forEach((row) => {
        const key = String(row.nutzungs_id || `${row.audit_seq}`);
        if (!known.has(key)) {
          loadedRows.push(row);
          known.add(key);
        }
      });
      hasMore = resultRows.length > PAGE_SIZE;
      if (visible.length) nextCursor = num(visible[visible.length - 1].audit_seq);
      block.querySelector("#uupStatus").textContent = loadedRows.length
        ? `${loadedRows.length} Kauf-Unit-Verbrauchsblöcke geladen. Jeder Block entspricht einer tatsächlich belasteten Kaufcharge.`
        : "Noch keine Kauf-Unit-Verbrauchsblöcke vorhanden.";
    } catch (error) {
      console.error("Kauf-Unit Verbrauchsnachweis:", error);
      block.querySelector("#uupStatus").textContent = `Verbrauchsnachweis konnte nicht geladen werden: ${error && error.message ? error.message : error}`;
      hasMore = false;
    } finally {
      loading = false;
      renderRows();
    }
  }

  async function resetAndLoad() {
    loadedRows = [];
    nextCursor = 999999999;
    hasMore = true;
    await loadNext();
  }

  function init() {
    ensureStyles();
    const block = ensureBlock();
    if (!block) return;
    resetAndLoad();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
