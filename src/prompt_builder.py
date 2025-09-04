from __future__ import annotations
from pathlib import Path

def build_system_prompt(config_dir: str) -> str:
    p = Path(config_dir) / "prompt_system.txt"
    if p.exists():
        return p.read_text(encoding="utf-8")
    # Fallback minimal system rules
    return (
        "You are BreathOfNow content generator. "
        "Return ONLY valid JSON following the schema keys used by the project. "
        "Avoid repeated quotes, attribute authors correctly, and keep language clear."
    )

def build_user_message(day_ctx: dict, config_dir: str, banned_norms: list[str], *, language: str = "EN") -> str:
    # A concise message the model can use; add banned norms to steer novelty
    banned_str = ", ".join(banned_norms[:50]) if banned_norms else "none"
    return (
        f"DATE: {day_ctx['date']}\n"
        f"TRADITION: {day_ctx['tradition']}\n"
        f"WEEK THEME: {day_ctx.get('week_theme','')}\n"
        f"TIMEZONE: {day_ctx.get('timezone','')}\n"
        f"LANGUAGE: {language}\n"
        f"DO NOT REPEAT (normalized): {banned_str}\n\n"
        "Produce a single JSON object with fields:\n"
        "quote_text, quote_author,\n"
        "med1, med2, jp1, jp2, cta_line,\n"
        "carousel_caption, carousel_hashtags (array), carousel_first_comment, story_action,\n"
        "poem_text, poem_caption, poem_first_comment, poem_story_action,\n"
        "image_prompt, image_caption, image_first_comment, image_story_action.\n"
        "No markdown, no extra text."
    )
