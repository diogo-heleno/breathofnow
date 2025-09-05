from __future__ import annotations
"""
BreathOfNow runner
- Builds a monthly plan
- For each day: builds prompts, (optionally) calls OpenAI, validates, dedupes quotes, writes per-day JSON
- Optionally appends rows to Google Sheets

Env toggles:
  USE_OPENAI=1          -> call OpenAI
  WRITE_TO_SHEETS=1     -> append rows to Google Sheet

Sheets env (either style works):
  SHEET_ID=... (preferred)   and  SHEET_NAME=Posts
  or
  SPREADSHEET_NAME=BreathOfNow_Content_Master and SHEET_NAME=Posts

Credentials (either):
  GOOGLE_SERVICE_ACCOUNT_JSON='{...}'  # JSON string (Actions secret)
  or GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
"""
import argparse
import datetime as dt
import json
import os
import time
from pathlib import Path
from typing import Dict, List, Optional

from .allocator import build_month_plan
from .quotes_guard import QuotesGuard
from .prompt_builder import build_system_prompt, build_user_message
from .validator import validate_payload

# --- optional OpenAI import (only if USE_OPENAI=1) ---
OPENAI_AVAILABLE = False
try:
    if os.environ.get("USE_OPENAI") == "1":
        from openai import OpenAI  # openai>=1.40.0
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
    p = SCHEMAS_DIR / "BreathOfNowDailyPost.schema.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip() == "1"

def _call_openai(system_prompt: str, user_message: str, schema: dict, max_retries: int = 2, sleep_seconds: float = 1.5) -> Optional[dict]:
    """Call OpenAI with JSON-schema responses; return parsed dict or None."""
    if not OPENAI_AVAILABLE:
        return None
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[OpenAI] OPENAI_API_KEY not set.")
        return None

    client = OpenAI(api_key=api_key)
    response_format = {"type": "json_schema", "json_schema": {"name": "BreathOfNowDailyPost", "schema": schema, "strict": True}}
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": system_prompt},
                          {"role": "user", "content": user_message}],
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
            print("[OpenAI] Could not parse JSON.")
            return None
        except Exception as e:
            print(f"[OpenAI] attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(sleep_seconds)
    return None

def _make_stub_payload(day_ctx: dict) -> dict:
    """A schema-like stub so Actions can produce artifacts without OpenAI."""
    quote = f"{day_ctx['tradition']} practice for {day_ctx['date']}"
    author = f"Stub Author {day_ctx['date']}"
    return {
        "quote_text": quote,
        "quote_author": author,
        "med1": "Breathe in for 4, out for 6. Notice the pause.",
        "med2": "Observe one thought without judgment for 60 seconds.",
        "jp1": "Where am I gripping today?",
        "jp2": "What can I release right now?",
        "cta_line": "Follow @breathofnow for daily calm.",
        "carousel_caption": f"{quote} — {author}",
        "carousel_hashtags": ["#mindfulness", "#presence", "#breathofnow"],
        "carousel_first_comment": "Journal: What tiny action reconnects me to now?",
        "story_action": "Add a poll: 'Can you pause 1 min right now?'",
        "poem_text": "A quiet step / the world exhales / and I arrive.",
        "poem_caption": "One line, one breath.",
        "poem_first_comment": "How did this land for you?",
        "poem_story_action": "Share the first line as a teaser.",
        "image_prompt": f"{day_ctx['tradition']} visual, see config styles; minimal, textured.",
        "image_caption": "Stillness speaks.",
        "image_first_comment": "Try the 4–6 breath for 1 minute.",
        "image_story_action": "Add a countdown sticker for tonight’s practice.",
    }

def _write_day_payload(date_str: str, payload: dict, force: bool = False) -> Path:
    _ensure_dirs()
    out_path = OUT_DIR / f"{date_str}.json"
    if out_path.exists() and not force:
        return out_path
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path

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

def run_month(year: int, month: int, *, language: str = "EN", dry_run: bool = False, skip_images: bool = False, force: bool = False) -> List[Dict]:
    plan = build_month_plan(year, month, str(CONFIG_DIR))

    guard = QuotesGuard(
        store_path=str(DATA_DIR / "used_quotes.json"),
        aliases_path=str(CONFIG_DIR / "author_aliases.yml"),
    ).load()

    system_prompt = build_system_prompt(str(CONFIG_DIR))
    schema = _load_json_schema()

    rows: List[Dict] = []

    for day_ctx in plan:
        print(f"[{day_ctx['date']}] {day_ctx['tradition']} • {day_ctx.get('week_theme','')}")
        banned = guard.banned_norms()
        user_msg = build_user_message(day_ctx, str(CONFIG_DIR), banned, language=language)

        if _env_flag("USE_OPENAI"):
            payload = _call_openai(system_prompt, user_msg, schema) or _make_stub_payload(day_ctx)
        else:
            payload = _make_stub_payload(day_ctx)  # always produce artifacts

        ok, msg = validate_payload(payload, day_ctx["tradition"], str(CONFIG_DIR), str(SCHEMAS_DIR))
        if not ok:
            print(f"  - Validation failed: {msg}")
            continue

        accepted, info = guard.check_and_register(payload["quote_text"], payload["quote_author"], day_ctx["date"])
        if not accepted:
            print(f"  - Quote rejected: {info}")
            continue

        _write_day_payload(day_ctx["date"], payload, force=force)
        rows.append(_map_to_sheet(day_ctx, payload))

    guard.save()

    if rows and _env_flag("WRITE_TO_SHEETS"):
        try:
            from sheets_writer import write_rows
            write_rows(rows, os.environ)
            print(f"[Sheets] Wrote {len(rows)} rows.")
        except Exception as e:
            print(f"[Sheets] Failed to write rows: {e}")

    return rows

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
    ap.add_argument("--language", type=str, default=os.getenv("LANGUAGE", "EN"))
    args = ap.parse_args()

    if args.day:
        run_day(args.day, language=args.language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    else:
        y, m = map(int, args.month.split("-"))
        run_month(y, m, language=args.language, dry_run=args.dry_run, skip_images=args.skip_images, force=args.force)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

