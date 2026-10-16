"""Website content (CMS), showroom settings and simple content collections."""
from app.core.errors import ConflictError, ValidationFailed
from app.core.utils import normalize_phone, now_iso
from app.repositories.base import (banners_repo, bikes_repo, brands_repo, categories_repo, content_repo,
                                   enquiries_repo, faqs_repo, gallery_repo, settings_repo, staff_repo,
                                   testimonials_repo)
from app.services import activity_service
from app.services.collection_service import CollectionService

SECTIONS = ("hero", "featured_bike_ids", "intro", "highlights", "home_sections", "about", "contact", "social", "footer")


def get_content() -> dict:
    return content_repo.get()


def update_section(section: str, value, actor=None) -> dict:
    if section not in SECTIONS:
        raise ValidationFailed(f"Unknown content section '{section}'")
    if section == "featured_bike_ids":
        known = {b["id"] for b in bikes_repo.all()}
        bad = [i for i in value if i not in known]
        if bad:
            raise ValidationFailed(f"Unknown motorcycle ids: {bad}")
    content_repo.set_section(section, value)
    activity_service.log("content", "content", None, f"Edited website content section '{section}'", actor)
    return get_content()


def get_settings() -> dict:
    return settings_repo.get()


def update_settings(changes: dict, actor=None) -> dict:
    current = settings_repo.get()
    current.update(changes)
    if current.get("booking_open_time", "10:00") >= current.get("booking_close_time", "20:00"):
        raise ValidationFailed("Booking opening time must be before closing time")
    settings_repo.replace(current)
    activity_service.log("settings", "settings", None, "Updated showroom settings", actor)
    return settings_repo.get()


# ---- Simple collections ------------------------------------------------------

def _category_guard(cat: dict):
    if any(b["category_id"] == cat["id"] for b in bikes_repo.all()):
        raise ConflictError("This category still has motorcycles. Move them or deactivate the category instead.",
                            code="in_use")


def _brand_guard(brand: dict):
    if any(b["brand_id"] == brand["id"] for b in bikes_repo.all()):
        raise ConflictError("This brand still has motorcycles. Move them or deactivate the brand instead.", code="in_use")


def _staff_guard(member: dict):
    owners = [s for s in staff_repo.all() if s["role"] == "owner" and s["active"]]
    if member["role"] == "owner" and len(owners) <= 1:
        raise ConflictError("At least one active Owner/Admin account must remain", code="last_owner")


categories = CollectionService(categories_repo, "category", searchable=("name", "description"), ordered=True,
                               slug_field="name", unique_fields=("name", "slug"), before_delete=_category_guard)
brands = CollectionService(brands_repo, "brand", searchable=("name", "description", "origin"), ordered=True,
                           slug_field="name", unique_fields=("name", "slug"), before_delete=_brand_guard)
gallery = CollectionService(gallery_repo, "gallery image", label_field="title", searchable=("title", "caption", "category"),
                            ordered=True, timestamps=False)
banners = CollectionService(banners_repo, "banner", label_field="title", searchable=("title", "subtitle"),
                            ordered=True, timestamps=False)
testimonials = CollectionService(testimonials_repo, "testimonial", searchable=("name", "text", "bike_label", "city"),
                                 ordered=True, timestamps=False)
faqs = CollectionService(faqs_repo, "faq", label_field="question", searchable=("question", "answer"),
                         ordered=True, timestamps=False)
staff = CollectionService(staff_repo, "staff member", searchable=("name", "email", "role", "phone"),
                          default_sort="name", unique_fields=("email",), before_delete=_staff_guard)
enquiries = CollectionService(enquiries_repo, "enquiry", label_field="subject",
                              searchable=("name", "email", "phone", "subject", "message"), default_sort="-created_at")


def create_enquiry(data: dict) -> dict:
    phone = normalize_phone(data["phone"])
    if not phone:
        raise ValidationFailed("Enter a valid Pakistani mobile number, e.g. 0300-1234567")
    return enquiries.create({**data, "phone": phone, "email": (data.get("email") or "").lower(),
                             "status": "new", "notes": "", "created_at": now_iso()}, actor="Website")


# ---- Staff roles (prepared RBAC structure; enforced client-side in demo only) ---

ROLES = {
    "owner": {"label": "Owner / Admin", "modules": ["*"]},
    "manager": {"label": "Manager", "modules": ["dashboard", "bikes", "categories", "brands", "bookings", "customers",
                                                 "sales", "inventory", "offers", "gallery", "content", "enquiries",
                                                 "reports", "activity-logs"]},
    "sales": {"label": "Sales Representative", "modules": ["dashboard", "bikes", "bookings", "customers", "sales",
                                                          "enquiries"]},
    "inventory": {"label": "Inventory Manager", "modules": ["dashboard", "bikes", "categories", "brands", "inventory",
                                                           "reports"]},
}


def roles() -> dict:
    return ROLES
