from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.catalog import OfferCreate, OfferUpdate
from app.schemas.common import ok
from app.services import offer_service

router = APIRouter(prefix="/offers", tags=["Offers & Promotions"])


@router.get("", summary="List offers. Status is evaluated from dates on every request.")
def list_offers(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status", description="active, scheduled, expired, inactive"),
    public: bool = Query(False, description="Only currently valid offers"),
    paging: dict = Depends(page_params),
):
    rows, meta = offer_service.list_offers(q, status_filter, public=public, **paging)
    return ok(rows, meta)


@router.get("/{offer_id}")
def get_offer(offer_id: int):
    return ok(offer_service.get_offer(offer_id))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_offer(payload: OfferCreate, actor=Depends(get_actor)):
    return ok(offer_service.create_offer(dump(payload), actor), message="Offer created")


@router.put("/{offer_id}")
def update_offer(offer_id: int, payload: OfferUpdate, actor=Depends(get_actor)):
    return ok(offer_service.update_offer(offer_id, dump(payload, partial=True), actor), message="Offer updated")


@router.delete("/{offer_id}")
def delete_offer(offer_id: int, actor=Depends(get_actor)):
    offer_service.delete_offer(offer_id, actor)
    return ok(None, message="Offer deleted")
