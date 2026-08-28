# BetInsight Kundenbereich – Mehrsprachigkeits-Migration

Stand: 28.08.2026
Branch: `feature/i18n-multilang-safe-v3`
Status: **DE/EN-Code-Migration vollständig · Browser-Regressionsprüfung vor Merge erforderlich**

## Feste Regeln

1. Die produktive deutsche Seite auf `main` bleibt bis zum Abschluss der Regressionstests unverändert.
2. Admin, Admin-Tipps und Master-Backoffice bleiben deutsch und sind nicht Teil der Übersetzung.
3. Geschäftslogik, Webhooks, Sheet-Felder, API-Felder und interne IDs werden nicht übersetzt.
4. Die Dashboard-UUID wird bei neuer interner Navigation niemals in eine Browser-URL geschrieben.
5. Alte eingehende UUID-/Token-Links bleiben nur als Kompatibilitätsweg erlaubt: Zugang lokal speichern und sensible Query-Parameter aus der sichtbaren URL entfernen.
6. Deutsch bleibt der Fallback, falls eine Übersetzung fehlt oder eine Locale nicht geladen werden kann.
7. Neue Sprachen erzeugen keine Kopien des kompletten Kundenbereichs.
8. `betinsight.network` erhält keinen Rückfall auf UUID-/Token-Parameter. Der Premium-Network-Weg bleibt gesperrt, bis ein eigener sicherer Cross-Origin-Handoff vorhanden und getestet ist.

## Zielarchitektur

Eine Kundenseite bleibt eine Kundenseite, zum Beispiel:

`https://app.betinsight.club/wallet/`

Die sichtbare Sprache wird zentral über `betinsight_language` gesteuert. Die Seite selbst wird nicht als `/de/wallet/`, `/en/wallet/`, `/es/wallet/` usw. vervielfacht.

### Zentrale Dateien

- `assets/i18n/core-v2.js` – zentraler Sprachkern
- `assets/i18n/locales/manifest.json` – registrierte Sprachen
- `assets/i18n/locales/de.json` – deutsche Basistexte / Fallback
- `assets/i18n/locales/en.json` – englische Basistexte
- `assets/i18n/pages/*/de.json` und `en.json` – umfangreiche Seitentexte, wo ein eigener Scope sinnvoll ist
- `assets/app-session.js` – lokaler Profil-/Dashboard-Sitzungshelfer
- `assets/app-navigation-v2.js` – mehrsprachige tokenfreie Same-Origin-Navigation
- `assets/app-navigation.js` – Kompatibilitätsloader für bestehende Kundenseiten
- `assets/i18n/dashboard-legacy.js` – Übersetzungsadapter für das große bestehende Hauptdashboard, ohne dessen Geschäftslogik neu zu schreiben

## Fertig migrierte Kundenbereiche DE/EN

- Konto & Zugang (`/konto/`)
- Hauptdashboard / Profil & Empfehlungscenter (`/`)
- Daily Bonus (`/daily/`)
- Neue Tipps (`/tipps/`)
- Freigeschaltete Tipps (`/freigeschaltet/`)
- Unit-Pakete (`/pakete/`)
- Units kaufen (`/kaufen/`)
- Unit-Wechselstube (`/wechselboerse/`)
- Angebote kaufen (`/wechselboerse/angebote/`)
- Units verkaufen / eigene Angebote (`/verkaufen/`)
- Wallet (`/wallet/`)
- Wettanbieter (`/anbieter/`)
- Marketing-Center (`/marketing-center/`)
- Support (`/support/`)
- zentrale App-Navigation einschließlich Sprachumschaltung

Adminbereiche wurden absichtlich nicht angefasst.

## Technische Leitplanken der Migration

### Dashboard-/Profilzugang

`assets/app-session.js` trennt:

- `betinsight_dashboard_token` – Dashboard-UUID
- `betinsight_profile_token` – normaler Profilzugang

Neue Same-Origin-Navigation verwendet nur Pfade und Hashes. Sie erzeugt keine URLs der Formen:

- `?dashboard_token=<UUID>`
- `?id=<UUID>`
- `?token=<UUID>`

Alte bereits versendete Links dürfen beim Einstieg weiterhin erkannt werden. Der Wert wird lokal übernommen; sensible Parameter werden anschließend aus der sichtbaren URL entfernt.

### Neue Tipps

