# BetInsight Kundenbereich – Mehrsprachigkeits-Migration

Stand: 27.08.2026
Branch: `feature/i18n-multilang-safe-v3`
Status: **WIP / nicht für `main` freigegeben**

## Feste Regeln

1. Die produktive deutsche Seite auf `main` bleibt während der Migration unverändert.
2. Admin, Admin-Tipps und Master-Backoffice bleiben deutsch und sind nicht Teil der Übersetzung.
3. Geschäftslogik, Webhooks, Sheet-Felder, API-Felder und interne IDs werden nicht übersetzt.
4. Die Dashboard-UUID wird bei neuer Navigation niemals in eine Browser-URL geschrieben.
5. Alte eingehende UUID-Links dürfen nur als Kompatibilitätsweg eingelesen, lokal gespeichert und sofort aus der sichtbaren URL entfernt werden.
6. Deutsch bleibt der Fallback, falls eine Übersetzung fehlt oder eine Locale nicht geladen werden kann.
7. Neue Sprachen erzeugen keine Kopien des kompletten Kundenbereichs.

## Zielarchitektur

Eine Kundenseite bleibt eine Kundenseite, zum Beispiel:

`https://app.betinsight.club/wallet/`

Die sichtbare Sprache wird zentral über `betinsight_language` gesteuert. Die Seite selbst wird nicht als `/de/wallet/`, `/en/wallet/`, `/es/wallet/` usw. vervielfacht.

### Zentrale Dateien

- `assets/i18n/core-v2.js` – Sprachkern
- `assets/i18n/locales/manifest.json` – registrierte Sprachen
- `assets/i18n/locales/de.json` – deutsche Texte / Fallback
- `assets/i18n/locales/en.json` – englische Texte
- `assets/app-session.js` – lokaler Dashboard-Sitzungshelfer
- `assets/app-navigation-next.js` – vorbereitete tokenfreie Navigation

### Weitere Sprache ergänzen

Beispiel Spanisch:

1. `assets/i18n/locales/es.json` hinzufügen.
2. In `assets/i18n/locales/manifest.json` `"es"` ergänzen.
3. Keine Kunden-HTML muss deshalb kopiert werden.
4. Nur neue Seitentexte müssen im gemeinsamen Sprachschlüssel-Schema übersetzt werden.

## Pilot 1 – Konto & Zugang

`konto/index.html` wurde ausschließlich auf dem Feature-Branch als erster echter Pilot umgestellt.

Der Pilot enthält:

- sichtbaren `DE | EN` Sprachschalter,
- Speicherung der gewählten Sprache im Browser,
- zentrale deutsche und englische Texte,
- lokalisierte dynamische Status- und Fehlermeldungen,
- unveränderten Webhook für die Anforderung des persönlichen Zugangslinks,
- unveränderte Referral-Weitergabe bei Registrierung,
- saubere Same-Origin-Navigation ohne Dashboard-UUID in der erzeugten URL,
- Sperre des Premium-Network-Übergangs, solange dafür noch keine geprüfte tokenfreie Cross-Origin-Übergabe existiert.

Die produktive Datei auf `main` wurde nicht verändert.

## Dashboard-UUID-Regel

Neue Navigation darf keine dieser Formen erzeugen:

- `?dashboard_token=<UUID>`
- `?id=<UUID>`
- `?token=<UUID>`

Die UUID liegt nach erfolgreichem Zugang ausschließlich lokal unter `betinsight_dashboard_token` und wird von den Kundenbereichen aus diesem Speicher gelesen.

Alte Lesewege bleiben während der Migration nur für bereits versendete oder gespeicherte Altlinks bestehen. Bei deren Aufruf muss die UUID sofort aus der Adresszeile entfernt werden.

## Premium Network

`betinsight.network` liegt auf einer anderen Origin. `localStorage` von `app.betinsight.club` kann dort nicht direkt gelesen werden.

Deshalb wird **keine** Zwischenlösung verwendet, die die Dashboard-UUID wieder an die URL hängt. Vor Freigabe dieses Bereichs ist ein eigener sicherer Handoff nötig, zum Beispiel ein kurzlebiger Einmalcode, der serverseitig gegen die bereits bestätigte Sitzung ausgestellt wird.

Bis dieser Handoff implementiert und getestet ist, bleibt der neue Premium-Network-Weg gesperrt.

## Reihenfolge nach Pilot 1

1. Pilot `Konto & Zugang` statisch und im Browser testen.
2. Zentrale neue Navigation auf dem Feature-Branch mit einer echten Kunden-Unterseite testen.
3. Hauptdashboard mehrsprachig vorbereiten.
4. Daily, Tipps, Freigeschaltete Tipps und Unit-Pakete.
5. Wechselstube, Angebote, Verkaufen und Wallet.
6. Wettanbieter, Marketing-Center und Support.
7. `betinsight.network` erst nach sicherem Cross-Origin-Handoff.
8. Gesamttest DE/EN Desktop + Mobil.
9. Erst danach kontrollierte Übernahme nach `main`.

## Mindest-Testmatrix vor Merge

### Deutsch
- alle bisher sichtbaren deutschen Texte fachlich unverändert,
- E-Mail-Zugangslink anfordern funktioniert,
- gespeicherter Zugang wird erkannt,
- Referral-Code wird weitergegeben,
- keine neue Fehlermeldung oder Sackgasse.

### Englisch
- alle sichtbaren Pilottexte wechseln auf Englisch,
- dynamische Texte wechseln ebenfalls,
- E-Mail-Feld, Buttons und Statusmeldungen sind übersetzt,
- Umschalten zurück auf Deutsch funktioniert ohne Reload.

### Sprache
- Auswahl bleibt nach Seitenreload gespeichert,
- unbekannte/fehlende Locale fällt auf Deutsch zurück,
- spätere Sprache kann über Manifest + neue JSON ergänzt werden.

### Sicherheit
- keine neu erzeugte URL enthält die Dashboard-UUID,
- Legacy-UUID wird sofort aus der Adresszeile entfernt,
- Premium-Network-Handoff erzeugt keine UUID-URL,
- Backend-Feldnamen und Webhook-Payloads bleiben unverändert.

### Darstellung
- Desktop,
- Smartphone,
- lange englische Texte ohne Überlauf,
- Sprachschalter erreichbar und tastaturbedienbar.
