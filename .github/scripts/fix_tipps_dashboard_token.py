from pathlib import Path

path = Path('tipps/index.html')
text = path.read_text(encoding='utf-8')

old_const = 'const TOKEN_STORAGE_KEY="betinsight_profile_token";const PAGE_SIZE=10;'
new_const = 'const TOKEN_STORAGE_KEY="betinsight_profile_token";const DASHBOARD_TOKEN_STORAGE_KEY="betinsight_dashboard_token";const PAGE_SIZE=10;'
if old_const not in text:
    raise SystemExit('Token constant anchor not found')
text = text.replace(old_const, new_const, 1)

old_fn = '''function normalizeToken(v){return String(v||"").trim()}\nfunction getToken(){const p=new URLSearchParams(location.search),u=p.get("token");if(u&&u.trim()){const n=normalizeToken(u);localStorage.setItem(TOKEN_STORAGE_KEY,n);return n}return normalizeToken(localStorage.getItem(TOKEN_STORAGE_KEY))}'''
new_fn = '''function normalizeToken(v){return String(v||"").trim()}\nfunction isDashboardUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizeToken(v))}\nfunction getToken(){const p=new URLSearchParams(location.search),u=p.get("token");if(u&&u.trim()){const n=normalizeToken(u);if(isDashboardUuid(n))localStorage.setItem(DASHBOARD_TOKEN_STORAGE_KEY,n);else localStorage.setItem(TOKEN_STORAGE_KEY,n);return n}const dashboard=normalizeToken(localStorage.getItem(DASHBOARD_TOKEN_STORAGE_KEY));if(dashboard)return dashboard;return normalizeToken(localStorage.getItem(TOKEN_STORAGE_KEY))}'''
if old_fn not in text:
    raise SystemExit('getToken anchor not found')
text = text.replace(old_fn, new_fn, 1)

old_version = 'BetInsight Tipps · Version 2026.08.27-12'
new_version = 'BetInsight Tipps · Version 2026.08.28-13-DASHBOARD-TOKEN'
if old_version in text:
    text = text.replace(old_version, new_version, 1)

path.write_text(text, encoding='utf-8')
print('Patched tipps/index.html')
