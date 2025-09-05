"""
validator.py — JSON Schema validation for BreathOfNow payloads.
Falls back to minimal required-keys check if schema is not provided.
"""

from __future__ import annotations

from typing import Dict, Any, Optional, List

from jsonschema import Draft202012Validator


# Minimal required fields (used only if schema is None)
REQUIRED: List[str] = [
    "date",
    "tradition",
    "time_carousel",
    "time_poem",
    "time_image",
    "quote",
    "meditation_1",
    "meditation_2",
    "journal_prompt_1",
    "journal_prompt_2",
]


def validate_payload(payload: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Validate a payload against the given JSON schema.
    If no schema is provided, do a minimal required-fields check.
    Returns the payload unchanged if valid, raises ValueError otherwise.
    """
    if schema:
        v = Draft202012Validator(schema)
        errors = sorted(v.iter_errors(payload), key=lambda e: e.path)
        if errors:
            msgs = []
            for e in errors:
                loc = "/".join(str(p) for p in e.path)
                msgs.append(f"{loc or '$'}: {e.message}")
            raise ValueError("Validation failed:\n- " + "\n- ".join(msgs))
        return payload

    # Fallback: simple required-fields check
    missing = [k for k in REQUIRED if k not in payload or payload[k] in (None, "")]
    if missing:
        raise ValueError(f"Payload missing required fields: {missing}")
    return payload
