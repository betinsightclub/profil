# BetInsight – Whitelist-Differenzbericht / Sperrprotokoll

**Prüftag:** 2026-10-21 (Europe/Berlin)  
**Status:** VORPRÜFUNG / NICHT ZUR PRODUKTIVÜBERNAHME FREIGEGEBEN  
**Umfang:** Repository `betinsightclub/profil`, amtliche Quellen DE/AT/CH; internationale Länder werden als Wiederprüfungsbestand inventarisiert, **nicht** pauschal neu bestätigt.  
**Baseline:** `main`, `assets/provider-whitelist.json` (Version 2.1; `updated: 2026-08-31`), `assets/provider-whitelist-batches.json` mit 92 Overrides (neueste `updated: 2026-09-09`).  
**Änderungsprinzip:** GitHub-Audit-Branch, keine Änderung an produktiven `main`-Dateien, keine automatischen Affiliate-/Bonusfreigaben.

## 1. Differenzen – priorisiert

| ID | Priorität | Ist | Amtliche/Projektgrundlage | Nötige Maßnahme | Status |
|---|---|---|---|---|---|
| DE-01 | hoch | DE-Basis: 30 **Markennamen** ohne individuell hinterlegte Betreiber- und Domainfelder | GGL-Whitelist, Stand **02.10.2026** | Alle DE-Einträge auf konkrete Internetdomain, Rechtsträger, Online-Sportwetten-Erlaubnis, Zeitpunkt und Vertriebsweg normieren | OFFEN |
| DE-02 | hoch | **Tipico** fehlt in der 30-Markennamen-Liste DE | GGL nennt **Tipico Co. Limited**, Sportwetten online/stationär, **tipico.de** | Als neuen Kandidaten in den Freigabeprozess aufnehmen, nicht ungeprüft live | BEHÖRDLICHER TREFFER / LIVE-FREIGABE OFFEN |
| DE-03 | mittel | Einige Provider haben mehrere separate Marken-/Subdomains unter einem Betreiber | z. B. I.B.C. Sportsbetting (`wettarena.de`, `bet3000.de`); NetX Betting (`sportwetten.de`, `betstar.sportwetten.de`, `betstar.sw.de`, `betbird.de`) | Betreiber↔Marke↔Domain als 1:n-Beziehung pflegen | TEILBELEG |
| DE-04 | mittel | GGL-Stand in bestehenden Metadaten vom 07.09.2026 (Batch 87), Basis vom 14.08.2026 | GGL-Website aktuell 02.10.2026 | Quellenstand und Änderungsprotokoll aktualisieren **erst nach vollständigem Einzelvergleich** | OFFEN |
| AT-01 | hoch | Batch 88 zeigt **sieben Anbieter identisch in allen neun Bundesländern** als `verified` | Österr. BMF: klassische Sportwetten sind landesrechtlich bewilligungspflichtig; die Bundesländer-/Anbieterbezüge müssen nach Recht und Betreiberfall geprüft werden | Landesrecht, ausstellende Behörde, Bewilligungsnummer, Geltung für Online-Angebot und Domain/Betreibersitz je Kandidat erneut belegen; bis dahin keine neue Freigabe | OFFEN |
| CH-01 | hoch | Basis/Batch 87 nennen Swisslos Sporttip und Loterie Romande Jouez Sport | Gespa bestätigt exklusiv diese zwei Gesellschaften für Online-Sportwetten | Nur diese beiden Produkte; konkrete weiterleitende Produktdomains vor Aktivierung prüfen; keine Links zu Drittanbietern | REGULATORISCH BESTÄTIGT / LINKS OFFEN |
| BR-01 | **kritisch** | BR ist in der Basisliste `status: verified` mit 188 Marken; Batch 87 bestätigt den Status erneut. Nur der separate `regional-restrictions.js`-Schalter sperrt BR im normalen UI, und der Schalter ist technisch deaktivierbar. | Geschäftsentscheidung: Brasilien ist **dauerhaft kein Zielmarkt** für Wett-Tipps/Sportanalyseangebote | BR in der Länderfreigabe selbst `excluded`, ohne Anbieter oder Referral-Links und unabhängig vom umstellbaren regionalen UI-Schalter erzwingen; Premium/Anbieter-Auswahl/Redirects prüfen | OFFEN; KEINE PRODUKTIVE ÜBERNAHME |
| UI-01 | hoch | `anbieter-auswahl/index.html` hat sechs fest eingebettete Anbieter (BetFury, TrustDice, Stake, Cloudbet, FortuneJack, Tipico) unabhängig von der länderspezifischen Liste | DE/GGL und CH/Gespa verbieten die pauschale Annahme internationaler Marktfreigaben | **Im Audit-Branch**: Sofort-Weiterleitung dieser Legacy-Seite auf den zentralen Länder-/Whitelist-Selektor vorbereitet. Nutzerfreundliche finale Umgestaltung und Browsertest erforderlich | IM ENTWURF, NICHT LIVE |
| PREMIUM-01 | hoch | `assets/premium-provider-details.js` lässt bei Ausfall der Whitelist eine **manuelle Eingabe** zu; Kategorien `Krypto`/`Sonstige` akzeptieren freie Provider-Namen | Frontend-Listen ersetzen keine Backend-Zulassungsprüfung | Vor Quoten- oder Referral-Weiterleitung serverseitig `country+region+brand+domain+betting_type` prüfen, fail-closed | OFFEN |
| BONUS-01 | hoch | Kein einheitliches, amtlich und anbieterbezogen geprüftes Bonusregister mit Verzicht/Umsatz | Bonusbedingungen liegen beim Anbieter und variieren je Aktion, Land und Zeitpunkt | CSV als Arbeitsregister; unbestätigte Werte `UNGEPRUEFT`; aktive Checkout-AGB müssen Vorrang erhalten | VORLÄUFIGES REGISTER ERSTELLT |
| INT-01 | mittel | 92 Batch-Dateien mit vielen Länder-`verified`-Einträgen, wiederholten Überschreibungen und teils `providers: []` | Länder-/Domaingenehmigungen sind zeit- und produktabhängig | Neueste effektive Merge-Regel pro Land/Region automatisch ausrechnen, Quelle/einzelne Marke nachprüfen; `verified` darf nicht aus einem alten Batch ungeprüft fortgeschrieben werden | STRUKTUR INVENTARISIERT; INHALTSNACHPRÜFUNG OFFEN |

