from pathlib import Path
import json
import re

HTML = Path("werbematerial/index.html")
text = HTML.read_text(encoding="utf-8")

# Portuguese is represented by Portugal, not Brazil, across the download language row.
text = text.replace("🇩🇪 🇬🇧 🇪🇸 🇧🇷 🇮🇹 🇫🇷", "🇩🇪 🇬🇧 🇪🇸 🇵🇹 🇮🇹 🇫🇷")

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

note = '<span class="format-language-note"><span aria-hidden="true">🌐</span><span data-bi-i18n="marketingMaterialsPage.autoLanguageDownload">Download automatisch in deiner Sprache</span><span class="format-flags" aria-hidden="true">🇩🇪 🇬🇧 🇪🇸 🇵🇹 🇮🇹 🇫🇷</span></span>'
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

# Prepare gallery for language-specific image files named like
# <motif>-de-hochformat.png / <motif>-en-hochformat.png / ...
helper_anchor = 'const loading=document.getElementById("imageLoading"),error=document.getElementById("imageError"),empty=document.getElementById("imageEmpty"),status=document.getElementById("imageStatus"),groups=document.getElementById("galleryGroups");'
helper_extra = '''
  let allImageFiles=[];
  const i18n=()=>window.BetInsightI18n;
  const tr=(key,vars,fallback)=>i18n()?.t?.(`marketingMaterialsPage.${key}`,vars||{},fallback)||fallback;
  const activeLanguage=()=>String(i18n()?.getLanguage?.()||document.documentElement.lang||"de").toLowerCase().split("-")[0];
  const languageFromName=name=>String(name||"").toLowerCase().match(/-(de|en|es|pt|it|fr)-(?:hochformat|querformat|quadrat)\\.(?:png|jpe?g|webp)$/i)?.[1]||"";
  const fileForActiveLanguage=file=>{
    const fileLang=languageFromName(file?.name);
    return fileLang?fileLang===activeLanguage():activeLanguage()==="de";
  };
'''.rstrip()
if 'const languageFromName=name=>' not in text:
    if helper_anchor not in text:
        raise SystemExit('Gallery helper anchor not found')
    text = text.replace(helper_anchor, helper_anchor + helper_extra, 1)

old_make = '''  const makeCard=file=>{
    const card=document.createElement("article");card.className="media";
    const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.alt="BetInsight Werbematerial";img.src=preview(file.name);img.onerror=()=>{img.onerror=null;img.src=original(file.name)};
    const d=document.createElement("a");d.className="download";d.href=original(file.name);d.setAttribute("download",file.name);d.title="Originalbild herunterladen";d.setAttribute("aria-label","Originalbild herunterladen");d.textContent="↓";
    card.append(img,d);return card;
  };'''
new_make = '''  const makeCard=file=>{
    const card=document.createElement("article");card.className="media";
    const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.alt=tr("imageAlt",{},"BetInsight Werbematerial");img.src=preview(file.name);img.onerror=()=>{img.onerror=null;img.src=original(file.name)};
    const d=document.createElement("a");d.className="download";d.href=original(file.name);d.setAttribute("download",file.name);d.title=tr("originalImageDownload",{},"Originalbild herunterladen");d.setAttribute("aria-label",tr("originalImageDownload",{},"Originalbild herunterladen"));d.textContent="↓";
    card.append(img,d);return card;
  };'''
if old_make in text:
    text = text.replace(old_make, new_make, 1)

old_count = 'count.textContent=files.length===1?"1 Bild":`${files.length} Bilder`;'
new_count = 'count.textContent=files.length===1?tr("oneImage",{},"1 Bild"):tr("imageCount",{count:files.length},`${files.length} Bilder`);'
text = text.replace(old_count, new_count)

fetch_pattern = re.compile(r'''  fetch\(API,\{headers:\{Accept:"application/vnd\.github\+json"\}\}\)\.then\(r=>\{if\(!r\.ok\)throw new Error\(r\.status\);return r\.json\(\)\}\)\.then\(items=>\{.*?\n  \}\)\.catch\(\(\)=>\{loading\.hidden=true;empty\.hidden=true;groups\.hidden=true;error\.hidden=false;status\.textContent="Nicht erreichbar"\}\);''', re.S)
new_fetch = '''  const renderImages=()=>{
    const files=allImageFiles.filter(fileForActiveLanguage);
    loading.hidden=true;error.hidden=true;empty.hidden=true;
    if(!files.length){groups.hidden=true;empty.hidden=false;status.textContent=tr("zeroImages",{},"0 Bilder");return}
    renderGroup("portrait",files.filter(f=>categoryFromName(f.name)==="portrait"));
    renderGroup("square",files.filter(f=>categoryFromName(f.name)==="square"));
    renderGroup("landscape",files.filter(f=>categoryFromName(f.name)==="landscape"));
    groups.hidden=false;status.textContent=files.length===1?tr("oneImage",{},"1 Bild"):tr("imageCount",{count:files.length},`${files.length} Bilder`);
  };

  fetch(API,{headers:{Accept:"application/vnd.github+json"}}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(items=>{
    allImageFiles=items.filter(x=>x&&x.type==="file"&&/\\.(png|jpe?g|webp)$/i.test(x.name));
    renderImages();
  }).catch(()=>{loading.hidden=true;empty.hidden=true;groups.hidden=true;error.hidden=false;status.textContent=tr("unavailable",{},"Nicht erreichbar")});
  window.addEventListener("bi:languagechange",()=>renderImages());'''
if 'const renderImages=()=>{' not in text:
    text, n = fetch_pattern.subn(new_fetch, text, count=1)
    if n != 1:
        raise SystemExit('Fetch/render block not found')

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
if final.count('🇵🇹') != 3 or '🇧🇷' in final:
    raise SystemExit('Portuguese download flag must be Portugal in all three format headers')
if 'const languageFromName=name=>' not in final or 'window.addEventListener("bi:languagechange",()=>renderImages())' not in final:
    raise SystemExit('Language-specific gallery filtering was not installed')
for lang, value in translations.items():
    data = json.loads(Path(f'assets/i18n/pages/werbematerial/{lang}.json').read_text(encoding='utf-8'))
    if data.get('marketingMaterialsPage', {}).get('autoLanguageDownload') != value:
        raise SystemExit(f'Locale validation failed for {lang}')

print('Werbematerial gallery is ready for language-specific DE/EN/ES/PT/IT/FR image downloads.')
