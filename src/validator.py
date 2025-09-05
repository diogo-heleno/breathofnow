from __future__ import annotations
from typing import Tuple
import os, json
from pathlib import Path

# jsonschema is optional during smoke tests
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except Exception:
    HAS_JSONSCHEMA = False

REQUIRED = [
    "quote_text","quote_author","med1","med2","jp1","jp2","cta_line",
    "carousel_caption","carousel_hashtags","carousel_first_comment","story_action",
    "poem_text","poem_caption","poem_first_comment","poem_story_action",
    "image_prompt","image_caption","image_first_comment","image_story_action",
]

def _load_schema(schemas_dir: str) -> dict | None:
    p = Path(schemas_dir) / "BreathOfNowDailyPost.schema.json"
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return None

def validate_payload(payload: dict, tradition: str, config_dir: str, schemas_dir: str) -> Tuple[bool, str]:
    # Allow bypassing schema during CI smoke tests
    skip = os.getenv("SKIP_SCHEMA", "") == "1"

    schema = None if skip else _load_schema(schemas_dir)
    if schema and HAS_JSONSCHEMA:
        try:
            jsonschema.Draft202012Validator(schema).validate(payload)
        except jsonschema.ValidationError as e:
            return False, f"schema: {e.message}"

    # Minimal checks so the mapper won't crash
    for k in REQUIRED:
        if k not in payload:
            return False, f"missing field: {k}"
    if not isinstance(payload.get("carousel_hashtags"), list):
        return False, "carousel_hashtags must be a list"
    if not payload["quote_text"] or not payload["quote_author"]:
        return False, "quote_text and quote_author required"

    return True, "ok"
