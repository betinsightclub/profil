from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Safety stop: {label} expected exactly once, found {count}")
    return text.replace(old, new, 1)


# Root dashboard: only change the existing Marketing-Center card, its target, and cache version.
p = Path("index.html")
s = p.read_text(encoding="utf-8")
s = replace_once(
    s,
    '<span class="footer-action-icon" aria-hidden="true">📣</span>\n          <span class="footer-action-label">Marketing-Center</span>',
    '<span class="footer-action-icon" aria-hidden="true">🎓</span>\n          <span class="footer-action-label">Academy & Ressourcen</span>',
    "root dashboard Marketing-Center button",
)
s = replace_once(
    s,
    'function goMarketingCenter(){const token=getActiveToken();const base="https://betinsightclub.github.io/profil/marketing-center/";location.href=token?base+"?token="+encodeURIComponent(token):base}',
    'function goMarketingCenter(){const token=getActiveToken();const base="https://betinsightclub.github.io/profil/ressourcen/";location.href=token?base+"?token="+encodeURIComponent(token):base}',
    "root dashboard Marketing-Center target",
)
s = replace_once(
    s,
    'assets/app-navigation.js?v=20260830-7',
    'assets/app-navigation.js?v=20260906-resources-1',
    "root navigation cache version",
)
p.write_text(s, encoding="utf-8")


# Compatibility loader: preserve the public function name but route it to the new hub.
p = Path("assets/app-navigation.js")
s = p.read_text(encoding="utf-8")
s = replace_once(
    s,
    'window.goMarketingCenter = () => safeRoute("marketing-center");',
    'window.goMarketingCenter = () => safeRoute("ressourcen");',
    "compatibility loader resources target",
)
s = replace_once(
    s,
    'app-navigation-v2.js?v=20260830-9',
    'app-navigation-v2.js?v=20260906-resources-1',
    "compatibility loader v2 cache version",
)
p.write_text(s, encoding="utf-8")


# Current v2 sidebar: Network keeps only its two commission areas.
# Academy & Resources becomes a separate top-level item.
p = Path("assets/app-navigation-v2.js")
s = p.read_text(encoding="utf-8")
old_nav = '''    {id:"network-group",key:"nav.network",fallback:"Netzwerk & Provisionen",icon:icons.network,children:[
      {id:"netzwerk",key:"nav.unitCommissions",fallback:"Unit-Provisionen"},
      {id:"premium-provisionen",key:"nav.premiumCommissions",fallback:"Premium-Provisionen"},
      {id:"marketing-center",key:"nav.marketingCenter",fallback:"Marketing-Center"}
    ]},
    {id:"premium",key:"nav.membership",fallback:"Mitgliedschaft",icon:icons.membership},'''
new_nav = '''    {id:"network-group",key:"nav.network",fallback:"Netzwerk & Provisionen",icon:icons.network,children:[
      {id:"netzwerk",key:"nav.unitCommissions",fallback:"Unit-Provisionen"},
      {id:"premium-provisionen",key:"nav.premiumCommissions",fallback:"Premium-Provisionen"}
    ]},
    {id:"ressourcen",key:"nav.resources",fallback:"Academy & Ressourcen",fallbackEn:"Academy & Resources",icon:icons.membership},
    {id:"premium",key:"nav.membership",fallback:"Mitgliedschaft",icon:icons.membership},'''
s = replace_once(s, old_nav, new_nav, "v2 sidebar structure")
s = replace_once(
    s,
    '      case "marketing-center": navigateProtected("marketing-center"); break;',
    '      case "ressourcen": navigateProtected("ressourcen"); break;\n      case "marketing-center": navigateProtected("marketing-center"); break;',
    "v2 resources route",
)
s = replace_once(
    s,
    'const known = ["daily","fan-challenge","tipps","freigeschaltet","wechselboerse","verkaufen","meine-verkaufsangebote","wallet","anbieter","marketing-center","support"];',
    'const known = ["daily","fan-challenge","tipps","freigeschaltet","wechselboerse","verkaufen","meine-verkaufsangebote","wallet","anbieter","ressourcen","marketing-center","support"];',
    "v2 active route list",
)
s = replace_once(
    s,
    'if (["netzwerk","premium-provisionen","marketing-center"].includes(id)) return "network-group";',
    'if (["netzwerk","premium-provisionen"].includes(id)) return "network-group";',
    "v2 network grouping",
)
p.write_text(s, encoding="utf-8")

print("Academy & Ressourcen navigation patch prepared successfully.")
