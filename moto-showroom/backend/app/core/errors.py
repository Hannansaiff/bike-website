"""Service-level exceptions translated into consistent JSON error responses."""


class ServiceError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, code: str | None = None, details: dict | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        self.details = details or {}


class NotFoundError(ServiceError):
    status_code = 404
    code = "not_found"


class ConflictError(ServiceError):
    status_code = 409
    code = "conflict"


class ValidationFailed(ServiceError):
    status_code = 422
    code = "validation_error"


class AuthError(ServiceError):
    status_code = 401
    code = "unauthorized"
