# BetInsight / TIME CLASH – Concurrent Work Rules

This repository is being edited from multiple parallel ChatGPT workstreams. These rules are mandatory for any change to TIME CLASH avatar/configurator files.

## Before every write
1. Fetch the latest `main` version of every target file.
2. Never replace a shared file with an older branch copy.
3. Create a fresh feature branch from the current `main`.
4. Patch only the smallest relevant block.
5. Before merge, compare `main...branch`. Merge only when `behind_by = 0`; otherwise rebuild/sync from the newest `main`.

## Workstream ownership
- FACE BASES: `time-clash/avatar-facepack-v5.js`
  - Reserved for the face/head workstream.
  - Other workstreams must not modify or replace this file.
- HAIR / BROWS / BEARDS: `time-clash/avatar-assets-v3.js`
  - Reserved for modular hair/brow/beard assets.
  - Other workstreams must not replace this file.
- BODY / CLOTHING / TATTOOS:
  - `time-clash/assets/avatar-bodypack-v1/**`
  - Body-related functions/fields only in `time-clash/avatar-engine.js`
  - Body-related controls/fields only in `time-clash/mein-team/index.html`
- MEDIA / NEWSPAPER:
  - `time-clash/medien/index.html`
  - Do not change from avatar asset workstreams unless the task explicitly requires it.
- APP I18N:
  - Existing PR/workstream `feature/i18n-multilang-safe*`
  - Keep separate from TIME CLASH avatar work.

## Shared-file rule
`time-clash/avatar-engine.js` and `time-clash/mein-team/index.html` are SHARED integration files.
No workstream owns the whole file. Do not copy an entire older version over `main`.
Only patch the relevant functions/DOM blocks against the latest `main`.

## Merge rule
- One workstream = one fresh branch.
- No direct overwrite of another workstream's assets.
- If another chat changes `main` while a branch is open, stop and resync before merge.
- Preserve new facepack / asset script version references already present on `main`.
- Close superseded PRs instead of merging both.

Last coordination update: 2026-09-26.
