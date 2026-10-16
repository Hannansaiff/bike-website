"""Application configuration.

Values can be overridden with environment variables (see ../.env.example).
No secrets are required in demo mode.
"""
import os


def _split(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "RevZone Motors API (Demo)")
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    # React (Vite) development origins allowed to call the API.
    CORS_ORIGINS: list[str] = _split(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
        )
    )
    DEFAULT_PAGE_SIZE: int = 12
    MAX_PAGE_SIZE: int = 100
    # Demo-only credentials. NEVER use this approach in production.
    DEMO_ADMIN_PASSWORD: str = os.getenv("DEMO_ADMIN_PASSWORD", "admin123")
    DEMO_CUSTOMER_PASSWORD: str = os.getenv("DEMO_CUSTOMER_PASSWORD", "demo1234")


settings = Settings()