## 2. Deutschland – GGL-Einzelprüfung

Offizielle, am 21.10.2026 abgerufene Quelle, Quellenstand **02.10.2026**:
https://www.gluecksspiel-behoerde.de/de/fuer-spielende/uebersicht-erlaubter-anbieter-whitelist

**BetInsight-Basisliste (30 Marken):** Bet-at-home; Betano; Betway; bwin; PokerStars Sports; DAZN BET; AdmiralBet; Neo.bet; bet365; Wettarena; Bet3000; Interwetten; Intertops; Bpremium; LeoVegas; Merkur Sports; XTiP; Merkur Bets; Sportwetten.de; Betstar; Betbird; ODDSET; VBET; Sportingbet; Letsbet; Original Wetten; Tipwin; Tiptorro; Winamax; 888sport.

**Beispielhafte GGL-Domain-Treffer (nicht Ersatz der Komplettprüfung):**

| Marke | Lizenzierter Betreiber | GGL-Domain |
|---|---|---|
| Betway | Betway Limited | betway.de |
| Wettarena | I.B.C. Sportsbetting Limited | wettarena.de |
| Bet3000 | I.B.C. Sportsbetting Limited | bet3000.de |
| Interwetten | Interwetten Gaming Limited | interwetten.de |
| Intertops | ITSP Services GmbH | intertops.de |
| Sportwetten.de, Betstar, Betbird | NetX Betting Limited | sportwetten.de; betstar.sportwetten.de; betstar.sw.de; betbird.de |
| ODDSET | Oddset Sportwetten GmbH | oddset.de |
| Original Wetten | **Tipico Karlsruhe Limited** | original-wetten.de |
| Tipico (**derzeit in DE-Basis nicht enthalten**) | Tipico Co. Limited | tipico.de |
| DAZN BET | DZBT Operations Limited | daznbet.de |
| PokerStars Sports | Cyan Blue International Limited | pokerstars.de/sports |
| Merkur Sports / XTiP / Merkur Bets | Merkur Bets Malta Limited | merkur-sports.de; xtip.de; merkurbets.de |
| 888sport | 888 Germany Limited | 888sport.de |

