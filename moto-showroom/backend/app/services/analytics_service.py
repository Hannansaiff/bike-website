"""Dashboard statistics and reports – always computed from current data."""
from collections import Counter, defaultdict
from datetime import timedelta

from app.core.utils import month_key, month_range, parse_date, today
from app.repositories.base import (bikes_repo, bookings_repo, brands_repo, categories_repo, customers_repo,
                                   sales_repo, units_repo)
from app.services import activity_service, booking_service, inventory_service
from app.services.bike_service import list_bikes

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _label(mk: str) -> str:
    y, m = mk.split("-")
    return f"{MONTH_NAMES[int(m) - 1]} {y[2:]}"


def _range(date_from, date_to, default_days=180):
    dt = parse_date(date_to) or today()
    df = parse_date(date_from) or (dt - timedelta(days=default_days))
    if df > dt:
        df, dt = dt, df
    return df, dt


def _in(d, df, dt) -> bool:
    d = parse_date(d)
    return df <= d <= dt


def dashboard(date_from=None, date_to=None) -> dict:
    df, dt = _range(date_from, date_to)
    bikes = bikes_repo.all()
    bikes_by_id = {b["id"]: b for b in bikes}
    brands = {b["id"]: b["name"] for b in brands_repo.all()}
    cats = {c["id"]: c["name"] for c in categories_repo.all()}
    units = units_repo.all()
    bookings = bookings_repo.all()
    sales_all = sales_repo.all()
    sales = [s for s in sales_all if s["status"] == "completed" and _in(s["sale_date"], df, dt)]
    bookings_r = [b for b in bookings if _in(b["created_at"], df, dt)]

    unit_counts = Counter(u["status"] for u in units)
    months = month_range(df, dt)
    sales_trend = {m: {"month": _label(m), "sales": 0, "revenue": 0} for m in months}
    for s in sales:
        mk = month_key(s["sale_date"])
        if mk in sales_trend:
            sales_trend[mk]["sales"] += 1
            sales_trend[mk]["revenue"] += s["selling_price"]
    booking_trend = {m: {"month": _label(m), "test_ride": 0, "showroom_visit": 0, "purchase_enquiry": 0} for m in months}
    for b in bookings_r:
        mk = month_key(b["created_at"])
        if mk in booking_trend:
            booking_trend[mk][b["booking_type"]] += 1

    brand_pop = Counter()
    for s in sales:
        bike = bikes_by_id.get(s["bike_id"])
        if bike:
            brand_pop[brands.get(bike["brand_id"], "Other")] += 1
    cat_dist = Counter()
    for u in units:
        if u["status"] != "sold":
            bike = bikes_by_id.get(u["bike_id"])
            if bike:
                cat_dist[cats.get(bike["category_id"], "Other")] += 1

    low_rows, _ = inventory_service.summary(low_stock_only=True)
    upcoming, _ = booking_service.list_bookings(upcoming=True, booking_type="test_ride", sort="preferred_date", page_size=6)
    recent_bookings, _ = booking_service.list_bookings(sort="-created_at", page_size=6)
    from app.services.sales_service import list_sales  # avoid import cycle at module load
    recent_sales, _ = list_sales(sort="-created_at", page_size=6)

    return {
        "range": {"from": df.isoformat(), "to": dt.isoformat()},
        "cards": {
            "total_models": len(bikes),
            "total_units": len(units),
            "available_units": unit_counts.get("in_stock", 0),
            "reserved_units": unit_counts.get("reserved", 0),
            "sold_units": unit_counts.get("sold", 0),
            "pending_bookings": sum(1 for b in bookings if b["status"] == "pending"),
            "confirmed_bookings": sum(1 for b in bookings if b["status"] == "confirmed"),
            "total_customers": len(customers_repo.all()),
            "completed_sales": len(sales),
            "revenue": sum(s["selling_price"] for s in sales),
            "collected": sum(s["amount_paid"] for s in sales),
            "outstanding": sum(s["balance"] for s in sales),
            "is_demo_financials": True,
        },
        "sales_trend": list(sales_trend.values()),
        "booking_trend": list(booking_trend.values()),
        "inventory_distribution": [
            {"name": "In stock", "value": unit_counts.get("in_stock", 0)},
            {"name": "Reserved", "value": unit_counts.get("reserved", 0)},
            {"name": "Sold", "value": unit_counts.get("sold", 0)},
        ],
        "popular_brands": [{"name": k, "value": v} for k, v in brand_pop.most_common(6)],
        "category_distribution": [{"name": k, "value": v} for k, v in cat_dist.most_common()],
        "low_stock": low_rows[:6],
        "upcoming_test_rides": upcoming,
        "recent_bookings": recent_bookings,
        "recent_sales": recent_sales,
        "recent_activity": activity_service.recent(8),
    }


# ---- Reports -------------------------------------------------------------------

