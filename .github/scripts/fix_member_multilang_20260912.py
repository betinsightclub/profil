from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 occurrence, found {count}")
    return text.replace(old, new, 1)


# 1) Central core: recognize all existing page scopes and load the legacy-content
# completion layer on every member page. This is presentation-only.
core_path = "assets/i18n/core-v2.js"
core = read(core_path)

old_scopes = '''  const PAGE_SCOPES = Object.freeze({
    "verkaufen": "sell",
    "angebote": "offers",
    "marketing-center": "marketing-center",
    "support": "support"
  });'''
new_scopes = '''  const PAGE_SCOPES = Object.freeze({
    "daily": "daily",
    "fan-challenge": "fan-challenge",
    "tipps": "tips",
    "kaufen": "buy",
    "pakete": "packages",
    "angebote": "offers",
    "verkaufen": "sell",
    "meine-verkaufsangebote": "my-sale-offers",
    "anbieter": "providers",
    "anbieter-auswahl": "providers",
    "marketing-center": "marketing-center",
    "premium-upgrade": "premium-upgrade",
    "support": "support"
  });'''
core = replace_once(core, old_scopes, new_scopes, "core PAGE_SCOPES")

old_loaders = '''        await loadUiScript("theme-manager.js?v=20260908-4", "BetInsightTheme");
        await loadUiScript("navigation-enhancements.js?v=20260909-3", "BetInsightNavigationEnhancements");
        return true;'''
new_loaders = '''        await loadUiScript("theme-manager.js?v=20260908-4", "BetInsightTheme");
        await loadUiScript("navigation-enhancements.js?v=20260909-3", "BetInsightNavigationEnhancements");
        await loadUiScript("i18n/member-completion.js?v=20260912-1", "BetInsightMemberCompletion");
        return true;'''
core = replace_once(core, old_loaders, new_loaders, "core member completion loader")
write(core_path, core)


# 2) Legacy hard-coded member copy: build DE -> currently selected language maps,
# not only DE -> EN. Missing target page dictionaries fail safely to {}.
completion_path = "assets/i18n/member-completion.js"
completion = read(completion_path)

old_page_scope = '''  const PAGE_SCOPE = Object.freeze({
    daily:"daily",
    "fan-challenge":"fan-challenge",
    tipps:"tips",
    pakete:"packages",
    kaufen:"buy",
    angebote:"offers",
    verkaufen:"sell",
    "meine-verkaufsangebote":"my-sale-offers",
    anbieter:"providers",
    "marketing-center":"marketing-center",
    support:"support"
  });'''
new_page_scope = '''  const PAGE_SCOPE = Object.freeze({
    dashboard:"dashboard",
    daily:"daily",
    "fan-challenge":"fan-challenge",
    tipps:"tips",
    pakete:"packages",
    kaufen:"buy",
    angebote:"offers",
    verkaufen:"sell",
    "meine-verkaufsangebote":"my-sale-offers",
    anbieter:"providers",
    "anbieter-auswahl":"providers",
    "marketing-center":"marketing-center",
    "premium-upgrade":"premium-upgrade",
    support:"support"
  });'''
completion = replace_once(completion, old_page_scope, new_page_scope, "member completion PAGE_SCOPE")

pattern = re.compile(r'''  function pairLocales\(de, en, map\) \{.*?\n  \}\n\n  function makeTemplate''', re.S)
replacement = '''  function pairLocales(sourceLocale, targetLocale, map) {
    const sourceFlat = flatten(sourceLocale), targetFlat = flatten(targetLocale);
    Object.entries(sourceFlat).forEach(([key,source]) => {
      const target = targetFlat[key];
      if (source && typeof target === "string" && source !== target) map.set(source,target);
    });
  }

  function makeTemplate'''
completion, count = pattern.subn(replacement, completion, count=1)
if count != 1:
    raise SystemExit(f"member completion pairLocales: expected 1 replacement, got {count}")

pattern = re.compile(r'''  async function buildDictionary\(language = lang\(\)\) \{.*?\n  \}\n\n  function preserveWhitespace''', re.S)
replacement = '''  async function buildDictionary(language = lang()) {
    const map = new Map();
    const targetLanguage = String(language || "de").toLowerCase().split("-")[0];
    if (targetLanguage === "de") { exact = map; templates = []; return; }

    const sharedDe = await loadJson(new URL("./locales/de.json", I18N_ROOT));
    const sharedTarget = await loadJson(new URL(`./locales/${encodeURIComponent(targetLanguage)}.json`, I18N_ROOT));
    pairLocales(sharedDe, sharedTarget, map);

    const id = pageId();
    const scope = PAGE_SCOPE[id] || document.querySelector('meta[name="bi-i18n-scope"]')?.content || "";
    if (scope) {
      const de = await loadJson(new URL(`./pages/${encodeURIComponent(scope)}/de.json`, I18N_ROOT));
      const target = await loadJson(new URL(`./pages/${encodeURIComponent(scope)}/${encodeURIComponent(targetLanguage)}.json`, I18N_ROOT));
      pairLocales(de, target, map);
    }

    // Existing legacy extras were authored as DE -> EN. Keep them English-only;
    // ES/PT/IT/FR use the proper keyed locale dictionaries instead of showing English.
    if (targetLanguage === "en") {
      Object.entries(EXTRAS[id] || {}).forEach(([source,target]) => map.set(source,target));
    }
    exact = map;
    templates = [...map.entries()].map(([source,target])=>makeTemplate(source,target)).filter(Boolean);
  }

  function preserveWhitespace'''
completion, count = pattern.subn(replacement, completion, count=1)
if count != 1:
    raise SystemExit(f"member completion buildDictionary: expected 1 replacement, got {count}")
write(completion_path, completion)


# 3) Root dashboard adapter: stop collapsing ES/PT/IT/FR back to German.
# Exact keyed dashboard copy can then use the already existing six-language files.
dashboard_path = "assets/i18n/dashboard-legacy.js"
dashboard = read(dashboard_path)
old_lang = '  function lang() { return i18n()?.getLanguage?.() === "en" ? "en" : "de"; }'
new_lang = '  function lang() { return String(i18n()?.getLanguage?.() || "de").toLowerCase().split("-")[0]; }'
dashboard = replace_once(dashboard, old_lang, new_lang, "dashboard lang")

old_locale = '    const locale = lang() === "en" ? "en-US" : "de-DE";'
new_locale = '''    const locale = ({de:"de-DE",en:"en-US",es:"es-ES",pt:"pt-PT",it:"it-IT",fr:"fr-FR"})[lang()] || "de-DE";'''
dashboard = replace_once(dashboard, old_locale, new_locale, "dashboard locale")
write(dashboard_path, dashboard)

print("Member multilingual wiring patched successfully.")
