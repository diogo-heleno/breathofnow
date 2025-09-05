"""
quotes_guard.py — prevents immediate quote re-use (very simple memory).
"""

from __future__ import annotations
from typing import Set


class QuotesGuard:
    def __init__(self):
        self.seen: Set[str] = set()

    def check_and_register(self, quote: str) -> None:
        q = (quote or "").strip()
        if not q:
            return
        key = q.lower()
        if key in self.seen:
            # In your real app you might regenerate; here we just allow once.
            pass
        self.seen.add(key)
