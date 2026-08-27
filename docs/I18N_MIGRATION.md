# BetInsight Customer App – Multilingual Migration

Status: feature branch only. Production `main` is intentionally unchanged.

## Non-negotiable rules

1. The German production customer app remains functional during migration.
2. Admin, master backoffice and internal operator pages remain German and are out of scope.
3. The canonical `dashboard_token` / dashboard UUID must never be generated into a visible browser URL.
4. Internal technical field names, Google Sheet columns, JSON keys, Make mappings and webhook contracts are never translated.
5. German is the permanent fallback language. A missing translation must fall back to German, never to an empty label.
6. One customer page serves all languages. We do not create separate `/en/`, `/es/`, `/pt/` copies of the protected app.
7. New languages are added as locale files, not by duplicating application logic.

## Language architecture

Core:
- `assets/i18n/core.js`
- `assets/i18n/locales/de.json`
- `assets/i18n/locales/en.json`

Future languages follow the same pattern, for example:
- `assets/i18n/locales/es.json`
- `assets/i18n/locales/pt.json`
- `assets/i18n/locales/fr.json`
- `assets/i18n/locales/it.json`

The selected language is stored in `localStorage` as `betinsight_language`.

Static page text is migrated gradually with attributes such as:

```html
<h1 data-bi-i18n="profile.title" data-bi-i18n-fallback="Dein BetInsight Profil">
  Dein BetInsight Profil
</h1>
```

The existing German text remains directly in the HTML as the visible fallback. This prevents the German page from becoming dependent on a translation file in order to render correctly.

## Session architecture

Foundation:
- `assets/app-session.js`

The dashboard UUID is stored locally under the existing key:
- `betinsight_dashboard_token`

New internal navigation must use clean paths only, for example:

```text
/app route: /wallet/
/app route: /tipps/
/app route: /wechselboerse/
```

Forbidden for new navigation:

```text
/wallet/?id=<dashboard UUID>
/tipps/?token=<dashboard UUID>
/wechselboerse/?dashboard_token=<dashboard UUID>
```

`captureLegacyIngress()` exists only so old bookmarks can be migrated and immediately cleaned. It must never be used as justification to generate new token URLs.

## Cross-domain Premium Network

`betinsight.network` is a separate origin, therefore `localStorage` from `app.betinsight.club` cannot be reused directly.

Until a secure token-free handoff is implemented and tested, the NEXT navigation deliberately does not send the dashboard UUID to `betinsight.network` in the URL.

A dedicated cross-origin handoff must be built separately before Premium Network is switched to the new navigation.

## Staged rollout

### Stage 0 – foundation
- Add i18n core and DE/EN locale files.
- Add token-safe app session helper.
- Build `app-navigation-next.js` as a non-production preview.
- Do not reference NEXT files from production pages yet.

### Stage 1 – low-risk pilot page
Recommended first pilot: `konto/` or another simple customer page without Unit mutation.

- Add `core.js` and `app-session.js`.
- Add DE/EN attributes.
- Verify German is pixel/function equivalent.
- Verify English switch.
- Verify browser URL contains no dashboard UUID.
- Verify page reload keeps language and authenticated session.

### Stage 2 – navigation pilot
- Replace current navigation with NEXT only on the pilot branch/page.
- Test every route from desktop and mobile.
- Migrate target pages to read dashboard UUID from `BetInsightSession` / local storage.

### Stage 3 – customer pages
Suggested order:
1. Dashboard/profile
2. Daily Bonus
3. Tips
4. Unlocked Tips
5. Packages / Units purchase
6. Unit Exchange overview
7. Offers
8. Sell Units
9. Wallet
10. Betting Providers
11. Marketing Center
12. Support
13. Account & Access

### Stage 4 – BetInsight Network
Separate repository and separate test branch:
- Network start page
- Premium Network
- Messages
- secure cross-origin session handoff

## Explicitly out of scope

The following remain German unless a later separate decision is made:
- `admin/`
- `admin/backoffice/`
- `admin-tipps/`
- master cost pages
- internal support/admin pages
- internal test/operator tools

## Test checklist per migrated page

- German text unchanged in meaning and function.
- English complete; no mixed-language buttons or JS messages.
- No translated backend keys.
- No dashboard UUID in browser URL before, during or after internal navigation.
- Refresh works without re-entering access.
- Mobile navigation works.
- Desktop navigation works.
- Language persists across page changes.
- Webhook payloads are byte-for-byte equivalent except for purely presentational language fields if explicitly intended.
- Unit balances, FIFO, wallet, sales, Premium and referral logic remain untouched.

## Release rule

Nothing from this migration is merged into `main` until the pilot page passes the German regression test and the dashboard-token URL test.
