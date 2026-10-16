"""Shared schema helpers and response envelopes."""
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field, create_model

T = TypeVar("T")


class Meta(BaseModel):
    model_config = ConfigDict(extra="allow")
    page: Optional[int] = None
    page_size: Optional[int] = None
    total: Optional[int] = None
    pages: Optional[int] = None


class Envelope(BaseModel, Generic[T]):
    """Every successful response: {"success": true, "data": ..., "meta": ...}"""
    success: bool = True
    data: T
    meta: Optional[Meta] = None
    message: Optional[str] = None


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict = Field(default_factory=dict)


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: ErrorBody


class ReorderRequest(BaseModel):
    ids: list[int] = Field(min_length=1)


class StatusNote(BaseModel):
    status: str
    note: str = Field(default="", max_length=500)


def ok(data: Any = None, meta: dict | None = None, message: str | None = None) -> dict:
    out = {"success": True, "data": data}
    if meta is not None:
        out["meta"] = meta
    if message:
        out["message"] = message
    return out


def partial(model: type[BaseModel], name: str | None = None) -> type[BaseModel]:
    """Create an 'Update' model where every field is optional (PATCH-style PUT)."""
    fields = {}
    for fname, finfo in model.model_fields.items():
        fields[fname] = (Optional[finfo.annotation], Field(default=None, **_constraints(finfo)))
    return create_model(name or f"{model.__name__}Update", __base__=BaseModel, **fields)


def _constraints(finfo) -> dict:
    """Carry string/number constraints (min_length, ge, ...) over to the partial model."""
    out = {}
    for meta in finfo.metadata:
        for attr in ("min_length", "max_length", "ge", "gt", "le", "lt", "pattern"):
            value = getattr(meta, attr, None)
            if value is not None:
                out[attr] = value
    return out
