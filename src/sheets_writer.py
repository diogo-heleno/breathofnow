"""
sheets.py — Google Sheets writer that:
- sets column A (Date)
- SKIPS column B (Weekday formula)
- writes columns C..M with values you pass
"""

from __future__ import annotations
import gspread
from typing import List


class SheetsWriter:
    def __init__(self, sheet_id: str, worksheet: str = "Posts", dry_run: bool = False):
        self.sheet_id = sheet_id
        self.worksheet_name = worksheet
        self.dry = dry_run
        if not dry_run:
            gc = gspread.service_account()  # uses GOOGLE_APPLICATION_CREDENTIALS
            self.ws = gc.open_by_key(sheet_id).worksheet(worksheet)

    def write_row_by_date(self, *, date_iso: str, values_c_to_m: List):
        """
        Writes:
          A: date_iso
          (B: untouched)
          C..M: values_c_to_m
        If a row with A=date_iso exists, update it; else write on first empty row.
        """
        if self.dry:
            print(f"[DRY] A={date_iso}, C..M={values_c_to_m}")
            return

        # Try to find existing row by date (col A)
        col_a = self.ws.col_values(1)
        row_idx = None
        for idx, val in enumerate(col_a, start=1):
            if val == date_iso:
                row_idx = idx
                break

        if row_idx is None:
            # Find first empty row (simple heuristic)
            row_idx = len(col_a) + 1

        # A
        self.ws.update_cell(row_idx, 1, date_iso)

        # C..M (11 columns)
        if len(values_c_to_m) != 11:
            raise ValueError(f"Expected 11 values for C..M, got {len(values_c_to_m)}")

        start = f"C{row_idx}"
        end = f"M{row_idx}"
        self.ws.update(
            f"{start}:{end}",
            [values_c_to_m],
            value_input_option="USER_ENTERED",
        )
