from pathlib import Path

# Marketing Center
p = Path('marketing-center/index.html')
t = p.read_text(encoding='utf-8')
old = '''  const TOKEN_STORAGE_KEY = "betinsight_profile_token";'''
new = '''  const TOKEN_STORAGE_KEY = "betinsight_profile_token";
  const DASHBOARD_TOKEN_STORAGE_KEY = "betinsight_dashboard_token";'''
if old not in t:
    raise SystemExit('Marketing token const anchor missing')
t = t.replace(old, new, 1)
old = '''  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = String(params.get("token") || "").trim();

    if (fromUrl) {
      localStorage.setItem(TOKEN_STORAGE_KEY, fromUrl);
      return fromUrl;
    }

    return String(localStorage.getItem(TOKEN_STORAGE_KEY) || "").trim();
  }'''
new = '''  function isDashboardUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
  }

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = String(params.get("token") || "").trim();

    if (fromUrl) {
      if (isDashboardUuid(fromUrl)) localStorage.setItem(DASHBOARD_TOKEN_STORAGE_KEY, fromUrl);
      else localStorage.setItem(TOKEN_STORAGE_KEY, fromUrl);
      return fromUrl;
    }

    return String(localStorage.getItem(DASHBOARD_TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY) || "").trim();
  }'''
if old not in t:
    raise SystemExit('Marketing getToken anchor missing')
t = t.replace(old, new, 1)
t = t.replace('Version: 2026.08.27-03', 'Version: 2026.08.28-04', 1)
t = t.replace('Anwendungs-Version: 1.6.2', 'Anwendungs-Version: 1.6.3', 1)
t = t.replace('content="1.6.2"', 'content="1.6.3"', 1)
t = t.replace('Version 1.6.2', 'Version 1.6.3', 1)
p.write_text(t, encoding='utf-8')
print('Patched marketing-center token storage')

# Exchange offers
p = Path('wechselboerse/angebote/index.html')
t = p.read_text(encoding='utf-8')
old = 'const TOKEN_STORAGE_KEY="betinsight_profile_token",RESERVATION_STORAGE_KEY="betinsight_active_purchase_reservation",PAGE_SIZE=8,DEMO_MODE=new URLSearchParams(location.search).get("demo")==="1";'
new = 'const TOKEN_STORAGE_KEY="betinsight_profile_token",DASHBOARD_TOKEN_STORAGE_KEY="betinsight_dashboard_token",RESERVATION_STORAGE_KEY="betinsight_active_purchase_reservation",PAGE_SIZE=8,DEMO_MODE=new URLSearchParams(location.search).get("demo")==="1";'
if old not in t:
    raise SystemExit('Offers token const anchor missing')
t = t.replace(old, new, 1)
old = 'function normalizeToken(v){return String(v||"").trim()}function getActiveToken(){const p=new URLSearchParams(location.search),u=normalizeToken(p.get("token"));if(u){try{localStorage.setItem(TOKEN_STORAGE_KEY,u)}catch(_){ }return u}try{return normalizeToken(localStorage.getItem(TOKEN_STORAGE_KEY))}catch(_){return""}}'
new = 'function normalizeToken(v){return String(v||"").trim()}function isDashboardUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizeToken(v))}function getActiveToken(){const p=new URLSearchParams(location.search),u=normalizeToken(p.get("token"));if(u){try{if(isDashboardUuid(u))localStorage.setItem(DASHBOARD_TOKEN_STORAGE_KEY,u);else localStorage.setItem(TOKEN_STORAGE_KEY,u)}catch(_){ }return u}try{return normalizeToken(localStorage.getItem(DASHBOARD_TOKEN_STORAGE_KEY)||localStorage.getItem(TOKEN_STORAGE_KEY))}catch(_){return""}}'
if old not in t:
    raise SystemExit('Offers getActiveToken anchor missing')
t = t.replace(old, new, 1)
t = t.replace('Version: 2.3 PILOT-LIVE AUTO-CONFIRM FINAL POLL LABELS','Version: 2.4 PILOT-LIVE TOKEN-COMPAT',1)
p.write_text(t, encoding='utf-8')
print('Patched exchange offers token storage')
