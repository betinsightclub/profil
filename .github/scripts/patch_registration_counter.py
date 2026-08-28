from pathlib import Path

path = Path("admin/backoffice/index.html")
text = path.read_text(encoding="utf-8")

text = text.replace(
    "Version: 2026.08.26-BACKOFFICE-v2.21-KOSTENBUCH",
    "Version: 2026.08.28-BACKOFFICE-v2.22-REGISTRIERUNGEN",
    1,
)

old_heading = '''      <div class="panel-heading">
        <div>
          <h2>Übersicht</h2>
          <p class="muted">
            Deine wichtigsten Vergütungs- und Auszahlungswerte auf einen Blick.
          </p>
        </div>
      </div>'''

new_heading = '''      <div class="panel-heading">
        <div>
          <h2>Übersicht</h2>
          <p class="muted">
            Deine wichtigsten Vergütungs- und Auszahlungswerte auf einen Blick.
          </p>
        </div>
        <div class="model-status-card" style="min-width:190px; flex:0 0 auto;">
          <span class="model-status-label">Registrierungen gesamt</span>
          <span class="model-status-value" id="registrationCount">0</span>
          <span class="route-hint">Echte Registrierungen seit Produktivstart</span>
        </div>
      </div>'''

if "id=\"registrationCount\"" not in text:
    if old_heading not in text:
        raise SystemExit("Overview heading target not found; aborting safely.")
    text = text.replace(old_heading, new_heading, 1)

old_js = '''      document.getElementById("nextBatchDate").textContent = String(data.next_batch_date || formatGermanDate(getNextBatchDate()));

      latestBalances = parseJsonValue(data.balances, []);'''

new_js = '''      document.getElementById("nextBatchDate").textContent = String(data.next_batch_date || formatGermanDate(getNextBatchDate()));
      const registrationCount = document.getElementById("registrationCount");
      if (registrationCount) {
        registrationCount.textContent = String(Math.max(0, Math.floor(num(data.registrations_total ?? 0))));
      }

      latestBalances = parseJsonValue(data.balances, []);'''

if "data.registrations_total" not in text:
    if old_js not in text:
        raise SystemExit("applyData target not found; aborting safely.")
    text = text.replace(old_js, new_js, 1)

path.write_text(text, encoding="utf-8")
