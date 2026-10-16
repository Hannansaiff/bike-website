from typing import Optional

from fastapi import APIRouter, Depends, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.common import ok
from app.schemas.operations import PaymentCreate, SaleCreate, SaleReverse, SaleUpdate
from app.services import sales_service

router = APIRouter(prefix="/sales", tags=["Sales & Invoices"])


@router.get("")
def list_sales(
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer_id: Optional[int] = None,
    bike_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    status: Optional[str] = None,
    include_archived: bool = False,
    sort: str = "-sale_date",
    paging: dict = Depends(page_params),
):
    rows, meta = sales_service.list_sales(q, date_from, date_to, customer_id, bike_id, payment_status, status,
                                          include_archived, sort, **paging)
    return ok(rows, meta)


@router.get("/meta")
def meta():
    return ok({"payment_methods": sales_service.PAYMENT_METHODS, "delivery_statuses": sales_service.DELIVERY,
               "payment_statuses": ["unpaid", "partially_paid", "paid", "refunded"]})


@router.post("", status_code=status.HTTP_201_CREATED, summary="Record a sale (marks the unit as sold)")
def create_sale(payload: SaleCreate, actor=Depends(get_actor)):
    return ok(sales_service.create_sale(dump(payload), actor), message="Sale recorded")


@router.get("/{sale_id}")
def get_sale(sale_id: int):
    return ok(sales_service.get_sale(sale_id))


@router.get("/{sale_id}/invoice")
def invoice(sale_id: int):
    return ok(sales_service.invoice(sale_id))


@router.post("/{sale_id}/payments", summary="Record a simulated payment")
def add_payment(sale_id: int, payload: PaymentCreate, actor=Depends(get_actor)):
    sale = sales_service.add_payment(sale_id, payload.amount, payload.method, payload.note,
                                     payload.date.isoformat() if payload.date else None, actor)
    return ok(sale, message="Payment recorded")


@router.put("/{sale_id}", summary="Update delivery status, notes or archive flag")
def update_sale(sale_id: int, payload: SaleUpdate, actor=Depends(get_actor)):
    return ok(sales_service.update_sale(sale_id, payload.model_dump(exclude_none=True), actor), message="Sale updated")


@router.post("/{sale_id}/reverse", summary="Reverse a sale (no deletion – keeps history)")
def reverse_sale(sale_id: int, payload: SaleReverse, actor=Depends(get_actor)):
    return ok(sales_service.reverse_sale(sale_id, payload.reason, actor), message="Sale reversed and unit returned to stock")
