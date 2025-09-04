"""
runner.py
Orchestrates month/day generation:
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

Required env for Sheets (either style works):
    # Preferred (ID-based):
    SHEET_ID=...                      # spreadsheet ID
    SHEET_NAME=Posts                  # defaults to 'Posts'

    # Legacy (name-based):
    SPREADSHEET_NAME=BreathOfNow_Content_Master
    SHEET_NAME=Posts

    # Credentials (either one):
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json      # file path
    or GOOGLE_SERVICE_ACCOUNT_JSON='{...}'                 # JSON string

Required files:
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

import argparse
import datetime as dt
import json
import os
import time
from pathlib import Path
from typing import List, Dict, Optional

from allocator import build_month_plan
from quotes_guard import QuotesGuard
from prompt_builder import build_system_prompt, build_user_message
from validator import validate_payload

# Optional OpenAI (only if USE_OPENAI=1)
OPENAI_AVAILABLE = False
try:
    if os.environ.get("USE_OPENAI") == "1":
        from openai import OpenAI  # requires openai>=1.40.0
        OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
SCHEMAS_DIR = ROOT / "schemas"
DATA_DIR = ROOT / "data"
OUT_DIR = DATA_DIR / "outputs"
IMG_DIR = DATA_DIR / "images"
LOG_DIR = DATA_DIR / "logs"

def _ensure_dirs():
    for p in (OUT_DIR, IMG_DIR, LOG_DIR):
        p.mkdir(parents=True, exist_ok=True)

def _load_json_schema() -> dict:
    path = SCHEMAS_DIR / "BreathOfNowDailyPost.schema.json"
    return json.loads(path.read_text(encoding="utf-8"))

def _banned_norms(guard: QuotesGuard) -> List[str]:
    # Prefer a method on QuotesGuard; fallback to raw store
    if hasattr(guard, "banned_norms"):
        return list(guard.banned_norms())
    store = getattr(guard, "store", {})
    items = store.get("items", []) if isinstance(store, dict) else []
    return [str(it.get("norm", "")).strip() for it in items if it.get("norm")]

def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip() == "1"

def _map_to_sheet(day_ctx: dict, payload: dict) -> Dict:
    """Map model JSON → Google Sheet columns (Phase 1)."""
    return {
        "Date": day_ctx["date"],
        "Weekday": day_ctx["weekday"],
        "Tradition": day_ctx["tradition"],
        "Was it posted?": "",

        "Time_Carousel": day_ctx.get("time_carousel", ""),
        "Time_Poem": day_ctx.get("time_reel", ""),
        "Time_Image": day_ctx.get("time_image", ""),
        "Timezone": day_ctx.get("timezone", ""),

        "Quote": f"{payload['quote_text']} — {payload['quote_author']}",
        "Meditation 1": payload.get("med1", ""),
        "Meditation 2": payload.get("med2", ""),
        "Journal Prompt 1": payload.get("jp1", ""),
        "Journal Prompt 2": payload.get("jp2", ""),
        "CTA": payload.get("cta_line", ""),
        "Caption": (payload.get("carousel_caption", "") + "\n" + " ".join(payload.get("carousel_hashtags", []))).strip(),
        "First Comment": payload.get("carousel_first_comment", ""),
        "Story Action": payload.get("story_action", ""),

        "Poem": payload.get("poem_text", ""),
        "Poem Caption": payload.get("poem_caption", ""),
        "Poem 1st Comment": payload.get("poem_first_comment", ""),
        "Poem Story Action": payload.get("poem_story_action", ""),

        "Image creation prompt": payload.get("image_prompt", ""),
        "Image Caption": payload.get("image_caption", ""),
        "Image 1st Comment": payload.get("image_first_comment", ""),
        "Image Story Action": payload.get("image_story_action", ""),
    }

def _call_openai(system_prompt: str, user_message: str, schema: dict, max_retries: int = 2, sleep_seconds: float = 1.5) -> Optional[dict]:
    """Call OpenAI with a JSON schema response format and parse the result."""
    if not OPENAI_AVAILABLE:
        return None
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[OpenAI] OPENAI_API_KEY not set; skipping.")
        return None

    client = OpenAI(api_key=api_key)
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "BreathOfNowDailyPost",
            "schema": schema,
            "strict": True,
        },
    }

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                response_format=response_format,
                temperature=0.7,
            )
            msg = resp.choices[0].message
            if getattr(msg, "content", None):
                try:
                    return json.loads(msg.content)
                except Exception:
                    pass
            parsed = getattr(msg, "parsed", None)
            if parsed:
                return parsed
            print("[OpenAI] Could not parse JSON from response.")
            return None
        except Exception as e:
            print(f"[OpenAI] Attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(sleep_seconds)
    return None

def _write_day_payload(date_str: str, payload: dict, force: bool = False) -> Path:
    """Persist per-day JSON for artifacts/idempotency."""
    _ensure_dirs()
    out_path = OUT_DIR / f"{date_str}.json"
    if out_path.exists() and not force:
        return out_path
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path

def run_month(year: int, month: int, *, language: str = "EN", dry_run: bool = False, skip_images: bool = False, force: bool = False) -> List[Dict]:
    """Generate a month and (optionally) append rows to Google Sheets."""
    plan = build_month_plan(year, month, str(CONFIG_DIR))

    guard = QuotesGuard(
        store_path=str(DATA_DIR / "used_quotes.json"),
        aliases_path=str(CONFIG_DIR / "author_aliases.yml"),
    ).load()

    system_prompt = build_system_prompt(str(CONFIG_DIR))
    json_schema = _load_json_schema()

    rows_for_sheet: List[Dict] = []

    for day_ctx in plan:
        print(f"[{day_ctx['date']}] {day_ctx['tradition']} • {day_ctx.get('week_theme','')}")
        banned = _banned_norms(guard)
        user_msg = build_user_message(day_ctx, str(CONFIG_DIR), banned, language=language)

        payload: Optional[dict] = None
        for attempt in range(1, 3):
            payload = _call_openai(system_prompt, user_msg, json_schema) if _env_flag("USE_OPENAI") else None
            if not payload:
                print(f"  - No payload (attempt {attempt}).")
                continue

            ok, errs = validate_payload(payload, day_ctx["tradition"], str(CONFIG_DIR), str(SCHEMAS_DIR))
            if not ok:
                print(f"  - Validation failed (attempt {attempt}): {errs}")
                continue

            accepted, info = guard.check_and_register(payload["quote_text"], payload["quote_author"], day_ctx["date"])
            if not accepted:
                print(f"  - Quote rejected (attempt {attempt}): {info}")
                continue

            break  # good payload

        if not payload:
            print(f"  ! Skipping {day_ctx['date']} (no valid payload).")
            continue

        # Persist per-day payload (for artifacts / audit)
        _write_day_payload(day_ctx["date"], payload, force=force)

        # Map to row
        row = _map_to_sheet(day_ctx, payload)
        rows_for_sheet.append(row)

    guard.save()

    if rows_for_sheet and _env_flag("WRITE_TO_SHEETS"):
        try:
            from sheets_writer import write_rows  # lazy import
            write_rows(rows_for_sheet, os.environ)
            print(f"[Sheets] Wrote {len(rows_for_sheet)} rows.")
        except Exception as e:
            print(f"[Sheets] Failed to write rows: {e}")

    return rows_for_sheet

def run_day(date_str: str, **kwargs) -> List[Dict]:
    d = dt.datetime.strptime(date_str, "%Y-%m-%d")
    return run_month(d.year, d.month, **kwargs)

def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--day", type=str, help="YYYY-MM-DD")
    g.add_argument("--month", type=str, help="YYYY-MM")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-images", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--language", type=str, default=os.environ.get("LANGUAGE", "EN"))
    args = ap.parse_args()

    if args.day:
        run_day(args.day, language=args.language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    else:
        y, m = map(int, args.month.split("-"))
        run_month(y, m, language=args.language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
