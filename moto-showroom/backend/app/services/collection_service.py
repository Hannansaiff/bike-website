"""Generic CRUD service used by simple modules (categories, brands, gallery,
banners, testimonials, FAQs, staff, enquiries).

Domain modules with richer rules (bikes, inventory, bookings, sales) have
their own services but follow the same conventions.
"""
from __future__ import annotations

from typing import Callable

from app.core.errors import ConflictError, NotFoundError
from app.core.utils import now_iso, paginate, slugify, sort_records, text_match
from app.services import activity_service


class CollectionService:
    def __init__(
        self,
        repo,
        entity: str,
        label_field: str = "name",
        searchable: tuple = ("name",),
        default_sort: str = "order",
        ordered: bool = False,
        slug_field: str | None = None,
        unique_fields: tuple = (),
        before_delete: Callable[[dict], None] | None = None,
        timestamps: bool = True,
    ):
        self.repo = repo
        self.entity = entity
        self.label_field = label_field
        self.searchable = searchable
        self.default_sort = default_sort
        self.ordered = ordered
        self.slug_field = slug_field
        self.unique_fields = unique_fields
        self.before_delete = before_delete
        self.timestamps = timestamps

    # -- queries ---------------------------------------------------------------
    def list(self, q=None, filters: dict | None = None, sort=None, page=1, page_size=50, paged=True):
        rows = [r for r in self.repo.all() if text_match(r, q, self.searchable)]
        for key, value in (filters or {}).items():
            if value is None or value == "":
                continue
            rows = [r for r in rows if r.get(key) == value]
        rows = sort_records(rows, sort, self.default_sort)
        if not paged:
            return rows, {"total": len(rows)}
        return paginate(rows, page, page_size)

    def get(self, record_id: int) -> dict:
        rec = self.repo.get(record_id)
        if not rec:
            raise NotFoundError(f"{self.entity.capitalize()} #{record_id} was not found")
        return rec

    # -- mutations -------------------------------------------------------------
    def _check_unique(self, data: dict, exclude_id: int | None = None):
        for field in self.unique_fields:
            value = data.get(field)
            if value is None:
                continue
            for r in self.repo.all():
                if r["id"] != exclude_id and str(r.get(field, "")).lower() == str(value).lower():
                    raise ConflictError(f"A {self.entity} with this {field} already exists", code="duplicate")

    def create(self, data: dict, actor=None) -> dict:
        data = dict(data)
        if self.slug_field and not data.get("slug"):
            data["slug"] = slugify(data.get(self.slug_field, ""))
        if self.ordered and not data.get("order"):
            data["order"] = max((r.get("order", 0) for r in self.repo.all()), default=0) + 1
        self._check_unique(data)
        if self.timestamps:
            data.setdefault("created_at", now_iso())
        rec = self.repo.add(data)
        activity_service.log("create", self.entity, rec["id"],
                             f"Created {self.entity} '{rec.get(self.label_field, rec['id'])}'", actor)
        return rec

    def update(self, record_id: int, changes: dict, actor=None) -> dict:
        current = self.get(record_id)
        changes = {k: v for k, v in changes.items() if k != "id"}
        if self.slug_field and changes.get(self.slug_field) and "slug" not in changes:
            changes["slug"] = slugify(changes[self.slug_field])
        self._check_unique({**current, **changes}, exclude_id=record_id)
        if self.timestamps:
            changes["updated_at"] = now_iso()
        rec = self.repo.update(record_id, changes)
        activity_service.log("update", self.entity, record_id,
                             f"Updated {self.entity} '{rec.get(self.label_field, record_id)}'", actor)
        return rec

    def delete(self, record_id: int, actor=None) -> None:
        current = self.get(record_id)
        if self.before_delete:
            self.before_delete(current)
        self.repo.remove(record_id)
        activity_service.log("delete", self.entity, record_id,
                             f"Deleted {self.entity} '{current.get(self.label_field, record_id)}'", actor)

    def reorder(self, ids: list[int], actor=None) -> list[dict]:
        existing = {r["id"] for r in self.repo.all()}
        missing = [i for i in ids if i not in existing]
        if missing:
            raise NotFoundError(f"Unknown {self.entity} ids: {missing}")
        for position, rid in enumerate(ids, start=1):
            self.repo.update(rid, {"order": position})
        activity_service.log("reorder", self.entity, None, f"Reordered {self.entity} list", actor)
        rows, _ = self.list(paged=False)
        return rows
