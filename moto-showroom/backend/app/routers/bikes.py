from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.catalog import BikeCreate, BikeUpdate
from app.schemas.common import ok
from app.services import bike_service

router = APIRouter(prefix="/bikes", tags=["Bikes"])

SortOption = Literal["latest", "price_asc", "price_desc", "popular", "name", "year_desc"]


@router.get("", summary="Search, filter, sort and paginate the catalogue")
def list_bikes(
    q: Optional[str] = Query(None, description="Search model name, brand or keywords"),
    category: Optional[str] = Query(None, description="Category slug(s) or id(s), comma-separated"),
    brand: Optional[str] = Query(None, description="Brand slug(s) or id(s), comma-separated"),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    min_cc: Optional[int] = Query(None, ge=0),
    max_cc: Optional[int] = Query(None, ge=0),
    fuel_type: Optional[str] = None,
    condition: Optional[Literal["new", "used"]] = None,
    model_year: Optional[int] = None,
    availability: Optional[str] = Query(None, description="available,reserved,sold,out_of_stock,discontinued,upcoming"),
    featured: Optional[bool] = None,
    ids: Optional[str] = Query(None, description="Comma-separated ids"),
    sort: SortOption = "latest",
    admin: bool = Query(False, description="Include bikes of inactive brands/categories (admin views)"),
    paging: dict = Depends(page_params),
):
    id_list = [int(i) for i in ids.split(",") if i.strip().isdigit()] if ids else None
    rows, meta = bike_service.list_bikes(
        q=q, category=category, brand=brand, min_price=min_price, max_price=max_price, min_cc=min_cc,
        max_cc=max_cc, fuel_type=fuel_type, condition=condition, model_year=model_year,
        availability_filter=availability, featured=featured, ids=id_list, sort=sort, public=not admin, **paging,
    )
    return ok(rows, meta)


@router.get("/meta/filters", summary="Options for catalogue filters")
def filter_meta():
    return ok(bike_service.filter_meta())


@router.get("/compare", summary="Compare two or three motorcycles")
def compare(ids: str = Query(..., description="2–3 comma-separated ids")):
    id_list = [int(i) for i in ids.split(",") if i.strip().isdigit()]
    return ok(bike_service.compare(id_list))


@router.get("/{id_or_slug}")
def get_bike(id_or_slug: str, admin: bool = False):
    return ok(bike_service.get_bike(id_or_slug, public=not admin))


@router.get("/{id_or_slug}/related")
def related(id_or_slug: str, limit: int = Query(4, ge=1, le=12)):
    return ok(bike_service.related(id_or_slug, limit))


@router.post("/{bike_id}/view", summary="Register a product page view (popularity)")
def register_view(bike_id: int):
    return ok({"views": bike_service.register_view(bike_id)})


@router.post("", status_code=status.HTTP_201_CREATED)
def create_bike(payload: BikeCreate, actor=Depends(get_actor)):
    return ok(bike_service.create_bike(dump(payload), actor), message="Motorcycle created")


@router.put("/{bike_id}")
def update_bike(bike_id: int, payload: BikeUpdate, actor=Depends(get_actor)):
    return ok(bike_service.update_bike(bike_id, dump(payload, partial=True), actor), message="Motorcycle updated")


@router.delete("/{bike_id}")
def delete_bike(bike_id: int, actor=Depends(get_actor)):
    bike_service.delete_bike(bike_id, actor)
    return ok(None, message="Motorcycle deleted")
