"""Repository interfaces.

Services depend on these small interfaces only. The in-memory implementation
below can later be swapped for a SQLAlchemy / PostgreSQL implementation that
exposes the same methods, without changing services or routers.
"""
import copy
from typing import Protocol

from app.core.store import store


class Repository(Protocol):
    def all(self) -> list[dict]: ...
    def get(self, record_id: int) -> dict | None: ...
    def find(self, **criteria) -> list[dict]: ...
    def add(self, record: dict) -> dict: ...
    def update(self, record_id: int, changes: dict) -> dict | None: ...
    def remove(self, record_id: int) -> bool: ...


class InMemoryRepository:
    """List-of-dicts repository backed by the shared DemoStore."""

    def __init__(self, collection: str):
        self.name = collection

    @property
    def _rows(self) -> list[dict]:
        return store.collection(self.name)

    def all(self) -> list[dict]:
        return [copy.deepcopy(r) for r in self._rows]

    def get(self, record_id: int) -> dict | None:
        for r in self._rows:
            if r["id"] == record_id:
                return copy.deepcopy(r)
        return None

    def find(self, **criteria) -> list[dict]:
        return [
            copy.deepcopy(r)
            for r in self._rows
            if all(r.get(k) == v for k, v in criteria.items())
        ]

    def first(self, **criteria) -> dict | None:
        found = self.find(**criteria)
        return found[0] if found else None

    def add(self, record: dict) -> dict:
        with store.lock:
            record = copy.deepcopy(record)
            record["id"] = store.next_id(self.name)
            self._rows.append(record)
            return copy.deepcopy(record)

    def update(self, record_id: int, changes: dict) -> dict | None:
        with store.lock:
            for r in self._rows:
                if r["id"] == record_id:
                    r.update(copy.deepcopy(changes))
                    return copy.deepcopy(r)
        return None

    def remove(self, record_id: int) -> bool:
        with store.lock:
            rows = self._rows
            for i, r in enumerate(rows):
                if r["id"] == record_id:
                    rows.pop(i)
                    return True
        return False


class DocumentRepository:
    """Single JSON-like document (site content, settings)."""

    def __init__(self, name: str):
        self.name = name

    def get(self) -> dict:
        return copy.deepcopy(store.documents.get(self.name, {}))

    def set_section(self, section: str, value) -> dict:
        with store.lock:
            store.documents.setdefault(self.name, {})[section] = copy.deepcopy(value)
            return self.get()

    def replace(self, value: dict) -> dict:
        with store.lock:
            store.documents[self.name] = copy.deepcopy(value)
            return self.get()


# Repository registry – one place to swap implementations later.
bikes_repo = InMemoryRepository("bikes")
categories_repo = InMemoryRepository("categories")
brands_repo = InMemoryRepository("brands")
units_repo = InMemoryRepository("inventory_units")
inventory_history_repo = InMemoryRepository("inventory_history")
bookings_repo = InMemoryRepository("bookings")
customers_repo = InMemoryRepository("customers")
sales_repo = InMemoryRepository("sales")
offers_repo = InMemoryRepository("offers")
gallery_repo = InMemoryRepository("gallery")
banners_repo = InMemoryRepository("banners")
testimonials_repo = InMemoryRepository("testimonials")
faqs_repo = InMemoryRepository("faqs")
staff_repo = InMemoryRepository("staff")
enquiries_repo = InMemoryRepository("enquiries")
activity_repo = InMemoryRepository("activity_logs")
content_repo = DocumentRepository("content")
settings_repo = DocumentRepository("settings")
