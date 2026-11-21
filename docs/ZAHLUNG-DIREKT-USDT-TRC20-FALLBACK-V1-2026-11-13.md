# BetInsight | Zweiter Zahlungsweg – Direktzahlung USDT/TRC20 (Vorbereitung v1)

Stand: 2026-11-13 · Status: **NUR ENTWURF / NICHT LIVE** · Branch: `dev/betinsight-direct-usdt-fallback-20261113`

## Ziel und feste Grenzen

Zusätzlicher Zahlungsweg für den **direkten Unit-Paketverkauf durch LucMedia LTDA**, ohne Abhängigkeit von Plisio. Kein neuer Unit-Typ, kein paralleler Wallet-Saldo und keine Änderung von FIFO, Referral, Tippfreischaltung oder Partnerabrechnung. **Die Mitglieder-Wechselstube ist ein separater User-zu-User-Prozess und wird nicht umgebaut.** Keine realen Zahlungen, Auszahlungen, Deployments oder Live-Schalter mit diesem Entwurf.

Die bereits bestehende Kette bleibt der Bezugspunkt: `kaufen/index.html` → `betinsight-payment-entry` → `betinsight-payment` → `betinsight_payment_intents` / `betinsight_payment_events` → `betinsight_post_completed_payment(p_intent_id)` → Kaufcharge, Ledger, Finanz- und Integritätsprüfung. Der neue Adapter darf **nicht** selbst Units gutschreiben, sondern ausschließlich eine nachweislich bestätigte Zahlung an den vorhandenen Abschlussweg übergeben. Bestehende `Plisio`-Route unverändert erhalten.

## Produktentscheidung für die erste Ausbaustufe

