"""
prompt_builder.py
Loads the system prompt and builds per-day messages for the model.

Public API:
    build_system_prompt(config_dir: str) -> str
    build_user_message(day_ctx: dict, config_dir: str, banned_norms: list[str], language: str="EN") -> str

`day_ctx` is one entry from allocator.build_month_plan; include:
    date, weekday, season, week_theme, tradition, timezone
"""

from __future__ import annotations
from pathlib import Path
import yaml
from typing import List, Dict

def build_system_prompt(config_dir: str) -> str:
    path = Path(config_dir) / "prompt_system.txt"
    return path.read_text(encoding="utf-8")

def _pick_hashtag_set(tradition: str, config_dir: str) -> list[str]:
    cfg = yaml.safe_load((Path(config_dir) / "hashtag_sets.yml").read_text(encoding="utf-8")) or {}
    sets = cfg.get(tradition, [])
    return sets[0] if sets else []

def _visual_keywords(tradition: str, config_dir: str) -> list[str]:
    cfg = yaml.safe_load((Path(config_dir) / "visual_identity.yml").read_text(encoding="utf-8")) or {}
    spec = cfg.get(tradition, {}) or {}
    return spec.get("keywords", [])

def build_user_message(day_ctx: Dict, config_dir: str, banned_norms: List[str], language: str = "EN") -> str:
    tags = _pick_hashtag_set(day_ctx["tradition"], config_dir)
    keywords = _visual_keywords(day_ctx["tradition"], config_dir)

    # Compose a simple YAML-like block for the user message (string for the model)
    lines = [
        f"date: {day_ctx['date']}",
        f"weekday: {day_ctx['weekday']}",
        f"timezone: {day_ctx['timezone']}",
        f"season: {day_ctx['season']}",
        f"week_theme: {day_ctx['week_theme']}",
        f"tradition: {day_ctx['tradition']}",
        f"visual_keywords_for_tradition: {', '.join(keywords)}",
        f"hashtag_sets_for_tradition: {', '.join(tags)}",
        "banned_quotes_norms: " + ("; ".join(banned_norms) if banned_norms else ""),
        f"language: {language}",
        "Return ONLY JSON for this day per the schema."
    ]
    return "\n".join(lines)
