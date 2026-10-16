"""DEMO authentication endpoints (admin + customer).

These endpoints demonstrate the flow only. Other API endpoints are NOT
protected in demo mode – see README → Security before production.
"""
from fastapi import APIRouter, Depends, status

from app.routers.deps import dump, get_customer_token
from app.schemas.common import ok
from app.schemas.operations import CustomerRegister, LoginRequest, ProfileUpdate
from app.services import auth_service, booking_service, customer_service, sales_service

router = APIRouter(prefix="/auth", tags=["Demo Authentication"])


@router.post("/admin/login")
def admin_login(payload: LoginRequest):
    return ok(auth_service.admin_login(payload.email, payload.password), message="Signed in (demo)")


@router.post("/customer/register", status_code=status.HTTP_201_CREATED)
def customer_register(payload: CustomerRegister):
    return ok(customer_service.register(dump(payload)), message="Account created (demo)")


@router.post("/customer/login")
def customer_login(payload: LoginRequest):
    return ok(customer_service.login(payload.email, payload.password), message="Signed in (demo)")


account = APIRouter(prefix="/account", tags=["Customer Account (demo)"])


@account.get("/overview", summary="Profile, bookings, test rides, purchases and enquiries")
def overview(token: str = Depends(get_customer_token)):
    customer = customer_service.customer_from_token(token)
    data = customer_service.history(customer["id"])
    return ok(data)


@account.put("/profile")
def update_profile(payload: ProfileUpdate, token: str = Depends(get_customer_token)):
    return ok(customer_service.update_profile(token, dump(payload, partial=True)), message="Profile updated")
