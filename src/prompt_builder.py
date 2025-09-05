# src/prompt_builder.py
from __future__ import annotations

import os
import json
from pathlib import Path
from datetime import date
from typing import List


def build_system_prompt(path: Path | str) -> str:
    """
    Load the system prompt text. If a directory is given, look for prompt_system.txt inside.
    """
    p = Path(path)
    if p.is_dir():
        p = p / "prompt_system.txt"
    if not p.exists():
        raise FileNotFoundError(f"System prompt file not found: {p}")
    return p.read_text(encoding="utf-8")


def build_user_message(day: str | date, guard_recent: List[str]) -> str:
    """
    Build a concise user message for the model. Includes:
    - Target language (from env LANGUAGE, default EN)
    - Date (string or date object)
    - Reminder to avoid recent quotes
    """
    language = os.getenv("LANGUAGE", "EN")
    day_str = day.isoformat() if isinstance(day, date) else str(day)

    lines = [
        f"Language: {language}",
        f"Date: {day_str}",
        "Task: Generate a valid BreathOfNowDailyPost JSON payload conforming to the schema.",
        "Constraint: Avoid repeating any of these recent quotes (normalized):",
    ]
    if guard_recent:
        lines += [f"- {q}" for q in guard_recent]
    else:
        lines.append("- (none)")
    return "\n".join(lines)


def load_schema(schema_path: Path | str) -> dict:
    """
    Load and parse the JSON schema file into a Python dict.
    """
    p = Path(schema_path)
    if p.is_dir():
        raise FileNotFoundError(f"Expected a schema *file*, got a directory: {p}")
    if not p.exists():
        raise FileNotFoundError(f"Schema file not found: {p}")
    return json.loads(p.read_text(encoding="utf-8"))
