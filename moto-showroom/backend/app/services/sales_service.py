"""Sales, simulated payments and invoices.

- No real payment gateway: every payment is a recorded demo transaction.
- Recording a sale marks the chosen inventory unit as sold (atomically).
- Completed sales are never deleted. They can be archived (hidden from the
  default list) or reversed (unit returns to stock, payment marked refunded),
  preserving the full history.
"""
from app.core.errors import ConflictError, NotFoundError, ValidationFailed
from app.core.store import store
from app.core.utils import normalize_phone, now_iso, paginate, parse_date, sort_records, text_match, today
from app.repositories.base import (bikes_repo, bookings_repo, customers_repo, sales_repo,
                                   settings_repo, units_repo)
from app.services import activity_service, booking_service, customer_service, inventory_service
from app.services.offer_service import pricing_for_bike

PAYMENT_METHODS = {"cash": "Cash", "bank_transfer": "Bank Transfer", "card": "Card (simulated)",
                   "installment": "Installment", "cheque": "Cheque"}
DELIVERY = ["pending", "ready", "delivered"]


def payment_status(selling_price: int, paid: int, reversed_: bool = False) -> str:
    if reversed_:
        return "refunded"
    if paid <= 0:
        return "unpaid"
    if paid < selling_price:
        return "partially_paid"
    return "paid"


def _enrich(s: dict, bikes=None, customers=None, units=None) -> dict:
    bikes = bikes or {b["id"]: b for b in bikes_repo.all()}
    customers = customers or {c["id"]: c for c in customers_repo.all()}
    units = units or {u["id"]: u for u in units_repo.all()}
    bike, cust, unit = bikes.get(s["bike_id"]), customers.get(s["customer_id"]), units.get(s["unit_id"])
    return {
        **s,
        "bike_name": bike["name"] if bike else "Deleted model",
        "bike_image": (bike.get("images") or [None])[0] if bike else None,
        "bike": {k: bike.get(k) for k in ("name", "model_year", "engine_cc", "fuel_type", "transmission", "condition")} if bike else None,
        "customer_name": cust["name"] if cust else "Unknown customer",
        "customer": {k: cust.get(k) for k in ("id", "name", "phone", "email", "city")} if cust else None,
        "unit": {k: unit.get(k) for k in ("id", "chassis_no", "engine_no", "color")} if unit else None,
        "payment_method_label": PAYMENT_METHODS.get(s["payment_method"], s["payment_method"]),
    }


def list_sales(q=None, date_from=None, date_to=None, customer_id=None, bike_id=None, payment_status_filter=None,
               status=None, include_archived=False, sort="-sale_date", page=1, page_size=20):
    bikes = {b["id"]: b for b in bikes_repo.all()}
    customers = {c["id"]: c for c in customers_repo.all()}
    units = {u["id"]: u for u in units_repo.all()}
    rows = [_enrich(s, bikes, customers, units) for s in sales_repo.all()]
    if not include_archived:
        rows = [s for s in rows if not s["archived"]]
    rows = [s for s in rows if text_match(s, q, ("invoice_no", "customer_name", "bike_name", "notes"))]
    df, dt = parse_date(date_from), parse_date(date_to)
    if df:
        rows = [s for s in rows if parse_date(s["sale_date"]) >= df]
    if dt:
        rows = [s for s in rows if parse_date(s["sale_date"]) <= dt]
    if customer_id:
        rows = [s for s in rows if s["customer_id"] == customer_id]
    if bike_id:
        rows = [s for s in rows if s["bike_id"] == bike_id]
    if payment_status_filter:
        rows = [s for s in rows if s["payment_status"] == payment_status_filter]
    if status:
        rows = [s for s in rows if s["status"] == status]
    rows = sort_records(rows, sort, "-sale_date")
    totals = {
        "count": len(rows),
        "gross": sum(s["selling_price"] for s in rows if s["status"] == "completed"),
        "collected": sum(s["amount_paid"] for s in rows if s["status"] == "completed"),
        "outstanding": sum(s["balance"] for s in rows if s["status"] == "completed"),
    }
    items, meta = paginate(rows, page, page_size)
    meta["totals"] = totals
    return items, meta


