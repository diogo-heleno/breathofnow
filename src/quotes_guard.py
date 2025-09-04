"""
quotes_guard.py
Normalization + de-duplication for quotes against a rolling window.

Public API:
    class QuotesGuard:
        load(store_path: str, window_days: int = 400)
        check_and_register(quote_text: str, quote_author: str, quote_date: str) -> tuple[bool, dict]
        save()

Returns (accepted: bool, info: dict). If accepted, the quote is registered.

Fuzzy metrics implemented (placeholders to be filled later):
- token Jaccard
- char trigrams overlap
"""

from __future__ import annotations
import json, re, hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List

STOPWORDS = set(["the", "and", "is", "a", "of", "to", "in", "for", "with", "on", "that", "it", "as", "at"])

def _normalize_text(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[“”\"'–—-]", " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def _tokens(s: str) -> List[str]:
    return [t for t in _normalize_text(s).split() if t not in STOPWORDS]

def _trigrams(s: str) -> set[str]:
    n = 3
    s = _normalize_text(s)
    return set(s[i:i+n] for i in range(max(0, len(s)-n+1)))

def _sha1(s: str) -> str:
    return "sha1:" + hashlib.sha1(s.encode("utf-8")).hexdigest()

def _canonical_author(author: str, aliases: Dict[str, list]) -> str:
    a = _normalize_text(author)
    for key, vals in aliases.items():
        if a in [ _normalize_text(v) for v in vals ]:
            return key
    # if not found, slugify
    return a.replace(" ", "_")

def jaccard(a: set, b: set) -> float:
    if not a and not b: return 1.0
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

class QuotesGuard:
    def __init__(self, store_path: str, aliases_path: str, window_days: int = 400):
        self.path = Path(store_path)
        self.aliases_path = Path(aliases_path)
        self.window_days = window_days
        self.store: Dict[str, Any] = {"meta": {"window_days": window_days}, "items": []}
        self.aliases: Dict[str, list] = {}

    def load(self):
        if self.path.exists():
            self.store = json.loads(self.path.read_text(encoding="utf-8"))
        if self.aliases_path.exists():
            import yaml
            self.aliases = yaml.safe_load(self.aliases_path.read_text(encoding="utf-8")) or {}
        return self

    def _prune(self):
        items = self.store.get("items", [])
        cutoff = datetime.utcnow() - timedelta(days=self.window_days)
        def parse_date(s: str) -> datetime:
            return datetime.fromisoformat(s) if "T" in s else datetime.fromisoformat(s + "T00:00:00")
        self.store["items"] = [it for it in items if parse_date(it["date"]) >= cutoff]

    def check_and_register(self, quote_text: str, quote_author: str, quote_date: str) -> tuple[bool, Dict]:
        """Return (accepted, info). If accepted, registers the quote in memory (call save() to persist)."""
        norm_text = _normalize_text(quote_text)
        canonical_author = _canonical_author(quote_author, self.aliases)
        norm = f"{norm_text} | {canonical_author.replace('_',' ')}"
        h = _sha1(norm)

        # prune window first
        self._prune()

        # Build comparison sets
        cand_tokens = set(_tokens(quote_text))
        cand_tris = _trigrams(quote_text)

        # Thresholds
        SAME_AUTHOR_JACCARD = 0.90
        ANY_AUTHOR_JACCARD = 0.80
        ANY_AUTHOR_TRIGRAM = 0.85

        for it in self.store.get("items", []):
            if it.get("hash") == h:
                return (False, {"reason": "exact_duplicate"})
            # token/trigram tests
            prev_tokens = set(it.get("tokens", []))
            prev_tris = set(it.get("trigrams", []))
            same_author = it.get("author_id", "") == canonical_author

            jac = jaccard(cand_tokens, prev_tokens)
            tri = jaccard(cand_tris, prev_tris)

            if same_author and jac >= SAME_AUTHOR_JACCARD:
                return (False, {"reason": "near_duplicate_same_author", "jaccard": jac})
            if jac >= ANY_AUTHOR_JACCARD or tri >= ANY_AUTHOR_TRIGRAM:
                return (False, {"reason": "near_duplicate_any_author", "jaccard": jac, "trigrams": tri})

        # Accept and stage
        record = {
            "date": quote_date,
            "quote_text": quote_text,
            "quote_author": quote_author,
            "norm": norm,
            "hash": h,
            "tokens": list(cand_tokens),
            "trigrams": list(cand_tris),
            "author_id": canonical_author,
            "lang": "en"
        }
        self.store.setdefault("items", []).append(record)
        self.store["meta"]["last_updated"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
        return (True, {"hash": h})

    def save(self):
        self.path.write_text(json.dumps(self.store, ensure_ascii=False, indent=2), encoding="utf-8")