`/tipps/` benötigt weiterhin den normalen Profilzugang, da die bestehende Tipp-/Freischaltlogik damit arbeitet. Die neue Navigation darf deshalb nicht so tun, als reiche eine allein gespeicherte Dashboard-UUID für diesen Bereich aus. Das ist Teil der Regressionstest-Matrix.

### Premium Network

`betinsight.network` liegt auf einer anderen Origin. `localStorage` von `app.betinsight.club` kann dort nicht direkt gelesen werden.

Deshalb ist im neuen Menü **keine Zwischenlösung mit UUID in der URL** erlaubt. `Premium-Provisionen` bleibt im neuen Navigationsweg mit einem verständlichen Migrationshinweis gesperrt, bis ein sicherer Handoff verfügbar ist, zum Beispiel:

1. bereits bestätigte App-Sitzung serverseitig prüfen,
2. kurzlebigen Einmalcode ausstellen,
3. nur diesen Einmalcode an `betinsight.network` übergeben,
4. Code dort einmalig gegen die bestätigte Sitzung tauschen,
5. Code sofort ungültig machen.

## Weitere Sprache ergänzen

Beispiel Spanisch:

1. `assets/i18n/locales/es.json` hinzufügen.
2. In `assets/i18n/locales/manifest.json` `es` registrieren.
3. Für große Seitenscopes die entsprechenden `assets/i18n/pages/<scope>/es.json` ergänzen.
4. Keine Kunden-HTML als spanische Kopie anlegen.
5. Dynamische Texte ebenfalls über vorhandene Sprachschlüssel führen.

Damit bleibt die Architektur für weitere Sprachen skalierbar.

## Noch nicht freigegeben: Merge nach `main`

Die Code-Migration ist auf dem Feature-Branch vollständig, aber ein Merge nach `main` erfolgt erst nach einem echten Browser-Regressionslauf.

### Mindest-Testmatrix vor Merge

#### Deutsch
- Dashboard und alle Kunden-Unterseiten öffnen,
- bisher sichtbare deutsche Texte fachlich unverändert,
- Profil-/Dashboard-Zugang wird erkannt,
- E-Mail-Zugangslink anfordern funktioniert,
- Referral-Code und Empfehlungslinks stimmen,
- Units, Tippfreischaltung, Ergebnisse, Wallet, Verkauf, Angebote, Daily und Support funktionieren unverändert,
- Premium-/Telegram-Bereiche verhalten sich wie vor der Übersetzung.

#### Englisch
- Sprache auf EN umschalten und mehrere Seiten nacheinander öffnen,
- Sprachwahl bleibt nach Navigation und Reload gespeichert,
- statische Texte, Pop-ups, Status-, Fehler- und Erfolgsmeldungen sind Englisch,
- lange englische Texte laufen auf Desktop und Mobil nicht über,
- dynamisch geladene Tipps, Ergebnisse, Netzwerkdaten und Supportinhalte behalten Datenwerte/IDs unverändert und übersetzen nur die Oberfläche.

#### Sprache
- DE → EN → DE ohne Datenverlust,
- Auswahl bleibt gespeichert,
- fehlende Locale fällt auf Deutsch zurück,
- Seitenscopes laden ohne 404-/JSON-Fehler.

#### Sicherheit
- interne Navigation erzeugt keine UUID-/Profilzugang-Query in der Browserzeile,
- alte Zugangslinks werden übernommen und aus der sichtbaren URL bereinigt,
- API-/Webhook-Anfragen dürfen die für das Backend erforderlichen Authentifizierungswerte weiterhin serverseitig senden; diese Regel betrifft die sichtbare Browser-Navigation,
- Premium-Network-Handoff erzeugt keine UUID-URL und bleibt bis zur sicheren Übergabe gesperrt.

#### Darstellung
- Desktop,
- Smartphone,
- Menü offen/geschlossen,
- Pop-ups und Dialoge,
- Tabellen und Netzwerkebenen,
- Unit-Pakete,
- Wettanbieter-Karten,
- Support-Threads,
- lange englische Button- und Hinweistexte.

## Merge-Regel

Erst wenn die Testmatrix ohne kritischen Fehler abgeschlossen ist, wird PR #6 von Draft/WIP auf mergefähig gesetzt und kontrolliert nach `main` übernommen. Bis dahin bleibt die produktive deutsche Seite unverändert.
