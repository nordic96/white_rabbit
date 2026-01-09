"""
Global exception handlers for the FastAPI application.

These handlers catch exceptions and convert them to standardized JSON responses
that match the ErrorResponse schema.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException

from typing import Union
from config import settings
import logging

from .exceptions import WhiteRabbitException
from .schemas.error import ErrorResponse, ValidationErrorResponse, ErrorDetail

logger = logging.getLogger(__name__)


async def white_rabbit_exception_handler(
    request: Request,
    exc: WhiteRabbitException
) -> JSONResponse:
    """
    Handle custom WhiteRabbitException errors.

    Args:
        request: The request that caused the exception
        exc: The WhiteRabbitException instance

    Returns:
        JSONResponse with standardized error format
    """
    error_response = ErrorResponse(
        error=type(exc).__name__,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details if exc.details else None,
        path=str(request.url.path)
    )

    logger.warning(
        f"WhiteRabbit exception: {type(exc).__name__} | "
        f"Status: {exc.status_code} | "
        f"Path: {request.url.path} | "
        f"Message: {exc.message}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(exclude_none=True)
    )


async def http_exception_handler(
    request: Request,
    exc: HTTPException
) -> JSONResponse:
    """
    Handle standard FastAPI HTTPException errors.

    Args:
        request: The request that caused the exception
        exc: The HTTPException instance

    Returns:
        JSONResponse with standardized error format
    """
    error_response = ErrorResponse(
        error="HTTPException",
        message=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        status_code=exc.status_code,
        details=None,
        path=str(request.url.path)
    )

    logger.warning(
        f"HTTP exception: Status: {exc.status_code} | "
        f"Path: {request.url.path} | "
        f"Message: {exc.detail}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(exclude_none=True)
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handle FastAPI request validation errors.

    Converts Pydantic validation errors into a user-friendly format.

    Args:
        request: The request that caused the exception
        exc: The RequestValidationError instance

    Returns:
        JSONResponse with detailed validation error information
    """
    # Extract validation errors
    errors = []
    for error in exc.errors():
        # Get the field path (e.g., "body" -> "title")
        field = ".".join(str(loc) for loc in error["loc"][1:]) if len(error["loc"]) > 1 else str(error["loc"][0])

        errors.append(
            ErrorDetail(
                field=field if field else None,
                message=error["msg"],
                type=error["type"]
            )
        )

    error_response = ValidationErrorResponse(
        error="ValidationError",
        message="Input validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"error_count": len(errors)},
        path=str(request.url.path),
        errors=errors
    )

    logger.warning(
        f"Validation error: Path: {request.url.path} | "
        f"Errors: {len(errors)} | "
        f"Details: {[e.model_dump() for e in errors]}"
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(exclude_none=True)
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handle any uncaught exceptions.

    This is a catch-all handler for unexpected errors.

    Args:
        request: The request that caused the exception
        exc: The Exception instance

    Returns:
        JSONResponse with generic error message
    """
    error_response = ErrorResponse(
        error="InternalServerError",
        message="An unexpected error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details={"error_type": type(exc).__name__} if settings.debug else None,
        path=str(request.url.path)
    )

    logger.error(
        f"Unhandled exception: {type(exc).__name__} | "
        f"Path: {request.url.path} | "
        f"Message: {str(exc)}",
        exc_info=True
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(exclude_none=True)
    )
