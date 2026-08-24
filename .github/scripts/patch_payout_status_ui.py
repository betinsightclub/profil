from pathlib import Path

path = Path("admin/backoffice/index.html")
text = path.read_text(encoding="utf-8")

old_version = "Version: 2026.08.24-BACKOFFICE-v2.19-BTC-MINIMUM-ROUTE-FIX"
new_version = "Version: 2026.08.24-BACKOFFICE-v2.20-PAYOUT-STATUS-REASONS"
if old_version in text:
    text = text.replace(old_version, new_version, 1)

marker = "    function renderPayoutRoutes(balances, wallets) {"
helper = '''    function payoutStatusText(status, possible) {
      if (possible) return "Auszahlung möglich";

      const key = String(status || "").trim().toUpperCase();
      const labels = {
        WALLET_FEHLT: "Wallet-Adresse fehlt",
        WALLET_FREIGABE_OFFEN: "Wallet-Freigabe offen",
        WALLET_24H_SPERRE: "24-h-Sicherheitssperre aktiv",
        MINDESTWERT_NICHT_ERREICHT: "Mindestwert noch nicht erreicht",
        ROUTE_SYSTEMSEITIG_GESPERRT: "Route systemseitig gesperrt",
        GLOBAL_GESPERRT: "Auszahlung systemweit gesperrt",
        INTERNE_ABRECHNUNG: "Interne Abrechnung"
      };

      return labels[key] || "Noch nicht möglich";
    }

'''
if "function payoutStatusText(status, possible)" not in text:
    if marker not in text:
        raise SystemExit("renderPayoutRoutes marker not found")
    text = text.replace(marker, helper + marker, 1)

old_route_status = '<span class="status-pill">${possible ? "Auszahlung möglich" : "Noch nicht möglich"}</span>'
new_route_status = '<span class="status-pill">${escapeHtml(payoutStatusText(balance.payout_status, possible))}</span>'
if old_route_status not in text and new_route_status not in text:
    raise SystemExit("route payout status marker not found")
text = text.replace(old_route_status, new_route_status)

old_table_status = '<td><span class="status-pill">${possible ? "Ja" : "Nein"}</span></td>'
new_table_status = '<td><span class="status-pill">${escapeHtml(payoutStatusText(item.payout_status, possible))}</span></td>'
if old_table_status not in text and new_table_status not in text:
    raise SystemExit("balance table payout status marker not found")
text = text.replace(old_table_status, new_table_status)

path.write_text(text, encoding="utf-8")
print("Backoffice payout status labels patched successfully")
