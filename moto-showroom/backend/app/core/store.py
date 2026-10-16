"""In-memory demo data store.

All data lives in process memory and is rebuilt from the seed on start-up
or when `reset()` is called. Nothing here survives a backend restart.
Replace the repositories (app/repositories) with database-backed ones to
persist data; services do not touch this module directly.
"""
import threading

from app.mock_data.seed import build_seed


class DemoStore:
    def __init__(self):
        self.lock = threading.RLock()
        self.collections: dict[str, list[dict]] = {}
        self.documents: dict[str, dict] = {}
        self._counters: dict[str, int] = {}
        self.reset()

    def reset(self) -> None:
        with self.lock:
            seed = build_seed()
            self.collections = seed["collections"]
            self.documents = seed["documents"]
            self._counters = {
                name: max((r["id"] for r in rows), default=0)
                for name, rows in self.collections.items()
            }

    def collection(self, name: str) -> list[dict]:
        if name not in self.collections:
            self.collections[name] = []
            self._counters[name] = 0
        return self.collections[name]

    def next_id(self, name: str) -> int:
        with self.lock:
            self._counters[name] = self._counters.get(name, 0) + 1
            return self._counters[name]


store = DemoStore()
