"""Bookings: test rides, showroom visits and purchase enquiries.

A booking is a *request*. It never changes inventory by itself – staff reserve
units in the Inventory module and record sales in the Sales module.
"""
import random
from datetime import datetime, timedelta

from app.core.errors import AuthError, NotFoundError, ValidationFailed
from app.core.utils import normalize_phone, now_iso, paginate, parse_date, sort_records, text_match, today
from app.repositories.base import bikes_repo, bookings_repo, settings_repo
from app.services import activity_service, customer_service

STATUSES = ["pending", "confirmed", "contacted", "completed", "rejected", "cancelled"]
TYPES = {"test_ride": "Test Ride", "showroom_visit": "Showroom Visit", "purchase_enquiry": "Purchase Enquiry"}
TRANSITIONS = {
    "pending": {"confirmed", "contacted", "rejected", "cancelled"},
    "contacted": {"confirmed", "completed", "rejected", "cancelled"},
    "confirmed": {"contacted", "completed", "cancelled"},
    "completed": set(),
    "rejected": set(),
    "cancelled": set(),
}
MAX_DAYS_AHEAD = 90


def _enrich(b: dict, bikes: dict) -> dict:
    bike = bikes.get(b["bike_id"])
    return {
        **b,
        "bike_name": bike["name"] if bike else "Deleted model",
        "bike_slug": bike["slug"] if bike else None,
        "bike_image": (bike.get("images") or [None])[0] if bike else None,
        "type_label": TYPES.get(b["booking_type"], b["booking_type"]),
        "allowed_transitions": sorted(TRANSITIONS.get(b["status"], set())),
    }


def _bikes():
    return {b["id"]: b for b in bikes_repo.all()}


def _new_reference() -> str:
    existing = {b["reference"] for b in bookings_repo.all()}
    stamp = datetime.now().strftime("%y%m")
    while True:
        ref = f"BK-{stamp}-{random.randint(1000, 9999)}"
        if ref not in existing:
            return ref


def list_bookings(q=None, status=None, booking_type=None, bike_id=None, date_from=None, date_to=None,
                  upcoming=None, sort="-created_at", page=1, page_size=20):
    bikes = _bikes()
    rows = [_enrich(b, bikes) for b in bookings_repo.all()]
    rows = [b for b in rows if text_match(b, q, ("reference", "name", "phone", "email", "bike_name", "message"))]
    if status:
        wanted = status.split(",")
        rows = [b for b in rows if b["status"] in wanted]
    if booking_type:
        rows = [b for b in rows if b["booking_type"] == booking_type]
    if bike_id:
        rows = [b for b in rows if b["bike_id"] == bike_id]
    df, dt = parse_date(date_from), parse_date(date_to)
    if df:
        rows = [b for b in rows if parse_date(b["preferred_date"]) >= df]
    if dt:
        rows = [b for b in rows if parse_date(b["preferred_date"]) <= dt]
    if upcoming:
        rows = [b for b in rows if parse_date(b["preferred_date"]) >= today() and b["status"] in ("pending", "confirmed", "contacted")]
    rows = sort_records(rows, sort, "-created_at")
    return paginate(rows, page, page_size)


def get_booking(booking_id: int) -> dict:
    b = bookings_repo.get(booking_id)
    if not b:
        raise NotFoundError("Booking not found")
    return _enrich(b, _bikes())


def lookup(reference: str, phone: str) -> dict:
    """Public tracking – requires the reference AND the phone used to book."""
    b = bookings_repo.first(reference=reference.strip().upper())
    if not b or normalize_phone(phone) != b["phone"]:
        raise NotFoundError("No booking matches that reference and phone number")
    data = _enrich(b, _bikes())
    data.pop("notes", None)  # internal staff notes are never shown publicly
    for h in data["status_history"]:
        h.pop("actor", None)
    return data


def _validate_schedule(preferred_date, preferred_time):
    d = parse_date(preferred_date)
    if d < today():
        raise ValidationFailed("Preferred date cannot be in the past")
    if d > today() + timedelta(days=MAX_DAYS_AHEAD):
        raise ValidationFailed(f"Bookings can be made up to {MAX_DAYS_AHEAD} days ahead")
    s = settings_repo.get()
    open_t, close_t = s.get("booking_open_time", "10:00"), s.get("booking_close_time", "20:00")
    if not (open_t <= preferred_time <= close_t):
        raise ValidationFailed(f"Please choose a time between {open_t} and {close_t}")
    if d == today() and preferred_time <= datetime.now().strftime("%H:%M"):
        raise ValidationFailed("Please choose a later time today")


