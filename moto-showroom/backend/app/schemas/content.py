"""Request schemas: CMS content, settings, gallery, banners, testimonials, FAQs,
staff and contact enquiries."""
import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import partial


class CTA(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    link: str = Field(min_length=1, max_length=200)


class HeroContent(BaseModel):
    eyebrow: str = Field(default="", max_length=80)
    title: str = Field(min_length=3, max_length=120)
    highlight: str = Field(default="", max_length=60)
    subtitle: str = Field(default="", max_length=400)
    image: str = Field(default="", max_length=500)
    primary_cta: CTA
    secondary_cta: CTA
    tertiary_cta: CTA


class IntroContent(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    text: str = Field(default="", max_length=1500)


class Highlight(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    value: int = Field(ge=0)
    suffix: str = Field(default="", max_length=5)


class AboutContent(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    story: str = Field(default="", max_length=5000)
    mission: str = Field(default="", max_length=1000)
    vision: str = Field(default="", max_length=1000)
    image: str = Field(default="", max_length=500)


class HourRow(BaseModel):
    day: str = Field(min_length=1, max_length=40)
    time: str = Field(min_length=1, max_length=40)


class ContactContent(BaseModel):
    phones: list[str] = Field(default_factory=list, max_length=5)
    whatsapp: str = Field(default="", max_length=20)
    email: str = Field(default="", max_length=120)
    address: str = Field(default="", max_length=300)
    city: str = Field(default="", max_length=80)
    map_embed_url: str = Field(default="", max_length=1000)
    map_query: str = Field(default="", max_length=300)
    hours: list[HourRow] = Field(default_factory=list, max_length=10)

    @field_validator("map_embed_url")
    @classmethod
    def only_google_embed(cls, v):
        if v and not re.match(r"^https://(www\.)?google\.com/maps/embed", v):
            raise ValueError("Map embed URL must start with https://www.google.com/maps/embed")
        return v


class SocialContent(BaseModel):
    facebook: str = ""
    instagram: str = ""
    youtube: str = ""
    tiktok: str = ""
    twitter: str = ""


class FooterContent(BaseModel):
    text: str = Field(default="", max_length=500)
    copyright: str = Field(default="", max_length=120)


class HomeSections(BaseModel):
    featured: bool = True
    latest: bool = True
    brands: bool = True
    offers: bool = True
    used: bool = True
    electric: bool = True
    scooters: bool = True
    best_sellers: bool = True
    testimonials: bool = True
    highlights: bool = True
    faqs: bool = True
    banners: bool = True


SECTION_SCHEMAS = {
    "hero": HeroContent,
    "intro": IntroContent,
    "about": AboutContent,
    "contact": ContactContent,
    "social": SocialContent,
    "footer": FooterContent,
    "home_sections": HomeSections,
}


class SettingsUpdate(BaseModel):
    business_name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    tagline: Optional[str] = Field(default=None, max_length=120)
    logo_text: Optional[str] = Field(default=None, min_length=1, max_length=20)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    currency: Optional[Literal["PKR"]] = None
    default_theme: Optional[Literal["dark", "light"]] = None
    invoice_prefix: Optional[str] = Field(default=None, min_length=2, max_length=6, pattern=r"^[A-Z]+$")
    invoice_terms: Optional[str] = Field(default=None, max_length=3000)
    invoice_footer: Optional[str] = Field(default=None, max_length=200)
    default_low_stock_threshold: Optional[int] = Field(default=None, ge=0, le=100)
    booking_open_time: Optional[str] = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    booking_close_time: Optional[str] = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


class GalleryCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    caption: str = Field(default="", max_length=300)
    category: Literal["showroom", "bikes", "events"] = "bikes"
    image: str = Field(min_length=5, max_length=500)
    order: Optional[int] = Field(default=None, ge=0)
    visible: bool = True


GalleryUpdate = partial(GalleryCreate, "GalleryUpdate")


class BannerCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    subtitle: str = Field(default="", max_length=300)
    image: str = Field(default="", max_length=500)
    cta_label: str = Field(default="", max_length=40)
    cta_link: str = Field(default="", max_length=200)
    order: Optional[int] = Field(default=None, ge=0)
    visible: bool = True


BannerUpdate = partial(BannerCreate, "BannerUpdate")


class TestimonialCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    city: str = Field(default="", max_length=60)
    rating: int = Field(default=5, ge=1, le=5)
    text: str = Field(min_length=10, max_length=800)
    bike_label: str = Field(default="", max_length=100)
    order: Optional[int] = Field(default=None, ge=0)
    visible: bool = True


TestimonialUpdate = partial(TestimonialCreate, "TestimonialUpdate")


class FaqCreate(BaseModel):
    question: str = Field(min_length=5, max_length=200)
    answer: str = Field(min_length=5, max_length=2000)
    order: Optional[int] = Field(default=None, ge=0)
    visible: bool = True


FaqUpdate = partial(FaqCreate, "FaqUpdate")


class StaffCreate(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=20)
    role: Literal["owner", "manager", "sales", "inventory"] = "sales"
    active: bool = True
    joined_at: Optional[str] = None


StaffUpdate = partial(StaffCreate, "StaffUpdate")


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    phone: str = Field(min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    subject: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, v):
        return v or None


class EnquiryUpdate(BaseModel):
    status: Optional[Literal["new", "in_progress", "resolved"]] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
