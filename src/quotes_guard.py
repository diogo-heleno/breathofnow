# src/quotes_guard.py
from __future__ import annotations
from pathlib import Path
from datetime import date, timedelta
import json
from typing import Dict, Set, Iterable, List

class QuotesGuard:
    """
    Tracks recently-used quotes to avoid repeats within a configurable window.
    Stores a JSON dict: {"yyyy-mm-dd": ["normalized quote 1", "normalized quote 2", ...], ...}
    """

    def __init__(self, db_path: Path | str, window_days: int = 90):
        self.db_path = Path(db_path)
        self.window_days = int(window_days)
        self._by_day: Dict[str, Set[str]] = {}
        self._load()

    # ---------- public API ----------

    def is_recent(self, quote: str) -> bool:
        """Return True if quote appeared within the window."""
        norm = self._norm(quote)
        cutoff = date.today() - timedelta(days=self.window_days)
        for d, quotes in self._by_day.items():
            if d >= cutoff.isoformat() and norm in quotes:
                return True
        return False

    def get_recent(self, n: int = 30) -> List[str]:
        """
        Return up to n most recent UNIQUE quotes (normalized),
        limited to the current window.
        Most recent first.
        """
        cutoff = date.today() - timedelta(days=self.window_days)
        out: List[str] = []
        seen: Set[str] = set()
        # iterate newest → oldest by date key
        for d in sorted(self._by_day.keys(), reverse=True):
            if d < cutoff.isoformat():
                continue
            for q in self._by_day[d]:
                if q in seen:
                    continue
                seen.add(q)
                out.append(q)
                if len(out) >= n:
                    return out
        return out

    def register(self, quote: str, used_on: date | None = None) -> None:
        """Record a quote for the given day (defaults to today), then persist."""
        used_on = used_on or date.today()
        day_key = used_on.isoformat()
        if day_key not in self._by_day:
            self._by_day[day_key] = set()
        self._by_day[day_key].add(self._norm(quote))
        self._prune()
        self._save()

    def recent_list(self) -> Dict[str, Iterable[str]]:
        """Return a read-friendly copy (lists) of stored data."""
        return {d: sorted(list(qs)) for d, qs in sorted(self._by_day.items())}

    # ---------- internals ----------

    def _norm(self, s: str) -> str:
        return " ".join(s.strip().lower().split())

    def _prune(self) -> None:
        cutoff = date.today() - timedelta(days=self.window_days)
        to_del = [d for d in self._by_day.keys() if d < cutoff.isoformat()]
        for d in to_del:
            del self._by_day[d]

    def _load(self) -> None:
        if not self.db_path.exists():
            self._by_day = {}
            return
        try:
            raw = json.loads(self.db_path.read_text(encoding="utf-8"))
            self._by_day = {d: set(v or []) for d, v in raw.items()}
            self._prune()
        except Exception:
            # Corrupt file? Start fresh but don't crash the run.
            self._by_day = {}

    def _save(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        data = {d: sorted(list(qs)) for d in self._by_day.items()}
        self.db_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
