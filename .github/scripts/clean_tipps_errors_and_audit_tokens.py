from pathlib import Path

path = Path('tipps/index.html')
text = path.read_text(encoding='utf-8')
original = text

text = text.replace(
    'if(c==="Accepted"||c.startsWith("Accepted"))throw new Error("Make hat nur „Accepted“ zurückgegeben.");',
    'if(c==="Accepted"||c.startsWith("Accepted"))throw new Error("Freischaltung wurde vom Server nicht abgeschlossen.");'
)

text = text.replace(
    "resultBox.innerHTML='<div class=\"error\">Kein Zugangscode gefunden.\\n\\nBitte öffne die Seite über deinen persönlichen Profil-Link.</div>';return",
    "resultBox.innerHTML='<div class=\"error\"><strong>Dein Zugang konnte nicht bestätigt werden.</strong>\\n\\nBitte öffne dein BetInsight Dashboard erneut und rufe die Tipps von dort auf.</div>';return"
)

text = text.replace(
    "resultBox.innerHTML='<div class=\"error\">Unbekannte Antwort vom Server:\\n\\n'+escapeHtml(raw)+'</div>'",
    "console.warn('Unerwartete Freischaltungsantwort:',raw);resultBox.innerHTML='<div class=\"error\"><strong>Freischaltung konnte nicht abgeschlossen werden.</strong>\\n\\nBitte versuche es erneut. Sollte der Fehler weiterhin auftreten, wende dich an den Support.</div>'"
)

text = text.replace(
    "catch(e){resultBox.innerHTML='<div class=\"error\">Fehler beim Freischalten:\\n\\n'+escapeHtml(e.message)+'</div>';console.error(e)}finally",
    "catch(e){console.error('Freischaltung fehlgeschlagen:',e);resultBox.innerHTML='<div class=\"error\"><strong>Freischaltung konnte nicht abgeschlossen werden.</strong>\\n\\nBitte versuche es erneut. Sollte der Fehler weiterhin auftreten, wende dich an den Support.</div>'}finally"
)

text = text.replace(
    "catch(e){os.style.display=\"none\";rs.style.display=\"none\";ob.innerHTML='<div class=\"error\">Fehler beim Laden der Tipps:\\n\\n'+escapeHtml(e.message)+'</div>';console.error(e)}}",
    "catch(e){os.style.display=\"none\";rs.style.display=\"none\";console.error('Tipps konnten nicht geladen werden:',e);ob.innerHTML='<div class=\"error\"><strong>Tipps konnten gerade nicht geladen werden.</strong>\\n\\nBitte lade die Seite erneut. Sollte der Fehler weiterhin auftreten, wende dich an den Support.</div>'}}"
)

text = text.replace('BetInsight Tipps · Version 2026.08.28-13-DASHBOARD-TOKEN','BetInsight Tipps · Version 2026.08.28-14-CLEAN-ERRORS',1)

if text == original:
    raise SystemExit('No frontend error-message changes applied')
path.write_text(text, encoding='utf-8')
print('Patched customer-facing tips error messages')

print('\n=== TOKEN AUDIT ===')
for file in sorted(Path('.').rglob('*')):
    if not file.is_file() or file.suffix.lower() not in {'.html','.js'}:
        continue
    try:
        data = file.read_text(encoding='utf-8')
    except Exception:
        continue
    has_profile = 'betinsight_profile_token' in data
    has_dashboard = 'betinsight_dashboard_token' in data
    if has_profile or has_dashboard:
        print(f'{file}: profile={has_profile} dashboard={has_dashboard}')
