"""DEMO admin authentication.

Any active staff member can sign in with the demo password (default
`admin123`). The returned token is NOT verified on other endpoints – the API is
open in demo mode. Production must add hashed passwords, signed expiring
tokens, and per-endpoint authorization using the roles in content_service.ROLES.
"""
import secrets

from app.config import settings
from app.core.errors import AuthError
from app.repositories.base import staff_repo
from app.services import activity_service
from app.services.content_service import ROLES


def admin_login(email: str, password: str) -> dict:
    member = next((s for s in staff_repo.all() if s["email"].lower() == email.strip().lower()), None)
    if not member or not member["active"] or password != settings.DEMO_ADMIN_PASSWORD:
        raise AuthError("Invalid email or password (demo login)")
    activity_service.log("login", "staff", member["id"], f"{member['name']} signed in to the admin panel", member["name"])
    role = ROLES.get(member["role"], ROLES["sales"])
    return {
        "token": f"demo-admin-{secrets.token_hex(12)}",
        "user": {"id": member["id"], "name": member["name"], "email": member["email"], "role": member["role"],
                 "role_label": role["label"], "modules": role["modules"]},
        "demo": True,
        "warning": "Demo authentication only – the API does not enforce this token.",
    }
