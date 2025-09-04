from __future__ import annotations
from pathlib import Path
import json, re
from typing import Tuple, List, Dict
import yaml

class QuotesGuard:
    """
    JSON-backed recent-history guard.
    Structure on disk:
    { "items": [ { "date": "...", "author": "...", "quote": "...", "norm": "..." }, ... ] }
    """
    def __init__(self, store_path: str | Path, aliases_path: str | Path | None = None, max_history: int = 400):
        self.path = Path(store_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.aliases_path = Path(aliases_path) if aliases_path else None
        self.max_history = max_history
        self.store: Dict = {"items": []}
        self.aliases = {}

    def load(self) -> "QuotesGuard":
        if self.path.exists():
            try:
                self.store = json.loads(self.path.read_text(encoding="utf-8"))
                if not isinstance(self.store, dict): self.store = {"items": []}
            except Exception:
                self.store = {"items": []}
        if self.aliases_path and self.aliases_path.exists():
            try:
                self.aliases = yaml.safe_load(self.aliases_path.read_text(encoding="utf-8")) or {}
            except Exception:
                self.aliases = {}
        return self

    def save(self) -> None:
        items = self.store.get("items", [])[-self.max_history:]
        self.path.write_text(json.dumps({"items": items}, ensure_ascii=False, indent=2), encoding="utf-8")

    def _canon_author(self, a: str) -> str:
        a = (a or "").strip()
        return self.aliases.get(a, a)

    @staticmethod
    def _norm(author: str, quote: str) -> str:
        t = f"{author}|{quote}".lower()
        t = re.sub(r"\s+", " ", t).strip()
        return t

    def banned_norms(self, recent: int = 60) -> List[str]:
        items = self.store.get("items", [])
        return [it["norm"] for it in items[-recent:] if "norm" in it]

    def check_and_register(self, quote_text: str, author: str, date_str: str) -> Tuple[bool, str]:
        author_c = self._canon_author(author)
        norm = self._norm(author_c, quote_text)
        if any(it.get("norm") == norm for it in self.store.get("items", [])):
            return False, "duplicate quote/author (recent history)"
        self.store.setdefault("items", []).append({
            "date": date_str, "author": author_c, "quote": quote_text, "norm": norm
        })
        return True, "ok"
