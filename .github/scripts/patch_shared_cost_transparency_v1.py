from pathlib import Path

p = Path('admin/backoffice/index.html')
s = p.read_text(encoding='utf-8')

s = s.replace(
    'Version: 2026.08.28-BACKOFFICE-v2.23-FREISCHALTUNGEN',
    'Version: 2026.08.29-BACKOFFICE-v2.24-KOSTEN-TRANSPARENZ',
    1,
)

if '.cost-transparency-grid {' not in s:
    css = r'''
    /* v2.24 – Gemeinsame Betriebskosten-Transparenz */
    .cost-transparency-card {
      margin-top: 16px;
      margin-bottom: 18px;
      border-color: rgba(0, 218, 255, 0.30);
      background: linear-gradient(180deg, rgba(7, 48, 66, 0.92), rgba(4, 30, 43, 0.94));
    }
    .cost-transparency-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .cost-transparency-stat {
      position: relative;
      overflow: hidden;
      isolation: isolate;
      min-width: 0;
      padding: 15px;
      border: 1px solid rgba(185, 216, 232, 0.15);
      border-radius: 13px;
      background: rgba(1, 12, 19, 0.34);
    }
    .cost-transparency-stat::after {
      content: "";
      position: absolute;
      z-index: 0;
      width: 110px;
      height: 110px;
      right: -55px;
      bottom: -55px;
      border-radius: 50%;
      background: radial-gradient(circle at 32% 30%, rgba(34,211,255,.20) 0%, rgba(0,212,138,.07) 55%, transparent 72%);
      border: 1px solid rgba(64,216,255,.12);
      pointer-events: none;
    }
    .cost-transparency-stat > * { position: relative; z-index: 1; }
    .cost-transparency-label {
      display: block;
      margin-bottom: 7px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .cost-transparency-value {
      display: block;
      color: #fff;
      font-size: 23px;
      font-weight: 900;
      line-height: 1.15;
    }
    .cost-transparency-note {
      display: block;
      margin-top: 6px;
      color: #9fc7d8;
      font-size: 12px;
      line-height: 1.4;
    }
    .cost-coverage-line,
    .cost-rate-plan {
      margin-top: 12px;
      padding: 11px 13px;
      border-radius: 11px;
      border: 1px solid rgba(185,216,232,.15);
      background: rgba(255,255,255,.035);
      color: #d8edf6;
      font-size: 13px;
      line-height: 1.5;
    }
    .cost-coverage-line.positive {
      border-color: rgba(0,212,138,.30);
      background: rgba(0,212,138,.08);
      color: #a9f7dc;
    }
    .cost-coverage-line.negative {
      border-color: rgba(255,125,134,.32);
      background: rgba(255,125,134,.075);
      color: #ffc6ca;
    }
    .cost-master-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 12px;
      margin-top: 14px;
      padding: 14px;
      border: 1px solid rgba(255,218,118,.28);
      border-radius: 12px;
      background: rgba(255,218,118,.06);
    }
    .cost-master-control .field { margin: 0; }
    .cost-master-control input { max-width: 220px; }
    .cost-rate-message { grid-column: 1 / -1; margin-top: 0; }
    @media (max-width: 760px) {
      .cost-transparency-grid,
      .cost-master-control { grid-template-columns: 1fr; }
      .cost-master-control input { max-width: none; }
    }
'''
    pos = s.find('</style>')
    if pos < 0:
        raise SystemExit('style end marker not found')
    s = s[:pos] + css + '\n' + s[pos:]

