from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ROOT / "assets" / "i18n" / "locales"

LANGUAGE_LABELS = {
    "de": {"label": "Sprache", "de": "Deutsch", "en": "Englisch", "es": "Spanisch", "pt": "Portugiesisch", "it": "Italienisch", "fr": "Französisch"},
    "en": {"label": "Language", "de": "German", "en": "English", "es": "Spanish", "pt": "Portuguese", "it": "Italian", "fr": "French"},
    "es": {"label": "Idioma", "de": "Alemán", "en": "Inglés", "es": "Español", "pt": "Portugués", "it": "Italiano", "fr": "Francés"},
    "pt": {"label": "Idioma", "de": "Alemão", "en": "Inglês", "es": "Espanhol", "pt": "Português", "it": "Italiano", "fr": "Francês"},
    "it": {"label": "Lingua", "de": "Tedesco", "en": "Inglese", "es": "Spagnolo", "pt": "Portoghese", "it": "Italiano", "fr": "Francese"},
    "fr": {"label": "Langue", "de": "Allemand", "en": "Anglais", "es": "Espagnol", "pt": "Portugais", "it": "Italien", "fr": "Français"},
}

NAV_PATCH = {
    "de": {"freeUnits": "Free Units", "fanChallenge": "Fan Challenge", "mySaleOffers": "Meine Verkaufsangebote", "resources": "Academy & Ressourcen"},
    "en": {"freeUnits": "Free Units", "fanChallenge": "Fan Challenge", "mySaleOffers": "My Sale Offers", "resources": "Academy & Resources"},
    "es": {"freeUnits": "Units gratis", "fanChallenge": "Desafío de fans", "mySaleOffers": "Mis ofertas de venta", "resources": "Academy y recursos"},
    "pt": {"freeUnits": "Units grátis", "fanChallenge": "Desafio dos fãs", "mySaleOffers": "Minhas ofertas de venda", "resources": "Academy e recursos"},
    "it": {"freeUnits": "Unit gratuite", "fanChallenge": "Sfida dei fan", "mySaleOffers": "Le mie offerte di vendita", "resources": "Academy e risorse"},
    "fr": {"freeUnits": "Units gratuites", "fanChallenge": "Défi des fans", "mySaleOffers": "Mes offres de vente", "resources": "Academy et ressources"},
}

ACTIVE_SCOPES = (
    "academy", "buy", "daily", "dashboard", "dashboard-completion", "fan-challenge",
    "marketing-center", "my-sale-offers", "offers", "packages", "premium-upgrade",
    "providers", "resources", "sell", "support", "tips", "wallet", "werbematerial",
)
LANGS = ("de", "en", "es", "pt", "it", "fr")


def compact(obj: dict) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def replace_top_level_line(text: str, key: str, obj: dict) -> str:
    pattern = re.compile(rf'^  "{re.escape(key)}": \{{.*\}},$', re.MULTILINE)
    replacement = f'  "{key}": {compact(obj)},'
    updated, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise RuntimeError(f"Could not replace top-level {key!r} locale object")
    return updated


def patch_shared_locales() -> None:
    for lang in LANGS:
        path = LOCALES / f"{lang}.json"
        text = path.read_text(encoding="utf-8")
        data = json.loads(text)
        language = dict(data.get("language") or {})
        language.update(LANGUAGE_LABELS[lang])
        nav = dict(data.get("nav") or {})
        nav.update(NAV_PATCH[lang])
        text = replace_top_level_line(text, "language", language)
        text = replace_top_level_line(text, "nav", nav)
        path.write_text(text, encoding="utf-8")


def patch_unlocked_tip_locale_format() -> None:
    path = ROOT / "freigeschaltet" / "index.html"
    text = path.read_text(encoding="utf-8")
    old = 'function locale(){return window.BetInsightI18n?.getLanguage?.()==="en"?"en-GB":"de-DE"}'
    new = 'function locale(){const l=String(window.BetInsightI18n?.getLanguage?.()||"de").toLowerCase().split("-")[0];return({de:"de-DE",en:"en-GB",es:"es-ES",pt:"pt-BR",it:"it-IT",fr:"fr-FR"})[l]||"de-DE"}'
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise RuntimeError("Unlocked-tip locale formatter no longer matches expected source")
    path.write_text(text, encoding="utf-8")


def validate() -> None:
    manifest = json.loads((LOCALES / "manifest.json").read_text(encoding="utf-8"))
    assert tuple(manifest.get("languages", [])) == LANGS, manifest

    for lang in LANGS:
        data = json.loads((LOCALES / f"{lang}.json").read_text(encoding="utf-8"))
        assert set(LANGUAGE_LABELS[lang]).issubset(data.get("language", {})), (lang, "language")
        assert set(NAV_PATCH[lang]).issubset(data.get("nav", {})), (lang, "nav")

    pages = ROOT / "assets" / "i18n" / "pages"
    missing = []
    for scope in ACTIVE_SCOPES:
        for lang in LANGS:
            path = pages / scope / f"{lang}.json"
            if not path.exists():
                missing.append(str(path.relative_to(ROOT)))
                continue
            json.loads(path.read_text(encoding="utf-8"))
    if missing:
        raise RuntimeError("Missing six-language page locales:\n" + "\n".join(missing))

    unlocked = (ROOT / "freigeschaltet" / "index.html").read_text(encoding="utf-8")
    for locale in ("de-DE", "en-GB", "es-ES", "pt-BR", "it-IT", "fr-FR"):
        assert locale in unlocked, locale


if __name__ == "__main__":
    patch_shared_locales()
    patch_unlocked_tip_locale_format()
    validate()
    print("Six-language member UI normalization and validation OK")
