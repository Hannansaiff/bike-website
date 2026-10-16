"""Customers, customer history and DEMO customer authentication.

Demo auth uses an unsalted SHA-256 hash and a deterministic token. This is for
demonstration only – production needs bcrypt/argon2, expiring signed tokens
(e.g. JWT/OAuth2) and server-side authorization.
"""
import hashlib

from app.core.errors import AuthError, ConflictError, NotFoundError, ValidationFailed
from app.core.utils import normalize_phone, now_iso, paginate, sort_records, text_match
from app.repositories.base import bikes_repo, bookings_repo, customers_repo, enquiries_repo, sales_repo
from app.services import activity_service

PUBLIC_FIELDS = ("id", "name", "phone", "email", "city", "registered_at")
_TOKEN_SALT = "demo-only-not-secret"


def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def _strip(c: dict) -> dict:
    return {k: v for k, v in c.items() if k != "password_hash"}


def make_token(customer: dict) -> str:
    sig = hashlib.sha256(f"{customer['id']}:{customer['email']}:{_TOKEN_SALT}".encode()).hexdigest()[:24]
    return f"demo-cust-{customer['id']}-{sig}"


def customer_from_token(token: str | None) -> dict:
    try:
        _, _, cid, sig = (token or "").split("-", 3)
        customer = customers_repo.get(int(cid))
    except (ValueError, TypeError):
        customer = None
    if not customer or make_token(customer) != token:
        raise AuthError("Please sign in to view your account (demo login)")
    return customer


def _stats(customer: dict, bookings, sales) -> dict:
    cb = [b for b in bookings if b.get("customer_id") == customer["id"]]
    cs = [s for s in sales if s["customer_id"] == customer["id"] and s["status"] == "completed"]
    dates = [b["created_at"] for b in cb] + [s["created_at"] for s in cs]
    return {
        "total_bookings": len(cb),
        "total_purchases": len(cs),
        "total_spent": sum(s["selling_price"] for s in cs),
        "outstanding_balance": sum(s["balance"] for s in cs),
        "last_activity": max(dates) if dates else customer["registered_at"],
    }


def list_customers(q=None, city=None, sort="-registered_at", page=1, page_size=20):
    bookings, sales = bookings_repo.all(), sales_repo.all()
    rows = [{**_strip(c), **_stats(c, bookings, sales)} for c in customers_repo.all()]
    rows = [c for c in rows if text_match(c, q, ("name", "phone", "email", "city", "notes"))]
    if city:
        rows = [c for c in rows if (c.get("city") or "").lower() == city.lower()]
    rows = sort_records(rows, sort, "-registered_at")
    return paginate(rows, page, page_size)


def get_customer(customer_id: int) -> dict:
    c = customers_repo.get(customer_id)
    if not c:
        raise NotFoundError("Customer not found")
    return c


def history(customer_id: int) -> dict:
    c = get_customer(customer_id)
    bikes = {b["id"]: b["name"] for b in bikes_repo.all()}
    bookings = sort_records([{**b, "bike_name": bikes.get(b["bike_id"], "—")}
                             for b in bookings_repo.find(customer_id=customer_id)], "-created_at")
    sales = sort_records([{**s, "bike_name": bikes.get(s["bike_id"], "—")}
                          for s in sales_repo.find(customer_id=customer_id)], "-sale_date")
    enquiries = sort_records([e for e in enquiries_repo.all()
                              if (e.get("email") and e["email"].lower() == (c.get("email") or "").lower())
                              or normalize_phone(e.get("phone", "")) == c["phone"]], "-created_at")
    return {
        "customer": {**_strip(c), **_stats(c, bookings_repo.all(), sales_repo.all())},
        "bookings": bookings,
        "test_rides": [b for b in bookings if b["booking_type"] == "test_ride"],
        "sales": sales,
        "enquiries": enquiries,
    }


