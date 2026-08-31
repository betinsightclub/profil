from pathlib import Path

p = Path('admin/backoffice/index.html')
s = p.read_text(encoding='utf-8')

old = '<div class="cost-coverage-line" id="sharedCostCoverage">Deckung laufender Monat wird geladen …</div>\n        <div class="cost-rate-plan" id="sharedCostPlan">Aktueller und geplanter Satz werden geladen …</div>'
new = '<div class="cost-coverage-line" id="sharedCostCoverage">Deckung laufender Monat wird geladen …</div>\n        <div class="cost-rate-plan" id="sharedCostPlanning">Offene Planung wird geladen …</div>\n        <div class="cost-rate-plan" id="sharedCostPlan">Aktueller und geplanter Satz werden geladen …</div>'
if 'id="sharedCostPlanning"' not in s:
    if old not in s:
        raise SystemExit('planning html anchor not found')
    s = s.replace(old, new, 1)

anchor = '      const difference = num(summary?.difference_eur);\n      const effective = String(summary?.next_prepayment_effective || "");\n'
repl = '      const difference = num(summary?.difference_eur);\n      const plannedKnown = num(summary?.planned_costs_known_eur);\n      const plannedCount = Math.max(0, Math.floor(num(summary?.planned_costs_open_count)));\n      const expectedKnown = num(summary?.expected_total_known_eur || totalCosts + plannedKnown);\n      const effective = String(summary?.next_prepayment_effective || "");\n'
if 'const plannedKnown = num(summary?.planned_costs_known_eur);' not in s:
    if anchor not in s:
        raise SystemExit('planning js anchor 1 not found')
    s = s.replace(anchor, repl, 1)

anchor2 = '      const plan = document.getElementById("sharedCostPlan");\n'
block = '''      const planning = document.getElementById("sharedCostPlanning");
      if (planning) {
        if (plannedCount > 0) {
          planning.innerHTML = plannedKnown > 0
            ? "<strong>Offene/geplante Kosten:</strong> " + escapeHtml(formatEuro(plannedKnown)) +
              " · " + escapeHtml(String(plannedCount)) + " offene Position" + (plannedCount === 1 ? "" : "en") +
              " · <strong>bekannte Gesamtkosten inkl. Planung:</strong> " + escapeHtml(formatEuro(expectedKnown))
            : "<strong>Offene Planung:</strong> " + escapeHtml(String(plannedCount)) + " Position" + (plannedCount === 1 ? "" : "en") +
              " · Betrag noch offen · <strong>aktuell gebuchte Gesamtkosten:</strong> " + escapeHtml(formatEuro(totalCosts));
        } else {
          planning.innerHTML = "<strong>Offene Planung:</strong> keine · <strong>Gesamtkosten:</strong> " + escapeHtml(formatEuro(totalCosts));
        }
      }

      const plan = document.getElementById("sharedCostPlan");
'''
if 'const planning = document.getElementById("sharedCostPlanning");' not in s:
    if anchor2 not in s:
        raise SystemExit('planning js anchor 2 not found')
    s = s.replace(anchor2, block, 1)

s = s.replace('Version: 2026.08.29-BACKOFFICE-v2.24-KOSTEN-TRANSPARENZ', 'Version: 2026.08.30-BACKOFFICE-v2.25-KOSTEN-PLANUNG', 1)
p.write_text(s, encoding='utf-8')
