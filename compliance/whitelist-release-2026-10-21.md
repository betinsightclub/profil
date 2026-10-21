# BetInsight – Whitelist Release 21.10.2026 (kontrolliert)

## Stand und Quellen
- **Prüfdatum:** 21.10.2026 (Europe/Berlin)
- **DE:** Amtliche GGL-Whitelist, Stand **02.10.2026**: https://www.gluecksspiel-behoerde.de/de/fuer-spielende/uebersicht-erlaubter-anbieter-whitelist
- **CH:** Gespa Online-Sportwetten, Swisslos Sporttip + Loterie Romande Jouez Sport: https://www.gespa.ch/de/geldspielformen/sportwetten
- **AT:** BMF FAQ Landesrecht (https://www.bmf.gv.at/themen/gluecksspiel-spielerschutz/gesetzliche-grundlagen-gluecksspiel/faq-gluecksspielmonopol.html); noch keine komplette Oktober-Einzelprüfung sämtlicher Landesbewilligungen.
- **BR:** BetInsight-Geschäftsentscheidung: **kein** Zielmarkt für Wett-Tipps, Sportanalyse-Angebote, Anbieter/Quoten, Boni oder Wett-Affiliate-Links.
- **Baseline:** `assets/provider-whitelist.json` (31.08.2026); 92 historische Overrides (zuletzt 09.09.2026).
- **Neue Datenebene:** `assets/provider-whitelist-web-batch-93.json`, nach allen historischen Overrides geladen. Legacy-Batches bleiben unverändert/rollbackfähig.

## Differenz und Übernahmeentscheidung

| Kennung | Vorher | Jetzt | Art / Sicherheit |
|---|---|---|---|
| DE-01 | 30 Namen ohne individuell verknüpfte GGL-Domain | 31 amtliche Sportwetten-Namen, jeweilige Betreiber/Domains, inkl. Tipico Co. Limited / tipico.de | Anzeige nur als Text, **kein** neuer Affiliate-/Bonuslink |
| CH-01 | Swisslos + Loterie Romande in historischer Liste | ausschließlich diese zwei in aktueller Overlay-Liste; keine Fremdlinks | amtliche Exklusivität |
| AT-01 | dieselben sieben Marken für jedes der neun Bundesländer als verified | neun Bundeslandauswahlen erhalten, aktive Online-Freigabe bis erneuter Betreiber-Landeslizenzprüfung ausgesetzt | konservative Quarantäne (bewusste Angebotsreduzierung) |
| BR-01 | 188 Marken in alter Liste; schaltbarer Marketing-Block | Ausschluss in finale Datenebene + nicht schaltbare UI-Länderblockade; keine buchmacherbezogene Ansicht | feste Produktentscheidung |
| INT-01 | mehrere ältere internationale Länder als verified | Browser-/Premium-Auswahl verlangt aktuelle Einzelprüfung (Prüfdatum max. 31 Tage) | ältere Einträge bleiben archiviert, werden vorübergehend **nicht** als neu verifiziert angezeigt |
| UI-01 | sechs internationale Anbieter mit Affiliate-Ausgangswegen auf Legacy-Seite | Legacy-Seite führt zur zentralen Länder-Auswahl | kein Verlust der alten Datei; direkte veraltete Affiliate-Auswahl nicht mehr erreichbar |
| PREMIUM-01 | freier Text in WHITELISTED/KRYPTO/SONSTIGE als Fallback; Type statt konkrete Namen | geprüfte Land/Region/Anbieter Auswahl erforderlich; Datenladerfehler = Sperre; konkrete Namen als zusätzliche Parameter bei bestehendem Make-Checkout | Änderung nur an Frontend; serverseitige Make-Prüfung muss separat abgenommen werden |
| BONUS-01 | Bonusinformationen nicht systematisch bestätigt | `bonus-und-anbieterregister-2026-10-21.csv`: 40 Prüfzeilen, alle nicht belegten Punkte `UNGEPRUEFT` | keine Bonuswerbung / automatische Aktivierung behaupten |

## Backend-Abgrenzung
- Das bestehende Make-Premium-Checkout-Ziel und das Supabase-Backend wurden **nicht verändert**.
- Die Frontend-Regel ist eine Darstellungssperre, **kein Ersatz für serverseitige Länder-/Domainvalidierung** an allen Endpunkten. Direkte API- oder Altlink-Aufrufe müssen gesondert serverseitig geprüft werden, bevor man dies als vollständig geschlossene Freigabesicherung bezeichnet.
- Keine Käufe, Zahlungen, Units, Konten, Tips oder Referral-Buchungen wurden für diesen Release erzeugt oder verändert.

## Manuelle Abnahme ohne Echtgeld
1. `/anbieter/` → Deutschland suchen und bestätigen → **31** Namen; Tipico vorhanden; Betreiber/registrierte Domain angezeigt; kein Klick auf Wettanbieter oder Bonus.
2. `/anbieter/` → Schweiz → **2** Namen Swisslos Sporttip, Loterie Romande Jouez Sport; **BetFury, Stake, Bet365 dürfen nicht vorkommen**.
3. `/anbieter/` → Österreich, nacheinander **alle neun** Bundesländer auswählen: keine neue Freigabe, deutlicher Hinweis auf Prüfung.
4. `/anbieter/` → Brasilien → geschlossene Informationsansicht; kein Anbieter.
5. `/anbieter-auswahl/` → automatische Navigation auf `/anbieter/`; **keine** globalen 6 Crypto-/Casino-Partnerbuttons.
6. `/anbieter/` → beliebiges anderes Land mit altem Prüfdatum → Hinweis auf ausstehende Neubeurteilung, statt Anzeige als aktuell bestätigt.
7. `/premium-upgrade/` als Test-Account, **keine Zahlung**: DE nur geprüfte WHITELISTED Anbieter möglich; freie KRYPTO/SONSTIGE-Option darf nicht zum Checkout führen. AT / Brasilien müssen gesperrt bleiben. CH nur zwei.
8. Browserkonsole: keine Syntax-/Script-Ladefehler, korrekte CSS/Mobilansicht. Testen mit aktivem und blockiertem Whitelist-Laden.
9. Vor endgültiger Bestätigung Live-Werbe-/Affiliate-Altlinks und serverseitige Prüfung über Make/Edge Functions/Quotenfunktionen unabhängig nachsehen.
10. Prüfen, dass Profile, gekaufte Units, Referral, Wechselstube und freigeschaltete Tipps unverändert funktionieren; **keine** Echtgeld-Testwette erforderlich.

## Änderungshistorie
- **2026-08-31:** Basis v2.1 hinterlegt.
- **2026-09-09:** 92 historische Whitelist-Batches, letzte Überschreibung.
- **2026-10-02:** Neuer Quellenstand deutsche GGL-Liste.
- **2026-10-21:** Neuabgleich 31 DE-Marken mit Betreiber/Domains; CH/BR/AT konservativ überschrieben. Einbindung mit separatem GitHub-Feature-Branch; Beta/Boni gesperrt und Quellen archiviert.
- **Nächste Nachprüfung:** monatlich ab 01.11.2026; ohne automatische produktive Freigabe.

## Technischer Rollback
- Nur die Feature-Branch-Änderungen zurücknehmen / betreffenden Merge revertieren. Historische 92 Batches und die August-Basis sind unverändert.
- Originale Endpunkte für Premium, Plisio, Supabase und Make bleiben gleich.
- Nach Rollback anbieter-/premium-seitige Cache-Version erneut kontrollieren.
