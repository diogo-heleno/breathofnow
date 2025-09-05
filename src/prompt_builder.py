from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Any
import json

REPO_ROOT = Path(__file__).resolve().parents[1]

def build_system_prompt(system_path: Path) -> str:
    if not system_path.exists():
        # Sensible default if file missing
        return (
            "You are BreathOfNow content generator. "
            "Return ONLY valid JSON matching the provided schema. "
            "Prefer accurate quote attributions over 'Zen proverb'."
        )
    return system_path.read_text(encoding="utf-8")

def build_user_message(day: str, guard_recent: List[Dict[str, str]] | None = None) -> str:
    """
    Compose the user message with the target day and the recent quotes to avoid duplicates.
    """
    guard_recent = guard_recent or []
    recent_snippets = [
        {"quote_text": q.get("quote_text", ""), "quote_source": q.get("quote_source", "")}
        for q in guard_recent
    ]
    return json.dumps(
        {
            "instruction": "Generate the BreathOfNow payload for the given date.",
            "target_date": day,
            "avoid_duplicates_recent": recent_snippets,
            "language": (os.getenv("LANGUAGE") or "EN"),
            "timezone": (os.getenv("TIMEZONE") or "Europe/Lisbon"),
        },
        ensure_ascii=False,
    )

def load_schema(schema_path: Path) -> Dict[str, Any]:
    """
    Load and normalize the JSON Schema (strip forbidden keys for response_format if needed).
    """
    data = json.loads(schema_path.read_text(encoding="utf-8"))
    # GitHub logs showed: uniqueItems is not permitted in response_format schemas.
    # Strip common offenders so the same schema can be reused everywhere.
    def scrub(obj: Any) -> Any:
        if isinstance(obj, dict):
            obj.pop("uniqueItems", None)
            obj.pop("$schema", None)
            obj.pop("$id", None)
            for k, v in list(obj.items()):
                obj[k] = scrub(v)
        elif isinstance(obj, list):
            return [scrub(x) for x in obj]
        return obj

    return scrub(data)