if 'id="sharedCostOverviewCard"' not in s:
    anchor = '''      </div>\n\n      <div class="section-grid">\n        <article class="content-card full personal-tipster-card hidden" id="personalTipsterCard">'''
    block = '''      </div>\n\n      <article class="content-card full cost-transparency-card" id="sharedCostOverviewCard">\n        <div class="panel-heading">\n          <div>\n            <h3>🏢 Betriebskosten &amp; Kostenreserve</h3>\n            <p class="muted">Gemeinsame Betriebskosten und der dafür zurückgelegte Umsatzanteil – für alle Admins transparent.</p>\n          </div>\n          <div class="route-hint" id="sharedCostMonthLabel">Aktueller Monat</div>\n        </div>\n\n        <div class="cost-transparency-grid">\n          <div class="cost-transparency-stat">\n            <span class="cost-transparency-label">Betriebskosten laufender Monat</span>\n            <span class="cost-transparency-value privacy-sensitive" id="sharedCostCurrent">0,00 €</span>\n            <span class="cost-transparency-note">Tatsächlich auf den laufenden Monat entfallende gemeinsame Kosten.</span>\n          </div>\n          <div class="cost-transparency-stat">\n            <span class="cost-transparency-label">Gebuchte Betriebskosten gesamt</span>\n            <span class="cost-transparency-value privacy-sensitive" id="sharedCostTotal">0,00 €</span>\n            <span class="cost-transparency-note">Summe aller bisher genehmigten und erfassten Rechnungen.</span>\n          </div>\n          <div class="cost-transparency-stat">\n            <span class="cost-transparency-label">Betriebskostenbeitrag aus Umsätzen</span>\n            <span class="cost-transparency-value privacy-sensitive" id="sharedCostContribution">0,00 €</span>\n            <span class="cost-transparency-note" id="sharedCostRateNote">Aktueller Satz: 2,50 %</span>\n          </div>\n        </div>\n\n        <div class="cost-coverage-line" id="sharedCostCoverage">Deckung laufender Monat wird geladen …</div>\n        <div class="cost-rate-plan" id="sharedCostPlan">Aktueller und geplanter Satz werden geladen …</div>\n\n        <div class="cost-master-control hidden" id="costMasterControl">\n          <div class="field">\n            <label for="nextCostPctInput">Betriebskostenbeitrag für Folgemonat</label>\n            <input id="nextCostPctInput" type="number" min="0" max="20" step="0.10" inputmode="decimal">\n            <div class="route-hint" id="nextCostEffectiveHint">Gilt ausschließlich ab dem Folgemonat; keine Rückwirkung.</div>\n          </div>\n          <button class="button button-green" type="button" id="saveNextCostPctButton">Ab nächstem Monat übernehmen</button>\n          <div id="costRateMessage" class="master-action-message cost-rate-message"></div>\n        </div>\n      </article>\n\n      <div class="section-grid">\n        <article class="content-card full personal-tipster-card hidden" id="personalTipsterCard">'''
    if anchor not in s:
        raise SystemExit('overview insertion anchor not found')
    s = s.replace(anchor, block, 1)

if 'const COST_RATE_API_URL' not in s:
    anchor = '    const SESSION_KEY = "betinsight_admin_session_v1";\n'
    block = '''    const SESSION_KEY = "betinsight_admin_session_v1";\n    const COST_RATE_SESSION_API_READY = true;\n    const COST_RATE_API_URL = "https://hook.eu1.make.com/d0np6cadeelzhiqf8qmab97i5v5iw0oo";\n'''
    if anchor not in s:
        raise SystemExit('SESSION_KEY anchor not found')
    s = s.replace(anchor, block, 1)

