"""Router factory for simple ordered collections (categories, brands, gallery,
banners, testimonials, FAQs). Keeps endpoints consistent across modules."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.common import ReorderRequest, ok
from app.services.collection_service import CollectionService


def collection_router(
    service: CollectionService,
    prefix: str,
    tag: str,
    create_schema,
    update_schema,
    visibility_field: Optional[str] = None,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", summary=f"List {tag.lower()}")
    def list_items(
        q: Optional[str] = None,
        public: bool = Query(False, description="Only return items visible on the public website"),
        sort: Optional[str] = None,
        paging: dict = Depends(page_params),
        all: bool = Query(False, description="Return every item without pagination"),
    ):
        filters = {visibility_field: True} if (public and visibility_field) else None
        if all or public:
            rows, meta = service.list(q=q, filters=filters, sort=sort, paged=False)
        else:
            rows, meta = service.list(q=q, filters=filters, sort=sort, **paging)
        return ok(rows, meta)

    @router.post("/reorder", summary=f"Reorder {tag.lower()}")
    def reorder(payload: ReorderRequest, actor=Depends(get_actor)):
        return ok(service.reorder(payload.ids, actor), message="Order saved")

    @router.get("/{item_id}")
    def get_item(item_id: int):
        return ok(service.get(item_id))

    @router.post("", status_code=status.HTTP_201_CREATED)
    def create_item(payload: create_schema, actor=Depends(get_actor)):
        return ok(service.create(dump(payload), actor), message="Created successfully")

    @router.put("/{item_id}")
    def update_item(item_id: int, payload: update_schema, actor=Depends(get_actor)):
        return ok(service.update(item_id, dump(payload, partial=True), actor), message="Saved successfully")

    @router.delete("/{item_id}")
    def delete_item(item_id: int, actor=Depends(get_actor)):
        service.delete(item_id, actor)
        return ok(None, message="Deleted successfully")

    return router
