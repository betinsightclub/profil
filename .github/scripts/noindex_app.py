from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
META = '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">'
START = '<!-- BETINSIGHT APP NOINDEX START -->'
END = '<!-- BETINSIGHT APP NOINDEX END -->'
BLOCK = f'{START}\n{META}\n{END}'

count = 0
for path in ROOT.rglob('*.html'):
    if '.git' in path.parts or '.github' in path.parts:
        continue
    text = path.read_text(encoding='utf-8')
    text = re.sub(re.escape(START) + r'.*?' + re.escape(END), '', text, flags=re.S)
    # Alte robots-Meta-Tags in der App werden durch eine eindeutige zentrale Noindex-Regel ersetzt.
    text = re.sub(r'\s*<meta\s+name=["\']robots["\'][^>]*>', '', text, flags=re.I)
    if '<head>' in text:
        text = text.replace('<head>', '<head>\n' + BLOCK, 1)
    elif '<HEAD>' in text:
        text = text.replace('<HEAD>', '<HEAD>\n' + BLOCK, 1)
    else:
        # HTML ohne expliziten Head: nichts riskant umbauen, sondern melden.
        print(f'WARNUNG: Kein <head> gefunden: {path.relative_to(ROOT)}')
        continue
    path.write_text(text, encoding='utf-8')
    count += 1

# Absichtlich NICHT Disallow: / . Google muss die Seiten crawlen dürfen, um das noindex zu sehen.
(ROOT / 'robots.txt').write_text(
    'User-agent: *\nAllow: /\n\n# Alle HTML-Seiten tragen meta robots noindex.\n',
    encoding='utf-8'
)

print(f'Noindex in {count} HTML-Dateien gesetzt.')
