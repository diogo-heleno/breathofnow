# src/prompt_builder.py
from __future__ import annotations

import os
from pathlib import Path
from datetime import date
from typing import List

def build_system_prompt(config_dir: Path) -> str:
    """
    Load the system prompt from config/prompt_system.txt.
    """
    config_dir = Path(config_dir)
    path = config_dir / "prompt_system.txt"
    if not path.exists():
        raise FileNotFoundError(f"System prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()

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

def load_schema(schemas_dir: Path) -> Path:
    """
    Return the path to the JSON Schema used by validator.validate_payload.
    Keeping it as a Path avoids duplicate JSON loading logic across modules.
    """
    schemas_dir = Path(schemas_dir)
    schema_path = schemas_dir / "BreathOfNowDailyPost.schema.json"
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")
    return schema_path
