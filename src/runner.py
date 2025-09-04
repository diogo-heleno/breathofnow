"""
runner.py
Orchestrates the month generation:
- Build calendar plan (allocator)
- For each day:
    - Query quote guard for banned norms (recent)
    - Build system + user prompts
    - Call model (OpenAI Structured Outputs when enabled)
    - Validate payload
    - Register quote in guard
    - Map to Sheet columns
- Batch write to Google Sheet

Env toggles:
    USE_OPENAI=1               # enable real model calls
    WRITE_TO_SHEETS=1          # write appended rows to Google Sheets

Required env (when writing to Sheets):
    GOOGLE_APPLICATION_CREDENTIALS
    SPREADSHEET_NAME (default: BreathOfNow_Content_Master)
    SHEET_NAME (default: Posts)

Required files (already in your repo):
    config/prompt_system.txt
    schemas/BreathOfNowDailyPost.schema.json
    config/author_aliases.yml
    config/rotation.yml
    config/weekly_themes.yml
    config/visual_identity.yml
    config/hashtag_sets.yml
    data/used_quotes.json
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple

from allocator import build_month_plan
from quotes_guard import QuotesGuard
from prompt_builder import build_system_prompt, build_user_message
from validator import validate_payload

# Optional: only imported if WRITE_TO_SHEETS=1
# (keeps module import errors away if gspread isn't installed yet)
sheets_writer = None

# Optional OpenAI (only used if USE_OPENAI=1)
OPENAI_AVAILABLE = False
try:
    if os.environ.get("USE_OPENAI") == "1":
        from openai import OpenAI  # requires openai>=1.40.0
        OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

CONFIG_DIR = str(Path(__file__).resolve().parents[1] / "config")
SCHEMAS_DIR = str(Path(__file__).resolve().parents[1] / "schemas")
DATA_DIR = str(Path(__file__).resolve().parents[1] / "data")


# -------------------------------
# Helpers
# -------------------------------

def _load_json_schema() -> dict:
    path = Path(SCHEMAS_DIR) / "BreathOfNowDailyPost.schema.json"
    return json.loads(path.read_text(encoding="utf-8"))

def _banned_norms(quotes_guard: QuotesGuard) -> List[str]:
    return [it.get("norm", "") for it in quotes_guard.store.get("items", [])]

def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip() == "1"


def _map_to_sheet(day_ctx: dict, payload: dict) -> Dict:
    """
    Convert model JSON into a dict matching your Sheet header from Phase 0.
    Only the main fields for Phase 1 are filled; automation fields left blank.
    """
    return {
        "Date": day_ctx["date"],
        "Weekday": day_ctx["weekday"],
        "Tradition": day_ctx["tradition"],
        "Was it posted?": "",

        "Time_Carousel": day_ctx["time_carousel"],
        "Time_Poem": day_ctx["time_reel"],
        "Time_Image": day_ctx["time_image"],
        "Timezone": day_ctx["timezone"]:

        "Quote": f"{payload['quote_text']} — {payload['quote_author']}",
        "Meditation 1": payload["med1"],
        "Meditation 2": payload["med2"],
        "Journal Prompt 1": payload["jp1"],
        "Journal Prompt 2": payload["jp2"],
        "CTA": payload["cta_line"],
        "Caption": payload["carousel_caption"] + "\n" + " ".join(payload["carousel_hashtags"]),
        "First Comment": payload["carousel_first_comment"],
        "Story Action": payload["story_action"],

        "Poem": payload["poem_text"],
        "Poem Caption": payload["poem_caption"],
        "Poem 1st Comment": payload["poem_first_comment"],
        "Poem Story Action": payload["poem_story_action"],

        "Image creation prompt": payload["image_prompt"],
        "Image Caption": payload["image_caption"],
        "Image 1st Comment": payload["image_first_comment"],
        "Image Story Action": payload["image_story_action"],

        # Canva/IG/Status columns left blank in Phase 1
    }


# -------------------------------
# OpenAI call (Structured Outputs)
# -------------------------------

def _call_openai(system_prompt: str, user_message: str, schema: dict, max_retries: int = 2, sleep_seconds: float = 1.5) -> Optional[dict]:
    """
    Calls OpenAI with a JSON schema response format.
    Returns parsed dict on success, or None on failure.
    Only used when USE_OPENAI=1 and OPENAI_API_KEY is set.
    """
    if not OPENAI_AVAILABLE:
        return None

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[OpenAI] OPENAI_API_KEY not set; skipping model call.")
        return None

    client = OpenAI(api_key=api_key)
    # Load schema as response_format
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "BreathOfNowDailyPost",
            "schema": schema,
            "strict": True
        }
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini-2024-08-06"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                response_format=response_format,
                temperature=0.7
            )
            # New SDK returns JSON in .choices[0].message
            msg = resp.choices[0].message
            # Depending on SDK, parsed JSON may be in msg.content (string) or msg.parsed if using Responses API.
            # Try to parse content as JSON:
            if getattr(msg, "content", None):
                try:
                    return json.loads(msg.content)
                except Exception:
                    pass

            # If the SDK supports parsed (Responses API), try that:
            parsed = getattr(msg, "parsed", None)
            if parsed:
                return parsed

            print("[OpenAI] Could not parse JSON from response; content length:",
                  len(msg.content) if getattr(msg, "content", None) else "N/A")
            return None

        except Exception as e:
            print(f"[OpenAI] Attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(sleep_seconds)
            else:
                return None

    return None


# -------------------------------
# Main runner
# -------------------------------

def run_month(year: int, month: int, language: str = "EN") -> List[Dict]:
    """
    Generates content for a month and (optionally) writes to Google Sheets.
    Returns the list of mapped rows.
    """
    # Build plan
    plan = build_month_plan(year, month, CONFIG_DIR)

    # Guard
    guard = QuotesGuard(
        store_path=str(Path(DATA_DIR) / "used_quotes.json"),
        aliases_path=str(Path(CONFIG_DIR) / "author_aliases.yml")
    ).load()

    # Prompts/schema
    system_prompt = build_system_prompt(CONFIG_DIR)
    json_schema = _load_json_schema()

    rows_for_sheet: List[Dict] = []

    for day_ctx in plan:
        print(f"[{day_ctx['date']}] {day_ctx['tradition']} • {day_ctx['week_theme']}")

        banned = _banned_norms(guard)
        user_msg = build_user_message(day_ctx, CONFIG_DIR, banned, language=language)

        payload: Optional[dict] = None

        # Try up to 2 attempts to get a valid + unique payload
        for attempt in range(1, 3):
            if _env_flag("USE_OPENAI"):
                payload = _call_openai(system_prompt, user_msg, json_schema)
            else:
                payload = None  # No model call in dry runs

            if not payload:
                print(f"  - No payload returned (attempt {attempt}).")
                continue

            # Validate content rules
            ok, errs = validate_payload(payload, day_ctx["tradition"], CONFIG_DIR, SCHEMAS_DIR)
            if not ok:
                print(f"  - Validation failed (attempt {attempt}): {errs}")
                continue

            # Quote uniqueness
            accepted, info = guard.check_and_register(
                payload["quote_text"], payload["quote_author"], day_ctx["date"]
            )
            if not accepted:
                print(f"  - Quote rejected (attempt {attempt}): {info}")
                continue

            # Good payload
            break

        # If after attempts we still don't have a good payload, optionally stub or skip
        if not payload:
            print(f"  ! Skipping day {day_ctx['date']} (no valid payload)")
            continue

        # Map to sheet structure
        row = _map_to_sheet(day_ctx, payload)
        rows_for_sheet.append(row)

    # Persist quotes guard
    guard.save()

    # Optionally write to Google Sheets
    if rows_for_sheet and _env_flag("WRITE_TO_SHEETS"):
        global sheets_writer
        if sheets_writer is None:
            # Lazy import to avoid requiring gspread for dry runs
            from sheets_writer import write_rows as _write_rows
            sheets_writer = _write_rows
        try:
            sheets_writer(rows_for_sheet, os.environ)
            print(f"[Sheets] Wrote {len(rows_for_sheet)} rows.")
        except Exception as e:
            print(f"[Sheets] Failed to write rows: {e}")

    return rows_for_sheet


if __name__ == "__main__":
    # Example: generate the current month in English
    # Toggle behavior with env flags:
    #   USE_OPENAI=1  -> call the model
    #   WRITE_TO_SHEETS=1 -> append to Google Sheet
    import datetime as _dt
    today = _dt.date.today()
    rows = run_month(today.year, today.month, language=os.environ.get("LANGUAGE", "EN"))
    print(f"Done. Generated {len(rows)} row(s).")
