from typing import Literal, Optional

from fastapi import APIRouter, Depends

from app.routers.deps import page_params
from app.schemas.common import ok
from app.services import activity_service, analytics_service

router = APIRouter(tags=["Dashboard & Reports"])


@router.get("/dashboard/stats", summary="Dashboard cards, charts and lists (computed live)")
def dashboard(date_from: Optional[str] = None, date_to: Optional[str] = None):
    return ok(analytics_service.dashboard(date_from, date_to))


@router.get("/reports/{kind}")
def report(
    kind: Literal["sales", "inventory", "bookings", "customers", "popularity"],
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None,
):
    if kind == "sales":
        data = analytics_service.sales_report(date_from, date_to, category_id, brand_id)
    elif kind == "inventory":
        data = analytics_service.inventory_report(category_id)
    elif kind == "bookings":
        data = analytics_service.bookings_report(date_from, date_to, category_id)
    elif kind == "customers":
        data = analytics_service.customers_report(date_from, date_to)
    else:
        data = analytics_service.popularity_report(category_id)
    return ok(data)


@router.get("/activity-logs", tags=["Activity Logs"])
def activity_logs(q: Optional[str] = None, entity: Optional[str] = None, action: Optional[str] = None,
                  paging: dict = Depends(page_params)):
    rows, meta = activity_service.list_logs(q, entity, action, **paging)
    return ok(rows, meta)