def _validate_contact(data: dict, exclude_id=None) -> dict:
    data = dict(data)
    if "phone" in data:
        phone = normalize_phone(data["phone"])
        if not phone:
            raise ValidationFailed("Enter a valid Pakistani mobile number, e.g. 0300-1234567")
        data["phone"] = phone
        for c in customers_repo.all():
            if c["id"] != exclude_id and c["phone"] == phone:
                raise ConflictError("A customer with this phone number already exists", code="duplicate")
    if data.get("email"):
        data["email"] = data["email"].strip().lower()
        for c in customers_repo.all():
            if c["id"] != exclude_id and (c.get("email") or "").lower() == data["email"]:
                raise ConflictError("A customer with this email already exists", code="duplicate")
    return data


def create_customer(data: dict, actor=None) -> dict:
    data = _validate_contact(data)
    password = data.pop("password", None)
    rec = customers_repo.add({
        "city": "", "notes": "", "source": "walk-in", **data,
        "password_hash": _hash(password) if password else None,
        "registered_at": now_iso(), "is_demo": False,
    })
    activity_service.log("create", "customer", rec["id"], f"Added customer '{rec['name']}'", actor)
    return _strip(rec)


def update_customer(customer_id: int, changes: dict, actor=None) -> dict:
    get_customer(customer_id)
    changes = _validate_contact(changes, exclude_id=customer_id)
    changes.pop("password", None)
    rec = customers_repo.update(customer_id, changes)
    activity_service.log("update", "customer", customer_id, f"Updated customer '{rec['name']}'", actor)
    return _strip(rec)


def delete_customer(customer_id: int, actor=None):
    c = get_customer(customer_id)
    if sales_repo.find(customer_id=customer_id):
        raise ConflictError("Customers with purchase records cannot be deleted (financial history must be kept).",
                            code="has_sales")
    for b in bookings_repo.find(customer_id=customer_id):
        bookings_repo.update(b["id"], {"customer_id": None})
    customers_repo.remove(customer_id)
    activity_service.log("delete", "customer", customer_id, f"Deleted customer '{c['name']}'", actor)


def find_or_create(name: str, phone: str, email: str | None, source: str) -> dict:
    normalized = normalize_phone(phone)
    existing = customers_repo.first(phone=normalized) if normalized else None
    if not existing and email:
        existing = next((c for c in customers_repo.all() if (c.get("email") or "").lower() == email.lower()), None)
    if existing:
        return existing
    return customers_repo.add({
        "name": name, "phone": normalized, "email": (email or "").lower(), "city": "", "notes": "",
        "source": source, "password_hash": None, "registered_at": now_iso(), "is_demo": False,
    })


# ---- Demo customer auth ----------------------------------------------------

def register(data: dict) -> dict:
    if len(data.get("password", "")) < 6:
        raise ValidationFailed("Password must be at least 6 characters")
    clean = _validate_contact(data)
    password = clean.pop("password")
    rec = customers_repo.add({**clean, "city": clean.get("city", ""), "notes": "", "source": "website",
                              "password_hash": _hash(password), "registered_at": now_iso(), "is_demo": False})
    activity_service.log("create", "customer", rec["id"], f"Customer '{rec['name']}' registered online", "Website")
    return {"token": make_token(rec), "customer": _strip(rec), "demo": True}


def login(email: str, password: str) -> dict:
    c = next((c for c in customers_repo.all() if (c.get("email") or "").lower() == email.strip().lower()), None)
    if not c or not c.get("password_hash") or c["password_hash"] != _hash(password):
        raise AuthError("Invalid email or password")
    return {"token": make_token(c), "customer": _strip(c), "demo": True}


def update_profile(token: str, changes: dict) -> dict:
    c = customer_from_token(token)
    allowed = {k: v for k, v in changes.items() if k in ("name", "phone", "email", "city")}
    clean = _validate_contact(allowed, exclude_id=c["id"])
    rec = customers_repo.update(c["id"], clean)
    # The demo token is derived from the email, so issue a fresh one.
    return {"token": make_token(rec), "customer": _strip(rec), "demo": True}
