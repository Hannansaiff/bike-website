from typing import Optional

from fastapi import APIRouter, Depends, status

from app.routers.deps import dump, get_actor, page_params
from app.schemas.common import ok
from app.schemas.operations import CustomerCreate, CustomerUpdate
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("")
def list_customers(q: Optional[str] = None, city: Optional[str] = None, sort: str = "-registered_at",
                   paging: dict = Depends(page_params)):
    rows, meta = customer_service.list_customers(q, city, sort, **paging)
    return ok(rows, meta)


@router.get("/{customer_id}")
def get_customer(customer_id: int):
    return ok(customer_service.history(customer_id))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, actor=Depends(get_actor)):
    return ok(customer_service.create_customer(dump(payload), actor), message="Customer added")


@router.put("/{customer_id}")
def update_customer(customer_id: int, payload: CustomerUpdate, actor=Depends(get_actor)):
    return ok(customer_service.update_customer(customer_id, dump(payload, partial=True), actor), message="Customer updated")


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, actor=Depends(get_actor)):
    customer_service.delete_customer(customer_id, actor)
    return ok(None, message="Customer deleted")
