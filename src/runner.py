"""
runner.py
Orchestrates day/month generation for BreathOfNow.

- Build calendar plan (allocator)
- For each day:
    - Query quote guard for banned norms (recent)
    - Build system + user prompts
    - Call model (placeholder or OpenAI v1 client)
    - Validate payload
    - Register quote in guard
    - Map to Sheet columns
- Batch write to Google Sheet

This file is safe to run as:
    python -m src.runner --day 2025-10-01
or:
    python -m src.runner --month 2025-10-01
"""
from .sheets_writer import append_rows, map_payload_to_row, heartbeat_write
import datetime as dt
from __future__ import annotations
import argparse
import os
from pathlib import Path
from typing import Dict, Any, List
from datetime import date, datetime

# --- make imports robust whether run as module or script ---
try:
    from .allocator import build_month_plan
except ImportError:
    from .allocator import build_month_plan

try:
    from .quotes_guard import QuotesGuard
except ImportError:
    from .quotes_guard import QuotesGuard

try:
    from .prompt_builder import build_system_prompt, build_user_message, load_schema
except ImportError:
    from .prompt_builder import build_system_prompt, build_user_message, load_schema

try:
    from .validator import validate_payload
except ImportError:
    from .validator import validate_payload

CONFIG_DIR = Path(__file__).resolve().parents[1] / "config"
SCHEMAS_DIR = Path(__file__).resolve().parents[1] / "schemas"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
WRITE_TO_SHEETS = os.getenv("WRITE_TO_SHEETS", "0") == "1"
TIMEZONE = os.getenv("TIMEZONE", "Europe/Lisbon")

# Optional: only import OpenAI if USE_OPENAI=1
USE_OPENAI = os.getenv("USE_OPENAI", "0") == "1"
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5")

if USE_OPENAI:
    from openai import OpenAI  # type: ignore

# Paths
REPO_ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = REPO_ROOT / "config"
SCHEMAS_DIR = REPO_ROOT / "schemas"
DATA_DIR = REPO_ROOT / "data"
OUTPUTS_DIR = DATA_DIR / "outputs"
IMAGES_DIR = DATA_DIR / "images"
LOGS_DIR = DATA_DIR / "logs"
SCHEMA_PATH = SCHEMAS_DIR / "BreathOfNowDailyPost.schema.json"

for p in (OUTPUTS_DIR, IMAGES_DIR, LOGS_DIR):
    p.mkdir(parents=True, exist_ok=True)

def run_for_day(day_iso: str) -> Dict[str, Any]:
    date_obj = dt.date.fromisoformat(day_iso)
    weekday = date_obj.strftime("%A")
    return {
        "date": day_iso,
        "weekday": weekday,
        "tradition": "Zen",
        "was_posted": "No",
        "time_carousel": "",
        "time_poem": "",
        "time_image": "",
        "timezone": TIMEZONE,
        "quote": "Pipeline heartbeat — write test.",
        "meditation_1": "",
        "meditation_2": "",
        "journal_prompt_1": "",
        "journal_prompt_2": "",
    }

def call_model(system_prompt: str, user_message: str) -> Dict[str, Any]:
    """Call the model (or return a stub if USE_OPENAI=0)."""
    if not USE_OPENAI:
        # Minimal stub so the pipeline can run in dry environments
        return {
            "post_date": "2025-10-01",
            "tradition": "Zen",
            "quote_text": "When you realize nothing is lacking, the whole world belongs to you.",
            "quote_source": "Attributed to Sengcan (Tang Dynasty) — often misattributed as “Zen Proverb”",
            "carousel_hashtags": ["#mindfulness", "#presence", "#breathofnow"],
            "caption": "Letting go reveals the plenty already here.",
            "first_comment": "Journal prompt: Where in my day can I do less so I feel more?",
            "image_style": "woodcut",
        }

    client = OpenAI()
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
    )
    # Expect JSON in assistant message
    content = resp.choices[0].message.content or "{}"
    import json
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback minimal payload if model returned text
        return {"raw": content}

