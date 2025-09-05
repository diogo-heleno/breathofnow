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

from __future__ import annotations
import argparse
import os
from pathlib import Path
from typing import Dict, Any, List

# --- make imports robust whether run as module or script ---
try:
    from .allocator import build_month_plan
except ImportError:
    from allocator import build_month_plan

try:
    from .quotes_guard import QuotesGuard
except ImportError:
    from quotes_guard import QuotesGuard

try:
    from .prompt_builder import build_system_prompt, build_user_message, load_schema
except ImportError:
    from prompt_builder import build_system_prompt, build_user_message, load_schema

try:
    from .validator import validate_payload
except ImportError:
    from validator import validate_payload

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

for p in (OUTPUTS_DIR, IMAGES_DIR, LOGS_DIR):
    p.mkdir(parents=True, exist_ok=True)

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
    system_prompt = build_system_prompt(CONFIG_DIR / "prompt_system.txt")
    user_message = build_user_message(day=day, guard_recent=guard.get_recent(n=30))

    # Model call
    raw = call_model(system_prompt, user_message)

    # Validate and normalize
    payload = validate_payload(raw, schema)

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

def main() -> None:
    ap = argparse.ArgumentParser()
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument("--day", help="Generate a single day: YYYY-MM-DD")
    grp.add_argument("--month", help="Generate an entire month anchored at YYYY-MM-01")
    args = ap.parse_args()

    if args.day:
        run_for_day(args.day)
    else:
        run_for_month(args.month)

if __name__ == "__main__":
    main()
