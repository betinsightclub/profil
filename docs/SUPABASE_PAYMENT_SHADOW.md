# BetInsight Payment Shadow – Supabase Migration

Stand: 2026-09-28

## Ziel
Den kritischen Unit-Kaufprozess schrittweise aus Make herauslösen, ohne den aktuellen Live-Kauf zu unterbrechen.

## Live bleibt unverändert
- `main` nutzt weiterhin den produktiven Make-Zahlungsweg.
- Das bestehende Make-Szenario wird nicht deaktiviert.
- Die neue Supabase-Logik schreibt ausschließlich in Tabellen mit Suffix `_shadow`.
- Die Shadow-Frontend-Änderung liegt ausschließlich auf dem Branch `shadow/supabase-payment-migration-20260928`.

## Vorbereitet in Supabase
### Tabellen
- `betinsight_payment_packages_shadow`
- `betinsight_payment_intents_shadow`
- `betinsight_payment_events_shadow`
- `betinsight_unit_purchases_shadow`
- `betinsight_unit_ledger_shadow`

Alle fünf Tabellen haben RLS aktiviert und sind nicht direkt für Browser-Clients freigegeben.

### Edge Functions
- `betinsight-payment-shadow`
  - feste Payment-ID / Order-Number
  - Idempotency-Key gegen Doppelklick und Reload
  - Statusmaschine inkl. `INVOICE_UNKNOWN`
  - Timeout erzeugt keine automatische zweite Rechnung
  - Provider-Reconciliation über Plisio-Operations-Suche
  - Plisio-Callback-Verifikation über `verify_hash`
  - bei `completed` nur Shadow-Kaufcharge + Shadow-Ledger, keine Live-Units
- `betinsight-member-gateway-shadow`
  - isolierter Browser-Gateway ausschließlich für den Shadow-Zahlungsweg

## Schutzlogik
1. Ein Kaufversuch erhält genau einen Idempotency-Key.
2. Daraus entsteht eine feste BetInsight-Payment-ID und feste `order_number`.
3. Wiederholte Klicks mit demselben Key liefern denselben Vorgang.
4. Bei Provider-Timeout wechselt der Vorgang auf `INVOICE_UNKNOWN`.
5. Während dieser Phase wird keine zweite Rechnung erzeugt.
6. Erst wird bei Plisio nach der bestehenden `order_number` gesucht.
7. Provider-Callbacks werden signaturgeprüft und als unveränderbare Events protokolliert.
8. Eine abgeschlossene Zahlung erzeugt im Shadow-Bereich höchstens eine Kaufcharge und einen Ledger-Eintrag.

## Frontend-Shadow
`kaufen/index.html` wurde auf dem Shadow-Branch vorbereitet:
- Shadow-Gateway statt Live-Gateway
- Idempotency-Key in `sessionStorage`
- Kaufbutton während der Vorbereitung gesperrt
- Doppelklick/Reload verwendet denselben Zahlungsversuch
- bei unklarem Provider-Ergebnis keine zweite Rechnung

## Noch vor einem echten Cutover erforderlich
1. Plisio Secret Key als Supabase Secret `PLISIO_SECRET_KEY` hinterlegen.
2. Shadow-Rechnung mit kleinem kontrolliertem Test erstellen.
3. Callback-Signatur und Statuswechsel prüfen.
4. Live-Make-Logik aus `BetInsight - Units gutschreiben nach Zahlung v4.7 DATE-SAFE MULTI-CRYPTO AFFILIATE-FIX` vollständig nach Supabase portieren:
   - USER-Zuordnung
   - Dublettenschutz
   - UNIT_KAEUFE/Kaufcharge
   - Admin-/Einnahmenwerte
   - Affiliate-Pool / Referral-Folgelogik
5. Parallelvergleich: ein kontrollierter Test muss in Shadow dieselben fachlichen Werte ergeben wie der aktuelle Make-Weg.
6. Erst dann `payment-create` im produktiven Member-Gateway auf Supabase umstellen.
7. Nach erfolgreichem Produktivtest Make-Szenarien deaktivieren, nicht sofort löschen.

## Cutover-Prinzip
Der Umschaltpunkt soll am Ende nur noch eine kleine Routing-Änderung sein. Die Datenstruktur und Logik werden vorher vollständig getestet.


## Fortschritt 2026-09-28 – Finanz- und Kaufchargenmodell

Der Shadow-Zahlungsweg bildet inzwischen zusätzlich die fachliche Logik des Live-Szenarios
`BetInsight - Units gutschreiben nach Zahlung v4.7 DATE-SAFE MULTI-CRYPTO AFFILIATE-FIX` nach.

Neu im Shadow:
- Netzwerk-Snapshot der USER-Zuordnung (User, Ref-Code, Sponsor, Upline 1–3)
- Finanzberechnung aus dem verifizierten Plisio-Payload
- Betriebskosten-Vorauszahlung 2,5 %
- Affiliate-Budget 10 % mit 6/3/1 und Firmenpool bei fehlenden Ebenen
- verteilbarer Netto-Betrag
- Sofortpool 40 % / Nutzungspool 60 %
- Sofortpool-Aufteilung ADM-001/002/003 = 40/30/30
- Kaufcharge mit Sponsor-, Referral-, Währungs-, Netzwerk- und Nutzungspool-Feldern
- Unit-Ledger bleibt idempotent
- Integritätsprüfung: Finance, Kaufcharge, Unit-Ledger, Admin-Summe, Affiliate-Summe und Netzwerk-Snapshot

Ein vollständiger transaktionaler Selbsttest mit einem Pro-Paket (240 Units / 199 EUR) besteht aktuell alle Prüfungen:
`all_ok = true`.

## Live-Make Zwischenfix

Beim Abgleich mit einer echten Pro-Zahlung vom 21.09.2026 wurde ein separater Make-Fehler entdeckt:
In mehreren Modulen wurde `round(wert; stellen)` verwendet. Die Make-Mapping-Funktion `round()`
rundet jedoch auf ganze Zahlen; dadurch wurden u. a. Krypto- und Pro-Unit-Werte im ursprünglichen Lauf
zu grob gerundet.

Die aktiven Module 16, 25, 26, 27, 28 und 30 wurden deshalb auf
`parseNumber(formatNumber(...))` mit der jeweils vorgesehenen Dezimalstellenzahl umgestellt.
Das Live-Szenario bleibt aktiv; dieser Zwischenfix verhindert falsche Rundung bei neuen Käufen,
bis Supabase den Prozess vollständig übernimmt.

## Weiterhin bewusst nicht umgeschaltet

- `main` bleibt auf dem bisherigen Live-Zahlungsweg.
- Der produktive Member-Gateway routet `payment-create` weiterhin zu Make.
- `PLISIO_SECRET_KEY` ist im Shadow noch nicht aktiviert.
- Keine Shadow-Tabelle schreibt echte USER-, UNIT_KAEUFE-, Admin- oder Affiliate-Bestände.
- Vor Cutover folgt ein echter kleiner Plisio-Test und danach der Live-vs-Shadow-Vergleich.
