# BetInsight – Tippfreischaltungs-Sheets-Migration (Staging, 2026-11-03)

**Status: STAGING ONLY. No production switch, no database schema changes, no Make scenario changes.**

## Befund

- Produktive Tippfreischaltungen und Unit-/Referral-/Admin-Ledger laufen bereits in Supabase.
- Die Supabase Edge Function `betinsight-tips-api` v15 ruft nach erfolgreichem `betinsight_tip_unlock_v1` die nachgelagerte Funktion `mirrorUnlockToSheets` auf. Fehler beim Sheets-Mirror werden protokolliert, ändern aber die erfolgreiche Supabase-Freischaltung nicht.
- Die Spiegelung liest **10 Schlüsselbereiche** aus Google Sheets (über Make 7756903) und schreibt geänderte Profile, Tippzähler, Kauf-Unit-Verbrauch, Referral-Freigaben, Freischaltungsbelege, Admin-Vergütungen und Unit-Transaktionen.
- Bei jedem normalen Make-Relay-Durchlauf fallen derzeit typischerweise 3 Credits an. Ein Unlock-Mirror nutzt typischerweise einen Lese- und einen Schreibaufruf, sofern Änderungen vorliegen.
- Make Core mit 10.000 Credits/Monat: Credit-Einsparungen verändern die Grundgebühr nicht automatisch.

## Bereits nachgewiesener lesender Abgleich

- 108/108 Freischaltungsnachweise mit `source=SUPABASE` im Kontroll-Sheet über ihren eindeutigen Schlüssel gefunden.
- 80/80 Supabase-Tippverbrauchspositionen im Google-Sheet `BO_TIPP_NUTZUNGEN` über Nutzer/Tipp/Lot eindeutig gefunden.
- 53 übernommene Alt-Freischaltungen sind gesondert zu behandeln; 52 besitzen nicht den neueren Freischaltungs-ID-Schlüssel.
- Referral- und Vergütungsdaten benötigen zusätzlich eine nachvollziehbare 1:1-Abgleichregel. Nicht allein anhand Gesamtzahlen umschalten.

## Vorbereitete, isolierte Implementierung

`direct-sheets-transport.mjs` ist ein neuer **noch nicht eingebundener** OAuth-Service-Account-Client:

- Nutzt ausschließlich die feste Spreadsheet-ID und freigegebene Tabellen.
- Erlaubt definierte Schlüssel-Leseoperationen sowie eingeschränkte `updateCells`-Operationen.
- Prüft Tabellen-IDs, Schreibfelder und Batch-Größen vor jedem Aufruf.
- Standardmäßig `mode="dry-run"`: **keine Netzwerkaufrufe, keine Schreibvorgänge**.
- Im späteren Live-Betrieb ist ein Service-Account nötig; seine privaten Zugangsdaten dürfen ausschließlich in Supabase Secrets liegen.
- Nie Google-Schlüssel, Make-Relay-Schlüssel oder Kunden-/Finanzdaten in dieses öffentliche GitHub-Repository committen.

## Bedingungen vor einer Freischaltung

1. Google Cloud Service Account mit Sheets API und minimalem Berechtigungsumfang anlegen; zuerst nur auf eine **Testkopie** des Sheets zugreifen lassen.
2. Service-Account-JSON als Supabase Secret `BETINSIGHT_GOOGLE_SERVICE_ACCOUNT_JSON` hinterlegen (nicht in GitHub).
3. Unveränderte v15-Produktionsfunktion sichern; das neue Modul zunächst nur im Testmodus verwenden.
4. Live-Daten **nur lesen** und jede betroffene Zeile und Summe mit Supabase vergleichen, einschließlich Unit-Salden, FIFO, Referral-Stufen, Admin-Ledger und Belegen.
5. Auf der separaten Testkopie den direkten Schreibpfad testen (kein Schreiben in die produktive Tabelle).
6. Unterschiedliche Legacy-Schlüssel und mögliche abweichende Upline-/Kauf-/Reserveformeln klären.
7. Danach Feature-Flag-Integration `BETINSIGHT_TIP_SHEETS_DIRECT_V1` standardmäßig **OFF**, mit Fallback auf den bisherigen Make-Relay und nachvollziehbarer Fehlermeldung.
8. Erst nach Freigabe von Datenschutz, Berechtigungen und Kontrollabgleich schrittweiser Cutover. **Make 7756903 bleibt aktiv**, da auch Zahlung, Ergebnisabgleich, Backoffice und Netzwerkverschiebungen den Relay verwenden.

## Aktueller Blocker

In den verbundenen BetInsight-Integrationen ist als Google-Sheets-Synchronisierung derzeit nur ein aktiver `GOOGLE_SHEETS_RELAY` über **Make** nachweisbar. Für direkten API-Zugriff fehlt eine unabhängig erteilte Google-Berechtigung. Ohne sie kann der neue direkte Weg weder gegen die produktive Tabelle authentifiziert noch vollständig geprüft werden.

## Tests

```bash
node --test migration/sheets-direct-v1/direct-sheets-transport.test.mjs
```

Die vier Tests betreffen Dry-run ohne Netzwerk, eingeschränkte Schreiboperationen, OAuth-Anfrageform und den Fehlschluss bei fehlender Berechtigung. Das ist **kein** produktiver Ende-zu-Ende-Test und keine Zusage von 100% Fehlerfreiheit.

**Rollback:** Bei einem späteren Cutover das Feature-Flag sofort auf OFF setzen. Der vorhandene Make-Relay bleibt bis zur vollständigen Verifikation unverändert und aktiv.
