"""
runner.py — BreathOfNow content runner (Sheets-first, no weekday calc)

Key points:
- Guarantees an ISO date on each day context (column A).
- Never writes to column B (Weekday) — your Sheet formula handles it.
- Writes C..M with payload fields.
- Works for --day YYYY-MM-DD or --month YYYY-MM (runs whole month).
"""

from __future__ import annotations
import os
import argparse
from dataclasses import dataclass
from datetime import date as _date, datetime
from typing import Dict, List, Tuple, Optional

from allocator import build_month_plan
from prompt_builder import build_system_prompt, build_user_message
from validator import validate_payload
from quotes_guard import QuotesGuard
from sheets import SheetsWriter

USE_OPENAI = os.getenv("USE_OPENAI", "0") == "1"
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5")
LANGUAGE = os.getenv("LANGUAGE", "EN")
TIMEZONE = os.getenv("TIMEZONE", "Europe/Lisbon")


# ------------------------
# Utilities
# ------------------------
def ensure_date(day_ctx: Dict, year: int, month: int, day: int) -> str:
    """Ensure an ISO date (YYYY-MM-DD) is present on day_ctx and return it."""
    if not day_ctx.get("date"):
        day_ctx["date"] = _date(year, month, day).isoformat()
    return day_ctx["date"]


def iso_ymd(d: _date) -> Tuple[int, int, int]:
    return d.year, d.month, d.day


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--day", help="YYYY-MM-DD")
    g.add_argument("--month", help="YYYY-MM (runs entire month)")
    p.add_argument("--dry-run", action="store_true", help="Do everything except write to Sheets / images")
    p.add_argument("--skip-images", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--language", default=LANGUAGE)
    return p.parse_args()


# ------------------------
# Core
# ------------------------
@dataclass
class DayItem:
    year: int
    month: int
    day: int
    ctx: Dict


def run_month(year: int, month: int, *, language: str, dry_run: bool, skip_images: bool, force: bool) -> None:
    """
    Build the plan for the month and write rows to Google Sheets.
    """
    # 1) Plan & helpers
    plan: List[DayItem] = []
    raw_plan = build_month_plan(year, month, language=language)  # list of dicts
    for entry in raw_plan:
        y, m, d = entry["year"], entry["month"], entry["day"]
        ctx = entry.get("context", {})
        ensure_date(ctx, y, m, d)  # <-- guarantees 'date' for Sheets A column
        plan.append(DayItem(y, m, d, ctx))

    # 2) Quote duplicate guard
    guard = QuotesGuard()

    # 3) Sheets writer
    ws = SheetsWriter(os.environ["SHEET_ID"], worksheet="Posts", dry_run=dry_run)

    # 4) Iterate days
    for item in plan:
        iso = ensure_date(item.ctx, item.year, item.month, item.day)  # redundant but safe

        # Build prompts (system + user) from context
        system_prompt = build_system_prompt(language=language, timezone=TIMEZONE)
        user_msg = build_user_message(item.ctx)

        # Call model (or stub) and validate
        if USE_OPENAI:
            # Real call wired in prompt_builder (kept here simple on purpose)
            payload = prompt_builder_call(system_prompt, user_msg, model=OPENAI_MODEL)
        else:
            payload = fake_payload(item, timezone=TIMEZONE)  # offline/dev

        validate_payload(payload)  # weekday is NOT required

        # Guard: ban duplicate quotes near in time
        guard.check_and_register(payload.get("quote", ""))

        # Map payload to row values (A set separately; B skipped; C..M here)
        row_values_C_to_M = map_payload_to_sheet_values(payload, timezone=TIMEZONE)

        # Write to Sheets
        ws.write_row_by_date(
            date_iso=iso,
            values_c_to_m=row_values_C_to_M,  # we never touch column B
        )


def run_day(day_str: str, **kwargs) -> None:
    d = datetime.fromisoformat(day_str).date()
    return run_month(d.year, d.month, **kwargs)


# ------------------------
# Mappers & Stubs
# ------------------------
def map_payload_to_sheet_values(payload: Dict, timezone: str) -> List:
    """
    Return list for columns C..M:
    C Tradition
    D Was it posted?
    E Time_Carousel
    F Time_Poem
    G Time_Image
    H Timezone
    I Quote
    J Meditation 1
    K Meditation 2
    L Journal Prompt 1
    M Journal Prompt 2
    """
    return [
        payload.get("tradition", ""),   # C
        "No",                           # D
        payload.get("time_carousel", ""),  # E
        payload.get("time_poem", ""),      # F
        payload.get("time_image", ""),     # G
        timezone or payload.get("timezone", "Europe/Lisbon"),  # H
        payload.get("quote", ""),       # I
        payload.get("meditation_1", ""),# J
        payload.get("meditation_2", ""),# K
        payload.get("journal_prompt_1", ""), # L
        payload.get("journal_prompt_2", ""), # M
    ]


def prompt_builder_call(system_prompt: str, user_msg: str, model: str) -> Dict:
    """
    Minimal OpenAI call using prompt_builder's recommended settings.
    Replace/extend as needed; kept thin so runner remains simple.
    """
    # Lazy import to avoid dependency when USE_OPENAI=0
    from openai import OpenAI

    client = OpenAI()
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},  # validator enforces schema
        temperature=0.7,
    )
    content = resp.choices[0].message.content
    import json as _json
    try:
        return _json.loads(content)
    except Exception:
        # If model didn't return JSON, wrap it
        return {"quote": content}


def fake_payload(item: DayItem, timezone: str) -> Dict:
    """Deterministic stub for offline/dev runs."""
    iso = _date(item.year, item.month, item.day).isoformat()
    return {
        "date": iso,
        "tradition": item.ctx.get("tradition", "Zen"),
        "time_carousel": "08:30",
        "time_poem": "12:00",
        "time_image": "18:00",
        "quote": f"When in doubt, breathe. ({iso})",
        "meditation_1": "Observe five breaths, count backwards 5→1.",
        "meditation_2": "Notice sounds; let them pass like clouds.",
        "journal_prompt_1": "Where did I resist today?",
        "journal_prompt_2": "What tiny action brings ease?",
    }


# ------------------------
# Entry
# ------------------------
def main() -> int:
    args = parse_args()
    language = args.language

    if args.day:
        run_day(args.day, language=language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    else:
        year, month = map(int, args.month.split("-"))
        run_month(year, month, language=language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
