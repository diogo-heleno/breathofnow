from __future__ import annotations

import os
import time
import datetime as dt
from typing import List, Dict, Any

import gspread

SHEET_ID = os.getenv("SHEET_ID", "").strip()
WORKSHEET_NAME = (os.getenv("SHEET_TAB", "Posts") or "Posts").strip()
DEFAULT_TZ = os.getenv("TIMEZONE", "Europe/Lisbon")

# Columns we expect in the "Posts" sheet (A..M)
EXPECTED_HEADERS = [
    "Date",
    "Weekday",
    "Tradition",
    "Was it posted?",
    "Time_Carousel",
    "Time_Poem",
    "Time_Image",
    "Timezone",
    "Quote",
    "Meditation 1",
    "Meditation 2",
    "Journal Prompt 1",
    "Journal Prompt 2",
]


# ------------------------ Auth & Worksheet helpers -----------------------------

def _client() -> gspread.Client:
    """
    Build a gspread client.
    Priority:
      1) GOOGLE_APPLICATION_CREDENTIALS (path to file)
      2) GOOGLE_SERVICE_ACCOUNT_JSON_PATH (path to file)
      3) GOOGLE_SERVICE_ACCOUNT_JSON (inline JSON)
    """
    path_envs = [
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip(),
        os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_PATH", "").strip(),
    ]
    for p in path_envs:
        if p and os.path.exists(p):
            print(f"[sheets] Using credentials file: {p}")
            return gspread.service_account(filename=p)

    raw_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if raw_json:
        import json
        data = json.loads(raw_json)
        print("[sheets] Using inlined GOOGLE_SERVICE_ACCOUNT_JSON")
        return gspread.service_account_from_dict(data)

    raise RuntimeError(
        "No Google credentials found. Provide GOOGLE_APPLICATION_CREDENTIALS (file path) "
        "or GOOGLE_SERVICE_ACCOUNT_JSON (inline)."
    )


def _open_worksheet(client: gspread.Client):
    if not SHEET_ID:
        raise RuntimeError("SHEET_ID env var is missing.")
    sh = client.open_by_key(SHEET_ID)
    try:
        ws = sh.worksheet(WORKSHEET_NAME)
        print(f"[sheets] Opened worksheet '{WORKSHEET_NAME}'")
    except gspread.WorksheetNotFound:
        print(f"[sheets] Worksheet '{WORKSHEET_NAME}' not found. Creating it.")
        ws = sh.add_worksheet(title=WORKSHEET_NAME, rows="2000", cols=str(len(EXPECTED_HEADERS)))
        ws.append_row(EXPECTED_HEADERS, value_input_option="RAW")
    return ws


def ensure_headers(ws) -> None:
    """Ensure the first row matches EXPECTED_HEADERS (exact order)."""
    current = ws.row_values(1)
    if current != EXPECTED_HEADERS:
        print("[sheets] Updating header row to expected schema.")
        if current:
            ws.delete_rows(1)
        ws.insert_row(EXPECTED_HEADERS, 1)


# ------------------------ Mapping ------------------------------------------------

def _get_nested(d: Any, *path, default: str = "") -> Any:
    cur = d
    for key in path:
        if isinstance(key, int):
            if not isinstance(cur, list) or key >= len(cur):
                return default
            cur = cur[key]
        else:
            if not isinstance(cur, dict):
                return default
            cur = cur.get(key, None)
        if cur is None:
            return default
    return cur


def map_payload_to_row(payload: Dict[str, Any], timezone: str = DEFAULT_TZ) -> List[Any]:
    """
    Map your payload to the Posts row format.
    Supports BOTH:
      - flat keys (date, time_carousel, meditation_1, ...)
      - nested schema keys (quote.text, times.carousel, meditations[0], ...)
    """
    # Date & weekday (weekday can be computed)
    date_str = payload.get("date") or _get_nested(payload, "date", default="")
    if not date_str:
        date_str = dt.date.today().isoformat()

    try:
        weekday = payload.get("weekday") or dt.datetime.strptime(date_str, "%Y-%m-%d").strftime("%A")
    except Exception:
        weekday = payload.get("weekday") or ""

    # Tradition
    tradition = payload.get("tradition") or _get_nested(payload, "tradition", default="")

    # Was posted
    was_posted = payload.get("was_posted") or "No"

    # Times (flat or nested)
    time_carousel = payload.get("time_carousel") or _get_nested(payload, "times", "carousel", default="")
    time_poem = payload.get("time_poem") or _get_nested(payload, "times", "poem", default="")
    time_image = payload.get("time_image") or _get_nested(payload, "times", "image", default="")

    # Timezone
    tz = payload.get("timezone") or timezone

    # Quote (flat 'quote' or nested 'quote.text')
    quote = payload.get("quote")
    if isinstance(quote, dict):
        quote = quote.get("text", "")
    if not isinstance(quote, str):
        quote = _get_nested(payload, "quote", "text", default=str(quote or ""))

    # Meditations (flat keys or list)
    med1 = payload.get("meditation_1") or _get_nested(payload, "meditations", 0, default="")
    med2 = payload.get("meditation_2") or _get_nested(payload, "meditations", 1, default="")

    # Journal prompts (flat keys or list)
    jp1 = payload.get("journal_prompt_1") or _get_nested(payload, "journal_prompts", 0, default="")
    jp2 = payload.get("journal_prompt_2") or _get_nested(payload, "journal_prompts", 1, default="")

    row = [
        date_str,
        weekday,
        tradition,
        was_posted,
        time_carousel,
        time_poem,
        time_image,
        tz,
        quote,
        med1,
        med2,
        jp1,
        jp2,
    ]
    # Ensure length matches headers
    return row[: len(EXPECTED_HEADERS)] + [""] * max(0, len(EXPECTED_HEADERS) - len(row))


# ------------------------ Append API --------------------------------------------

def _append_with_retry(ws, rows: List[List[Any]], value_input_option: str = "USER_ENTERED", retries: int = 3) -> None:
    delay = 1.0
    for attempt in range(1, retries + 1):
        try:
            ws.append_rows(rows, value_input_option=value_input_option)
            return
        except Exception as e:
            if attempt == retries:
                raise
            print(f"[sheets] append_rows failed (attempt {attempt}/{retries}): {e} — retrying in {delay:.1f}s")
            time.sleep(delay)
            delay *= 2


def append_rows(rows: List[List[Any]]) -> int:
    """
    Append rows to the Posts worksheet.
    Returns the number of rows written.
    """
    if not rows:
        print("[sheets] No rows to write.")
        return 0
    client = _client()
    ws = _open_worksheet(client)
    ensure_headers(ws)
    _append_with_retry(ws, rows, value_input_option="USER_ENTERED")
    print(f"[sheets] Appended {len(rows)} row(s) to '{WORKSHEET_NAME}'.")
    return len(rows)


def heartbeat_write(date_iso: str, note: str) -> None:
    """
    Writes a minimal heartbeat row so we can confirm pipeline→Sheets works
    even if generation failed earlier in the run.
    """
    payload = {
        "date": date_iso,
        "weekday": "",
        "tradition": "",
        "was_posted": "No",
        "time_carousel": "",
        "time_poem": "",
        "time_image": "",
        "timezone": DEFAULT_TZ,
        "quote": note,  # visible in the 'Quote' column
    }
    row = map_payload_to_row(payload)
    append_rows([row])