**Korrektur/Identitätsabgleich:** `original-wetten.de` gehört laut GGL zu **Tipico Karlsruhe Limited**, während `tipico.de` zu **Tipico Co. Limited** gehört. Trotz gemeinsamer Markenfamilie sind das zwei getrennte Erlaubnisinhaber. `pokerstars.de/sports` ist laut GGL als Sportwetten-Angebot von **Cyan Blue International Limited** registriert; die allgemeine PokerStars-Pokerlizenz unter Reel Germany ist davon getrennt. Die aktuelle tatsächliche Sports-Produkterreichbarkeit bleibt unabhängig von der Registererlaubnis prüfpflichtig. 

**Wichtig:** Ein Treffer in der GGL-Seite beweist nur den dort aufgeführten rechtlichen Status. Er bestätigt **keinen** Affiliate-Vertrag, keine aktiven Redirect-Zieladressen, Bonusaktion oder zulässige werbliche Ausgestaltung. GGL-Quelle wurde als öffentliche HTML-Seite geprüft; es wird keine behauptete vollständige automatisierte Listenprüfung ausgewiesen.

## 3. Österreich – regionale Matrix

Verbindliche neun Regionen, wie bereits im BetInsight-JSON:
**Burgenland AT-1; Kärnten AT-2; Niederösterreich AT-3; Oberösterreich AT-4; Salzburg AT-5; Steiermark AT-6; Tirol AT-7; Vorarlberg AT-8; Wien AT-9.**

Bestehende sieben Online-Kandidaten in Batch 88: **win2day, Tipico, tipp3, ADMIRAL, Sicher.Wetten, tippbet360, VERSUSbet**. In der bestehenden Matrix sind sämtliche sieben in allen neun Regionen gleichlautend hinterlegt; dies darf nicht automatisch als neun eigenständige Landesgenehmigungen ausgelegt werden. Batch 88 nennt bei diesen Kandidaten als Rechts-/Bewilligungsbezug überwiegend Niederösterreich (`AT-3`) oder Oberösterreich (`AT-4`). Der relevante Anknüpfungsort bei Online-Wetten, die landesrechtliche Grundlage und die tatsächliche Reichweite werden pro Betreiber neu abgeklärt.

Amtliche Grundlagen: https://www.bmf.gv.at/themen/gluecksspiel-spielerschutz/gesetzliche-grundlagen-gluecksspiel/faq-gluecksspielmonopol.html ; https://www.wien.gv.at/amtswege/sportwetten-taetigkeit-wettunternehmer ; Landesrecht: https://www.ris.bka.gv.at/UI/Land/Auswahl.aspx?TabbedMenuSelection=LandesrechtTab

## 4. Schweiz

Gespa – Online-Sportwetten: Swisslos/Sporttip und Loterie Romande/Jouez Sport. Andere ausländische Online-Buchmacher und entsprechende Direktlinks dürfen im Schweizer Wettanbieterbereich nicht aktiviert werden.
Quellen: https://www.gespa.ch/de/geldspielformen/sportwetten ; https://www.gespa.ch/de/bekaempfung-illegaler-aktivitaeten/illegale-spielangebote

