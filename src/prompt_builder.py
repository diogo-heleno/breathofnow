"""
prompt_builder.py
-----------------
Loads the system prompt and schema, and builds per-day user messages for the model.

Public API:
    build_system_prompt(config_dir: str) -> str
    load_json_schema(schemas_dir: str) -> dict
    build_user_message(day_ctx: dict, config_dir: str, banned_norms: list[str], language: str="EN") -> str
    build_openai_request(system_prompt: str, user_message: str, schema: dict)
        -> (messages: list[dict], response_format: dict)

`day_ctx` is one entry from allocator.build_month_plan and includes:
    date, weekday, season, week_theme, tradition, timezone, time_* fields
"""

from __future__ import annotations
from pathlib import Path
from typing import List, Dict
import json
import yaml


# -------------------------------
# Loaders
# -------------------------------

def build_system_prompt(config_dir: str) -> str:
    """
    Read the finalized system prompt from config/prompt_system.txt
    """
    path = Path(config_dir) / "prompt_system.txt"
    return path.read_text(encoding="utf-8")


def load_json_schema(schemas_dir: str) -> dict:
    """
    Load the strict JSON schema used for Structured Outputs.
    """
    path = Path(schemas_dir) / "BreathOfNowDailyPost.schema.json"
    return json.loads(path.read_text(encoding="utf-8"))


# -------------------------------
# Helpers for tradition resources
# -------------------------------

def _pick_hashtag_set(tradition: str, config_dir: str) -> list[str]:
    """
    Returns one hashtag set (list[str]) for the given tradition.
    If multiple sets exist, returns the first; you can randomize/rotate later.
    """
    cfg_path = Path(config_dir) / "hashtag_sets.yml"
    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    sets = cfg.get(tradition, [])
    return sets[0] if sets else []


def _visual_keywords(tradition: str, config_dir: str) -> list[str]:
    """
    Returns the list of visual identity keywords for the given tradition.
    """
    cfg_path = Path(config_dir) / "visual_identity.yml"
    cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    spec = cfg.get(tradition, {}) or {}
    return spec.get("keywords", [])


# -------------------------------
# User message builder
# -------------------------------

def build_user_message(
    day_ctx: Dict,
    config_dir: str,
    banned_norms: List[str],
    language: str = "EN"
) -> str:
    """
    Compose the per-day context message for the model.
    Returns a plain string (no JSON/markdown) that the model will read
    alongside the system prompt and schema.
    """
    tags = _pick_hashtag_set(day_ctx["tradition"], config_dir)
    keywords = _visual_keywords(day_ctx["tradition"], config_dir)

    # Keep this human-readable; the model just needs clean, unambiguous inputs.
    lines = [
        f"date: {day_ctx['date']}",
        f"weekday: {day_ctx['weekday']}",
        f"timezone: {day_ctx['timezone']}",
        f"season: {day_ctx.get('season','')}",
        f"week_theme: {day_ctx.get('week_theme','')}",
        f"tradition: {day_ctx['tradition']}",
        f"visual_keywords_for_tradition: {', '.join(keywords)}",
        f"hashtag_sets_for_tradition: {', '.join(tags)}",
        "banned_quotes_norms: " + ("; ".join(banned_norms) if banned_norms else ""),
        f"language: {language}",
        "Return ONLY JSON for this day per the schema."
    ]
    return "\n".join(lines)


# -------------------------------
# OpenAI request packager
# -------------------------------

def build_openai_request(system_prompt: str, user_message: str, schema: dict):
    """
    Prepare the messages and response_format payload expected by the OpenAI
    Chat Completions API for Structured Outputs.

    Usage (in runner.py):
        messages, response_format = build_openai_request(sys_prompt, user_msg, json_schema)
        resp = client.chat.completions.create(
            model="gpt-4o-mini-2024-08-06",
            messages=messages,
            response_format=response_format,
            temperature=0.7
        )
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    # Important: wrap your schema as required by the API
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "BreathOfNowDailyPost",
            "schema": schema,
            "strict": True
        }
    }

    return messages, response_format
