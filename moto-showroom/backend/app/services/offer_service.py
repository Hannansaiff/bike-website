"""Offers & pricing rules.

A single function – `pricing_for_bike` – decides the discount shown on bike
cards, the product page and the default discount on a new sale/invoice, so
discounts stay consistent everywhere.
"""
from app.core.errors import ValidationFailed
from app.core.utils import now_iso, paginate, parse_date, sort_records, text_match, today
from app.repositories.base import bikes_repo, offers_repo
from app.services import activity_service
from app.services.collection_service import CollectionService


def offer_status(offer: dict, on=None) -> str:
    on = on or today()
    if not offer.get("active"):
        return "inactive"
    start, end = parse_date(offer.get("start_date")), parse_date(offer.get("end_date"))
    if start and on < start:
        return "scheduled"
    if end and on > end:
        return "expired"
    return "active"


def discount_amount(offer: dict, price: int) -> int:
    value = offer.get("discount_value") or 0
    if offer.get("discount_type") == "percent":
        amount = round(price * value / 100)
    elif offer.get("discount_type") == "fixed":
        amount = int(value)
    else:
        amount = 0
    return max(0, min(int(amount), int(price)))


def _applies(offer: dict, bike_id: int) -> bool:
    return offer.get("applies_to_all") or bike_id in (offer.get("bike_ids") or [])


def active_offers_for_bike(bike_id: int) -> list[dict]:
    return [o for o in offers_repo.all() if offer_status(o) == "active" and _applies(o, bike_id)]


def pricing_for_bike(bike: dict) -> dict:
    price = int(bike["price"])
    offers = active_offers_for_bike(bike["id"])
    best, best_amount = None, 0
    for o in offers:
        amt = discount_amount(o, price)
        if amt > best_amount or (best is None and o.get("discount_type") == "none"):
            best, best_amount = o, amt
    perks = [o for o in offers if o.get("discount_type") == "none"]
    return {
        "price": price,
        "discount": best_amount,
        "final_price": price - best_amount,
        "discount_percent": round(best_amount * 100 / price, 1) if price and best_amount else 0,
        "offer": (
            {"id": best["id"], "title": best["title"], "is_demo": best.get("is_demo", False),
             "discount_type": best["discount_type"], "discount_value": best["discount_value"]}
            if best and best_amount else None
        ),
        "perks": [{"id": p["id"], "title": p["title"], "is_demo": p.get("is_demo", False)} for p in perks],
    }


def enrich(offer: dict) -> dict:
    names = {b["id"]: b["name"] for b in bikes_repo.all()}
    return {
        **offer,
        "status": offer_status(offer),
        "bikes": [{"id": i, "name": names[i]} for i in offer.get("bike_ids", []) if i in names],
        "label": "Sample offer" if offer.get("is_demo") else "Configured offer",
    }


def _validate(data: dict):
    start, end = parse_date(data.get("start_date")), parse_date(data.get("end_date"))
    if start and end and end < start:
        raise ValidationFailed("End date must be on or after the start date")
    dtype, value = data.get("discount_type", "none"), data.get("discount_value") or 0
    if dtype == "percent" and not (0 < value <= 90):
        raise ValidationFailed("Percentage discount must be between 1 and 90")
    if dtype == "fixed" and value <= 0:
        raise ValidationFailed("Fixed discount must be greater than zero")
    known = {b["id"] for b in bikes_repo.all()}
    unknown = [i for i in data.get("bike_ids", []) if i not in known]
    if unknown:
        raise ValidationFailed(f"Unknown motorcycle ids: {unknown}")
    if not data.get("applies_to_all") and not data.get("bike_ids") and dtype != "none":
        raise ValidationFailed("Select at least one eligible motorcycle or apply the offer to all motorcycles")


_base = CollectionService(offers_repo, "offer", label_field="title", searchable=("title", "description"),
                          default_sort="-created_at")


def list_offers(q=None, status=None, page=1, page_size=50, public=False):
    rows = [enrich(o) for o in offers_repo.all() if text_match(o, q, ("title", "description"))]
    if public:
        rows = [o for o in rows if o["status"] == "active"]
    elif status:
        rows = [o for o in rows if o["status"] == status]
    rows = sort_records(rows, "-created_at")
    return paginate(rows, page, page_size)


def get_offer(offer_id: int) -> dict:
    return enrich(_base.get(offer_id))


def create_offer(data: dict, actor=None) -> dict:
    _validate(data)
    data.setdefault("is_demo", False)
    return enrich(_base.create(data, actor))


def update_offer(offer_id: int, changes: dict, actor=None) -> dict:
    merged = {**_base.get(offer_id), **changes}
    _validate(merged)
    return enrich(_base.update(offer_id, changes, actor))


def delete_offer(offer_id: int, actor=None):
    _base.delete(offer_id, actor)
