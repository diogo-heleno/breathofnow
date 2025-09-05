from __future__ import annotations
import os
import datetime as dt
from typing import List, Dict, Any, Optional

import gspread


SHEET_ID = os.getenv("SHEET_ID", "").strip()
WORKSHEET_NAME = os.getenv("SHEET_TAB", "Posts").strip() or "Posts"

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


def _client() -> gspread.Client:
    """
    Build a gspread client.
    Uses GOOGLE_APPLICATION_CREDENTIALS if present (filename to JSON).
    Falls back to GOOGLE_SERVICE_ACCOUNT_JSON contents if needed.
    """
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if creds_path and os.path.exists(creds_path):
        print(f"[sheets] Using credentials file: {creds_path}")
        return gspread.service_account(filename=creds_path)

    raw_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if raw_json:
        import json
        data = json.loads(raw_json)
        print("[sheets] Using inlined GOOGLE_SERVICE_ACCOUNT_JSON")
        return gspread.service_account_from_dict(data)

    raise RuntimeError(
        "No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON."
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
    """Ensure the first row matches EXPECTED_HEADERS."""
    current = ws.row_values(1)
    if current != EXPECTED_HEADERS:
        print("[sheets] Updating header row to expected schema.")
        if current:
            ws.delete_rows(1)
        ws.insert_row(EXPECTED_HEADERS, 1)


def map_payload_to_row(payload: Dict[str, Any], timezone: str = "Europe/Lisbon") -> List[Any]:
    """
    Map your model payload to the Posts row format.
    This is conservative: it fills what we are sure about, leaves the rest blank.
    """
    # Defensive gets — your runner can pass a richer payload later.
    date_str = payload.get("date") or dt.date.today().isoformat()
    weekday = payload.get("weekday") or ""
    tradition = payload.get("tradition") or ""
    was_posted = payload.get("was_posted") or "No"
    time_carousel = payload.get("time_carousel") or ""
    time_poem = payload.get("time_poem") or ""
    time_image = payload.get("time_image") or ""
    tz = payload.get("timezone") or timezone
    quote = payload.get("quote") or ""

    med1 = payload.get("meditation_1") or ""
    med2 = payload.get("meditation_2") or ""
    jp1 = payload.get("journal_prompt_1") or ""
    jp2 = payload.get("journal_prompt_2") or ""

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
    ws.append_rows(rows, value_input_option="USER_ENTERED")
    print(f"[sheets] Appended {len(rows)} row(s) to '{WORKSHEET_NAME}'.")
    return len(rows)


def heartbeat_write(date_iso: str, note: str) -> None:
    """
    Writes a minimal heartbeat row so we can confirm pipeline-to-sheets works
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
        "timezone": os.getenv("TIMEZONE", "Europe/Lisbon"),
        "quote": note,  # visible in the 'Quote' column
    }
    row = map_payload_to_row(payload)
    append_rows([row])
