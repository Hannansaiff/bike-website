"""FastAPI application entry point.

Run (from the backend folder):  uvicorn app.main:app --reload --port 8000
Swagger UI:                      http://localhost:8000/docs
"""
from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.core.errors import ServiceError
from app.core.store import store
from app.routers import analytics, auth, bikes, bookings, content, customers, inventory, offers, sales, taxonomy
from app.schemas.common import ok
from app.services import activity_service

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for the RevZone Motors motorcycle showroom demo.\n\n"
        "**Demo mode:** all data is in-memory sample data and resets when the server restarts. "
        "Authentication endpoints are demonstrations only; endpoints are not protected."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Demo-Actor"],
)


# ---- Consistent error responses ------------------------------------------------

def _error(status_code: int, code: str, message: str, details=None) -> JSONResponse:
    return JSONResponse(status_code=status_code,
                        content={"success": False, "error": {"code": code, "message": message, "details": details or {}}})


@app.exception_handler(ServiceError)
async def service_error_handler(_: Request, exc: ServiceError):
    return _error(exc.status_code, exc.code, exc.message, exc.details)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    fields = {}
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query", "path")]
        key = ".".join(loc) or "request"
        msg = err.get("msg", "Invalid value").replace("Value error, ", "")
        fields.setdefault(key, msg)
    first = next(iter(fields.items()), ("request", "Invalid request"))
    return _error(422, "validation_error", f"{first[0]}: {first[1]}" if first[0] != "request" else first[1],
                  {"fields": fields})


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(_: Request, exc: StarletteHTTPException):
    return _error(exc.status_code, "http_error", str(exc.detail))


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception):  # pragma: no cover
    return _error(500, "server_error", "Something went wrong on the server. Please try again.")


# ---- Routes ---------------------------------------------------------------------

api = APIRouter(prefix=settings.API_PREFIX)
for r in (
    bikes.router, taxonomy.categories_router, taxonomy.brands_router, inventory.router, bookings.router,
    customers.router, sales.router, offers.router, content.router, content.gallery_router,
    content.banners_router, content.testimonials_router, content.faqs_router, content.staff_router,
    content.enquiries_router, analytics.router, auth.router, auth.account,
):
    api.include_router(r)


@api.get("/health", tags=["System"])
def health():
    return ok({"status": "ok", "mode": "demo", "database": None, "version": settings.APP_VERSION})


@api.post("/demo/reset", tags=["System"], summary="Restore the initial sample dataset")
def reset_demo():
    store.reset()
    activity_service.log("reset", "system", None, "Demo data reset to the initial sample dataset")
    return ok(None, message="Demo data has been reset")


app.include_router(api)


@app.get("/", include_in_schema=False)
def root():
    return {"name": settings.APP_NAME, "docs": "/docs", "api": settings.API_PREFIX, "mode": "demo"}