def get_sale(sale_id: int) -> dict:
    s = sales_repo.get(sale_id)
    if not s:
        raise NotFoundError("Sale not found")
    return _enrich(s)


def invoice(sale_id: int) -> dict:
    sale = get_sale(sale_id)
    settings = settings_repo.get()
    from app.repositories.base import content_repo  # local import keeps module deps light
    contact = content_repo.get().get("contact", {})
    return {
        "sale": sale,
        "dealer": {
            "name": settings.get("business_name"), "tagline": settings.get("tagline"),
            "logo_text": settings.get("logo_text"), "logo_url": settings.get("logo_url"),
            "address": contact.get("address"), "phones": contact.get("phones", []), "email": contact.get("email"),
        },
        "terms": settings.get("invoice_terms", ""),
        "footer": settings.get("invoice_footer", ""),
        "currency": settings.get("currency", "PKR"),
        "is_demo": True,
    }


def _next_invoice_no() -> str:
    prefix = settings_repo.get().get("invoice_prefix", "INV")
    year = today().year
    nums = []
    for s in sales_repo.all():
        try:
            nums.append(int(s["invoice_no"].rsplit("-", 1)[1]))
        except (ValueError, IndexError):
            pass
    return f"{prefix}-{year}-{max(nums, default=1000) + 1}"


def create_sale(data: dict, actor=None) -> dict:
    with store.lock:  # prevents two simultaneous requests selling the same unit
        unit = units_repo.get(data["unit_id"])
        if not unit:
            raise ValidationFailed("Selected inventory unit does not exist")
        if unit["status"] == "sold":
            raise ConflictError("This unit has already been sold and cannot be sold again", code="already_sold")
        bike = bikes_repo.get(unit["bike_id"])
        if not bike:
            raise ValidationFailed("The unit's motorcycle model no longer exists")
        if data.get("bike_id") and data["bike_id"] != bike["id"]:
            raise ValidationFailed("The selected unit does not belong to the selected motorcycle")

        # Customer: existing id or inline new customer
        if data.get("customer_id"):
            customer = customers_repo.get(data["customer_id"])
            if not customer:
                raise ValidationFailed("Selected customer does not exist")
        elif data.get("new_customer"):
            nc = data["new_customer"]
            if not normalize_phone(nc.get("phone", "")):
                raise ValidationFailed("Enter a valid Pakistani mobile number for the new customer")
            customer = customer_service.find_or_create(nc["name"], nc["phone"], nc.get("email"), "walk-in")
        else:
            raise ValidationFailed("Select a customer or enter new customer details")

        list_price = int(data.get("list_price") or bike["price"])
        if data.get("discount") is None:
            discount = pricing_for_bike(bike)["discount"]
            discount_note = (pricing_for_bike(bike)["offer"] or {}).get("title", "")
        else:
            discount = int(data["discount"])
            discount_note = data.get("discount_note") or "Manual discount"
        if discount < 0 or discount > list_price:
            raise ValidationFailed("Discount must be between 0 and the list price")
        selling = list_price - discount
        advance = int(data.get("advance_payment") or 0)
        if advance < 0 or advance > selling:
            raise ValidationFailed("Advance payment must be between 0 and the selling price")
        sale_date = parse_date(data.get("sale_date")) or today()
        if sale_date > today():
            raise ValidationFailed("Sale date cannot be in the future")
        if data["payment_method"] not in PAYMENT_METHODS:
            raise ValidationFailed("Unknown payment method")
        booking_id = data.get("booking_id")
        if booking_id and not bookings_repo.get(booking_id):
            raise ValidationFailed("Linked booking not found")

        invoice_no = _next_invoice_no()
        payments = ([{"amount": advance, "date": sale_date.isoformat(), "method": data["payment_method"],
                      "note": "Advance / initial payment"}] if advance else [])
        rec = sales_repo.add({
            "invoice_no": invoice_no, "customer_id": customer["id"], "bike_id": bike["id"], "unit_id": unit["id"],
            "booking_id": booking_id, "sale_date": sale_date.isoformat(), "list_price": list_price,
            "discount": discount, "discount_note": discount_note if discount else "", "selling_price": selling,
            "payments": payments, "amount_paid": advance, "balance": selling - advance,
            "payment_status": payment_status(selling, advance), "payment_method": data["payment_method"],
            "delivery_status": data.get("delivery_status", "pending"), "status": "completed",
            "archived": False, "reversal": None, "notes": data.get("notes") or "",
            "sold_by": actor or activity_service.DEFAULT_ACTOR, "is_demo": True, "created_at": now_iso(),
        })
        inventory_service.mark_sold(unit["id"], invoice_no, actor)

    if booking_id:
        b = bookings_repo.get(booking_id)
        if b and "completed" in booking_service.TRANSITIONS.get(b["status"], set()):
            booking_service.update_status(booking_id, "completed", f"Converted to sale {invoice_no}", actor)
    activity_service.log("sale", "sale", rec["id"],
                         f"Recorded sale {invoice_no}: '{bike['name']}' to {customer['name']} for PKR {selling:,}", actor)
    return get_sale(rec["id"])


