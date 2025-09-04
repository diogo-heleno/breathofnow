from __future__ import annotations
import os
import json
import gspread
from typing import List, Dict
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def _load_creds(env: dict):
    # Prefer JSON string secret
    raw = env.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if raw and raw.strip().startswith("{"):
        info = json.loads(raw)
        return Credentials.from_service_account_info(info, scopes=SCOPES)

    # Fallback to file path (Actions writes it to gsa.json)
    path = env.get("GOOGLE_APPLICATION_CREDENTIALS") or env.get("GOOGLE_SERVICE_ACCOUNT_JSON_PATH")
    if not path:
        raise RuntimeError("No Google credentials found in env.")
    return Credentials.from_service_account_file(path, scopes=SCOPES)

def write_rows(rows: List[Dict], env: dict):
    creds = _load_creds(env)
    client = gspread.authorize(creds)

    sheet_id = env.get("SHEET_ID")
    sheet_name = env.get("SHEET_NAME", "Posts")
    if sheet_id:
        sh = client.open_by_key(sheet_id)
    else:
        spreadsheet_name = env.get("SPREADSHEET_NAME", "BreathOfNow_Content_Master")
        sh = client.open(spreadsheet_name)
    ws = sh.worksheet(sheet_name)

    # Ensure header
    header = list(rows[0].keys())
    existing = ws.row_values(1)
    if not existing:
        ws.append_row(header, value_input_option="RAW")
    elif existing != header:
        # You can tighten this to enforce exact headers; for now assume same order used.
        pass

    values = [list(r.values()) for r in rows]
    ws.append_rows(values, value_input_option="RAW")
