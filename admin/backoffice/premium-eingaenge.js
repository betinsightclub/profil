/*
BetInsight – Premium-Eingänge Backoffice-Komponente
Stand: 2026-09-05

Sicherheitsprinzip:
- liest ausschließlich das bereits serverseitig gefilterte Feld premium_eingaenge_raw
- keine eigene Berechnung von Premium-Provisionen
- keine Prozentrechnung
- keine Schreibaktion
- keine Reserve-/Fremddaten werden für Partner nachgeladen
*/
(function () {
  "use strict";

  const COMPONENT_ID = "premiumEingaengeCard";
  const STYLE_ID = "premiumEingaengeStyle";

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numberValue(value) {
    const normalized = String(value ?? "0")
      .trim()
      .replace(/\s/g, "")
      .replace(/\./g, ".")
      .replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function euro(value) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(numberValue(value));
  }

  function dateLabel(value) {
    const raw = String(value || "").trim();
    if (!raw) return "–";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(d);
  }

  function tariffLabel(code) {
    const value = String(code || "").toUpperCase();
    if (value === "PREMIUM-1") return "Premium";
    if (value === "PREMIUM-2") return "Premium Plus";
    return code || "Premium";
  }

  function statusLabel(value) {
    const status = String(value || "").trim().toUpperCase();
    if (!status) return "LIVE";
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function parseRaw(raw, isMaster) {
    const text = String(raw || "").trim();
    if (!text) return [];

    return text.split("§").map(function (record) {
      const p = record.split("|");
      if (isMaster) {
        if (p.length < 8) return null;
        return {
          date: p[0] || "",
          tariff: p[1] || "",
          adminId: p[2] || "",
          adminName: p[3] || "",
          assigned: p[4] || "0",
          reserve: p[5] || "0",
          allocationStatus: p[6] || "",
          status: p[7] || ""
        };
      }

      if (p.length < 4) return null;
      return {
        date: p[0] || "",
        tariff: p[1] || "",
        assigned: p[2] || "0",
        status: p[3] || ""
      };
    }).filter(Boolean);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .premium-income-card {
        margin-bottom: 18px;
        padding: 18px;
        border: 1px solid rgba(191, 142, 255, 0.34);
        border-radius: 16px;
        background: linear-gradient(145deg, rgba(68, 35, 96, 0.22), rgba(8, 30, 44, 0.80));
        box-shadow: 0 16px 38px rgba(0, 0, 0, 0.20);
      }
      .premium-income-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
      }
      .premium-income-title {
        margin: 0 0 5px;
        font-size: 20px;
        font-weight: 900;
        color: #ffffff;
      }
      .premium-income-sub {
        margin: 0;
        color: #c9b8e8;
        font-size: 13px;
        line-height: 1.5;
      }
      .premium-income-badge {
        flex: 0 0 auto;
        padding: 6px 10px;
        border: 1px solid rgba(191, 142, 255, 0.42);
        border-radius: 999px;
        background: rgba(191, 142, 255, 0.10);
        color: #eadbff;
        font-size: 12px;
        font-weight: 900;
      }
      .premium-income-kpis {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }
      .premium-income-kpi {
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.035);
      }
      .premium-income-kpi span {
        display: block;
        margin-bottom: 4px;
        color: #b9d8e8;
        font-size: 11px;
      }
      .premium-income-kpi strong {
        color: #ffffff;
        font-size: 18px;
      }
      .premium-income-table-wrap {
        overflow-x: auto;
      }
      .premium-income-table {
        width: 100%;
        border-collapse: collapse;
      }
      .premium-income-table th,
      .premium-income-table td {
        padding: 10px 9px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        text-align: left;
        white-space: nowrap;
      }
      .premium-income-table th {
        color: #b9d8e8;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .premium-income-table td {
        color: #ffffff;
        font-size: 13px;
      }
      .premium-income-empty {
        padding: 14px;
        border: 1px dashed rgba(191, 142, 255, 0.25);
        border-radius: 12px;
        color: #b9d8e8;
        text-align: center;
      }
      .premium-income-security {
        margin-top: 12px;
        color: #a9c7d7;
        font-size: 12px;
        line-height: 1.5;
      }
      @media (max-width: 720px) {
        .premium-income-head { display: block; }
        .premium-income-badge { display: inline-flex; margin-top: 8px; }
        .premium-income-kpis { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCard() {
    let card = document.getElementById(COMPONENT_ID);
    if (card) return card;

    const panel = document.getElementById("tab-provisions");
    if (!panel) return null;

    const heading = panel.querySelector(".panel-heading");
    card = document.createElement("article");
    card.id = COMPONENT_ID;
    card.className = "premium-income-card";

    if (heading && heading.nextSibling) {
      panel.insertBefore(card, heading.nextSibling);
    } else {
      panel.appendChild(card);
    }
    return card;
  }

  function render(data) {
    const role = String(data?.role || "").toUpperCase();
    const isMaster = role === "MASTER";
    const rows = parseRaw(data?.premium_eingaenge_raw, isMaster);
    const card = ensureCard();
    if (!card) return;

    const assignedTotal = rows.reduce(function (sum, row) {
      return sum + numberValue(row.assigned);
    }, 0);
    const reserveTotal = isMaster
      ? rows.reduce(function (sum, row) { return sum + numberValue(row.reserve); }, 0)
      : 0;

    const intro = isMaster
      ? "Masteransicht: LIVE-Zuteilungen und zugehörige Reserveentscheidungen aus der Premium-Finanzverteilung."
      : "Hier erscheinen ausschließlich deine tatsächlich zugeteilten LIVE-Premium-Eingänge.";

    const headerCells = isMaster
      ? "<th>Datum</th><th>Tarif</th><th>Empfänger</th><th>Zugeordnet</th><th>Reserve</th><th>Zuteilung</th><th>Status</th>"
      : "<th>Datum</th><th>Tarif</th><th>Dein Eingang</th><th>Status</th>";

    const bodyRows = rows.map(function (row) {
      if (isMaster) {
        return "<tr>" +
          "<td>" + esc(dateLabel(row.date)) + "</td>" +
          "<td>" + esc(tariffLabel(row.tariff)) + "</td>" +
          "<td><strong>" + esc(row.adminName || row.adminId || "–") + "</strong>" +
            (row.adminId ? "<div style=\"color:#9fc3d4;font-size:11px;margin-top:3px\">" + esc(row.adminId) + "</div>" : "") + "</td>" +
          "<td class=\"privacy-sensitive\"><strong>" + esc(euro(row.assigned)) + "</strong></td>" +
          "<td class=\"privacy-sensitive\">" + esc(euro(row.reserve)) + "</td>" +
          "<td>" + esc(statusLabel(row.allocationStatus)) + "</td>" +
          "<td>" + esc(statusLabel(row.status)) + "</td>" +
        "</tr>";
      }

      return "<tr>" +
        "<td>" + esc(dateLabel(row.date)) + "</td>" +
        "<td>" + esc(tariffLabel(row.tariff)) + "</td>" +
        "<td class=\"privacy-sensitive\"><strong>" + esc(euro(row.assigned)) + "</strong></td>" +
        "<td>" + esc(statusLabel(row.status)) + "</td>" +
      "</tr>";
    }).join("");

    const secondaryKpi = isMaster
      ? "<div class=\"premium-income-kpi\"><span>Premium-Event-/Webinarreserve</span><strong class=\"privacy-sensitive\">" + esc(euro(reserveTotal)) + "</strong></div>"
      : "<div class=\"premium-income-kpi\"><span>Datenquelle</span><strong>Nur LIVE &amp; ZUGETEILT</strong></div>";

    const securityText = isMaster
      ? "Die Masteransicht darf Reserveentscheidungen sehen. TEST-Datensätze werden serverseitig nicht in dieses Feld übernommen."
      : "Reservebeträge, Zykluspositionen, andere Gründeranteile und nicht zugeteilte Premium-Eingänge werden nicht an deinen Browser übertragen.";

    card.innerHTML =
      "<div class=\"premium-income-head\">" +
        "<div><h3 class=\"premium-income-title\">💎 Premium-Eingänge</h3><p class=\"premium-income-sub\">" + esc(intro) + "</p></div>" +
        "<span class=\"premium-income-badge\">LIVE · serverseitig gefiltert</span>" +
      "</div>" +
      "<div class=\"premium-income-kpis\">" +
        "<div class=\"premium-income-kpi\"><span>Aktuell zugeteilter Gesamtbetrag</span><strong class=\"privacy-sensitive\">" + esc(euro(assignedTotal)) + "</strong></div>" +
        secondaryKpi +
      "</div>" +
      (rows.length
        ? "<div class=\"premium-income-table-wrap\"><table class=\"premium-income-table\"><thead><tr>" + headerCells + "</tr></thead><tbody>" + bodyRows + "</tbody></table></div>"
        : "<div class=\"premium-income-empty\">Noch keine LIVE-Premium-Eingänge vorhanden.</div>") +
      "<div class=\"premium-income-security\">🔒 " + esc(securityText) + "</div>";
  }

  function install() {
    ensureStyles();
    ensureCard();

    const originalApplyData = window.applyData;
    if (typeof originalApplyData !== "function") {
      console.warn("BetInsight Premium-Eingänge: applyData wurde nicht gefunden.");
      return;
    }

    if (originalApplyData.__premiumEntriesWrapped) return;

    function wrappedApplyData(data) {
      originalApplyData(data);
      try {
        render(data || {});
      } catch (error) {
        console.error("BetInsight Premium-Eingänge konnten nicht gerendert werden:", error);
      }
    }
    wrappedApplyData.__premiumEntriesWrapped = true;
    window.applyData = wrappedApplyData;
  }

  install();
})();
