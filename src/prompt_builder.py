"""
prompt_builder.py — loads system prompt and crafts user message
"""

from __future__ import annotations
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
SCHEMAS_DIR = ROOT / "schemas"


def build_system_prompt(*, language: str, timezone: str) -> str:
    # If you have a config file, load it; else return a sensible default.
    system_path = CONFIG_DIR / "prompt_system.txt"
    if system_path.exists():
        return system_path.read_text(encoding="utf-8")
    return (
        f"You are BreathOfNow content producer. Language={language}. "
        f"Timezone={timezone}. Return a JSON object with fields documented in the schema. "
        f"Do NOT include 'weekday' — Sheet computes it."
    )


def build_user_message(day_ctx: Dict) -> str:
    """
    Build the concise user message for the model.
    Include date & tradition and any guardrails.
    """
    date = day_ctx.get("date", "")
    tradition = day_ctx.get("tradition", "Zen")
    return (
        "Produce the daily content JSON with the following fields only:\n"
        "date, tradition, time_carousel, time_poem, time_image, quote, "
        "meditation_1, meditation_2, journal_prompt_1, journal_prompt_2.\n"
        f"Date: {date}\nTradition: {tradition}\n"
        "Keep it concise, contemplative, Instagram-ready. No markdown."
    )
