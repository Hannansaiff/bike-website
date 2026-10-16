"""Motorcycle catalogue (products).

A *bike* is a catalogue product/model. Physical stock lives in inventory
units (inventory_service); availability shown to customers is derived from
those units plus the listing status, never from bookings.
"""
from app.core.errors import ConflictError, NotFoundError, ValidationFailed
from app.core.utils import now_iso, paginate, slugify, text_match
from app.repositories.base import (bikes_repo, bookings_repo, brands_repo, categories_repo,
                                   sales_repo, units_repo)
from app.services import activity_service
from app.services.offer_service import pricing_for_bike

AVAILABILITY_LABELS = {
    "available": "Available",
    "reserved": "Reserved",
    "sold": "Sold Out",
    "out_of_stock": "Out of Stock",
    "discontinued": "Discontinued",
    "upcoming": "Upcoming",
}


def stock_counts(bike_id: int, units=None) -> dict:
    units = units if units is not None else units_repo.find(bike_id=bike_id)
    counts = {"in_stock": 0, "reserved": 0, "sold": 0}
    for u in units:
        if u["bike_id"] == bike_id:
            counts[u["status"]] = counts.get(u["status"], 0) + 1
    counts["total"] = counts["in_stock"] + counts["reserved"] + counts["sold"]
    return counts


def availability(bike: dict, counts: dict) -> str:
    if bike["listing_status"] == "upcoming":
        return "upcoming"
    if bike["listing_status"] == "discontinued":
        return "discontinued"
    if counts["in_stock"] > 0:
        return "available"
    if counts["reserved"] > 0:
        return "reserved"
    if counts["sold"] > 0:
        return "sold"
    return "out_of_stock"


class _Lookups:
    """Pre-loaded reference data so list enrichment is O(n)."""

    def __init__(self):
        self.brands = {b["id"]: b for b in brands_repo.all()}
        self.categories = {c["id"]: c for c in categories_repo.all()}
        self.units = units_repo.all()
        sales = [s for s in sales_repo.all() if s["status"] == "completed"]
        self.sales_count = {}
        for s in sales:
            self.sales_count[s["bike_id"]] = self.sales_count.get(s["bike_id"], 0) + 1
        self.booking_count = {}
        for b in bookings_repo.all():
            self.booking_count[b["bike_id"]] = self.booking_count.get(b["bike_id"], 0) + 1


def enrich(bike: dict, lk: _Lookups | None = None) -> dict:
    lk = lk or _Lookups()
    counts = stock_counts(bike["id"], lk.units)
    avail = availability(bike, counts)
    brand = lk.brands.get(bike["brand_id"])
    cat = lk.categories.get(bike["category_id"])
    sold = lk.sales_count.get(bike["id"], 0)
    bookings = lk.booking_count.get(bike["id"], 0)
    return {
        **bike,
        "brand": {"id": brand["id"], "name": brand["name"], "slug": brand["slug"], "active": brand["active"]} if brand else None,
        "category": {"id": cat["id"], "name": cat["name"], "slug": cat["slug"], "active": cat["active"]} if cat else None,
        "pricing": pricing_for_bike(bike),
        "stock": counts,
        "availability": avail,
        "availability_label": AVAILABILITY_LABELS[avail],
        "is_low_stock": bike["listing_status"] == "active" and counts["in_stock"] <= bike.get("low_stock_threshold", 2),
        "sales_count": sold,
        "booking_count": bookings,
        "popularity": bike.get("views", 0) + bookings * 15 + sold * 40,
        "image": (bike.get("images") or [None])[0],
    }


def _visible_publicly(b: dict) -> bool:
    return (b["brand"] is None or b["brand"]["active"]) and (b["category"] is None or b["category"]["active"])


SORTS = {
    "price_asc": (lambda b: b["pricing"]["final_price"], False),
    "price_desc": (lambda b: b["pricing"]["final_price"], True),
    "latest": (lambda b: (b.get("created_at") or ""), True),
    "popular": (lambda b: b["popularity"], True),
    "name": (lambda b: b["name"].lower(), False),
    "year_desc": (lambda b: b["model_year"], True),
}


