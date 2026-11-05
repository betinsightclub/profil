# BetInsight – User-Testphase / Units nach verlorenen Tipps (Entwurf)
Stand: 05.11.2026 · **NICHT PRODUKTIV FREIGEGEBEN**

## Zweck
Zusätzliche vierte Rubrik im Tipp-Center: **User-Testphase**. Die Teilnehmer können künftig einen begrenzten Bestand von z. B. 50 oder 100 BetInsight-Units für den Test verwenden. Die endgültigen Beträge, Laufzeit und Teilnehmerberechtigung sind noch nicht festgelegt. Die vierte Rubrik und der Performance-Rechner sind zunächst nur Oberfläche. **Es werden keine automatischen Unit-Rückgaben durchgeführt.**

## Unveränderliche Sicherheitsprinzipien
- Nur die bestehende plattformweite BetInsight-Währung **Units**; kein zweites Wallet und keine zweite Währung.
- Eine Rückgabe betrifft ausschließlich den **Preis einer bereits bezahlten Tippfreischaltung in Units**, niemals einen externen Geld-Wetteinsatz oder eine Buchmacherwette.
- Rückgabe nur nach eindeutig bestätigtem **VERLOREN**, nur an den Account, der denselben Tipp zuvor tatsächlich freigeschaltet hat, und nur für eindeutig als **USER_TESTPHASE** klassifizierte Tipps.
- Rückgabe als **nicht übertragbare Geschenk-Units**; sie dürfen nicht als verkaufbare oder auszahlbare Referral-/Kauf-Units behandelt werden. Für gekaufte Units darf keine neue Kaufcharge erzeugt werden.
- Begrenzung pro Mitglied/Phase: Teilnehmer-Whitelist, einmaliges Startbudget (50 **oder** 100 Units nach Festlegung), maximal zulässige Freischaltungen, zeitliche Gültigkeit und optional separater Rückgabelimit-Zähler. Damit entsteht kein endloser, unbegrenzter Testkreislauf.
- Keine Gutschrift bei GEWONNEN, OFFEN oder nur vom Browser behauptetem Ergebnis. Bei VOID/ABGESAGT ist die gewöhnliche Stornoregel gesondert anzuwenden und nicht als „verlorener Testtipp“ zu zählen.
- Rückgabe in Supabase nur mit **atomarer Transaktion**, eindeutiger (campaign_id, user_id, tipp_id)-Idempotenz, nachvollziehbarem Journal und erneut geprüfter Serverberechtigung. Nach einem erneuten Aufruf darf niemals doppelt gutgeschrieben werden.
- Die bestehende FIFO-, Wallet- und Referral-Logik sowie Tipps außerhalb der Rubrik dürfen nicht verändert werden.
- Schulungstipps haben eine bisherige **manuelle 1-Unit-Gutschrift** als eigene Regel. Nicht stillschweigend durch User-Testphase-Logik ersetzen.
- USER_TESTPHASE-/Schulungstipps in eigener Performance; **nicht** der offiziellen Martin-/Frank-Performance zuschlagen, auch dann nicht, wenn der Tippgeber dieselbe Person ist.
- Nicht mit „risikofrei“, „garantierter Gewinn“ oder als Rückzahlung externer Wettverluste bewerben.

## Vor Aktivierung unbedingt festlegen
1. Bedeutet „50/100 Units“ eine einmalige Gratis-Zuteilung pro Teilnehmer oder eine Obergrenze für Test-Ausgaben?
2. Ist der Rückerstattungsbetrag der komplette gezahlte Freischaltpreis oder ein fester Teil? Vorschlag: exakt der ursprünglich verbrauchte Tippfreischaltpreis, aber nur im Rahmen des bewilligten Budgets.
3. Gilt eine maximale Tipp-Anzahl und ein Maximalbetrag aller Rückgaben? (Empfehlung: ja.)
4. Sind nur eingeladene Testmitglieder zugelassen, welche Laufzeit und welche Tippgeber dürfen teilnehmen?
5. Was passiert bei nachträglicher Korrektur VERLOREN → GEWONNEN? Geprüfte, protokollierte Korrekturbuchung, niemals unkontrollierte Abbuchung.
6. Rechtliche/steuerliche Prüfung des internationalen Bonus-/Wallet-Modells und klare Teilnahmebedingungen.

## Aktivierungsfolge
Regeln freigeben → atomare Supabase-Implementierung mit eindeutiger Buchung → Testkonto/Mehrfachaufrufe/Reversals testen → Backend-Gate einschalten → erst dann echte Testtipps auf der öffentlichen Oberfläche freischaltbar machen.

## UI heute
Martin, Frank, Schulungstipps und User-Testphase haben die gleichen Performance-Steuerelemente: 1–10 = neueste zehn bestätigte Gewinn/Verlust-Tipps, danach 11–20 usw. und Gesamt; Wett-ROI mit 1–100 € konstantem hypothetischem Einsatz, **ohne Tipp-Unit-Kosten**. Leere Gruppen zeigen keine erfundenen Daten.
