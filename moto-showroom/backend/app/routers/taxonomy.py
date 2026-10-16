"""Categories and brands."""
from app.routers.factory import collection_router
from app.schemas.catalog import BrandCreate, BrandUpdate, CategoryCreate, CategoryUpdate
from app.services import content_service

categories_router = collection_router(content_service.categories, "/categories", "Categories",
                                      CategoryCreate, CategoryUpdate, "active")
brands_router = collection_router(content_service.brands, "/brands", "Brands", BrandCreate, BrandUpdate, "active")
