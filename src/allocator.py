"""
allocator.py
Builds the calendar map for a target month:
- season detection
- ISO-week theme cycle
- per-day tradition assignment (fixed pattern or seeded shuffle)
- posting times from config

Public API:
    build_month_plan(year: int, month: int, config_dir: str) -> list[dict]
Returns a list of day dicts:
    {
      "date": "YYYY-MM-DD",
      "weekday": "Monday",
      "season": "Autumn",
      "week_theme": "Detachment",
      "tradition": "Zen",
      "timezone": "Europe/Lisbon",
      "time_carousel": "09:00",
      "time_reel": "12:00",
      "time_image": "18:00"
    }
"""

from __future__ import annotations
from datetime import date, timedelta
import calendar
import yaml
from pathlib import Path
from typing import List, Dict

def _load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def _season_for_month(month: int, seasons_cfg: dict) -> str:
    for season_name, spec in seasons_cfg.items():
        months = spec.get("months", [])
        if month in months:
            return season_name
    raise ValueError(f"No season configured for month={month}")

def _iso_week_index(first_month_day: date, current_day: date) -> int:
    """Index into the 4-week theme cycle starting from the first ISO week that touches the month."""
    # anchor at the Monday of the first ISO week that includes day 1 of month
    delta_to_monday = (first_month_day.weekday() - 0) % 7
    anchor = first_month_day - timedelta(days=delta_to_monday)
    weeks_since = (current_day - anchor).days // 7
    return weeks_since % 4

def build_month_plan(year: int, month: int, config_dir: str) -> List[Dict]:
    cfg_rotation = _load_yaml(Path(config_dir) / "rotation.yml")
    cfg_weekly = _load_yaml(Path(config_dir) / "weekly_themes.yml")

    timezone = cfg_rotation.get("timezone", "Europe/Lisbon")
    seasons_cfg = cfg_rotation.get("seasons", {})
    posting_times = cfg_rotation.get("posting_times", {})
    week_start = cfg_rotation.get("week_start", "Monday")
    determinism = cfg_rotation.get("determinism", {"mode": "fixed_pattern"})

    season_name = _season_for_month(month, seasons_cfg)
    season_spec = seasons_cfg[season_name]
    weekly_pattern = season_spec.get("weekly_pattern", [])  # list of 7 strings (Mon..Sun)
    if len(weekly_pattern) != 7:
        raise ValueError(f"weekly_pattern must have 7 entries for season {season_name}")

    # Month boundaries
    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])

    results: List[Dict] = []
    for d in (first_day + timedelta(days=i) for i in range((last_day - first_day).days + 1)):
        weekday_idx = d.weekday()  # Monday=0..Sunday=6
        weekday_name = calendar.day_name[weekday_idx]
        tradition = weekly_pattern[weekday_idx]

        # Thematic 4-week cycle
        idx = _iso_week_index(first_day, d)
        cycle = cfg_weekly.get("cycle", [])
        week_theme = cycle[idx]["name"] if cycle and 0 <= idx < len(cycle) else ""

        results.append({
            "date": d.isoformat(),
            "weekday": weekday_name,
            "season": season_name,
            "week_theme": week_theme,
            "tradition": tradition,
            "timezone": timezone,
            "time_carousel": posting_times.get("carousel", "09:00"),
            "time_reel": posting_times.get("reel", "12:00"),
            "time_image": posting_times.get("image", "18:00"),
        })

    return results
