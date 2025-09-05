from __future__ import annotations
"""
runner.py
Orchestrates day/month generation for BreathOfNow.

- Build calendar plan (allocator)
- For each day:
    - Query quote guard for banned norms (recent)
    - Build system + user prompts
    - Call model (stub or OpenAI v1 client)
    - Validate payload (local JSON Schema)
    - Register quote in guard
    - Map to Sheet columns
    - Write artifacts and (optionally) append to Google Sheet

Usage:
    python -m src.runner --day 2025-10-01
    python -m src.runner --month 2025-10-01
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Local modules
from .allocator import build_month_plan
from .quotes_guard import QuotesGuard
from .prompt_builder import build_system_prompt, build_user_message, load_schema
from .validator import validate_payload
from .sheets_writer import append_rows, heartbeat_write  # your writer helpers

# --- Paths & env ----------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = REPO_ROOT / "config"
SCHEMAS_DIR = REPO_ROOT / "schemas"
DATA_DIR = REPO_ROOT / "data"
OUTPUTS_DIR = DATA_DIR / "outputs"
IMAGES_DIR = DATA_DIR / "images"
LOGS_DIR = DATA_DIR / "logs"

for p in (OUTPUTS_DIR, IMAGES_DIR, LOGS_DIR):
    p.mkdir(parents=True, exist_ok=True)

WRITE_TO_SHEETS = os.getenv("WRITE_TO_SHEETS", "0") == "1"
TIMEZONE = os.getenv("TIMEZONE", "Europe/Lisbon")
USE_OPENAI = os.getenv("USE_OPENAI", "0") == "1"
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5")

# Optional OpenAI import (only if enabled)
if USE_OPENAI:
    from openai import OpenAI  # type: ignore


# --- Utilities ------------------------------------------------------------------
def _log(msg: str) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[runner] {ts} | {msg}"
    print(line)
    with (LOGS_DIR / "run.log").open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def _strip_code_fences(s: str) -> str:
    """Remove ``` or ```json fences if present."""
    s = s.strip()
    if not s.startswith("```"):
        return s
    parts = s.split("```")
    # parts: ["", "json\n{...}\n", "" ] or ["", "{...}\n", ""]
    if len(parts) >= 2:
        body = parts[1]
        if body.lower().startswith("json"):
            # remove the 'json' line
            body = body.split("\n", 1)[1] if "\n" in body else ""
        return body.strip()
    return s


def _call_model(system_prompt: str, user_message: str) -> Dict[str, Any]:
    """
    Call the model. If USE_OPENAI=0, return a minimal stub so the pipeline runs.
    The schema is enforced locally afterwards.
    """
    if not USE_OPENAI:
        _log("USE_OPENAI=0 → returning stub payload")
        return {
            "tradition": "Zen",
            "quote": {"text": "When walking, walk. When eating, eat.", "source": "Zen saying"},
            "meditations": ["3 minutes belly breathing", "Label sounds softly"],
            "journal_prompts": ["Where did I rush today?", "What would slowness change?"],
            "times": {"carousel": "09:00", "poem": "12:00", "image": "18:00"},
        }

    _log(f"Calling OpenAI model={OPENAI_MODEL}")
    client = OpenAI()

    # Responses API: ask for plain JSON
    resp = client.responses.create(
        model=OPENAI_MODEL,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    # Prefer the convenience property; fall back if needed
    try:
        text = (resp.output_text or "").strip()  # type: ignore[attr-defined]
    except Exception:
        # Fallback: best-effort extraction from the generic structure
        text = json.dumps(getattr(resp, "output", {}), ensure_ascii=False)

    text = _strip_code_fences(text)

    # Try parsing as-is; if that fails, salvage first {...}
    try:
        return json.loads(text)
    except Exception:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise RuntimeError("Model did not return valid JSON")


def _map_to_sheet_row(day_iso: str, payload: Dict[str, Any]) -> List[Any]:
    """
    Map the (validated) payload to your Sheet columns (per your screenshot):
    Date | Weekday | Tradition | Was it posted? | Time_Carousel | Time_Poem | Time_Image
    | Timezone | Quote | Meditation 1 | Meditation 2 | Journal Prompt 1 | Journal Prompt 2
    """
    d = datetime.strptime(day_iso, "%Y-%m-%d").date()
    weekday = d.strftime("%A")

    def g(*path, default=""):
        cur: Any = payload
        for k in path:
            if isinstance(k, int):
                if not isinstance(cur, list) or k >= len(cur):
                    return default
                cur = cur[k]
            else:
                if not isinstance(cur, dict):
                    return default
                cur = cur.get(k)
            if cur is None:
                return default
        return cur

    return [
        day_iso,                           # Date
        weekday,                           # Weekday
        g("tradition"),                    # Tradition
        "No",                              # Was it posted?
        g("times", "carousel"),            # Time_Carousel
        g("times", "poem"),                # Time_Poem
        g("times", "image"),               # Time_Image
        TIMEZONE,                          # Timezone
        g("quote", "text"),                # Quote
        g("meditations", 0),               # Meditation 1
        g("meditations", 1),               # Meditation 2
        g("journal_prompts", 0),           # Journal Prompt 1
        g("journal_prompts", 1),           # Journal Prompt 2
    ]


# --- Core runners ---------------------------------------------------------------
def run_for_day(day_iso: str) -> Dict[str, Any]:
    """
    Generate one day. Returns the **validated payload dict**.
    Also writes JSON artifact and updates quotes guard.
    """
    _log(f"Generating day={day_iso}")

    # Load prompt + schema
    system_prompt = build_system_prompt(CONFIG_DIR)  # accepts directory
    schema = load_schema(SCHEMAS_DIR / "BreathOfNowDailyPost.schema.json")

    # Recent quotes guard
    guard = QuotesGuard(DATA_DIR / "used_quotes.json", window_days=90)
    recent = guard.get_recent(n=30)

    # Build user prompt and call the model
    user_msg = build_user_message(day=day_iso, guard_recent=recent)
    raw = _call_model(system_prompt, user_msg)

    # Validate (pass schema **dict**, not path)
    payload = validate_payload(raw, schema)

    # Persist artifact
    out_path = OUTPUTS_DIR / f"day-{day_iso}.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    _log(f"Wrote artifact: {out_path}")

    # Register quote
    q_text = payload.get("quote", {}).get("text")
    q_src = payload.get("quote", {}).get("source", "")
    if q_text:
        guard.register_quote(q_text, q_src)
        guard.save()

    return payload


def run_for_month(anchor_iso: str) -> List[Dict[str, Any]]:
    """
    Generate all days in the plan for a given month anchor (YYYY-MM-DD or YYYY-MM).
    Returns a list of validated payloads (one per day).
    """
    if len(anchor_iso) == 7:  # YYYY-MM
        anchor_iso = f"{anchor_iso}-01"

    plan = build_month_plan(anchor_iso)  # expected to include plan["days"] as ISO strings
    _log(f"Month plan has {len(plan.get('days', []))} days")

    results: List[Dict[str, Any]] = []
    for day_iso in plan.get("days", []):
        try:
            results.append(run_for_day(day_iso))
        except Exception as e:
            _log(f"ERROR generating {day_iso}: {e}")
    return results


# --- Row helpers for Sheets -----------------------------------------------------
def _payloads_to_rows(payload_or_list: Dict[str, Any] | List[Dict[str, Any]], fallback_date_iso: str) -> List[List[Any]]:
    """
    Accepts one payload or a list of payloads and maps each to a sheet row.
    """
    items = payload_or_list if isinstance(payload_or_list, list) else [payload_or_list]
    rows: List[List[Any]] = []
    for p in items:
        # Determine the day to use in the first column (schema doesn’t require a date field)
        day_iso = fallback_date_iso
        # Map
        rows.append(_map_to_sheet_row(day_iso, p))
    return rows


# --- CLI -----------------------------------------------------------------------
def main() -> None:
    ap = argparse.ArgumentParser()
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument("--day", help="Generate a single day: YYYY-MM-DD")
    grp.add_argument("--month", help="Generate an entire month (anchor YYYY-MM or YYYY-MM-DD)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.day:
        # Normalize to YYYY-MM-DD
        day_iso = datetime.strptime(args.day, "%Y-%m-%d").date().isoformat()
        payload = run_for_day(day_iso)

        if WRITE_TO_SHEETS and not args.dry_run:
            try:
                rows = _payloads_to_rows(payload, fallback_date_iso=day_iso)
                if rows:
                    append_rows(rows)
                    _log("Appended 1 row to Google Sheets.")
                else:
                    heartbeat_write(day_iso, "Heartbeat — no payload mapped from run_for_day()")
            except Exception as e:
                _log(f"Sheets append failed: {e}")
                raise
        else:
            _log("WRITE_TO_SHEETS disabled or dry-run; skipping Sheets write.")

    else:
        # Month anchor: accept YYYY-MM or YYYY-MM-DD; normalize to first day
        m = args.month
        if len(m) == 7:  # YYYY-MM
            m = f"{m}-01"
        month_anchor = datetime.strptime(m, "%Y-%m-%d").date().replace(day=1)
        payloads = run_for_month(month_anchor.isoformat())

        if WRITE_TO_SHEETS and not args.dry_run:
            try:
                rows = _payloads_to_rows(payloads, fallback_date_iso=month_anchor.isoformat())
                if rows:
                    append_rows(rows)
                    _log(f"Appended {len(rows)} rows to Google Sheets.")
                else:
                    heartbeat_write(month_anchor.isoformat(), "Heartbeat — no rows mapped from run_for_month()")
            except Exception as e:
                _log(f"Sheets append failed: {e}")
                raise
        else:
            _log("WRITE_TO_SHEETS disabled or dry-run; skipping Sheets write.")


if __name__ == "__main__":
    main()