def add_payment(sale_id: int, amount: int, method: str, note: str = "", pay_date=None, actor=None) -> dict:
    s = sales_repo.get(sale_id)
    if not s:
        raise NotFoundError("Sale not found")
    if s["status"] != "completed":
        raise ConflictError("Payments cannot be added to a reversed sale")
    if amount <= 0:
        raise ValidationFailed("Payment amount must be greater than zero")
    if amount > s["balance"]:
        raise ValidationFailed(f"Payment exceeds the remaining balance of PKR {s['balance']:,}")
    if method not in PAYMENT_METHODS:
        raise ValidationFailed("Unknown payment method")
    pdate = parse_date(pay_date) or today()
    payments = s["payments"] + [{"amount": amount, "date": pdate.isoformat(), "method": method, "note": note}]
    paid = s["amount_paid"] + amount
    rec = sales_repo.update(sale_id, {
        "payments": payments, "amount_paid": paid, "balance": s["selling_price"] - paid,
        "payment_status": payment_status(s["selling_price"], paid), "updated_at": now_iso(),
    })
    activity_service.log("payment", "sale", sale_id, f"Recorded payment of PKR {amount:,} on {s['invoice_no']}", actor)
    return get_sale(rec["id"])


def update_sale(sale_id: int, changes: dict, actor=None) -> dict:
    """Only non-financial fields can be edited after a sale."""
    s = sales_repo.get(sale_id)
    if not s:
        raise NotFoundError("Sale not found")
    allowed = {k: v for k, v in changes.items() if k in ("delivery_status", "notes", "archived")}
    if "delivery_status" in allowed and allowed["delivery_status"] not in DELIVERY:
        raise ValidationFailed("Unknown delivery status")
    allowed["updated_at"] = now_iso()
    sales_repo.update(sale_id, allowed)
    what = "archived" if allowed.get("archived") else ("unarchived" if allowed.get("archived") is False else "updated")
    activity_service.log("update", "sale", sale_id, f"Sale {s['invoice_no']} {what}", actor)
    return get_sale(sale_id)


def reverse_sale(sale_id: int, reason: str, actor=None) -> dict:
    with store.lock:
        s = sales_repo.get(sale_id)
        if not s:
            raise NotFoundError("Sale not found")
        if s["status"] == "reversed":
            raise ConflictError("This sale has already been reversed")
        reversal = {"date": today().isoformat(), "reason": reason, "refunded_amount": s["amount_paid"],
                    "actor": actor or activity_service.DEFAULT_ACTOR, "at": now_iso()}
        sales_repo.update(sale_id, {"status": "reversed", "payment_status": "refunded",
                                    "reversal": reversal, "updated_at": now_iso()})
        inventory_service.return_to_stock(s["unit_id"], s["invoice_no"], actor)
    activity_service.log("reversal", "sale", sale_id,
                         f"Reversed sale {s['invoice_no']} (refund PKR {s['amount_paid']:,}): {reason}", actor)
    return get_sale(sale_id)


def customer_sales(token: str) -> list[dict]:
    c = customer_service.customer_from_token(token)
    rows, _ = list_sales(customer_id=c["id"], include_archived=True, page_size=500)
    return rows