def write_to_sheet(rows: List[List[Any]]) -> None:
    """Batch write to Google Sheet if WRITE_TO_SHEETS=1 and SHEET_ID is set."""
    if os.getenv("WRITE_TO_SHEETS", "0") != "1":
        return
    sheet_id = os.getenv("SHEET_ID")
    if not sheet_id:
        return

    import gspread
    from google.oauth2.service_account import Credentials

    gsa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_PATH") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not gsa_path or not Path(gsa_path).exists():
        raise RuntimeError("Google service account credentials not found.")

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(gsa_path, scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(sheet_id)
    ws = sh.sheet1  # adjust if you want a specific worksheet

    # Append rows
    ws.append_rows(rows, value_input_option="RAW")

def map_payload_to_row(day: str, payload: Dict[str, Any]) -> List[Any]:
    """
    Map the validated payload to your Sheet columns.
    TODO: adjust to your exact header order.
    """
    return [
        day,
        payload.get("tradition", ""),
        payload.get("quote_text", ""),
        payload.get("quote_source", ""),
        ", ".join(payload.get("carousel_hashtags", [])),
        payload.get("caption", ""),
        payload.get("first_comment", ""),
        payload.get("image_style", ""),
    ]

def run_for_day(day: str) -> None:
    schema = load_schema(SCHEMAS_DIR / "BreathOfNowDailyPost.schema.json")
    guard = QuotesGuard(DATA_DIR / "quotes_guard.json")

    # Prompt build
    system_prompt = build_system_prompt(CONFIG_DIR)  # pass directory, not file
    user_message = build_user_message(day=day, guard_recent=guard.get_recent(n=30))

    # Model call
    raw = call_model(system_prompt, user_message)

    # Validate and normalize
    payload = validate_payload(raw, SCHEMA_PATH)

    # Register quote
    if payload.get("quote_text"):
        guard.register_quote(payload["quote_text"], payload.get("quote_source", ""))

    # Map to sheet row
    row = map_payload_to_row(day, payload)

    # Write outputs locally for artifacts
    (OUTPUTS_DIR / f"{day}.json").write_text(__import__("json").dumps(payload, ensure_ascii=False, indent=2))
    (LOGS_DIR / f"{day}.log").write_text(f"Generated day {day}")

    # Optionally write to Google Sheet
    write_to_sheet([row])

def run_for_month(date_str: str) -> None:
    plan = build_month_plan(date_str)
    for day in plan["days"]:
        run_for_day(day)

def _to_rows(payload_or_list, fallback_date_iso: str) -> list[list]:
    """
    Accepts a dict or a list[dict] and maps to sheet rows.
    Ensures 'date' and 'timezone' exist for mapping.
    """
    if payload_or_list is None:
        return []
    items = payload_or_list if isinstance(payload_or_list, list) else [payload_or_list]
    rows = []
    for p in items:
        if not isinstance(p, dict):
            continue
        # Ensure date/timezone keys exist for the mapper
        if "date" not in p:
            p = {**p, "date": fallback_date_iso}
        if "timezone" not in p:
            p = {**p, "timezone": TIMEZONE}
        rows.append(map_payload_to_row(p, timezone=TIMEZONE))
    return rows


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument("--day", help="Generate a single day: YYYY-MM-DD")
    grp.add_argument("--month", help="Generate an entire month anchored at YYYY-MM-01")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.day:
        # Convert 'YYYY-MM-DD' string to a datetime.date
        day = datetime.strptime(args.day, "%Y-%m-%d").date()
        result = run_for_day(day)

        if WRITE_TO_SHEETS and not args.dry_run:
            try:
                print("[runner] Writing day result to Google Sheets...")
                rows = _to_rows(result, fallback_date_iso=day.isoformat())
                if rows:
                    append_rows(rows)
                else:
                    # Nothing mapped — write a heartbeat so we can verify wiring
                    heartbeat_write(day.isoformat(), "Heartbeat — no payload mapped from run_for_day()")
            except Exception as e:
                print(f"[runner] Sheets write failed: {e}")
                raise
        else:
            print("[runner] WRITE_TO_SHEETS disabled or dry-run; skipping sheets write.")

    else:
        # Normalize month anchor to the first of the month as a datetime.date
        month_anchor = datetime.strptime(args.month, "%Y-%m-%d").date().replace(day=1)
        results = run_for_month(month_anchor)

        if WRITE_TO_SHEETS and not args.dry_run:
            try:
                print("[runner] Writing month results to Google Sheets...")
                # Use the anchor day for any items missing a date
                rows = _to_rows(results, fallback_date_iso=month_anchor.isoformat())
                if rows:
                    append_rows(rows)
                else:
                    heartbeat_write(month_anchor.isoformat(), "Heartbeat — no rows mapped from run_for_month()")
            except Exception as e:
                print(f"[runner] Sheets write failed: {e}")
                raise
        else:
            print("[runner] WRITE_TO_SHEETS disabled or dry-run; skipping sheets write.")






