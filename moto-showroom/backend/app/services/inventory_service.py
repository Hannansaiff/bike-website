"""Inventory: physical units of each catalogue model.

Rules
- A unit is `in_stock`, `reserved` or `sold`.
- Staff can move units between in_stock and reserved.
- Only the sales module can mark a unit `sold` (and a sale reversal returns it).
- A sold unit can never be sold again.
- Every change is written to the inventory history (separate from current state).
"""
from app.core.errors import ConflictError, NotFoundError, ValidationFailed
from app.core.utils import now_iso, paginate, sort_records, text_match
from app.repositories.base import bikes_repo, bookings_repo, inventory_history_repo, units_repo
from app.services import activity_service
from app.services.bike_service import availability, stock_counts

MANUAL_TRANSITIONS = {("in_stock", "reserved"), ("reserved", "in_stock")}


def _bike_or_404(bike_id: int) -> dict:
    bike = bikes_repo.get(bike_id)
    if not bike:
        raise NotFoundError("Motorcycle not found")
    return bike


def _unit_or_404(unit_id: int) -> dict:
    unit = units_repo.get(unit_id)
    if not unit:
        raise NotFoundError(f"Inventory unit #{unit_id} not found")
    return unit


def record_history(unit: dict, action: str, from_status, to_status, note: str = "", actor=None):
    inventory_history_repo.add({
        "unit_id": unit["id"], "bike_id": unit["bike_id"], "action": action,
        "from_status": from_status, "to_status": to_status, "note": note,
        "actor": actor or activity_service.DEFAULT_ACTOR, "timestamp": now_iso(),
    })


def _enrich_unit(u: dict, bikes: dict) -> dict:
    bike = bikes.get(u["bike_id"])
    return {**u, "bike_name": bike["name"] if bike else "Deleted model",
            "selling_price": bike["price"] if bike else None,
            "image": (bike.get("images") or [None])[0] if bike else None}


def list_units(q=None, bike_id=None, status=None, condition=None, page=1, page_size=25):
    bikes = {b["id"]: b for b in bikes_repo.all()}
    rows = [_enrich_unit(u, bikes) for u in units_repo.all()]
    if bike_id:
        rows = [u for u in rows if u["bike_id"] == bike_id]
    if status:
        rows = [u for u in rows if u["status"] == status]
    if condition:
        rows = [u for u in rows if u["condition"] == condition]
    rows = [u for u in rows if text_match(u, q, ("bike_name", "chassis_no", "engine_no", "color", "notes"))]
    rows = sort_records(rows, "-added_at")
    return paginate(rows, page, page_size)


def summary(q=None, low_stock_only=False, category_id=None):
    units = units_repo.all()
    rows = []
    for bike in bikes_repo.all():
        if category_id and bike["category_id"] != category_id:
            continue
        counts = stock_counts(bike["id"], units)
        stock_units = [u for u in units if u["bike_id"] == bike["id"] and u["status"] != "sold"]
        low = bike["listing_status"] == "active" and counts["in_stock"] <= bike.get("low_stock_threshold", 2)
        row = {
            "bike_id": bike["id"], "bike_name": bike["name"], "category_id": bike["category_id"],
            "condition": bike["condition"], "listing_status": bike["listing_status"],
            "availability": availability(bike, counts), "price": bike["price"],
            "low_stock_threshold": bike.get("low_stock_threshold", 2), "is_low_stock": low,
            "stock_cost_value": sum(u.get("purchase_cost") or 0 for u in stock_units),
            "stock_retail_value": len(stock_units) * bike["price"],
            "image": (bike.get("images") or [None])[0],
            **counts,
        }
        rows.append(row)
    rows = [r for r in rows if text_match(r, q, ("bike_name",))]
    if low_stock_only:
        rows = [r for r in rows if r["is_low_stock"]]
    rows.sort(key=lambda r: (not r["is_low_stock"], r["bike_name"]))
    totals = {
        "models": len(rows),
        "units": sum(r["total"] for r in rows),
        "in_stock": sum(r["in_stock"] for r in rows),
        "reserved": sum(r["reserved"] for r in rows),
        "sold": sum(r["sold"] for r in rows),
        "low_stock_models": sum(1 for r in rows if r["is_low_stock"]),
        "stock_cost_value": sum(r["stock_cost_value"] for r in rows),
        "stock_retail_value": sum(r["stock_retail_value"] for r in rows),
    }
    return rows, totals


def _check_identifiers(chassis_no, engine_no, exclude_id=None):
    for u in units_repo.all():
        if u["id"] == exclude_id:
            continue
        if chassis_no and u.get("chassis_no", "").lower() == chassis_no.lower():
            raise ConflictError(f"Chassis number {chassis_no} is already registered to unit #{u['id']}", code="duplicate")
        if engine_no and u.get("engine_no", "").lower() == engine_no.lower():
            raise ConflictError(f"Engine number {engine_no} is already registered to unit #{u['id']}", code="duplicate")


