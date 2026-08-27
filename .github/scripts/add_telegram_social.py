from pathlib import Path

path = Path("assets/app-navigation.js")
text = path.read_text(encoding="utf-8")
telegram_url = "https://t.me/+iKZj1FvUf4RmMjdh"

if "const TELEGRAM_URL" not in text:
    needle = '  const YOUTUBE_URL = "https://www.youtube.com/@betinsightclub";\n'
    if needle not in text:
        raise SystemExit("YouTube URL marker not found")
    text = text.replace(
        needle,
        needle + f'  const TELEGRAM_URL = "{telegram_url}";\n',
        1,
    )

if "bi-social-telegram" not in text:
    needle = "    links.appendChild(youtube);"
    if needle not in text:
        raise SystemExit("YouTube append marker not found")
    block = '''    const telegram = document.createElement("a");
    telegram.className = "bi-social-link bi-social-telegram";
    telegram.href = TELEGRAM_URL;
    telegram.target = "_blank";
    telegram.rel = "noopener noreferrer";
    telegram.setAttribute("aria-label", "BetInsight Club auf Telegram öffnen");
    telegram.title = "BetInsight Club auf Telegram";
    telegram.innerHTML = '<svg class="bi-social-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#229ED9"/><path d="M17.8 7.2 15 17.3c-.2.7-.8.9-1.4.5l-4.2-3.1-2 1.9c-.2.2-.4.4-.8.4l.3-4.3 7.8-7c.3-.3-.1-.5-.5-.2l-9.6 6-4.1-1.3c-.9-.3-.9-.9.2-1.3l16-6.2c.8-.3 1.5.2 1.1 1.5Z" fill="#fff" transform="translate(2 2) scale(.83)"/></svg>';

    links.append(youtube, telegram);'''
    text = text.replace(needle, block, 1)

text = text.replace(
    "BetInsight App Navigation · 2026-08-27-03",
    "BetInsight App Navigation · 2026-08-27-04",
    1,
)
path.write_text(text, encoding="utf-8")
