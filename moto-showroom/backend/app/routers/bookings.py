from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.common import ok
from app.schemas.operations import BookingCreate, BookingStatusUpdate, BookingUpdate, NoteCreate
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("")
def list_bookings(
    q: Optional[str] = None,
    status: Optional[str] = Query(None, description="One or more statuses, comma-separated"),
    booking_type: Optional[str] = None,
    bike_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    upcoming: bool = False,
    sort: str = "-created_at",
    paging: dict = Depends(page_params),
):
    rows, meta = booking_service.list_bookings(q, status, booking_type, bike_id, date_from, date_to,
                                               upcoming, sort, **paging)
    return ok(rows, meta)


@router.get("/meta", summary="Booking statuses, types and allowed transitions")
def meta():
    return ok({"statuses": booking_service.STATUSES, "types": booking_service.TYPES,
               "transitions": {k: sorted(v) for k, v in booking_service.TRANSITIONS.items()}})


@router.get("/history", summary="Booking status-change history")
def status_history(paging: dict = Depends(page_params)):
    rows, meta = booking_service.status_history_feed(**paging)
    return ok(rows, meta)


@router.get("/track", summary="Public booking lookup by reference + phone")
def track(reference: str = Query(..., min_length=6), phone: str = Query(..., min_length=10)):
    return ok(booking_service.lookup(reference, phone))


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit a booking (public)")
def create_booking(payload: BookingCreate):
    return ok(booking_service.create_booking(dump(payload)), message="Booking request received")


@router.get("/{booking_id}")
def get_booking(booking_id: int):
    return ok(booking_service.get_booking(booking_id))


@router.put("/{booking_id}")
def update_booking(booking_id: int, payload: BookingUpdate, actor=Depends(get_actor)):
    return ok(booking_service.update_booking(booking_id, dump(payload, partial=True), actor), message="Booking updated")


@router.post("/{booking_id}/status")
def update_status(booking_id: int, payload: BookingStatusUpdate, actor=Depends(get_actor)):
    return ok(booking_service.update_status(booking_id, payload.status, payload.note, actor),
              message=f"Booking marked {payload.status}")


@router.post("/{booking_id}/notes")
def add_note(booking_id: int, payload: NoteCreate, actor=Depends(get_actor)):
    return ok(booking_service.add_note(booking_id, payload.text, actor), message="Note added")


@router.delete("/{booking_id}")
def delete_booking(booking_id: int, actor=Depends(get_actor)):
    booking_service.delete_booking(booking_id, actor)
    return ok(None, message="Booking deleted")