def create_booking(data: dict, source="Website") -> dict:
    bike = bikes_repo.get(data["bike_id"])
    if not bike:
        raise ValidationFailed("Selected motorcycle does not exist")
    if bike["listing_status"] == "discontinued":
        raise ValidationFailed("This model is discontinued and cannot be booked")
    if data["booking_type"] == "test_ride" and bike["listing_status"] == "upcoming":
        raise ValidationFailed("Test rides are not available for upcoming models – choose a showroom visit or purchase enquiry")
    phone = normalize_phone(data["phone"])
    if not phone:
        raise ValidationFailed("Enter a valid Pakistani mobile number, e.g. 0300-1234567")
    _validate_schedule(data["preferred_date"], data["preferred_time"])
    customer = customer_service.find_or_create(data["name"], phone, data.get("email"), "booking")
    created = now_iso()
    rec = bookings_repo.add({
        "reference": _new_reference(),
        "bike_id": bike["id"],
        "customer_id": customer["id"],
        "name": data["name"].strip(),
        "phone": phone,
        "email": (data.get("email") or "").lower(),
        "booking_type": data["booking_type"],
        "preferred_date": parse_date(data["preferred_date"]).isoformat(),
        "preferred_time": data["preferred_time"],
        "message": data.get("message") or "",
        "status": "pending",
        "notes": [],
        "status_history": [{"from": None, "to": "pending", "note": "Booking submitted", "actor": source, "at": created}],
        "created_at": created,
        "updated_at": created,
    })
    activity_service.log("create", "booking", rec["id"],
                         f"New {TYPES[rec['booking_type']].lower()} {rec['reference']} for '{bike['name']}'", source)
    return _enrich(rec, _bikes())


def update_status(booking_id: int, status: str, note: str = "", actor=None) -> dict:
    b = bookings_repo.get(booking_id)
    if not b:
        raise NotFoundError("Booking not found")
    if status not in STATUSES:
        raise ValidationFailed("Unknown booking status")
    if status == b["status"]:
        raise ValidationFailed(f"Booking is already {status}")
    if status not in TRANSITIONS[b["status"]]:
        allowed = ", ".join(sorted(TRANSITIONS[b["status"]])) or "none (final status)"
        raise ValidationFailed(f"Cannot change a {b['status']} booking to {status}. Allowed: {allowed}")
    at = now_iso()
    history = b["status_history"] + [{"from": b["status"], "to": status, "note": note,
                                      "actor": actor or activity_service.DEFAULT_ACTOR, "at": at}]
    rec = bookings_repo.update(booking_id, {"status": status, "status_history": history, "updated_at": at})
    activity_service.log("status_change", "booking", booking_id,
                         f"Booking {b['reference']} changed from {b['status']} to {status}", actor)
    return _enrich(rec, _bikes())


def add_note(booking_id: int, text: str, actor=None) -> dict:
    b = bookings_repo.get(booking_id)
    if not b:
        raise NotFoundError("Booking not found")
    notes = b["notes"] + [{"text": text, "actor": actor or activity_service.DEFAULT_ACTOR, "at": now_iso()}]
    rec = bookings_repo.update(booking_id, {"notes": notes, "updated_at": now_iso()})
    activity_service.log("note", "booking", booking_id, f"Note added to booking {b['reference']}", actor)
    return _enrich(rec, _bikes())


def update_booking(booking_id: int, changes: dict, actor=None) -> dict:
    """Staff can reschedule open bookings."""
    b = bookings_repo.get(booking_id)
    if not b:
        raise NotFoundError("Booking not found")
    if b["status"] in ("completed", "rejected", "cancelled"):
        raise ValidationFailed("Closed bookings cannot be edited")
    merged = {**b, **changes}
    if "preferred_date" in changes or "preferred_time" in changes:
        _validate_schedule(merged["preferred_date"], merged["preferred_time"])
        changes["preferred_date"] = parse_date(merged["preferred_date"]).isoformat()
    if "phone" in changes:
        phone = normalize_phone(changes["phone"])
        if not phone:
            raise ValidationFailed("Enter a valid Pakistani mobile number")
        changes["phone"] = phone
    changes["updated_at"] = now_iso()
    rec = bookings_repo.update(booking_id, changes)
    activity_service.log("update", "booking", booking_id, f"Edited booking {b['reference']}", actor)
    return _enrich(rec, _bikes())


def delete_booking(booking_id: int, actor=None):
    b = bookings_repo.get(booking_id)
    if not b:
        raise NotFoundError("Booking not found")
    bookings_repo.remove(booking_id)
    activity_service.log("delete", "booking", booking_id, f"Deleted booking {b['reference']}", actor)


def customer_bookings(token: str) -> list[dict]:
    c = customer_service.customer_from_token(token)
    if not c:
        raise AuthError("Sign in required")
    rows, _ = list_bookings(page_size=500)
    return [b for b in rows if b.get("customer_id") == c["id"]]


def status_history_feed(page=1, page_size=25):
    """Flattened booking status-change history for the reports/history view."""
    bikes = _bikes()
    events = []
    for b in bookings_repo.all():
        for h in b["status_history"]:
            events.append({"booking_id": b["id"], "reference": b["reference"], "customer": b["name"],
                           "bike_name": bikes.get(b["bike_id"], {}).get("name", "—"), **h})
    events = sort_records(events, "-at")
    return paginate(events, page, page_size)
