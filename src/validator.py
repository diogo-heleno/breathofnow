"""
validator.py
Validates the model's JSON against:
- JSON Schema (`schemas/BreathOfNowDailyPost.schema.json`)
- Additional business rules (word/char limits, hashtags, visual keywords, etc.)

Public API:
    validate_payload(payload: dict, tradition: str, config_dir: str) -> tuple[bool, list[str]]
Returns (is_valid, list_of_errors)
"""

from __future__ import annotations
import json, re
from pathlib import Path
from typing import List, Tuple
import yaml
from jsonschema import validate as js_validate, Draft202012Validator

def _load_schema(schemas_dir: str) -> dict:
    path = Path(schemas_dir) / "BreathOfNowDailyPost.schema.json"
    return json.loads(path.read_text(encoding="utf-8"))

def _word_count(s: str) -> int:
    return len(re.findall(r"\b\w+\b", s or ""))

def _has_visual_keyword(image_prompt: str, keywords: List[str]) -> bool:
    s = (image_prompt or "").lower()
    return any(k.lower() in s for k in keywords)

def validate_payload(payload: dict, tradition: str, config_dir: str, schemas_dir: str) -> Tuple[bool, List[str]]:
    errors: List[str] = []

    # 1) JSON Schema
    schema = _load_schema(schemas_dir)
    validator = Draft202012Validator(schema)
    schema_errors = [f"schema: {e.message}" for e in validator.iter_errors(payload)]
    errors.extend(schema_errors)

    if schema_errors:
        return (False, errors)

    # 2) Business rules
    # 2a) Quote word cap
    if _word_count(payload.get("quote_text", "")) > 24:
        errors.append("quote_text exceeds 24 words")

    # 2b) Journal prompts verb + first-person singular (simple heuristic)
    for key in ("jp1", "jp2"):
        jp = payload.get(key, "").strip()
        if not jp:
            errors.append(f"{key} empty")
            continue
        if not re.match(r"^(I\s+[a-z])", jp):
            errors.append(f"{key} must start with 'I ' + verb (first-person)")
        if len(jp) > 120:
            errors.append(f"{key} exceeds 120 chars")

    # 2c) Hashtags: 10–15, unique, include #BreathOfNow
    tags = payload.get("carousel_hashtags", [])
    if not (10 <= len(tags) <= 15):
        errors.append("carousel_hashtags must have 10–15 items")
    if len(set(tags)) != len(tags):
        errors.append("carousel_hashtags contains duplicates")
    if "#BreathOfNow" not in tags:
        errors.append("carousel_hashtags must include #BreathOfNow")

    # 2d) Visual identity keywords present in image_prompt
    vis_cfg = yaml.safe_load((Path(config_dir) / "visual_identity.yml").read_text(encoding="utf-8")) or {}
    keywords = (vis_cfg.get(tradition, {}) or {}).get("keywords", [])
    if not _has_visual_keyword(payload.get("image_prompt", ""), keywords):
        errors.append(f"image_prompt missing a {tradition} visual keyword")

    # 2e) Meditations length and non-dup
    for mk in ("med1", "med2"):
        if len(payload.get(mk, "")) > 500:
            errors.append(f"{mk} exceeds 500 chars")

    # (Optional) med1 vs med2 similarity check can be added later

    # 2f) Poem stanzas separated by blank line (simple heuristic)
    poem = payload.get("poem_text", "")
    if poem and "\n\n" not in poem:
        errors.append("poem_text should have blank line between stanzas (2–3 stanzas)")

    # 2g) Captions length
    for ck in ("carousel_caption", "poem_caption", "image_caption"):
        if len(payload.get(ck, "")) > 600:
            errors.append(f"{ck} exceeds 600 chars")

    return (len(errors) == 0, errors)
