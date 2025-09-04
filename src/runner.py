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

from allocator import build_month_plan
from quotes_guard import QuotesGuard
from prompt_builder import build_system_prompt, build_user_message
from validator import validate_payload

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
        "Time_Image": day_ctx.get("t
