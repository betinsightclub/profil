from pathlib import Path
import json

base = Path('assets/i18n/pages/dashboard')

def load(name):
    p = base / name
    return p, json.loads(p.read_text(encoding='utf-8'))

de_path, de = load('de.json')
pt_path, pt = load('pt.json')

de_page = de.setdefault('dashboardPage', {})
pt_page = pt.setdefault('dashboardPage', {})

pairs = {
    'networkReferralHeading': ('Netzwerk & Referral-Übersicht', 'Visão geral da rede e indicações'),
    'networkReferralCopy': ('Deine Partnerstruktur und Referral-Units auf einen Blick.', 'Sua estrutura de parceiros e suas Referral Units em uma visão geral.'),
    'partnersTotal': ('Partner gesamt', 'Parceiros no total'),
}
for key, (src, target) in pairs.items():
    de_page[key] = src
    pt_page[key] = target

pt_page['directPartners'] = 'Nível 1 – parceiros diretos'
pt_page['partner'] = 'Parceiro'

de_path.write_text(json.dumps(de, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
pt_path.write_text(json.dumps(pt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Dashboard PT network strings patched.')
