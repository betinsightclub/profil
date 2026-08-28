from pathlib import Path

path = Path("admin/backoffice/index.html")
text = path.read_text(encoding="utf-8")
original = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    "Version: 2026.08.28-BACKOFFICE-v2.22-REGISTRIERUNGEN",
    "Version: 2026.08.28-BACKOFFICE-v2.23-FREISCHALTUNGEN",
    "version",
)

replace_once(
    """                  <th>Quote</th>\n                  <th>Ergebnis</th>""",
    """                  <th>Quote</th>\n                  <th>Freischaltungen</th>\n                  <th>Ergebnis</th>""",
    "master results header",
)

replace_once(
    '<tr><td colspan="7"><div class="empty-state">Noch keine Ergebnisdaten geladen.</div></td></tr>',
    '<tr><td colspan="8"><div class="empty-state">Noch keine Ergebnisdaten geladen.</div></td></tr>',
    "initial master results colspan",
)

replace_once(
    """    let latestTipsterHistory = [];\n    let latestTipsterTipResults = [];\n    let selectedHistoryWeek = \"\";""",
    """    let latestTipsterHistory = [];\n    let latestTipsterTipResults = [];\n    let latestTipUnlockCounts = new Map();\n    let selectedHistoryWeek = \"\";""",
    "unlock state",
)

parser_code = r'''    function parseTipUnlockCountsRaw(raw) {
      const counts = new Map();
      const text = String(raw || "").trim();
      if (!text) return counts;

      text.split("§").forEach(function (record) {
        const separator = record.lastIndexOf("|");
        if (separator <= 0) return;
        const tipId = normalizeText(record.slice(0, separator));
        const count = Math.max(0, Math.floor(num(record.slice(separator + 1))));
        if (tipId) counts.set(tipId, count);
      });

      return counts;
    }

    function tipUnlockCount(tipId) {
      const id = normalizeText(tipId);
      if (!id) return 0;
      return Math.max(0, Math.floor(num(latestTipUnlockCounts.get(id) || 0)));
    }

    function unlockCountForItems(items) {
      return (Array.isArray(items) ? items : [])
        .filter(function (item) { return item && !item.display_only; })
        .reduce(function (sum, item) {
          return sum + tipUnlockCount(firstDefined(item, ["tip_id", "tipp_id", "id"], ""));
        }, 0);
    }

'''

replace_once(
    "    function normalizeTipsterTipResults(items) {",
    parser_code + "    function normalizeTipsterTipResults(items) {",
    "unlock parser insertion",
)

replace_once(
    """      const weekItems = runningWeek ? tipItemsFor(adminId, runningWeek) : [];\n      const weekStats = resultStatsForItems(weekItems, weekCount);\n      const totalStats = resultStatsForItems(realTipItemsForAdmin(adminId));""",
    """      const weekItems = runningWeek ? tipItemsFor(adminId, runningWeek) : [];\n      const totalItems = realTipItemsForAdmin(adminId);\n      const weekStats = resultStatsForItems(weekItems, weekCount);\n      const totalStats = resultStatsForItems(totalItems);\n      const weekUnlocks = unlockCountForItems(weekItems);\n      const totalUnlocks = unlockCountForItems(totalItems);""",
    "tipster analysis stats",
)

replace_once(
    "'<div class=\"tipster-analysis-title\">Kurz-Analyse</div>' +",
    "'<div class=\"tipster-analysis-title\">Kurz-Analyse · Nutzerinteresse</div>' +",
    "analysis title",
)

replace_once(
    "'<th>Zeitraum</th><th>Tipps</th><th>Gewonnen</th><th>Verloren</th><th>Trefferquote</th>' +",
    "'<th>Zeitraum</th><th>Tipps</th><th>Freischaltungen</th><th>Gewonnen</th><th>Verloren</th><th>Trefferquote</th>' +",
    "analysis header",
)

replace_once(
    """              '<td><strong>' + weekStats.tips + '</strong></td>' +\n              '<td class=\"tipster-analysis-win\">' + weekStats.won + '</td>' +""",
    """              '<td><strong>' + weekStats.tips + '</strong></td>' +\n              '<td><strong>' + weekUnlocks + '×</strong></td>' +\n              '<td class=\"tipster-analysis-win\">' + weekStats.won + '</td>' +""",
    "analysis week unlocks",
)

replace_once(
    """              '<td><strong>' + totalStats.tips + '</strong></td>' +\n              '<td class=\"tipster-analysis-win\">' + totalStats.won + '</td>' +""",
    """              '<td><strong>' + totalStats.tips + '</strong></td>' +\n              '<td><strong>' + totalUnlocks + '×</strong></td>' +\n              '<td class=\"tipster-analysis-win\">' + totalStats.won + '</td>' +""",
    "analysis total unlocks",
)

replace_once(
    "masterResultsTableBody.innerHTML = '<tr><td colspan=\"7\"><div class=\"empty-state\">Noch keine Ergebnisdaten über Make geliefert.</div></td></tr>';",
    "masterResultsTableBody.innerHTML = '<tr><td colspan=\"8\"><div class=\"empty-state\">Noch keine Ergebnisdaten über Make geliefert.</div></td></tr>';",
    "runtime master results colspan",
)

replace_once(
    """          <td>${escapeHtml(firstDefined(item, [\"quote\", \"odds\"], \"–\"))}</td>\n          <td>\n            <span class=\"status-pill\">${escapeHtml(resultStatusLabel(currentStatus))}</span>""",
    """          <td>${escapeHtml(firstDefined(item, [\"quote\", \"odds\"], \"–\"))}</td>\n          <td><span class=\"status-pill\">${tipUnlockCount(tipId)}×</span><div class=\"route-hint\">Nutzer</div></td>\n          <td>\n            <span class=\"status-pill\">${escapeHtml(resultStatusLabel(currentStatus))}</span>""",
    "master row unlock cell",
)

replace_once(
    """      latestTipsterTipResults = normalizeTipsterTipResults([].concat(Array.isArray(tipResults) ? tipResults : [], Array.isArray(tipResultFeed) ? tipResultFeed : [], rawTipResultFeed));\n      latestTipsterHistory = parseTipsterHistoryRaw(data.tipster_history_raw || \"\");""",
    """      latestTipsterTipResults = normalizeTipsterTipResults([].concat(Array.isArray(tipResults) ? tipResults : [], Array.isArray(tipResultFeed) ? tipResultFeed : [], rawTipResultFeed));\n      latestTipUnlockCounts = parseTipUnlockCountsRaw(data.tip_unlock_counts_raw || master.tip_unlock_counts_raw || \"\");\n      latestTipsterHistory = parseTipsterHistoryRaw(data.tipster_history_raw || \"\");""",
    "apply unlock data",
)

if text == original:
    raise SystemExit("No changes were produced")

path.write_text(text, encoding="utf-8")
print("Patched admin/backoffice/index.html with per-tip unlock counters and personal interest stats.")