- Zahlungsart in der Seite: `Plisio (vorübergehend gesperrt bei Provider-Störung)` oder `Direktzahlung USDT / TRC20 (noch in Vorbereitung)`. Während Vorbereitung nur Hinweis, **kein funktionsfähiger Bezahlbutton**.
- Direktzahlung: Kunde zahlt an eine **von LucMedia kontrollierte Firmenempfangswallet**; nicht an private Verkäufer-Wallets und nicht an Plisio. Firmenwallet muss separat verifiziert und buchhalterisch zugeordnet werden, bevor sie produktiv hinterlegt wird.
- Bei spätere Erweiterung: provider-unabhängige Schnittstelle, weitere Coins/Chains sind nicht automatisch freigegeben. Keine Annahme, dass opBNB-USDT dem offiziell von Tether herausgegebenen TRON-USDT entspricht.
- Nur Transaktion auf **TRON Mainnet**, TRC20 `USD₮`, offizielle Token-Kontraktadresse `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (vor Go-live nochmals anhand Tether prüfen).
- Hinweis auf Netzwerk zwingend sichtbar. Eine Zahlung auf falscher Chain darf keine automatisierte Gutschrift auslösen.

## Geplanter sicherer Ablauf

1. Kunde meldet sich in BetInsight an, wählt **bestehenden** Paketcode. Supabase prüft die Sitzung serverseitig; kein Vertrauen allein auf E-Mail, query string, CORS-Origin oder selbst übermittelte User-ID.
2. Backend liest Paketpreis und Unit-Menge aus der aktuellen serverseitigen `betinsight_payment_packages`-Tabelle, niemals aus dem HTML.
3. Backend erzeugt **genau einen** `payment_intent` mit `provider=DIRECT_USDT_TRC20`, eindeutiger Order-Nummer, serverseitig festgehaltenem EUR→USDT-Wechselkurs samt Kursquelle und Zeit, exaktem USDT-Betrag (6 Nachkommastellen), Status `PENDING` und begrenzter Gültigkeit. Kein Nachberechnen eines bereits ausgegebenen Zahlungsbetrags.
4. Benutzeroberfläche zeigt Betrag, Netzwerk TRC20, Empfängerwallet, Scan-/QR-Option, Ablauf und Auftrags-ID. Kein Platzhalter als echte Wallet ausgeben. Im Zweifel **nur Testvorschau**.
5. Zahlungsverifikator liest **bestätigte** TRC20-`Transfer`-Ereignisse über einen gesicherten Blockchain-Indexer. Prüfung auf richtigen Token-Contract, Hauptnetz, erfolgreiche/finalisierte Überweisung, Empfänger, **exakten** Token-Rohbetrag, Blockzeit, Quote/Order-Zuordnung und Doppelnutzung. API-Ausfall / widersprüchliche Daten → `REVIEW`, niemals Gutschrift.
6. **Wichtige Zuordnung:** Bevor vollautomatisch aktiviert wird, muss pro Bestellung eine **eindeutig zuordenbare Empfangsadresse oder ein ähnlich beweisbar eindeutiges Verfahren** implementiert und getestet werden. Eine gemeinsame Wallet mit bloß identischen Beträgen ist dafür nicht ausreichend. Manuell übermittelte TXIDs werden serverseitig validiert und sind zunächst nur für manuelle Prüfung geeignet.
7. Idempotenz: `(network, txid, token_contract, transfer_log_index)` einmalig, order-/intentbasierter Schutz vor Replay und Doppelverarbeitung; atomare Übergabe. Ein Transaktionsnachweis darf niemals zwei Unit-Käufe freigeben.
8. Erst dann bestehenden `betinsight_post_completed_payment(p_intent_id)`-Abschlussweg **nach Prüfung seiner Provider-Abhängigkeiten** verwenden. Bereits vorhandene `betinsight_check_payment_integrity(p_intent_id)` ausführen. Nicht einfach `status=COMPLETED` im Frontend oder manuell in der Datenbank setzen.
9. Kaufcharge, Unit-Buchung, Referral- und Kosten-/Partnerlogik bleiben wie bisher. Im Finanzjournal Payment Provider `DIRECT_WALLET`, Kurs, Netzwerk, TxID, Brutto/Netto, Gebühren und BRL-Gegenwert nach bestehenden Buchhaltungsregeln erfassen.
10. Bezahlseite zeigt `Zahlung wird geprüft` → `Bestätigt` oder `Manuelle Prüfung` / `Abgelaufen` an. Keine Unit-Gutschrift aufgrund von Browser-Polling, Screenshots oder bloßem `payment sent`.

## Datenmodell / Integrationspunkte (noch KEINE Migration)

- Wiederverwenden: `betinsight_payment_intents`, `betinsight_payment_events`, `betinsight_unit_purchases`, `betinsight_payment_finance`, `betinsight_payment_integrity`.
- Auf bestehende Constraints und Trigger Rücksicht nehmen; geplanter zusätzlicher schreibgeschützter Zuordnungs-/Blockchain-Belegdatensatz pro Intent mit `chain`, `token_contract`, `deposit_address`, `quoted_amount_usdt`, `rate_source`, `rate_at`, `expires_at`, `txid`, `event_index`, `confirmation_state`, `verified_at`.
- Neue isolierte Edge Function `betinsight-payment-direct-v1` **nur im Test** und separater nur-lesender Verifikator; erfordert serverseitige Auth und strikte RLS, keine `service_role`-Secrets im Browser.
- Eigene Provider-Auswahl im Frontend **erst nach** End-to-End-Test und manuellem Go-live. Default `direct_provider_enabled=false`; Plisio-Route unverändert.

## Testkatalog vor Freigabe

1. Paketcode/Preis: 49, 99, 199, 299 EUR (sowie Bonuspakete) kommen ausschließlich serverseitig; Kurs fixiert.
2. Korrekte bestätigte Testnet-/simulierte Zahlung → **ein** Kauf, **eine** neue Kaufcharge, **eine** Finanzbuchung, korrekte Referral-/Integritätsprüfung.
3. Doppelter Indexer-Event, identische TXID, parallele Worker oder Browser-Doppelklick → **keine** zweite Gutschrift.
4. Falsche Wallet, falscher Token-Contract, falsche Chain, nicht finalisierte TX, unterbezahlt, Überzahlung, verspätete TX → **kein** automatisches Guthaben; `REVIEW`.
5. Zwei Kunden bestellen zur gleichen Zeit identische Pakete → nachweisbar eindeutige Zuordnung; sonst bleibt Funktion deaktiviert.
6. Indexer-Ausfall, Rate Limit und Blockchain-Störung → sichere Wiederholung ohne doppelten Erfolg, kein dauerhaft verlorenes Ereignis.
7. Plisio-Bestandskäufe (einschließlich Rückerstattungs-/EXPIRED-Fälle) weiterhin unverändert.
8. Prüfung mit LucMedia-Buchhaltung: voller Kundenumsatz, Nachweisdaten für Steuer/DeCripto, keine Vermischung mit User-Wechselstube.

## Go-live-Sperren

**Bis auf Weiteres NICHT aktivieren:** kein QR-Code mit produktiver Firmenwallet, kein echter Zahlungsbutton, keine Main-Branch-Änderung, keine Edge-Funktion deployen, keine Datenbank-Migration, keine Testzahlung mit echtem Geld. Freigabe erst nach Wallet-Besitz-/Kursquelle-/Netzwerk-/Sicherheits-/Buchhaltungs-Abnahme und ausdrücklicher Betreiberfreigabe.

## Technischer Ist-Stand bei Prüfung am 2026-11-13

- Supabase-Projekt `lszlaglwlixejzytrurg` hat bereits `betinsight-payment` und `betinsight-payment-entry`; letzterer erzeugt heute einen Plisio-Checkout. Die produktive Kaufseite `kaufen/index.html` enthält vorhandene Paketcodes und ruft den Entry auf.
- Datenbank: 10 produktive Payment-Intents, davon 5 `COMPLETED`, 5 `EXPIRED`, 0 andere Status; letzter angelegter Intent 2026-10-30. 5/5 vorhandene Integritätsprüfungen `all_ok=true`.
- Keine produktiven Daten oder Zahlungsfunktionen wurden im Rahmen dieser Planung verändert.

## Abgrenzung zum früheren MCT-Dual-Chain-Claim

Gemeinsam verwendbar sind serverseitige Anspruchs-/Transaktionsprüfung, Netzwerkidentität, TXID-Journal, Anti-Replay und Statusmaschine. **Nicht kopieren:** Claims aus einem vorfinanzierten Reward-Pool, 24h-Fenster, Claim-Guthaben oder Nutzer-Auszahlungen auf LTC/XNO/opBNB. BetInsight hier = Kundeneinzahlung an Firmenwallet in TRC20-USDT. Das frühere MCT-Claim-System war zum letzten geprüften Projektstand kein nachgewiesener produktiver Zahlungsdienst.

Quellen (technische Recherche):
- https://tether.to/en/supported-protocols/
- https://tronweb.network/docu/docs/common-tasks/trc20-tokens
- https://developers.tron.network/docs/trongrid
- https://supabase.com/docs/guides/functions/schedule-functions
