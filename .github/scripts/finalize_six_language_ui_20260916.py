#!/usr/bin/env python3
"""Deprecated compatibility wrapper.

The member UI now supports eight languages. This historical six-language script
must never normalize the repository back to six languages.
"""

from pathlib import Path
import runpy

VALIDATOR = Path(__file__).with_name("validate_member_i18n_eight_languages_20260930.py")
runpy.run_path(str(VALIDATOR), run_name="__main__")
