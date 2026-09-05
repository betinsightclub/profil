/*
BetInsight – Premium-Eingänge Backoffice-Komponente
Stand: 2026-09-05 · getrennte Master-/Partneransicht

Sicherheitsprinzip:
- Unit-Provisionen bleiben unverändert im bestehenden Bereich "Provisionen".
- Premium erhält einen eigenen Tab und eigene Anzeige.
- Partner sehen ausschließlich serverseitig vorgefilterte LIVE-Zuteilungen.
- Nicht zugeteilte Premium-Eingänge, Reserve-/Zyklusdaten und Fremdanteile werden Partnern nicht geliefert.
- Premium-Netzwerkprovisionen werden hier NICHT prozentual berechnet; angezeigt werden bereits gebuchte Beträge.
- Änderungen der Zuteilung sind ausschließlich MASTER-gesichert und gelten nur für künftige Eingänge.
*/
(function () {
  "use strict";

  const PREMIUM_PANEL_ID = "tab-premium";
  const PREMIUM_TAB_ID = "premiumTabButton";
  const STYLE_ID = "premiumEingaengeStyle";
  const PREMIUM_RULE_API_URL = "https://hook.eu1.make.com/6jrn446fmzuaqpqf66xs0ihege1c5cnp";

  let lastPremiumData = null;

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function euro(value, maxDigits = 6) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDigits
    }).format(num(value));
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
    const value = String(code || "").trim().toUpperCase();
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

  function parsePremiumRows(raw, isMaster) {
    const text = String(raw || "").trim();
    if (!text) return [];

    return text.split("§").map(function (record) {
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
          referralPool: p[6] || "0",
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
        referralPool: p[3] || "0",
        plisio: p[4] || "0",
        founderBase: p[5] || "0",
        assigned: p[6] || "0",
        status: p[7] || ""
      };
    }).filter(Boolean);
  }

  function parseAllocationRules(raw) {
    const text = String(raw || "").trim();
    if (!text) return [];

    return text.split("§").map(function (record) {
      const p = record.split("|");
      if (p.length < 8) return null;
      return {
        adminId: p[0] || "",
        adminName: p[1] || "",
        mode: p[2] || "",
        cycleSize: Math.max(1, Math.floor(num(p[3]) || 10)),
        assignedPerCycle: Math.max(0, Math.min(10, Math.floor(num(p[4])))),
        offset: Math.floor(num(p[5])),
        validFrom: p[6] || "",
        ruleId: p[7] || ""
      };
    }).filter(Boolean);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .tabs { grid-template-columns: repeat(6, minmax(0, 1fr)); }

      .premium-panel-heading-note {
        max-width: 880px;
      }

      .premium-master-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .premium-rule-card {
        padding: 16px;
        border: 1px solid rgba(191, 142, 255, 0.30);
        border-radius: 14px;
        background: linear-gradient(145deg, rgba(68, 35, 96, 0.18), rgba(8, 30, 44, 0.52));
      }

      .premium-rule-card h3 {
        margin: 0 0 6px;
      }

      .premium-rule-current {
        margin-bottom: 13px;
        color: #cbb9ea;
        font-size: 13px;
      }

      .premium-rule-controls {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: end;
      }

      .premium-rule-controls label {
        display: block;
        margin-bottom: 6px;
        color: #b9d8e8;
        font-size: 12px;
        font-weight: 800;
      }

      .premium-rule-controls select {
        width: 100%;
        min-height: 42px;
        padding: 9px 10px;
        border: 1px solid rgba(185, 216, 232, 0.24);
        border-radius: 10px;
        background: #082536;
        color: #ffffff;
      }

      .premium-rule-message {
        min-height: 20px;
        margin-top: 10px;
        color: #b9d8e8;
        font-size: 12px;
        line-height: 1.45;
      }

      .premium-rule-message.success { color: #8af0ca; }
      .premium-rule-message.error { color: #ff9fa7; }

      .premium-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .premium-summary-card {
        padding: 13px;
        border: 1px solid rgba(185, 216, 232, 0.14);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.035);
      }

      .premium-summary-card span {
        display: block;
        margin-bottom: 4px;
        color: #b9d8e8;
        font-size: 11px;
      }

      .premium-summary-card strong {
        color: #ffffff;
        font-size: 18px;
      }

      .premium-table-note {
        margin-top: 12px;
        color: #aac6d5;
        font-size: 12px;
        line-height: 1.5;
      }

      .premium-separation-note {
        margin-bottom: 16px;
        padding: 12px 14px;
        border: 1px solid rgba(0, 218, 255, 0.18);
        border-radius: 12px;
        background: rgba(0, 218, 255, 0.045);
        color: #b9d8e8;
        font-size: 13px;
        line-height: 1.5;
      }

      .premium-status-chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border: 1px solid rgba(0, 212, 138, 0.26);
        border-radius: 999px;
        background: rgba(0, 212, 138, 0.08);
        color: #98f2d1;
        font-size: 11px;
        font-weight: 800;
      }

      @media (max-width: 900px) {
        .tabs { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .premium-master-grid { grid-template-columns: 1fr; }
        .premium-summary-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 620px) {
        .tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .premium-rule-controls { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePremiumTab() {
    let button = document.getElementById(PREMIUM_TAB_ID);
    if (button) return button;

    const tabs = document.querySelector(".tabs");
    if (!tabs) return null;

    button = document.createElement("button");
    button.id = PREMIUM_TAB_ID;
    button.className = "tab-button";
    button.type = "button";
    button.dataset.tab = "premium";
    button.setAttribute("aria-selected", "false");
    button.textContent = "💎 Premium";

    const payoutButton = tabs.querySelector('[data-tab="payout"]');
    if (payoutButton) tabs.insertBefore(button, payoutButton);
    else tabs.appendChild(button);

    button.addEventListener("click", function () {
      if (typeof window.activateTab === "function") {
        window.activateTab("premium");
      } else {
        document.querySelectorAll(".tab-button").forEach(function (item) {
          item.setAttribute("aria-selected", item === button ? "true" : "false");
        });
        document.querySelectorAll("[data-panel]").forEach(function (panel) {
          panel.classList.toggle("active", panel.dataset.panel === "premium");
        });
      }
    });

    return button;
  }

  function ensurePremiumPanel() {
    let panel = document.getElementById(PREMIUM_PANEL_ID);
    if (panel) return panel;

    const provisions = document.getElementById("tab-provisions");
    if (!provisions || !provisions.parentNode) return null;

    panel = document.createElement("section");
    panel.className = "panel";
    panel.id = PREMIUM_PANEL_ID;
    panel.dataset.panel = "premium";

    const next = provisions.nextSibling;
    if (next) provisions.parentNode.insertBefore(panel, next);
    else provisions.parentNode.appendChild(panel);

    return panel;
  }

  function removeOldEmbeddedCard() {
    const old = document.getElementById("premiumEingaengeCard");
    if (old) old.remove();
  }

  function allocationOptions(selected) {
    let html = "";
    for (let i = 10; i >= 0; i -= 1) {
      html += '<option value="' + i + '"' + (i === selected ? " selected" : "") + ">" +
        i + " von 10 Premium-Eingängen</option>";
    }
    return html;
  }

  function ruleFor(rules, adminId) {
    return rules.find(function (rule) { return rule.adminId === adminId; }) || {
      adminId,
      adminName: adminId === "ADM-002" ? "Martin" : "Frank",
      cycleSize: 10,
      assignedPerCycle: 10,
      validFrom: ""
    };
  }

  function masterRuleCard(rule) {
    const adminId = esc(rule.adminId);
    const current = Math.max(0, Math.min(10, Math.floor(num(rule.assignedPerCycle))));
    return `
      <article class="premium-rule-card" data-premium-rule="${adminId}">
        <h3>${esc(rule.adminName || rule.adminId)}</h3>
        <div class="premium-rule-current">
          Aktuell: <strong>${current} von 10</strong> Premium-Eingängen werden zugeteilt.
          ${rule.validFrom ? " · gültig seit " + esc(dateLabel(rule.validFrom)) : ""}
        </div>
        <div class="premium-rule-controls">
          <div>
            <label for="premiumRule_${adminId}">Künftige Premium-Eingänge zuteilen</label>
            <select id="premiumRule_${adminId}" data-premium-rule-select="${adminId}">
              ${allocationOptions(current)}
            </select>
          </div>
          <button class="button button-primary" type="button" data-premium-rule-save="${adminId}">
            Einstellung speichern
          </button>
        </div>
        <div class="premium-rule-message" data-premium-rule-message="${adminId}"></div>
      </article>
    `;
  }

  function renderMaster(data, rows, rules, panel) {
    const assignedTotal = rows.reduce(function (sum, row) { return sum + num(row.assigned); }, 0);
    const reserveTotal = rows.reduce(function (sum, row) { return sum + num(row.reserve); }, 0);

    const martin = ruleFor(rules, "ADM-002");
    const frank = ruleFor(rules, "ADM-003");

    const bodyRows = rows.map(function (row) {
      return `
        <tr>
          <td>${esc(dateLabel(row.date))}</td>
          <td><strong>${esc(tariffLabel(row.tariff))}</strong><div class="route-hint">${esc(row.paymentId || "")}</div></td>
          <td>${esc(row.adminName || row.adminId || "–")}</td>
          <td class="privacy-sensitive">${esc(euro(row.gross))}</td>
          <td class="privacy-sensitive">${esc(euro(row.referralPool))}</td>
          <td class="privacy-sensitive">${esc(euro(row.referralActual))}</td>
          <td class="privacy-sensitive">${esc(euro(row.poolRemainder))}</td>
          <td class="privacy-sensitive">${esc(euro(row.plisio))}</td>
          <td class="privacy-sensitive">${esc(euro(row.founderBase))}</td>
          <td class="privacy-sensitive"><strong>${esc(euro(row.assigned))}</strong></td>
          <td class="privacy-sensitive">${esc(euro(row.reserve))}</td>
          <td>${esc(statusLabel(row.allocationStatus))}</td>
          <td><span class="premium-status-chip">${esc(statusLabel(row.status))}</span></td>
        </tr>
      `;
    }).join("");

    panel.innerHTML = `
      <div class="panel-heading">
        <div class="premium-panel-heading-note">
          <h2>💎 Premium – Mastersteuerung</h2>
          <p class="muted">
            Premium-Einnahmen und Zuteilung sind vollständig vom Unit-Provisionsbereich getrennt.
            Die Einstellung unten gilt ausschließlich für künftige Premium-Eingänge.
          </p>
        </div>
      </div>

      <div class="premium-separation-note">
        <strong>Nur Master:</strong> Du legst fest, wie viele der nächsten Premium-Eingänge Martin bzw. Frank zugeteilt werden.
        Nicht zugeteilte Eingänge bleiben für den jeweiligen Partner vollständig unsichtbar. Bereits gebuchte Zahlungen werden nicht rückwirkend verändert.
      </div>

      <div class="premium-master-grid">
        ${masterRuleCard(martin)}
        ${masterRuleCard(frank)}
      </div>

      <div class="section-grid">
        <article class="content-card full">
          <h3>Premium-Eingänge · interne Gesamtansicht</h3>
          <p class="muted">
            Diese Tabelle zeigt dir die vollständige LIVE-Finanzaufteilung. Premium-Netzwerkprovisionen werden nicht hier neu berechnet,
            sondern als bereits gebuchte Beträge übernommen.
          </p>

          <div class="premium-summary-grid">
            <div class="premium-summary-card">
              <span>Zugewiesen gesamt</span>
              <strong class="privacy-sensitive">${esc(euro(assignedTotal))}</strong>
            </div>
            <div class="premium-summary-card">
              <span>Nicht zugeteilt · Premium-Reserve</span>
              <strong class="privacy-sensitive">${esc(euro(reserveTotal))}</strong>
            </div>
            <div class="premium-summary-card">
              <span>LIVE-Zuteilungszeilen</span>
              <strong>${rows.length}</strong>
            </div>
          </div>

          <div class="table-wrap">
            <table aria-label="Premium-Eingänge Master">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Tarif / Zahlung</th>
                  <th>Empfänger</th>
                  <th>Eingang</th>
                  <th>Referral-/Premium-Pool</th>
                  <th>Ref tatsächlich</th>
                  <th>Pool-Rest</th>
                  <th>Plisio</th>
                  <th>Gründerrest</th>
                  <th>Zugewiesen</th>
                  <th>Reserve</th>
                  <th>Entscheidung</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length ? bodyRows : '<tr><td colspan="13"><div class="empty-state">Noch keine LIVE-Premium-Eingänge vorhanden.</div></td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="premium-table-note">
            🔒 Nur deine Masteransicht enthält interne Zuteilungs- und Reserveinformationen. TEST-Datensätze werden nicht in diese LIVE-Anzeige übernommen.
          </div>
        </article>
      </div>
    `;

    bindMasterControls();
  }

  function renderPartner(data, rows, panel) {
    const grossTotal = rows.reduce(function (sum, row) { return sum + num(row.gross); }, 0);
    const assignedTotal = rows.reduce(function (sum, row) { return sum + num(row.assigned); }, 0);

    const bodyRows = rows.map(function (row) {
      return `
        <tr>
          <td>${esc(dateLabel(row.date))}</td>
          <td><strong>${esc(tariffLabel(row.tariff))}</strong></td>
          <td class="privacy-sensitive">${esc(euro(row.gross))}</td>
          <td class="privacy-sensitive">${esc(euro(row.referralPool))}</td>
          <td class="privacy-sensitive">${esc(euro(row.plisio))}</td>
          <td class="privacy-sensitive">${esc(euro(row.founderBase))}</td>
          <td class="privacy-sensitive"><strong>${esc(euro(row.assigned))}</strong></td>
          <td><span class="premium-status-chip">${esc(statusLabel(row.status))}</span></td>
        </tr>
      `;
    }).join("");

    panel.innerHTML = `
      <div class="panel-heading">
        <div class="premium-panel-heading-note">
          <h2>💎 Premium-Eingänge</h2>
          <p class="muted">
            Deine zugeteilten Premium-Einnahmen – separat von den Unit-Paketeinnahmen.
          </p>
        </div>
      </div>

      <div class="premium-separation-note">
        Hier erscheinen ausschließlich Premium-Eingänge, die dir tatsächlich zugeteilt wurden.
        Nicht zugeteilte Zahlungen werden nicht an dein Backoffice übertragen.
      </div>

      <div class="section-grid">
        <article class="content-card full">
          <h3>Meine Premium-Eingänge</h3>
          <p class="muted">
            Wie bei den Unit-Paketeinnahmen siehst du den Eingang, den Referral-/Premium-Abzug, die Plisio-Gebühr,
            den verbleibenden Gründerrest und deinen persönlichen Anteil.
          </p>

          <div class="premium-summary-grid">
            <div class="premium-summary-card">
              <span>Zugeordnete Zahlungseingänge</span>
              <strong class="privacy-sensitive">${esc(euro(grossTotal))}</strong>
            </div>
            <div class="premium-summary-card">
              <span>Dein Premium-Anteil</span>
              <strong class="privacy-sensitive">${esc(euro(assignedTotal))}</strong>
            </div>
            <div class="premium-summary-card">
              <span>Zugeordnete Eingänge</span>
              <strong>${rows.length}</strong>
            </div>
          </div>

          <div class="table-wrap">
            <table aria-label="Eigene Premium-Eingänge">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Tarif</th>
                  <th>Eingang</th>
                  <th>Referral-/Premium-Abzug</th>
                  <th>Plisio-Abzug</th>
                  <th>Verteilbarer Gründerrest</th>
                  <th>Dein Anteil von BetInsight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length ? bodyRows : '<tr><td colspan="8"><div class="empty-state">Noch keine dir zugeteilten LIVE-Premium-Eingänge vorhanden.</div></td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="premium-table-note">
            Der Referral-/Premium-Abzug wird als Gesamtbetrag dargestellt. Interne Zuteilungs-, Reserve- oder Fremdanteile sind nicht Bestandteil deiner Ansicht.
          </div>
        </article>
      </div>
    `;
  }

  function render(data) {
    lastPremiumData = data || {};

    removeOldEmbeddedCard();
    ensureStyles();
    ensurePremiumTab();
    const panel = ensurePremiumPanel();
    if (!panel) return;

    const role = String(data?.role || "").toUpperCase();
    const isMaster = role === "MASTER";
    const rows = parsePremiumRows(data?.premium_eingaenge_raw, isMaster);
    const rules = isMaster ? parseAllocationRules(data?.premium_zuteilungsregeln_raw) : [];

    if (isMaster) renderMaster(data, rows, rules, panel);
    else renderPartner(data, rows, panel);
  }

  function localRequestId() {
    return (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
  }

  async function saveMasterRule(adminId, button) {
    const select = document.querySelector('[data-premium-rule-select="' + adminId + '"]');
    const message = document.querySelector('[data-premium-rule-message="' + adminId + '"]');
    const value = Math.floor(num(select?.value));

    if (!Number.isInteger(value) || value < 0 || value > 10) {
      if (message) {
        message.textContent = "Bitte einen Wert zwischen 0 und 10 wählen.";
        message.className = "premium-rule-message error";
      }
      return;
    }

    if (
      typeof window.getCurrentAdmin !== "function" ||
      typeof window.sha256Hex !== "function"
    ) {
      if (message) {
        message.textContent = "Die sichere Admin-Session konnte nicht gelesen werden.";
        message.className = "premium-rule-message error";
      }
      return;
    }

    const current = window.getCurrentAdmin();
    if (!current?.session?.token || current?.admin?.role !== "owner") {
      if (message) {
        message.textContent = "Diese Einstellung ist ausschließlich im Master-Zugang verfügbar.";
        message.className = "premium-rule-message error";
      }
      return;
    }

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Wird sicher gespeichert …";
    if (message) {
      message.textContent = "Master-Session wird geprüft. Die neue Regel gilt nur für künftige Premium-Eingänge …";
      message.className = "premium-rule-message";
    }

    try {
      const sessionHash = await window.sha256Hex(current.session.token);
      const response = await fetch(PREMIUM_RULE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        body: JSON.stringify({
          action: "save_premium_allocation",
          session_hash: sessionHash,
          target_admin_id: adminId,
          assigned_per_10: value,
          request_id: localRequestId()
        })
      });

      const raw = await response.text();
      let result = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch (error) {
        throw new Error("Der sichere Premium-Regelwebhook hat keine gültige JSON-Antwort geliefert.");
      }

      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.message || result?.error || "Die Premium-Zuteilung konnte nicht gespeichert werden.");
      }

      if (message) {
        message.textContent = result.message || "Premium-Zuteilung wurde gespeichert.";
        message.className = "premium-rule-message success";
      }

      if (typeof window.loadBackofficeData === "function") {
        await window.loadBackofficeData();
      }
    } catch (error) {
      if (message) {
        message.textContent = error?.message || "Die Premium-Zuteilung konnte nicht gespeichert werden.";
        message.className = "premium-rule-message error";
      }
    } finally {
      button.disabled = false;
      button.textContent = previousText;
    }
  }

  function bindMasterControls() {
    document.querySelectorAll("[data-premium-rule-save]").forEach(function (button) {
      if (button.dataset.boundPremiumRule === "1") return;
      button.dataset.boundPremiumRule = "1";
      button.addEventListener("click", function () {
        saveMasterRule(String(button.dataset.premiumRuleSave || ""), button);
      });
    });
  }

  function install() {
    removeOldEmbeddedCard();
    ensureStyles();
    ensurePremiumTab();
    ensurePremiumPanel();

    const originalApplyData = window.applyData;
    if (typeof originalApplyData !== "function") {
      console.warn("BetInsight Premium: applyData wurde nicht gefunden.");
      return;
    }

    if (originalApplyData.__premiumSeparatedWrapped) return;

    function wrappedApplyData(data) {
      originalApplyData(data);
      try {
        render(data || {});
      } catch (error) {
        console.error("BetInsight Premium-Anzeige konnte nicht gerendert werden:", error);
      }
    }

    wrappedApplyData.__premiumSeparatedWrapped = true;
    window.applyData = wrappedApplyData;

    if (lastPremiumData) render(lastPremiumData);
  }

  install();
})();
