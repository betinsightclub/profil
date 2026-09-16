from pathlib import Path
import json

HTML = Path("werbematerial/index.html")
text = HTML.read_text(encoding="utf-8")

css_anchor = '.format-count{padding:5px 9px;color:var(--muted);font-size:.72rem;font-weight:850;background:rgba(10,33,48,.76);border:1px solid var(--line);border-radius:999px}'
css_extra = '.format-language-note{display:inline-flex;align-items:center;gap:5px;margin-left:12px;color:var(--muted);font-size:.72rem;font-weight:700;white-space:nowrap}.format-flags{font-size:.9rem;letter-spacing:.02em}'
if '.format-language-note{' not in text:
    if css_anchor not in text:
        raise SystemExit('CSS anchor not found')
    text = text.replace(css_anchor, css_anchor + css_extra, 1)

mobile_anchor = '.format-size{display:block;margin:3px 0 0}'
if '.format-language-note{display:flex;margin:4px 0 0;white-space:normal}' not in text:
    if mobile_anchor not in text:
        raise SystemExit('Mobile CSS anchor not found')
    text = text.replace(mobile_anchor, mobile_anchor + '.format-language-note{display:flex;margin:4px 0 0;white-space:normal}', 1)

note = '<span class="format-language-note"><span aria-hidden="true">🌐</span><span data-bi-i18n="marketingMaterialsPage.autoLanguageDownload">Download automatisch in deiner Sprache</span><span class="format-flags" aria-hidden="true">🇩🇪 🇬🇧 🇪🇸 🇧🇷 🇮🇹 🇫🇷</span></span>'
replacements = {
    '<h3>Hochformat <span class="format-size" id="portraitSize"></span></h3>': '<h3>Hochformat <span class="format-size" id="portraitSize"></span>' + note + '</h3>',
    '<h3>Quadrat <span class="format-size" id="squareSize"></span></h3>': '<h3>Quadrat <span class="format-size" id="squareSize"></span>' + note + '</h3>',
    '<h3>Querformat <span class="format-size" id="landscapeSize"></span></h3>': '<h3>Querformat <span class="format-size" id="landscapeSize"></span>' + note + '</h3>',
}
for old, new in replacements.items():
    if note in text and new in text:
        continue
    if old not in text:
        raise SystemExit(f'HTML anchor not found: {old[:40]}')
    text = text.replace(old, new, 1)

HTML.write_text(text, encoding="utf-8")

translations = {
    'de': 'Download automatisch in deiner Sprache',
    'en': 'Automatic download in your language',
    'es': 'Descarga automática en tu idioma',
    'pt': 'Download automático no seu idioma',
    'it': 'Download automatico nella tua lingua',
    'fr': 'Téléchargement automatique dans votre langue',
}

for lang, value in translations.items():
    path = Path(f'assets/i18n/pages/werbematerial/{lang}.json')
    data = json.loads(path.read_text(encoding='utf-8'))
    page = data.setdefault('marketingMaterialsPage', {})
    page['autoLanguageDownload'] = value
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Validation: note appears exactly once per image format and every language contains the key.
final = HTML.read_text(encoding='utf-8')
if final.count('data-bi-i18n="marketingMaterialsPage.autoLanguageDownload"') != 3:
    raise SystemExit('Expected language-download note in exactly three format headers')
for lang, value in translations.items():
    data = json.loads(Path(f'assets/i18n/pages/werbematerial/{lang}.json').read_text(encoding='utf-8'))
    if data.get('marketingMaterialsPage', {}).get('autoLanguageDownload') != value:
        raise SystemExit(f'Locale validation failed for {lang}')

print('Werbematerial language download note added for portrait, square and landscape in DE/EN/ES/PT/IT/FR.')
