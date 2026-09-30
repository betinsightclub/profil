#!/usr/bin/env python3
"""Validate BetInsight member i18n coverage for all eight supported languages.

Checks:
- manifest has the eight supported languages
- shared locale files contain every German key
- all active member page scopes exist in all eight languages
- every target page locale contains every German key
- {{placeholder}} names match the German source
- NL / zh-TW member language switch and locale adapters are wired correctly
- Portuguese member switch uses Portugal flag
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
I18N = ROOT / "assets" / "i18n"
LOCALES = I18N / "locales"
PAGES = I18N / "pages"

LANGS = ("de", "en", "es", "pt", "it", "fr", "nl", "zh-tw")
ACTIVE_SCOPES = (
    "academy", "buy", "daily", "dashboard", "dashboard-completion",
    "fan-challenge", "marketing-center", "my-sale-offers", "offers",
    "packages", "premium-upgrade", "providers", "resources", "sell",
    "support", "tips", "wallet", "werbematerial",
)

PLACEHOLDER_RE = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")


def load(path: Path):
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def flatten(value, prefix=""):
    result = {}
    if isinstance(value, dict):
        for key, child in value.items():
            child_key = f"{prefix}.{key}" if prefix else str(key)
            result.update(flatten(child, child_key))
    else:
        result[prefix] = "" if value is None else str(value)
    return result


def placeholders(text: str):
    return sorted(match.strip() for match in PLACEHOLDER_RE.findall(str(text)))


def compare(source: dict, target: dict, label: str):
    missing = sorted(set(source) - set(target))
    empty = sorted(key for key in source if key in target and not str(target[key]).strip())
    bad_placeholders = sorted(
        key for key in source
        if key in target and placeholders(source[key]) != placeholders(target[key])
    )
    if missing or empty or bad_placeholders:
        chunks = [f"Locale validation failed: {label}"]
        if missing:
            chunks.append("Missing keys:\n  " + "\n  ".join(missing))
        if empty:
            chunks.append("Empty values:\n  " + "\n  ".join(empty))
        if bad_placeholders:
            chunks.append("Placeholder mismatches:\n  " + "\n  ".join(bad_placeholders))
        raise RuntimeError("\n".join(chunks))


def main():
    manifest = load(LOCALES / "manifest.json")
    if tuple(manifest.get("languages", ())) != LANGS:
        raise RuntimeError(f"Manifest languages mismatch: {manifest.get('languages')}")

    shared_de = flatten(load(LOCALES / "de.json"))
    for lang in LANGS:
        path = LOCALES / f"{lang}.json"
        if not path.exists():
            raise RuntimeError(f"Missing shared locale: {path.relative_to(ROOT)}")
        compare(shared_de, flatten(load(path)), f"shared/{lang}")

    for scope in ACTIVE_SCOPES:
        source_path = PAGES / scope / "de.json"
        source = flatten(load(source_path))
        for lang in LANGS:
            path = PAGES / scope / f"{lang}.json"
            if not path.exists():
                raise RuntimeError(f"Missing page locale: {path.relative_to(ROOT)}")
            compare(source, flatten(load(path)), f"{scope}/{lang}")

    core = (I18N / "core-v2.js").read_text(encoding="utf-8")
    switch = (ROOT / "assets" / "member-language-switch.js").read_text(encoding="utf-8")
    completion = (I18N / "member-completion.js").read_text(encoding="utf-8")
    dashboard_legacy = (I18N / "dashboard-legacy.js").read_text(encoding="utf-8")
    unlocked = (ROOT / "freigeschaltet" / "index.html").read_text(encoding="utf-8")

    assertions = {
        "core NL": 'nl:{flag:"🇳🇱",label:"Nederlands"}' in core,
        "core zh-TW": '"zh-tw":{flag:"🇹🇼",label:"繁體中文"}' in core,
        "switch NL": '"nl"' in switch and "🇳🇱 NL" in switch,
        "switch zh-TW": '"zh-tw"' in switch and "🇹🇼 繁中" in switch,
        "Portugal flag": "🇵🇹 PT" in switch and "🇧🇷 PT" not in switch,
        "member completion zh-TW": 'return "zh-tw"' in completion,
        "dashboard locale NL": 'nl:"nl-NL"' in dashboard_legacy,
        "dashboard locale zh-TW": '"zh-tw":"zh-TW"' in dashboard_legacy,
        "unlocked locale NL": 'nl:"nl-NL"' in unlocked,
        "unlocked locale zh-TW": '"zh-tw":"zh-TW"' in unlocked,
        "unlocked Portugal locale": 'pt:"pt-PT"' in unlocked,
    }
    failed = [name for name, ok in assertions.items() if not ok]
    if failed:
        raise RuntimeError("Adapter validation failed: " + ", ".join(failed))

    print("BetInsight eight-language member i18n validation OK")
    print(f"Languages: {', '.join(LANGS)}")
    print(f"Scopes: {len(ACTIVE_SCOPES)}")


if __name__ == "__main__":
    main()
