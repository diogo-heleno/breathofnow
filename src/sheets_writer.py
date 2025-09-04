"""
sheets_writer.py
Writes rows to Google Sheets (BreathOfNow_Content_Master → Posts).

Public API:
    write_rows(rows: list[dict], env: dict) -> None

`rows` should already be mapped to your Sheet header (Phase 0).
Env reads:
    SPREADSHEET_NAME, SHEET_NAME
Google auth comes from GOOGLE_APPLICATION_CREDENTIALS (.env path).
"""

from __future__ import annotations
import os
import gspread
from typing import List, Dict

def _open_sheet(env: dict):
    gc = gspread.service_account(filename=os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
    sh = gc.open(env.get("SPREADSHEET_NAME", "BreathOfNow_Content_Master"))
    ws = sh.worksheet(env.get("SHEET_NAME", "Posts"))
    return ws

def write_rows(rows: List[Dict], env: dict) -> None:
    if not rows:
        return
    ws = _open_sheet(env)
    # We assume header already exists. Build values in column order by reading header row:
    header = ws.row_values(1)
    values = []
    for r in rows:
        row_values = [r.get(col, "") for col in header]
        values.append(row_values)
    # Append in one batch
    ws.append_rows(values, value_input_option="RAW")
