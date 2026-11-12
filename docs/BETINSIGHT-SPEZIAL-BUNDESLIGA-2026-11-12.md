# BetInsight Spezial – Bundesliga 2026/27 (Vorschau, 12.11.2026)

Status: **Nur UI-Vorschau in Entwicklungsbranch. Nicht buchbar; keine Unit-Abbuchung und keine automatische Kompensation.**

## Beschluss

- Sichtbarer Name der vierten Tipp-Center-Kachel: **BetInsight Spezial** (bisher „User-Testphase“).
- Separat von Martin, Frank und Schulung; alle drei bestehenden Kacheln und deren Abrechnung bleiben unverändert.
- Erste Vorschau: **Bundesliga 2026/27 – vier separate Top-4-Platzierungsanalysen**.
- Externe Prognosequelle: Opta-Saisonprognose veröffentlicht 09.11.2026 nach Spieltag 9. **Keine von BetInsight selbst durchgeführte Simulation.**
- Erst nach Prüfung der konkreten Märkte und Quoten sowie der Teilnahmebedingungen darf ein Artikel als kostenpflichtiger Spezial-Tipp gelten.
- Geplanter Einzelpreis: **1 plattformweite BetInsight-Unit pro Spezial-Analyse**, nicht vier Units für ein Paket.
- Bei einer nach der offiziellen Bundesliga-Abschlusstabelle *falschen* freigeschalteten Prognose: **1 zusätzliche kostenlos erzeugte Geschenk-Unit pro berechtigter Freischaltung als Entschädigung**.
- Die ursprünglich verbrauchte Unit **bleibt verbraucht**: keine rückwirkende Wiederherstellung einer gekauften, Geschenk- oder Referral-Unit-Charge, keine Rücknahme der damaligen Freischaltung und keine Rückbuchung bereits entstandener Provisionen.
- Entschädigung ist **keine Erstattung eines externen Wetteinsatzes oder Wettverlusts**.
- Geschenk-Units aus Entschädigung sind ausschließlich für Plattformfunktionen nutzbar: nicht verkaufbar, nicht auszahlbar, nicht in Referral-Units umwandelbar und lösen beim späteren Einsatz keine neue Referral-Provision aus.
- Buchhalterisch als **separate kompensatorische Geschenk-Unit-Gutschrift** mit Ursprungs-Tipp-ID erfassen; originale Debit-/Referral-Buchungen bleiben unverändert.
- Für jede berechtigte Kombination aus Aktion, Mitglied und Tipp **höchstens eine** Entschädigung; atomare/duplikatgeschützte serverseitige Buchung mit Journal, erst nach offiziell bestätigtem Saisonergebnis; keine Gutschrift bei offenem/nicht gewertetem Ergebnis.
- Budget-/Missbrauchsgrenzen und rechtliche Einordnung sind vor Freischaltung festzulegen.

## Technische Abgrenzung der Vorschau

- Die bisherige interne Kennung `Testphase` / `USER_TESTPHASE` und die vorhandene Filter-/Statistikzuordnung bleiben aus Rückwärtskompatibilität zunächst unangetastet. Dies ist **keine** Freigabe, alte Testphasen-Daten als neue Spezial-Artikel zu verwenden; die neue Artikelart muss vor Liveschaltung separat definiert und geprüft werden.
- `tipps/index.html` zeigt eine statische Vorschaubox mit vier geplanten Analysen; kein Freischalt-Button, keine Zahlungs-API, keine neue Datenbankabfrage.
- UI-Texte wurden in allen acht vorhandenen Tipp-Center-Sprachen aktualisiert.
- Bisheriges Dokument `USER-TESTPHASE-UNIT-RUECKGABE-2026-11-05.md` enthält die **ältere, nicht aktivierte** 50/100-Units-Test-Idee. Diese ist nicht automatisch ein Teil des Spezial-Angebots; nicht ohne eigene Entscheidung zusammenführen.
- Keine Änderung an Supabase, Make, FIFO, Kauf-Units, Referral-Provisionen, Wallet oder Admin-Tippprozess.

## Go-live-Check vor echten Spezial-Freischaltungen

1. Für jeden Tipp: konkrete Wette/Abrechnungsdefinition, endgültig überprüfte Quote, Quelle, Abrufzeitpunkt und Aufnahmestatus festhalten.
2. Eindeutige Tipp-/Kampagnen-IDs und keine Überschneidung mit vorhandener Testphase.
3. Regel für verlorene Tipps (z. B. Top 4 gemäß offizieller Abschlusstabelle), Abbruch/Annullierung, Status und Ergebnisverifikation definieren.
4. Entschädigung als Geschenk-Unit atomar und idempotent im Ledger implementieren und mit Testkonten prüfen, inklusive wiederholter Requests und Affiliate-/FIFO-Abgrenzung.
5. Nutzungsbedingungen, Werberecht, Länderzugang und rechtliche Behandlung von Gratis-Units im Sportwettenkontext prüfen.
6. Erst nach separater Abnahme die 1-Unit-Freischaltung freigeben. Vorher ausschließlich Vorschau.

