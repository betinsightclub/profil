# BetInsight Spezial – Saisonwetten / Bundesliga 2026/27
Stand: 12.11.2026. Redaktioneller Opta-Datenstand: 09.11.2026 nach Spieltag 9.

## Verbindliche Kategorie
**Anzeigename:** BetInsight Spezial – Saisonwetten.
**Tippgebername:** BetInsight Spezial; getrennt von Martin, Frank und Schulung.
**Interner Quelltyp:** `BETINSIGHT_SPEZIAL_SAISONWETTEN`.
**Vier Tipp-IDs:** `BI-SP-2627-TOP4-01` bis `-04`.
Die bisherige sichtbare User-Testphase-Kachel wurde ersetzt; technisch heißt der Auswahlwert zur Rückwärtskompatibilität `Testphase`. Die alten Testphasen-Tipps werden **nicht** in der Spezial-Statistik mitgezählt und fließen auch nicht in Martin/Frank.

## Inhalte und Preis
1. FC Bayern München: prognostizierter Top-4-Platz.
2. Borussia Dortmund: prognostizierter Top-4-Platz.
3. RB Leipzig: prognostizierter Top-4-Platz.
4. Bayer Leverkusen: prognostizierter Top-4-Platz.

Jeweils **1 Unit pro einzeln freigeschalteter Analyse**. Opta 10.000 Simulationen laut 90min, keine eigene BetInsight-Simulation. Opta-Tabelle vom 09.11.2026 – die Reihenfolge ist eine Prognose; keine Garantie und keine nachgewiesene bookmaker-value-Wette. **Keine erfundenen oder ungeprüften Quoten.** Die freischaltbare Leistung ist eine digitale Analyse, kein externer Wettschein. DFL-Spieltag 34 am 22.05.2027; Freischaltschluss bewusst am **21.05.2027 um 23:59 Uhr Europe/Berlin**, damit nicht nach dem letzten Spieltag gekauft wird. In der bestehenden Tipp-Datenstruktur ist dieses Datum als `spiel_datum` und `anpfiff` (Abschlusszeit, **kein tatsächlicher Spielanpfiff**) gespeichert. Jeder Tipp wird erst bei offiziellem Saisonende gewertet.

## Kundenentschädigung bei falscher Top-4-Prognose
Nach offizieller DFL-Abschlusstabelle wird pro **tatsächlich und individuell freigeschalteter** Prognose, die nicht eingetroffen ist, **1 neue kostenlose Geschenk-Unit** als Entschädigung gutgeschrieben. Der Gründer nimmt diese Entschädigungsbuchungen über das bestehende autorisierte Admin-Unit-Credit-Verfahren vor. Nicht automatisch bis zu einer gesondert geprüften Abrechnungsautomation. Eindeutige Buchungskennung je (Saison, Tipp, Mitglied), keine Doppelbuchung. Keine Rücknahme/Erstattung ursprünglicher Units, keine Rückbuchung bereits bestehender Referral-/Adminprovisionen und kein externer Wetteinsatzersatz. Geschenk-Unit nicht auszahlbar, erzeugt selbst keine Referral-Provisionen. Bei verschobenem, annulliertem oder nicht endgültig gewertetem Saisonergebnis zuerst manuell prüfen. Bevor echte Entschädigungen gebucht werden, ist der originale BetInsight-Geschenk-Unit-Buchungspfad samt Idempotenz und Finanzjournal zu prüfen.

## Freischaltung / Datenherkunft
- Nutzt die **bestehende** produktive BetInsight-Mitgliederroute `betinsight-member-gateway?route=tip-unlock`, nachgeschaltet `betinsight-tips-api?action=unlock` und **bestehende** Transaktions-RPC `betinsight_tip_unlock_v1`. Dadurch bleibt die originale FIFO-/Kauf-/Geschenk-/Referral-Logik unberührt.
- Jede Tipp-ID wird separat freigeschaltet. Die bestehende Freischaltung ist serverseitig idempotent pro Mitglied und Tipp. Es wird bei erneutem Klick nicht doppelt abgebucht.
- Die vier `betinsight_tips`-Datensätze wurden zunächst als **Entwurf** angelegt, `preis_units=1`, `quote=NULL`, `sportart=Saisonprognose`, `tipp_quelle=BETINSIGHT_SPEZIAL_SAISONWETTEN`, `telegram_tipp_status=NICHT_ERFORDERLICH`.
- Die Frontend-Kachel zeigt den Button nur aktiv, wenn der zugehörige Datensatz auf der offiziellen Tippliste als `veröffentlicht` erscheint. Noch nicht freigegebene Datensätze haben deaktivierte Buttons.

## KEINE Telegram-, Live- oder MatchRadar-Alarme
- Saisonprognosen sind bewusst mit `sportart=Saisonprognose` gekennzeichnet, **nicht** mit normalem Sportartwert `Fussball`. Der vorhandene MatchRadar-Trigger erstellt nur bei ausgewählten normalen Sportarten Posts. Dadurch keine automatische Community-Neutipp-Meldung.
- Die Entwürfe werden **nicht über** den regulären Admin-Tipp-Publish-Prozess gesendet (dort würde ein Publish-Outbox-Eintrag entstehen); es wird **kein** Eintrag in `betinsight_tip_publish_outbox` erzeugt.
- Für diese vier IDs ist `telegram_tipp_status=NICHT_ERFORDERLICH`. Weder Telegram-Neutipp-Bot noch Live-Alarm noch Newsletter-Neutipp-Push sind zu aktivieren.

## Redaktioneller NewsRadar-Bericht
Öffentlich (kostenfrei): `https://betinsight.club/de/newsradar/bundesliga-2026-27-opta-top4-saisonwetten/`
Der Bericht wird über das bestehende statische Website-Repo `betinsightclub/website` und die NewsRadar-Übersicht veröffentlicht; **kein Telegram-Massenversand**. Enthält Quellennachweise, Warnung vor ungeprüften Buchmacherquoten und Link zur Spezial-Kategorie.

## Verifikation / Go-Live
1. Branch-Tests für Tippcenter-Syntax, acht Sprachen und bestehende Tipp-Regressionen grün.
2. Pro ID in Supabase prüfen: genau 1 Datensatz; Preis 1; `quote IS NULL`; korrekter Spezial-Quelltyp; keine Publish-Outbox; kein Telegram-/MatchRadar-Post.
3. Vier Entwürfe erst auf `veröffentlicht` stellen, **nachdem die neue Frontend-Kachel freigegeben** wurde.
4. Danach alle vier im Tipp-Center sichtbar und Button aktiv, ohne Testuser-Buchung zu riskieren.
5. Bei Bedarf Testfreischaltung nur in einem dafür autorisierten Testkonto mit passenden Units durchführen. Reale Nutzerkonten nicht für Probebuchungen belasten.
6. Die kommende Auszahlung von Gratis-Geschenk-Units und die Einstufung möglicher Werberechtsrisiken vor späterer Saisonabrechnung separat prüfen.

## Quellen
- Opta via 90min (09.11.2026): https://www.90min.de/supercomputer-sagt-bundesliga-tabelle-26-27-voraus-ki-prognose-nach-dem-9-spieltag
- DFL Terminplan: https://www.bundesliga.com/de/bundesliga/news/spielplan-saison-start-termine-daten-2026-27-22043
