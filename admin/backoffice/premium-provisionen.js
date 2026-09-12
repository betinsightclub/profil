/* BetInsight – Premium / Premium Plus Sofortprovisionen im Provisionen-Tab
   Stand 2026-09-12
   Nutzt ausschließlich die bereits serverseitig gefilterten Premium-LIVE-Daten.
   Partner erhalten keine Reserve-/Fremdanteile. */
(() => {
  "use strict";

  const BLOCK_ID = "premiumProvisionenSofortBlock";
  const STYLE_ID = "premiumProvisionenSofortStyle";

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function num(value) {
    const raw = String(value ?? "0").trim().replace(/\s/g, "");
    if (!raw) return 0;
    let normalized = raw;
    if (raw.includes(",") && raw.includes(".")) {
      normalized = raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
    } else {
      normalized = raw.replace(",", ".");
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function eur(value) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num(value));
  }

  function dateLabel(value) {
    const raw = String(value || "").trim();
    if (!raw) return "–";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(d);
  }

  function tariffLabel(code) {
    const value = String(code || "").toUpperCase();
    if (value === "PREMIUM-1") return "Premium";
    if (value === "PREMIUM-2") return "Premium Plus";
    return code || "Premium";
  }

  function parseRows(raw, isMaster) {
    const text = String(raw || "").trim();
    if (!text) return [];

    return text.split("§").map((record) => {
      const p = record.split("|");
      if (isMaster) {
        if (p.length < 15) return null;
        return {
          date: p[0] || "",
          tariff: p[1] || "",
          paymentId: p[2] || "",
          adminId: p[3] || "",
          adminName: p[4] || "",
          gross: p[5] || "0",
          pool: p[6] || "0",
          referralActual: p[7] || "0",
          poolRemainder: p[8] || "0",
          plisio: p[9] || "0",
          founderBase: p[10] || "0",
          assigned: p[11] || "0",
          reserve: p[12] || "0",
          allocationStatus: p[13] || "",
          status: p[14] || ""
        };
      }
      if (p.length < 8) return null;
      return {
        date: p[0] || "",
        tariff: p[1] || "",
        gross: p[2] || "0",
        pool: p[3] || "0",
        plisio: p[4] || "0",
        founderBase: p[5] || "0",
        assigned: p[6] || "0",
        status: p[7] || ""
      };
    }).filter(Boolean);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pps-card{margin-top:22px;border:1px solid rgba(191,142,255,.30);border-radius:18px;background:rgba(9,45,64,.96);overflow:hidden;box-shadow:0 16px 38px rgba(0,0,0,.22)}
      .pps-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:18px 20px;border-bottom:1px solid rgba(185,216,232,.14)}
      .pps-head h3{margin:0 0 6px;font-size:20px}.pps-sub{color:#b9d8e8;font-size:13px;line-height:1.5;max-width:900px}
      .pps-badge{display:inline-flex;align-items:center;padding:5px 9px;border:1px solid rgba(0,212,138,.28);border-radius:999px;background:rgba(0,212,138,.09);color:#8af0ca;font-size:11px;font-weight:900;white-space:nowrap}
      .pps-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px 20px;border-bottom:1px solid rgba(185,216,232,.10)}
      .pps-stat{padding:12px;border:1px solid rgba(185,216,232,.13);border-radius:12px;background:rgba(255,255,255,.035)}
      .pps-stat span{display:block;color:#9fc7d8;font-size:11px;text-transform:uppercase;font-weight:800}.pps-stat strong{display:block;margin-top:5px;color:#fff;font-size:20px}
      .pps-table-wrap{overflow-x:auto}.pps-table{width:100%;min-width:980px;border-collapse:collapse;font-size:12px}.pps-table th,.pps-table td{padding:10px 11px;text-align:left;vertical-align:top;border-bottom:1px solid rgba(185,216,232,.09)}
      .pps-table th{background:#082a3b;color:#9fd7e9;font-size:11px;text-transform:uppercase;letter-spacing:.03em}.pps-table td{color:#fff}.pps-positive{color:#82f5c8;font-weight:900}.pps-muted{color:#9fc7d8;font-size:11px;margin-top:3px}.pps-empty{padding:24px;text-align:center;color:#b9d8e8}
      .pps-note{padding:12px 20px;color:#aac6d5;font-size:12px;line-height:1.5;border-top:1px solid rgba(185,216,232,.08)}
      @media(max-width:760px){.pps-head{flex-direction:column}.pps-stats{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureBlock() {
    let block = document.getElementById(BLOCK_ID);
    if (block) return block;
    const panel = document.getElementById("tab-provisions");
    if (!panel) return null;
    block = document.createElement("article");
    block.id = BLOCK_ID;
    block.className = "pps-card";
    panel.appendChild(block);
    return block;
  }

  function render(data) {
    ensureStyles();
    const block = ensureBlock();
    if (!block) return;

    const isMaster = String(data?.role || "").toUpperCase() === "MASTER";
    const allRows = parseRows(data?.premium_eingaenge_raw, isMaster);
    const rows = allRows.filter((row) => {
      if (num(row.assigned) <= 0) return false;
      if (!isMaster) return true;
      return String(row.allocationStatus || "").toUpperCase() === "ZUGETEILT";
    });

    const totalAssigned = rows.reduce((sum, row) => sum + num(row.assigned), 0);
    const uniquePayments = new Set(rows.map((row) => row.paymentId || `${row.date}|${row.tariff}|${row.gross}`)).size;
    const grossAssigned = rows.reduce((sum, row) => sum + num(row.gross), 0);

    const head = isMaster
      ? `<th>Datum</th><th>Tarif / Zahlung</th><th>Empfänger</th><th>Eingang</th><th>Premium-Pool</th><th>Ref tatsächlich</th><th>Plisio</th><th>Gründerrest</th><th>Sofortprovision</th>`
      : `<th>Datum</th><th>Tarif</th><th>Eingang</th><th>Premium-Pool</th><th>Plisio</th><th>Gründerrest</th><th>Deine Sofortprovision</th>`;

    const body = rows.map((row) => {
      if (isMaster) {
        return `<tr>
          <td>${esc(dateLabel(row.date))}</td>
          <td><strong>${esc(tariffLabel(row.tariff))}</strong><div class="pps-muted">${esc(row.paymentId || "")}</div></td>
          <td>${esc(row.adminName || row.adminId || "–")}</td>
          <td>${esc(eur(row.gross))}</td>
          <td>${esc(eur(row.pool))}</td>
          <td>${esc(eur(row.referralActual))}</td>
          <td>${esc(eur(row.plisio))}</td>
          <td>${esc(eur(row.founderBase))}</td>
          <td class="pps-positive">${esc(eur(row.assigned))}</td>
        </tr>`;
      }
      return `<tr>
        <td>${esc(dateLabel(row.date))}</td>
        <td><strong>${esc(tariffLabel(row.tariff))}</strong></td>
        <td>${esc(eur(row.gross))}</td>
        <td>${esc(eur(row.pool))}</td>
        <td>${esc(eur(row.plisio))}</td>
        <td>${esc(eur(row.founderBase))}</td>
        <td class="pps-positive">${esc(eur(row.assigned))}</td>
      </tr>`;
    }).join("");

    block.innerHTML = `
      <div class="pps-head">
        <div>
          <h3>💎 Premium / Premium Plus · Sofortprovisionen</h3>
          <div class="pps-sub">Nach einer bestätigten Plisio-Zahlung wird der tatsächlich zugeteilte Gründeranteil sofort als verfügbare Provision gebucht. Premium bleibt dabei finanziell getrennt vom Unit-40/60-Modell: hier gilt der eigene 62,5-%-Premium-Pool.</div>
        </div>
        <span class="pps-badge">SOFORT AUSZAHLBAR</span>
      </div>
      <div class="pps-stats">
        <div class="pps-stat"><span>Sofortprovision gesamt</span><strong>${esc(eur(totalAssigned))}</strong></div>
        <div class="pps-stat"><span>Zugeordnete Premium-Zahlungen</span><strong>${uniquePayments}</strong></div>
        <div class="pps-stat"><span>Zugeordnete Eingänge · Summe</span><strong>${esc(eur(grossAssigned))}</strong></div>
      </div>
      <div class="pps-table-wrap">
        <table class="pps-table" aria-label="Premium Sofortprovisionen">
          <thead><tr>${head}</tr></thead>
          <tbody>${rows.length ? body : `<tr><td colspan="${isMaster ? 9 : 7}"><div class="pps-empty">Noch keine zugeteilten LIVE-Premium-Sofortprovisionen vorhanden.</div></td></tr>`}</tbody>
        </table>
      </div>
      <div class="pps-note">🔒 Partner sehen ausschließlich ihre serverseitig zugeteilten Premium-Eingänge. Nicht zugeteilte Zahlungen und Reserveanteile werden hier nicht als Provision angezeigt; die vollständige Master-Aufteilung bleibt im Premium-Tab.</div>
    `;
  }

  function install() {
    ensureStyles();
    ensureBlock();
    const originalApplyData = window.applyData;
    if (typeof originalApplyData !== "function") {
      console.warn("BetInsight Premium-Provisionen: applyData wurde nicht gefunden.");
      return;
    }
    if (originalApplyData.__premiumProvisionenWrapped) return;

    function wrappedApplyData(data) {
      originalApplyData(data);
      try { render(data || {}); }
      catch (error) { console.error("Premium-Sofortprovisionen konnten nicht gerendert werden:", error); }
    }
    wrappedApplyData.__premiumProvisionenWrapped = true;
    window.applyData = wrappedApplyData;
  }

  install();
})();
