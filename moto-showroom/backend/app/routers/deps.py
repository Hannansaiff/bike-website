"""Shared router dependencies."""
from typing import Optional

from fastapi import Header, Query

from app.config import settings


def get_actor(x_demo_actor: Optional[str] = Header(default=None)) -> Optional[str]:
    """Name of the admin performing an action, sent by the admin UI.

    DEMO ONLY: this header is trusted for activity-log attribution. Production
    must derive the actor from a verified token instead.
    """
    return (x_demo_actor or "").strip()[:80] or None


def get_customer_token(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def page_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
):
    return {"page": page, "page_size": page_size}


def dump(model, partial: bool = False) -> dict:
    """Serialise a request model for services.

    Create requests keep defaults; partial updates only include fields the
    client actually sent (and ignore explicit nulls).
    """
    if partial:
        return model.model_dump(mode="json", exclude_unset=True, exclude_none=True)
    return model.model_dump(mode="json")
