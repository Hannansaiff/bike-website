"""Request schemas: bookings, customers, inventory, sales, auth."""
import re
from datetime import date
from typing import Literal, Optional

from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field, field_validator, model_validator

from app.schemas.common import partial

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
BookingType = Literal["test_ride", "showroom_visit", "purchase_enquiry"]
BookingStatus = Literal["pending", "confirmed", "contacted", "completed", "rejected", "cancelled"]
PaymentMethod = Literal["cash", "bank_transfer", "card", "installment", "cheque"]
DeliveryStatus = Literal["pending", "ready", "delivered"]


def _phone(v: str) -> str:
    digits = re.sub(r"[\s\-()]", "", v or "")
    if not re.match(r"^(?:\+92|0092|0)?3\d{9}$", digits):
        raise ValueError("Enter a valid Pakistani mobile number, e.g. 0300-1234567")
    return v


PhoneStr = Annotated[str, AfterValidator(_phone)]


class BookingCreate(BaseModel):
    bike_id: int
    name: str = Field(min_length=3, max_length=80)
    phone: PhoneStr
    email: Optional[EmailStr] = None
    booking_type: BookingType
    preferred_date: date
    preferred_time: str
    message: str = Field(default="", max_length=1000)

    @field_validator("preferred_time")
    @classmethod
    def check_time(cls, v):
        if not TIME_RE.match(v):
            raise ValueError("Time must be in HH:MM format")
        return v

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, v):
        return v or None


class BookingUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=80)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_date: Optional[date] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("preferred_time")
    @classmethod
    def check_time(cls, v):
        if v is not None and not TIME_RE.match(v):
            raise ValueError("Time must be in HH:MM format")
        return v

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, v):
        return v or None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    note: str = Field(default="", max_length=500)


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class CustomerCreate(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    phone: PhoneStr
    email: Optional[EmailStr] = None
    city: str = Field(default="", max_length=60)
    notes: str = Field(default="", max_length=2000)
    source: Literal["walk-in", "website", "referral", "booking", "phone"] = "walk-in"

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, v):
        return v or None


CustomerUpdate = partial(CustomerCreate, "CustomerUpdate")


class CustomerRegister(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    phone: PhoneStr
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    city: str = Field(default="", max_length=60)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=100)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=80)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = Field(default=None, max_length=60)


class StockAdd(BaseModel):
    bike_id: int
    quantity: int = Field(default=1, ge=1, le=50)
    chassis_no: Optional[str] = Field(default=None, max_length=40)
    engine_no: Optional[str] = Field(default=None, max_length=40)
    color: Optional[str] = Field(default=None, max_length=40)
    purchase_cost: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    notes: str = Field(default="", max_length=500)


class UnitUpdate(BaseModel):
    chassis_no: Optional[str] = Field(default=None, max_length=40)
    engine_no: Optional[str] = Field(default=None, max_length=40)
    color: Optional[str] = Field(default=None, max_length=40)
    purchase_cost: Optional[int] = Field(default=None, ge=0, le=100_000_000)
    notes: Optional[str] = Field(default=None, max_length=500)


class UnitStatusUpdate(BaseModel):
    status: Literal["in_stock", "reserved"]
    note: str = Field(default="", max_length=500)
    booking_id: Optional[int] = None


class NewCustomerInline(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    phone: PhoneStr
    email: Optional[EmailStr] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, v):
        return v or None


class SaleCreate(BaseModel):
    unit_id: int
    bike_id: Optional[int] = None
    customer_id: Optional[int] = None
    new_customer: Optional[NewCustomerInline] = None
    booking_id: Optional[int] = None
    sale_date: Optional[date] = None
    list_price: Optional[int] = Field(default=None, gt=0)
    discount: Optional[int] = Field(default=None, ge=0)
    discount_note: str = Field(default="", max_length=200)
    advance_payment: int = Field(default=0, ge=0)
    payment_method: PaymentMethod = "cash"
    delivery_status: DeliveryStatus = "pending"
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def need_customer(self):
        if not self.customer_id and not self.new_customer:
            raise ValueError("Select an existing customer or enter new customer details")
        return self


class PaymentCreate(BaseModel):
    amount: int = Field(gt=0)
    method: PaymentMethod = "cash"
    note: str = Field(default="", max_length=200)
    date: Optional[date] = None


class SaleUpdate(BaseModel):
    delivery_status: Optional[DeliveryStatus] = None
    notes: Optional[str] = Field(default=None, max_length=1000)
    archived: Optional[bool] = None


class SaleReverse(BaseModel):
    reason: str = Field(min_length=5, max_length=500)