def list_bikes(
    q=None, category=None, brand=None, min_price=None, max_price=None, min_cc=None, max_cc=None,
    fuel_type=None, condition=None, model_year=None, availability_filter=None, featured=None,
    ids=None, sort="latest", page=1, page_size=12, public=True,
):
    lk = _Lookups()
    rows = [enrich(b, lk) for b in bikes_repo.all()]
    if public:
        rows = [b for b in rows if _visible_publicly(b)]
    if ids:
        rows = [b for b in rows if b["id"] in ids]
    if q:
        rows = [b for b in rows if text_match(
            {**b, "brand_name": b["brand"]["name"] if b["brand"] else "", "cat": b["category"]["name"] if b["category"] else ""},
            q, ("name", "brand_name", "cat", "description", "features", "fuel_type", "transmission"))]
    if category:
        cats = [c.strip() for c in str(category).split(",") if c.strip()]
        def in_cat(b):
            if not b["category"]:
                return False
            if "used" in cats and b["condition"] == "used":
                return True
            return b["category"]["slug"] in cats or str(b["category"]["id"]) in cats
        rows = [b for b in rows if in_cat(b)]
    if brand:
        brands = [x.strip() for x in str(brand).split(",") if x.strip()]
        rows = [b for b in rows if b["brand"] and (b["brand"]["slug"] in brands or str(b["brand"]["id"]) in brands)]
    if min_price is not None:
        rows = [b for b in rows if b["pricing"]["final_price"] >= min_price]
    if max_price is not None:
        rows = [b for b in rows if b["pricing"]["final_price"] <= max_price]
    if min_cc is not None:
        rows = [b for b in rows if b["engine_cc"] >= min_cc]
    if max_cc is not None:
        rows = [b for b in rows if b["engine_cc"] <= max_cc]
    if fuel_type:
        rows = [b for b in rows if b["fuel_type"].lower() == fuel_type.lower()]
    if condition:
        rows = [b for b in rows if b["condition"] == condition]
    if model_year:
        rows = [b for b in rows if b["model_year"] == model_year]
    if availability_filter:
        wanted = availability_filter.split(",")
        rows = [b for b in rows if b["availability"] in wanted]
    if featured is not None:
        rows = [b for b in rows if b["featured"] == featured]
    key, reverse = SORTS.get(sort or "latest", SORTS["latest"])
    rows.sort(key=key, reverse=reverse)
    return paginate(rows, page, page_size)


def get_bike(id_or_slug, public=True) -> dict:
    raw = None
    if str(id_or_slug).isdigit():
        raw = bikes_repo.get(int(id_or_slug))
    if not raw:
        raw = bikes_repo.first(slug=str(id_or_slug))
    if not raw:
        raise NotFoundError("Motorcycle not found")
    bike = enrich(raw)
    if public and not _visible_publicly(bike):
        raise NotFoundError("Motorcycle not found")
    return bike


def related(id_or_slug, limit=4) -> list[dict]:
    bike = get_bike(id_or_slug)
    rows, _ = list_bikes(page_size=200)
    same = [b for b in rows if b["id"] != bike["id"] and b["category_id"] == bike["category_id"]]
    others = [b for b in rows if b["id"] != bike["id"] and b["brand_id"] == bike["brand_id"] and b not in same]
    return (same + others)[:limit]


def compare(ids: list[int]) -> list[dict]:
    if not 2 <= len(ids) <= 3:
        raise ValidationFailed("Select two or three motorcycles to compare")
    return [get_bike(i) for i in ids]


def register_view(bike_id: int) -> int:
    bike = bikes_repo.get(bike_id)
    if not bike:
        raise NotFoundError("Motorcycle not found")
    views = bike.get("views", 0) + 1
    bikes_repo.update(bike_id, {"views": views})
    return views