**Abnahme:** Zwei korrekte Produkte; keine fremden Wettlinks auf `anbieter`, `anbieter-auswahl`, Premium- oder Tippseiten für CH; ggf. Landesteil-Verfügbarkeitsprüfung.

## 5. Brasilien

**BetInsight-Unternehmensentscheidung (verbindlich):** keine Vermarktung von Wett-Tipps, Wetten oder anbieterbezogenen Quoten-/Affiliate-Funktionen nach Brasilien, unabhängig davon, welche brasilianischen Anbieter staatlich erlaubt sein mögen.

**Technischer Befund:** `assets/provider-whitelist.json` listet 188 BR-Marken; Batch 87 erhält `verified` aufrecht. `assets/regional-restrictions.js` verwendet einen von Supabase geladenen schaltbaren Wert `brazil_betting_block_active` (Fallback `true`). Für den dauerhaft ausgeschlossenen Markt ist eine unabhängige, nicht durch Werbekonfiguration aufgehobene Länderregel erforderlich.

## 6. Bonusbedingungen – vorläufige Feststellung

Prüffelder pro **Land + Marke + konkrete Aktionsversion**: Code erforderlich (ja/nein), automatische Einbuchung (ja/nein/opt-in), Checkbox/Auswahl, Bonus ablehnen oder nachträglich widerrufen, Mindesteinzahlung, Bonusmaximum, anrechenbarer Umsatz (Bonus/Einzahlung/gesamt), Umsatzfaktor, Mindestquote, Frist, zulässige Wettarten, Cashout/Auszahlung, KYC, Verfall und zuständige vollständige Aktion-AGB.

**Tipico DE als einziges exemplarisch recherchiertes Bonusangebot (KEINE Abschlussbestätigung):** Die Anbieter-Marketingseiten nennen aktuell einen Willkommensbonus mit Opt-in-Haken bei erster Einzahlung, keinen zwingenden Bonuscode, 10-fachen Umsatz des Bonusbetrags, Mindestquote 1,50, 30 Tage und maximal 100 € Bonus. **Aber:** Andere Tipico-Hilfeseiten nennen abweichende historische oder nicht vereinheitlichte Parameter, etwa 6-fach / 2,00 / 90 Tage. Darum gelten sämtliche Werte bis zur **konkreten, aktuellen Aktions- und Checkout-AGB** als vorläufig. Verzicht/Widerruf nach Einzahlung **nicht bestätigt**. Keine Bonusbedingungen automatisiert bewerben.

Anbieterquellen zur Plausibilitätsprüfung:
- https://www.tipico.de/wett-tipps/tipico-bonus-erklaeren
- https://www.tipico.de/wett-tipps/tipico-umsatzbedingungen
- https://www.tipico.de/wett-tipps/freunde-werben-tipico

**Ergänzende deutsche Betreiber-/Domainmatrix:** `compliance/de-ggl-betreiber-domains-2026-10-21.csv` enthält **31 Zuordnungen** (30 bestehende BetInsight-Marken plus Tipico-Kandidat) zu den auf der amtlichen GGL-Webliste vom 02.10.2026 genannten Online-Sportwettenbetreibern und Domains. Die Tabelle ist ein Prüfbeleg, keine Affiliate- oder Marketingfreigabe. Produkt-Erreichbarkeit, Redirect, Alters- und Werberegeln müssen weiterhin getestet werden.

CSV-Register: `compliance/bonus-und-anbieterregister-2026-10-21.csv` enthält **40 Zeilen**: 30 bisherige DE-Marken + Tipico-Kandidat, sieben AT-Marken, zwei CH-Produkte; ungeprüfte Bonusfelder stehen auf `UNGEPRUEFT`.

## 7. Geltende Aktivierungssperre / technischer Freigabeprozess

