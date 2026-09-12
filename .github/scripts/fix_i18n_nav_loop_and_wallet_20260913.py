from pathlib import Path


def patch(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if new in text:
        return False
    if old not in text:
        raise SystemExit(f'{label}: expected source text not found')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True

changes = []

changes.append(patch(
    'assets/i18n/core-v2.js',
    '    "pakete": "packages",\n    "angebote": "offers",',
    '    "pakete": "packages",\n    "wallet": "wallet",\n    "angebote": "offers",',
    'core wallet scope'
))

changes.append(patch(
    'assets/i18n/core-v2.js',
    'navigation-enhancements.js?v=20260913-1',
    'navigation-enhancements.js?v=20260913-2',
    'navigation cache bust'
))

changes.append(patch(
    'assets/i18n/member-completion.js',
    '    pakete:"packages",\n    kaufen:"buy",',
    '    pakete:"packages",\n    wallet:"wallet",\n    kaufen:"buy",',
    'completion wallet scope'
))

changes.append(patch(
    'assets/app-navigation.js',
    'i18n/core-v2.js?v=20260913-1',
    'i18n/core-v2.js?v=20260913-2',
    'core cache bust'
))

print('Patched files:', sum(bool(x) for x in changes))