def add_stock(data: dict, actor=None) -> list[dict]:
    """Add one or more units. Identifiers are only allowed when adding one unit."""
    bike = _bike_or_404(data["bike_id"])
    qty = data.get("quantity", 1)
    if bike["listing_status"] == "upcoming":
        raise ValidationFailed("Cannot add stock to an upcoming model. Change its listing status to active first.")
    if qty > 1 and (data.get("chassis_no") or data.get("engine_no")):
        raise ValidationFailed("Chassis/engine numbers can only be entered when adding a single unit")
    _check_identifiers(data.get("chassis_no"), data.get("engine_no"))
    created = []
    for _ in range(qty):
        unit = units_repo.add({
            "bike_id": bike["id"],
            "chassis_no": data.get("chassis_no") or "",
            "engine_no": data.get("engine_no") or "",
            "color": data.get("color") or (bike.get("colors") or [""])[0],
            "condition": bike["condition"],
            "purchase_cost": data.get("purchase_cost"),
            "status": "in_stock",
            "booking_id": None,
            "notes": data.get("notes") or "",
            "added_at": now_iso(),
            "updated_at": None,
        })
        record_history(unit, "stock_added", None, "in_stock", data.get("notes") or "Stock added", actor)
        created.append(unit)
    activity_service.log("stock_change", "inventory", bike["id"], f"Added {qty} unit(s) of '{bike['name']}'", actor)
    return created


def update_unit(unit_id: int, changes: dict, actor=None) -> dict:
    unit = _unit_or_404(unit_id)
    if unit["status"] == "sold" and set(changes) - {"notes"}:
        raise ConflictError("Sold units are locked. Only notes can be edited.", code="unit_sold")
    _check_identifiers(changes.get("chassis_no"), changes.get("engine_no"), exclude_id=unit_id)
    changes["updated_at"] = now_iso()
    updated = units_repo.update(unit_id, changes)
    record_history(updated, "details_updated", unit["status"], unit["status"], "Unit details edited", actor)
    activity_service.log("update", "inventory", unit_id, f"Edited inventory unit #{unit_id}", actor)
    return updated


def change_status(unit_id: int, status: str, note: str = "", booking_id: int | None = None, actor=None) -> dict:
    unit = _unit_or_404(unit_id)
    if unit["status"] == status:
        raise ValidationFailed(f"Unit is already {status.replace('_', ' ')}")
    if status == "sold" or unit["status"] == "sold":
        raise ConflictError("Use the Sales module to sell a unit or reverse a sale", code="use_sales")
    if (unit["status"], status) not in MANUAL_TRANSITIONS:
        raise ValidationFailed(f"Cannot change unit from {unit['status']} to {status}")
    if booking_id is not None and not bookings_repo.get(booking_id):
        raise ValidationFailed("Linked booking not found")
    changes = {"status": status, "updated_at": now_iso(),
               "booking_id": booking_id if status == "reserved" else None}
    updated = units_repo.update(unit_id, changes)
    action = "reserved" if status == "reserved" else "released"
    record_history(updated, action, unit["status"], status, note, actor)
    bike = bikes_repo.get(unit["bike_id"]) or {"name": "unit"}
    activity_service.log("stock_change", "inventory", unit_id,
                         f"Unit #{unit_id} of '{bike['name']}' {action}", actor)
    return updated


def delete_unit(unit_id: int, actor=None):
    unit = _unit_or_404(unit_id)
    if unit["status"] != "in_stock":
        raise ConflictError("Only in-stock units can be removed. Sold units are kept for history.", code="unit_locked")
    units_repo.remove(unit_id)
    record_history(unit, "removed", "in_stock", None, "Unit removed from stock", actor)
    activity_service.log("stock_change", "inventory", unit_id, f"Removed inventory unit #{unit_id}", actor)


def history(bike_id=None, unit_id=None, page=1, page_size=25):
    bikes = {b["id"]: b["name"] for b in bikes_repo.all()}
    rows = inventory_history_repo.all()
    if bike_id:
        rows = [r for r in rows if r["bike_id"] == bike_id]
    if unit_id:
        rows = [r for r in rows if r["unit_id"] == unit_id]
    rows = [{**r, "bike_name": bikes.get(r["bike_id"], "Deleted model")} for r in rows]
    rows = sort_records(rows, "-timestamp")
    return paginate(rows, page, page_size)


def mark_sold(unit_id: int, invoice_no: str, actor=None) -> dict:
    """Called only by sales_service (inside the store lock)."""
    unit = _unit_or_404(unit_id)
    if unit["status"] == "sold":
        raise ConflictError("This unit has already been sold", code="already_sold")
    updated = units_repo.update(unit_id, {"status": "sold", "updated_at": now_iso()})
    record_history(updated, "sold", unit["status"], "sold", f"Sold on {invoice_no}", actor)
    return updated


def return_to_stock(unit_id: int, invoice_no: str, actor=None) -> dict:
    unit = _unit_or_404(unit_id)
    updated = units_repo.update(unit_id, {"status": "in_stock", "booking_id": None, "updated_at": now_iso()})
    record_history(updated, "sale_reversed", unit["status"], "in_stock", f"Returned to stock – {invoice_no} reversed", actor)
    return updated