1. **Keine direkte Änderung an `main`** aus diesem Audit. Kein automatisches Merge, keine Referral-URL ergänzen.
2. Eine positive Anzeige erfordert je Datenzeile: **amtliches Register, Vertrags-/Betreibername, exakte Domain, Wettart, Online-Vertriebsweg, geografischer Geltungsbereich, Quellenstand und Prüfdatum.** Affiliate-Freigabe ist gesondert.
3. Schweizer Providerliste auf die zwei legalen Online-Angebote begrenzen; keine Link-Weitergabe zu Drittanbietern.
4. Brasilien als Zielmarkt **hart ausschließen**, auch bei Ausfall externer Konfigurationsdienste oder Umschalten des bisherigen Marketing-Schalters.
5. Österreich: Bundesland sichtbar halten, aber nur sauber belegte online-relevante Genehmigungen je Anbieter auswerten; nicht schlicht neun Kopien als neun Bewilligungen behandeln.
6. Bonus-/Code-/Umsatz-Bedingungen nur als `verified_bonus`, wenn konkrete aktuelle Angebots-AGB mit Geltungsgebiet und Datum dokumentiert sind. Sonst `UNGEPRUEFT` und keine Werbeaussage.
7. **Abnahmetests vor Merge:** DE erlaubte und unerlaubte Domain, AT alle neun Regionen, CH fremder Buchmacher, BR bei aktiviertem und deaktiviertem Konfigurationsschalter, Premium-Kategorie `Sonstige`, Datenladerfehler, Direkt-URL ohne Länderauswahl, historische Referral-Links, Cache/SEO-Seiten.
8. Monatliche manuelle oder beaufsichtigte Stichproben, jede Änderung mit vorher/nachher, Grund, Quellenstand, Prüfer und Commit.

## 8. Änderungshistorie

| Datum | Änderung | Art | Veröffentlichung |
|---|---|---|---|
| 2026-08-31 | Zentrale Basisliste v2.1 gespeichert | historischer Basisstand | bereits in `main` |
| 2026-09-09 | Letzte bekannte Override-Batches (87–92) | historischer Ergänzungsstand | bereits in `main` |
| 2026-10-02 | Neuer amtlicher GGL-Whitelist-Stand | externe Registeränderung | nicht automatisch übertragen |
| 2026-10-21 | Bundes-/Länderprüfung und Code-Audit; BR-Risiko, DE-Tipico-Lücke, AT-Kopiermatrix, globale Showcase-Route, Premium-Fallback dokumentiert | **Audit-Dokumentation** | **nur Audit-Branch** |
| 2026-10-21 | GGL-Sportwetten-Betreiber-/Domainmatrix für 30 Bestandsmarken + Tipico ergänzt; Tipico Co. Limited und Tipico Karlsruhe Limited juristisch getrennt | **31 Prüfzeilen, kein Affiliate-/Bonusabschluss** | **nur Audit-Branch** |
| 2026-10-21 | Legacy-Schauliste der sechs internationalen Anbieter auf zentralen Länder-/Whitelist-Selektor umgeleitet (Meta- und JS-Redirect) | **QA-Entwurf** | **nur Audit-Branch** |

## 9. Begrenzung und nächster Kontrollpunkt

Diese Version ist ein **nachvollziehbarer Differenz- und Sperrbericht**, keine nachgewiesene Vollprüfung aller bestehenden internationalen Anbieter/Domains. Alle 92 JSON-Batches wurden hinsichtlich betroffener Länder, Status und Prüfdatum inventarisiert; die amtlichen Register jedes einzelnen der vielen internationalen Länder sowie jedes Bonusangebots konnten damit noch nicht erneut verifiziert werden. Die noch ungeprüften Freigaben dürfen nicht als am 21.10.2026 erfolgreich bestätigt ausgewiesen werden.

**Nächster Abnahmepunkt:** Alle bestehenden aktiven Land-Region-Anbieter-Links mit den jeweiligen aktuellen Registern vergleichen, den geprüften Satz in einer neuen schreibgeschützten Version ablegen, eine differenzielle QA-Auswertung durchführen und erst dann einen getrennten Release-PR zur produktiven Freischaltung erzeugen.