if 'function renderSharedCosts' not in s:
    anchor = '    function applyData(data) {\n'
    functions = r'''    function formatCostDate(value) {
      const text = String(value || "").trim();
      if (!text) return "–";
      const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return text;
      return match[3] + "." + match[2] + "." + match[1];
    }

    function renderSharedCosts(summary, isMaster) {
      const currentCosts = num(summary?.actual_costs_eur);
      const totalCosts = num(summary?.total_recorded_costs_eur);
      const contribution = num(summary?.prepayment_eur);
      const currentRate = num(summary?.prepayment_pct);
      const nextRate = summary?.next_prepayment_pct !== undefined ? num(summary.next_prepayment_pct) : currentRate;
      const difference = num(summary?.difference_eur);
      const effective = String(summary?.next_prepayment_effective || "");

      const monthLabel = document.getElementById("sharedCostMonthLabel");
      if (monthLabel) monthLabel.textContent = String(summary?.display_month || summary?.month || "Aktueller Monat");
      const currentEl = document.getElementById("sharedCostCurrent");
      const totalEl = document.getElementById("sharedCostTotal");
      const contributionEl = document.getElementById("sharedCostContribution");
      const rateNote = document.getElementById("sharedCostRateNote");
      if (currentEl) currentEl.textContent = formatEuro(currentCosts);
      if (totalEl) totalEl.textContent = formatEuro(totalCosts);
      if (contributionEl) contributionEl.textContent = formatEuro(contribution);
      if (rateNote) rateNote.textContent = "Aktueller Satz: " + formatNumber(currentRate, 2) + " %";

      const coverage = document.getElementById("sharedCostCoverage");
      if (coverage) {
        coverage.classList.remove("positive", "negative");
        coverage.classList.add(difference >= 0 ? "positive" : "negative");
        coverage.innerHTML = "<strong>Deckung laufender Monat:</strong> " +
          escapeHtml(formatEuro(contribution)) + " von " + escapeHtml(formatEuro(currentCosts)) +
          " · Differenz: <strong>" + escapeHtml((difference > 0 ? "+" : "") + formatEuro(difference)) + "</strong>";
      }

      const plan = document.getElementById("sharedCostPlan");
      if (plan) {
        plan.innerHTML = "<strong>Aktueller Satz:</strong> " + escapeHtml(formatNumber(currentRate, 2) + " %") +
          " · <strong>ab " + escapeHtml(formatCostDate(effective)) + " geplant:</strong> " +
          escapeHtml(formatNumber(nextRate, 2) + " %") +
          " · Änderungen gelten nicht rückwirkend.";
      }

      const control = document.getElementById("costMasterControl");
      if (control) control.classList.toggle("hidden", !isMaster);
      const input = document.getElementById("nextCostPctInput");
      if (input && document.activeElement !== input) input.value = nextRate.toFixed(2);
      const hint = document.getElementById("nextCostEffectiveHint");
      if (hint) hint.textContent = "Wirksam ab " + formatCostDate(effective) + ". Der laufende Monat bleibt bei " + formatNumber(currentRate, 2) + " %.";
    }

    async function saveNextCostRate() {
      const current = getCurrentAdmin();
      const button = document.getElementById("saveNextCostPctButton");
      const input = document.getElementById("nextCostPctInput");
      const message = document.getElementById("costRateMessage");
      const value = num(input?.value);

      if (!current.session || current.admin?.role !== "owner") {
        setActionMessage(message, "Diese Änderung ist ausschließlich im Master-Zugang erlaubt.", "error");
        return;
      }
      if (!COST_RATE_SESSION_API_READY || !COST_RATE_API_URL) {
        setActionMessage(message, "Der sichere Schreibweg ist noch nicht verbunden.", "error");
        return;
      }
      if (!Number.isFinite(value) || value < 0 || value > 20) {
        setActionMessage(message, "Bitte einen Wert zwischen 0 und 20 Prozent eintragen.", "error");
        return;
      }

      button.disabled = true;
      button.textContent = "Wird gespeichert …";
      setActionMessage(message, "Master-Session wird geprüft. Der Satz wird ausschließlich für den Folgemonat festgelegt …", "success");
      try {
        const sessionHash = await sha256Hex(current.session.token);
        const response = await fetch(COST_RATE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          credentials: "omit",
          body: JSON.stringify({
            action: "save_next_cost_pct",
            session_hash: sessionHash,
            new_pct: value,
            request_id: requestId()
          })
        });
        const raw = await response.text();
        let result;
        try { result = parseWebhookJsonSafe(raw); }
        catch (error) { throw new Error("Der Betriebskosten-Webhook lieferte keine gültige Antwort."); }
        if (!response.ok || result?.ok !== true) throw new Error(result?.message || "Der neue Satz konnte nicht gespeichert werden.");
        setActionMessage(message, result.message || "Betriebskostenbeitrag für den Folgemonat gespeichert.", "success");
        await loadBackofficeData();
      } catch (error) {
        setActionMessage(message, error?.message || "Der neue Satz konnte nicht gespeichert werden.", "error");
      } finally {
        button.disabled = false;
        button.textContent = "Ab nächstem Monat übernehmen";
      }
    }

'''
    if anchor not in s:
        raise SystemExit('applyData anchor not found')
    s = s.replace(anchor, functions + anchor, 1)

if 'const costsSummary = parseJsonValue(data.costs_summary' not in s:
    anchor = '      masterTabButton.classList.toggle("hidden", !isMaster);\n\n      document.getElementById("availableBalance")'
    replacement = '      masterTabButton.classList.toggle("hidden", !isMaster);\n      const costsSummary = parseJsonValue(data.costs_summary, {});\n      renderSharedCosts(costsSummary, isMaster);\n\n      document.getElementById("availableBalance")'
    if anchor not in s:
        raise SystemExit('applyData insertion anchor not found')
    s = s.replace(anchor, replacement, 1)

if 'saveNextCostPctButton")?.addEventListener' not in s:
    anchor = '    reloadButton.addEventListener("click", loadBackofficeData);\n'
    replacement = '    document.getElementById("saveNextCostPctButton")?.addEventListener("click", saveNextCostRate);\n' + anchor
    if anchor not in s:
        raise SystemExit('listener anchor not found')
    s = s.replace(anchor, replacement, 1)

s = s.replace('<th>Betriebskosten 2,5 %</th>', '<th>Betriebskostenbeitrag</th>')
s = s.replace(
    'Davon werden 2,5 % Betriebskostenvorauszahlung und 10 % Affiliate-Reserve abgezogen.',
    'Davon werden der für den jeweiligen Monat gültige Betriebskostenbeitrag und 10 % Affiliate-Reserve abgezogen.',
)

p.write_text(s, encoding='utf-8')
