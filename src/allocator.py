"""
allocator.py — builds a month plan with ISO dates pre-stamped.
"""

from __future__ import annotations
from datetime import date as _date, timedelta
from calendar import monthrange
from typing import List, Dict


def build_month_plan(year: int, month: int, *, language: str = "EN") -> List[Dict]:
    n_days = monthrange(year, month)[1]
    out: List[Dict] = []
    traditions = cycle_traditions()
    for day in range(1, n_days + 1):
        iso = _date(year, month, day).isoformat()
        out.append({
            "year": year,
            "month": month,
            "day": day,
            "context": {
                "date": iso,                 # <— IMPORTANT for runner / Sheets A
                "language": language,
                "tradition": traditions[(day - 1) % len(traditions)],
            }
        })
    return out


def cycle_traditions():
    # Adjust to your rotation
    return ["Zen", "Tao", "Stoic", "Zen", "Tao"]
