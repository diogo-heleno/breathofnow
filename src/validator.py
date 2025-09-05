"""
validator.py — light validation (no 'weekday' requirement).
"""

from __future__ import annotations
from typing import Dict


REQUIRED = [
    "date",
    "tradition",
    "time_carousel",
    "time_poem",
    "time_image",
    "quote",
    "meditation_1",
    "meditation_2",
    "journal_prompt_1",
    "journal_prompt_2",
]


def validate_payload(payload: Dict) -> None:
    missing = [k for k in REQUIRED if k not in payload or payload[k] is None]
    if missing:
        raise ValueError(f"Payload missing required fields: {missing}")
