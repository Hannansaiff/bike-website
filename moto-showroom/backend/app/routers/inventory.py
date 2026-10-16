from typing import Literal, Optional

from fastapi import APIRouter, Depends, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.common import ok
from app.schemas.operations import StockAdd, UnitStatusUpdate, UnitUpdate
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/summary", summary="Stock per model with low-stock flags")
def summary(q: Optional[str] = None, low_stock_only: bool = False, category_id: Optional[int] = None):
    rows, totals = inventory_service.summary(q, low_stock_only, category_id)
    return ok(rows, {"total": len(rows), "totals": totals})


@router.get("/units", summary="Individual physical units")
def list_units(
    q: Optional[str] = None,
    bike_id: Optional[int] = None,
    status: Optional[Literal["in_stock", "reserved", "sold"]] = None,
    condition: Optional[Literal["new", "used"]] = None,
    paging: dict = Depends(page_params),
):
    rows, meta = inventory_service.list_units(q, bike_id, status, condition, **paging)
    return ok(rows, meta)


@router.post("/units", status_code=status.HTTP_201_CREATED, summary="Add stock")
def add_stock(payload: StockAdd, actor=Depends(get_actor)):
    units = inventory_service.add_stock(dump(payload), actor)
    return ok(units, message=f"{len(units)} unit(s) added to stock")


@router.put("/units/{unit_id}")
def update_unit(unit_id: int, payload: UnitUpdate, actor=Depends(get_actor)):
    return ok(inventory_service.update_unit(unit_id, dump(payload, partial=True), actor), message="Unit updated")


@router.post("/units/{unit_id}/status", summary="Reserve or release a unit")
def change_status(unit_id: int, payload: UnitStatusUpdate, actor=Depends(get_actor)):
    unit = inventory_service.change_status(unit_id, payload.status, payload.note, payload.booking_id, actor)
    return ok(unit, message="Unit reserved" if payload.status == "reserved" else "Unit released to stock")


@router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, actor=Depends(get_actor)):
    inventory_service.delete_unit(unit_id, actor)
    return ok(None, message="Unit removed")


@router.get("/history", summary="Inventory change history")
def history(bike_id: Optional[int] = None, unit_id: Optional[int] = None, paging: dict = Depends(page_params)):
    rows, meta = inventory_service.history(bike_id, unit_id, **paging)
    return ok(rows, meta)
