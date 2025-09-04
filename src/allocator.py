from __future__ import annotations
from calendar import monthrange
from datetime import date, timedelta
from pathlib import Path
import json
import yaml

def _weekday_name(d: date) -> str:
    return ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][d.weekday()]

def _load_yaml(p: Path, default):
    try:
        if p.exists():
            return yaml.safe_load(p.read_text(encoding="utf-8")) or default
    except Exception:
        pass
    return default

def build_month_plan(year: int, month: int, config_dir: str):
    cfg = Path(config_dir)
    rotation = _load_yaml(cfg / "rotation.yml", {"cycle": ["Zen","Stoic","Tao"]})
    weekly = _load_yaml(cfg / "weekly_themes.yml", {})  # e.g., {"2025-09-01": "Detachment"}
    visual = _load_yaml(cfg / "visual_identity.yml", {})
    timezone = (visual.get("timezone") or "Europe/Lisbon")

    days = monthrange(year, month)[1]
    start = date(year, month, 1)
    plan = []
    cycle = rotation.get("cycle", ["Zen","Stoic","Tao"])

    for i in range(days):
        d = start + timedelta(days=i)
        tradition = cycle[i % len(cycle)]
        plan.append({
            "date": d.isoformat(),
            "weekday": _weekday_name(d),
            "tradition": tradition,
            "week_theme": weekly.get(d.isoformat()) or weekly.get(f"{year}-{month:02d}", "Theme"),
            "time_carousel": "08:00",
            "time_reel": "12:00",
            "time_image": "18:00",
            "timezone": timezone,
        })
    return plan
