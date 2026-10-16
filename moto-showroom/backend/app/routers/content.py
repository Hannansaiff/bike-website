from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, Query, status

from app.core.errors import ValidationFailed
from app.routers.deps import dump, get_actor, page_params
from app.routers.factory import collection_router
from app.schemas.common import ok
from app.schemas.content import (SECTION_SCHEMAS, BannerCreate, BannerUpdate, EnquiryCreate, EnquiryUpdate,
                                 FaqCreate, FaqUpdate, GalleryCreate, GalleryUpdate, Highlight, SettingsUpdate,
                                 StaffCreate, StaffUpdate, TestimonialCreate, TestimonialUpdate)
from app.services import content_service
from app.services.collection_service import CollectionService

router = APIRouter(tags=["Website Content"])


@router.get("/content", summary="All website content sections")
def get_content():
    return ok(content_service.get_content())


@router.put("/content/{section}", summary="Replace one content section")
def update_section(section: str, value: Any = Body(...), actor=Depends(get_actor)):
    if section in SECTION_SCHEMAS:
        value = SECTION_SCHEMAS[section].model_validate(value).model_dump(mode="json")
    elif section == "highlights":
        if not isinstance(value, list) or len(value) > 8:
            raise ValidationFailed("Highlights must be a list of up to 8 items")
        value = [Highlight.model_validate(v).model_dump() for v in value]
    elif section == "featured_bike_ids":
        if not isinstance(value, list) or not all(isinstance(v, int) for v in value) or len(value) > 12:
            raise ValidationFailed("Featured motorcycles must be a list of up to 12 ids")
    return ok(content_service.update_section(section, value, actor), message="Content saved")


@router.get("/settings", tags=["Settings"])
def get_settings():
    return ok(content_service.get_settings())


@router.put("/settings", tags=["Settings"])
def update_settings(payload: SettingsUpdate, actor=Depends(get_actor)):
    return ok(content_service.update_settings(dump(payload, partial=True), actor), message="Settings saved")


# ---- Collections ----------------------------------------------------------------

gallery_router = collection_router(content_service.gallery, "/gallery", "Gallery", GalleryCreate, GalleryUpdate, "visible")
banners_router = collection_router(content_service.banners, "/banners", "Banners", BannerCreate, BannerUpdate, "visible")
testimonials_router = collection_router(content_service.testimonials, "/testimonials", "Testimonials",
                                        TestimonialCreate, TestimonialUpdate, "visible")
faqs_router = collection_router(content_service.faqs, "/faqs", "FAQs", FaqCreate, FaqUpdate, "visible")


# ---- Staff ------------------------------------------------------------------------
staff_router = APIRouter(prefix="/staff", tags=["Staff"])


@staff_router.get("/roles", summary="Demo roles and the modules each can access")
def roles():
    return ok(content_service.roles())


@staff_router.get("")
def list_staff(q: Optional[str] = None, paging: dict = Depends(page_params)):
    rows, meta = content_service.staff.list(q=q, **paging)
    return ok(rows, meta)


@staff_router.post("", status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffCreate, actor=Depends(get_actor)):
    data = dump(payload)
    if not data.get("joined_at"):
        from app.core.utils import today_iso
        data["joined_at"] = today_iso()
    data["is_demo"] = True
    return ok(content_service.staff.create(data, actor), message="Staff member added")


@staff_router.put("/{staff_id}")
def update_staff(staff_id: int, payload: StaffUpdate, actor=Depends(get_actor)):
    changes = dump(payload, partial=True)
    current = content_service.staff.get(staff_id)
    leaving_owner = current["role"] == "owner" and (changes.get("role", "owner") != "owner" or changes.get("active") is False)
    if leaving_owner:
        content_service._staff_guard(current)
    return ok(content_service.staff.update(staff_id, changes, actor), message="Staff member updated")


@staff_router.delete("/{staff_id}")
def delete_staff(staff_id: int, actor=Depends(get_actor)):
    content_service.staff.delete(staff_id, actor)
    return ok(None, message="Staff member removed")


# ---- Contact enquiries ---------------------------------------------------------------
enquiries_router = APIRouter(prefix="/enquiries", tags=["Contact Enquiries"])


@enquiries_router.get("")
def list_enquiries(q: Optional[str] = None, status_filter: Optional[str] = Query(None, alias="status"),
                   paging: dict = Depends(page_params)):
    rows, meta = content_service.enquiries.list(q=q, filters={"status": status_filter}, **paging)
    return ok(rows, meta)


@enquiries_router.post("", status_code=status.HTTP_201_CREATED, summary="Submit the public contact form")
def create_enquiry(payload: EnquiryCreate):
    return ok(content_service.create_enquiry(dump(payload)), message="Thanks! We'll get back to you soon.")


@enquiries_router.get("/{enquiry_id}")
def get_enquiry(enquiry_id: int):
    return ok(content_service.enquiries.get(enquiry_id))


@enquiries_router.put("/{enquiry_id}")
def update_enquiry(enquiry_id: int, payload: EnquiryUpdate, actor=Depends(get_actor)):
    return ok(content_service.enquiries.update(enquiry_id, dump(payload, partial=True), actor), message="Enquiry updated")


@enquiries_router.delete("/{enquiry_id}")
def delete_enquiry(enquiry_id: int, actor=Depends(get_actor)):
    content_service.enquiries.delete(enquiry_id, actor)
    return ok(None, message="Enquiry deleted")
