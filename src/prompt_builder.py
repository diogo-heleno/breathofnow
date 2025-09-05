# src/prompt_builder.py
from __future__ import annotations

import os
from pathlib import Path
from datetime import date
from typing import List

def build_system_prompt(path: Path | str) -> str:
    p = Path(path)
    if p.is_dir():
        p = p / "prompt_system.txt"
    if not p.exists():
        raise FileNotFoundError(f"System prompt file not found: {p}")
    return p.read_text(encoding="utf-8")

def build_user_message(day: date, guard_recent: List[str]) -> str:
    """
    Build a concise user message for the model. Includes:
    - Target language (from env LANGUAGE, default EN)
    - Date
    - Reminder to avoid recent quotes
    """
    language = os.getenv("LANGUAGE") or "EN"
    lines = [
        f"Language: {language}",
        f"Date: {day.isoformat()}",
        "Task: Generate a valid BreathOfNowDailyPost JSON payload conforming to the schema.",
        "Constraint: Avoid repeating any of these recent quotes (normalized):",
    ]
    if guard_recent:
        lines += [f"- {q}" for q in guard_recent]
    else:
        lines.append("- (none)")
    return "\n".join(lines)



def load_schema(schema_path: Path | str) -> Path:
    p = Path(schema_path)
    if p.is_dir():
        # Do NOT silently guess here; force callers to pass the full file path.
        raise FileNotFoundError(f"Expected a schema *file*, got a directory: {p}")
    if not p.exists():
        raise FileNotFoundError(f"Schema file not found: {p}")
    return p



