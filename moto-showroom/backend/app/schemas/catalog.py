"""Request schemas: bikes, categories, brands, offers."""
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import partial

Condition = Literal["new", "used"]
ListingStatus = Literal["active", "upcoming", "discontinued"]
FuelType = Literal["Petrol", "Electric", "Hybrid"]


class BikeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    brand_id: int
    category_id: int
    model_year: int = Field(ge=1980, le=2035)
    price: int = Field(gt=0, le=100_000_000, description="Price in PKR")
    condition: Condition = "new"
    listing_status: ListingStatus = "active"
    featured: bool = False
    engine_cc: int = Field(ge=0, le=3000)
    fuel_type: FuelType = "Petrol"
    transmission: str = Field(min_length=2, max_length=60)
    mileage: str = Field(default="", max_length=60)
    max_power: str = Field(default="", max_length=60)
    colors: list[str] = Field(default_factory=list, max_length=12)
    warranty: str = Field(default="", max_length=160)
    registration: str = Field(default="", max_length=160)
    odometer_km: int = Field(default=0, ge=0, le=1_000_000)
    description: str = Field(default="", max_length=3000)
    features: list[str] = Field(default_factory=list, max_length=30)
    images: list[str] = Field(default_factory=list, max_length=12)
    low_stock_threshold: int = Field(default=2, ge=0, le=100)

    @field_validator("colors", "features", "images")
    @classmethod
    def strip_items(cls, v):
        return [s.strip() for s in v if s and s.strip()]


BikeUpdate = partial(BikeCreate, "BikeUpdate")


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: Optional[str] = Field(default=None, max_length=80, pattern=r"^[a-z0-9-]*$")
    description: str = Field(default="", max_length=500)
    image: str = Field(default="", max_length=500)
    order: Optional[int] = Field(default=None, ge=0)
    active: bool = True


CategoryUpdate = partial(CategoryCreate, "CategoryUpdate")


class BrandCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: Optional[str] = Field(default=None, max_length=80, pattern=r"^[a-z0-9-]*$")
    description: str = Field(default="", max_length=500)
    origin: str = Field(default="", max_length=80)
    color: str = Field(default="#ef4444", pattern=r"^#[0-9a-fA-F]{6}$")
    logo: str = Field(default="", max_length=500)
    order: Optional[int] = Field(default=None, ge=0)
    active: bool = True


BrandUpdate = partial(BrandCreate, "BrandUpdate")


class OfferCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(default="", max_length=1000)
    discount_type: Literal["percent", "fixed", "none"] = "percent"
    discount_value: float = Field(default=0, ge=0)
    bike_ids: list[int] = Field(default_factory=list)
    applies_to_all: bool = False
    start_date: date
    end_date: date
    banner: str = Field(default="", max_length=500)
    active: bool = True
    highlight: bool = False

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date")
        return self


OfferUpdate = partial(OfferCreate, "OfferUpdate")