def sales_report(date_from=None, date_to=None, category_id=None, brand_id=None):
    from app.services.sales_service import list_sales
    df, dt = _range(date_from, date_to, 365)
    bikes = {b["id"]: b for b in bikes_repo.all()}
    rows, _ = list_sales(date_from=df.isoformat(), date_to=dt.isoformat(), include_archived=True, page_size=10000)
    if category_id:
        rows = [s for s in rows if bikes.get(s["bike_id"], {}).get("category_id") == category_id]
    if brand_id:
        rows = [s for s in rows if bikes.get(s["bike_id"], {}).get("brand_id") == brand_id]
    done = [s for s in rows if s["status"] == "completed"]
    by_month = defaultdict(lambda: {"sales": 0, "revenue": 0, "discounts": 0})
    for s in done:
        m = by_month[month_key(s["sale_date"])]
        m["sales"] += 1
        m["revenue"] += s["selling_price"]
        m["discounts"] += s["discount"]
    by_method = Counter()
    for s in done:
        for p in s["payments"]:
            by_method[p["method"]] += p["amount"]
    return {
        "range": {"from": df.isoformat(), "to": dt.isoformat()},
        "totals": {
            "sales": len(done), "reversed": len(rows) - len(done),
            "gross": sum(s["list_price"] for s in done), "discounts": sum(s["discount"] for s in done),
            "net": sum(s["selling_price"] for s in done), "collected": sum(s["amount_paid"] for s in done),
            "outstanding": sum(s["balance"] for s in done),
            "average_sale": round(sum(s["selling_price"] for s in done) / len(done)) if done else 0,
        },
        "by_month": [{"month": _label(k), **by_month[k]} for k in month_range(df, dt)],
        "by_payment_method": [{"name": k, "value": v} for k, v in by_method.most_common()],
        "rows": rows,
        "is_demo": True,
    }


def inventory_report(category_id=None):
    rows, totals = inventory_service.summary(category_id=category_id)
    cats = {c["id"]: c["name"] for c in categories_repo.all()}
    by_cat = defaultdict(lambda: {"in_stock": 0, "reserved": 0, "sold": 0})
    for r in rows:
        c = by_cat[cats.get(r["category_id"], "Other")]
        for k in ("in_stock", "reserved", "sold"):
            c[k] += r[k]
    return {"totals": totals, "by_category": [{"name": k, **v} for k, v in by_cat.items()],
            "rows": [{**r, "category_name": cats.get(r["category_id"], "—")} for r in rows]}


def bookings_report(date_from=None, date_to=None, category_id=None):
    df, dt = _range(date_from, date_to, 365)
    bikes = {b["id"]: b for b in bikes_repo.all()}
    rows, _ = booking_service.list_bookings(page_size=10000)
    rows = [b for b in rows if _in(b["created_at"], df, dt)]
    if category_id:
        rows = [b for b in rows if bikes.get(b["bike_id"], {}).get("category_id") == category_id]
    by_status = Counter(b["status"] for b in rows)
    by_type = Counter(b["type_label"] for b in rows)
    closed = sum(by_status[s] for s in ("completed", "rejected", "cancelled"))
    return {
        "range": {"from": df.isoformat(), "to": dt.isoformat()},
        "totals": {"bookings": len(rows), "completed": by_status["completed"], "pending": by_status["pending"],
                   "completion_rate": round(by_status["completed"] * 100 / closed, 1) if closed else 0},
        "by_status": [{"name": k, "value": v} for k, v in by_status.most_common()],
        "by_type": [{"name": k, "value": v} for k, v in by_type.most_common()],
        "rows": rows,
    }


def customers_report(date_from=None, date_to=None):
    from app.services.customer_service import list_customers
    df, dt = _range(date_from, date_to, 365)
    rows, _ = list_customers(page_size=10000, sort="-total_spent")
    new = [c for c in rows if _in(c["registered_at"], df, dt)]
    return {
        "range": {"from": df.isoformat(), "to": dt.isoformat()},
        "totals": {"customers": len(rows), "new_in_range": len(new),
                   "buyers": sum(1 for c in rows if c["total_purchases"]),
                   "lifetime_value": sum(c["total_spent"] for c in rows)},
        "by_city": [{"name": k or "Unknown", "value": v} for k, v in Counter(c.get("city") for c in rows).most_common(8)],
        "top_customers": rows[:10],
        "rows": rows,
    }


def popularity_report(category_id=None):
    rows, _ = list_bikes(page_size=10000, public=False, sort="popular")
    if category_id:
        rows = [b for b in rows if b["category_id"] == category_id]
    slim = [{"id": b["id"], "name": b["name"], "brand": b["brand"]["name"] if b["brand"] else "—",
             "category": b["category"]["name"] if b["category"] else "—", "views": b.get("views", 0),
             "bookings": b["booking_count"], "sales": b["sales_count"], "score": b["popularity"],
             "availability": b["availability"]} for b in rows]
    return {"rows": slim, "top": slim[:10]}