def filter_meta() -> dict:
    rows, _ = list_bikes(page_size=500)
    prices = [b["pricing"]["final_price"] for b in rows] or [0]
    ccs = [b["engine_cc"] for b in rows] or [0]
    return {
        "categories": [{"id": c["id"], "name": c["name"], "slug": c["slug"]}
                       for c in sorted(categories_repo.all(), key=lambda c: c["order"]) if c["active"]],
        "brands": [{"id": b["id"], "name": b["name"], "slug": b["slug"]}
                   for b in sorted(brands_repo.all(), key=lambda b: b["order"]) if b["active"]],
        "years": sorted({b["model_year"] for b in rows}, reverse=True),
        "fuel_types": sorted({b["fuel_type"] for b in rows}),
        "price_range": [min(prices), max(prices)],
        "cc_range": [min(ccs), max(ccs)],
        "availability": [{"value": k, "label": v} for k, v in AVAILABILITY_LABELS.items()],
    }


# ---- Mutations --------------------------------------------------------------

def _validate(data: dict):
    if not brands_repo.get(data["brand_id"]):
        raise ValidationFailed("Selected brand does not exist")
    if not categories_repo.get(data["category_id"]):
        raise ValidationFailed("Selected category does not exist")
    if data.get("fuel_type") == "Electric" and data.get("engine_cc", 0) != 0:
        raise ValidationFailed("Electric motorcycles should have engine capacity 0 cc")


def _unique_slug(name: str, exclude_id=None) -> str:
    base = slugify(name)
    slug, n = base, 2
    taken = {b["slug"] for b in bikes_repo.all() if b["id"] != exclude_id}
    while slug in taken:
        slug, n = f"{base}-{n}", n + 1
    return slug


def create_bike(data: dict, actor=None) -> dict:
    _validate(data)
    record = {
        **data,
        "slug": _unique_slug(data["name"]),
        "views": 0,
        "is_demo": False,
        "created_at": now_iso(),
        "updated_at": None,
    }
    rec = bikes_repo.add(record)
    activity_service.log("create", "bike", rec["id"], f"Added motorcycle '{rec['name']}'", actor)
    return get_bike(rec["id"], public=False)


def update_bike(bike_id: int, changes: dict, actor=None) -> dict:
    current = bikes_repo.get(bike_id)
    if not current:
        raise NotFoundError("Motorcycle not found")
    merged = {**current, **changes}
    _validate(merged)
    if "name" in changes and changes["name"] != current["name"]:
        changes["slug"] = _unique_slug(changes["name"], exclude_id=bike_id)
    changes["updated_at"] = now_iso()
    bikes_repo.update(bike_id, changes)
    if "price" in changes and changes["price"] != current["price"]:
        activity_service.log("price_change", "bike", bike_id,
                             f"Changed price of '{merged['name']}' from PKR {current['price']:,} to PKR {changes['price']:,}", actor)
    if "listing_status" in changes and changes["listing_status"] != current["listing_status"]:
        activity_service.log("status_change", "bike", bike_id,
                             f"Listing status of '{merged['name']}' set to {changes['listing_status']}", actor)
    activity_service.log("update", "bike", bike_id, f"Updated motorcycle '{merged['name']}'", actor)
    return get_bike(bike_id, public=False)


def delete_bike(bike_id: int, actor=None):
    bike = bikes_repo.get(bike_id)
    if not bike:
        raise NotFoundError("Motorcycle not found")
    if sales_repo.find(bike_id=bike_id):
        raise ConflictError("This motorcycle has sales history and cannot be deleted. Mark it as discontinued instead.",
                            code="has_sales")
    if any(u["status"] != "in_stock" for u in units_repo.find(bike_id=bike_id)):
        raise ConflictError("This motorcycle has reserved units. Release them before deleting.", code="has_reserved_units")
    open_bookings = [b for b in bookings_repo.find(bike_id=bike_id) if b["status"] in ("pending", "confirmed", "contacted")]
    if open_bookings:
        raise ConflictError(f"This motorcycle has {len(open_bookings)} open booking(s). Close them first or mark the model discontinued.",
                            code="has_open_bookings")
    for u in units_repo.find(bike_id=bike_id):
        units_repo.remove(u["id"])
    bikes_repo.remove(bike_id)
    activity_service.log("delete", "bike", bike_id, f"Deleted motorcycle '{bike['name']}'", actor)
