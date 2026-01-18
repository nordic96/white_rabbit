"""
Middleware for request/response logging and error handling.
"""
import logging
import secrets
import time
import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Request, Response, Security, status
from fastapi.security import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings


logger = logging.getLogger(__name__)
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Verify if API Key is provided from the request header.

    Args:
        api_key: API key from request header.

    Returns:
        The validated API key.

    Raises:
        HTTPException: 401 if API key is missing, 403 if invalid.
    """
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include 'X-API-Key' header."
        )

    # Use timing-safe comparison to prevent timing attacks
    if not secrets.compare_digest(api_key, settings.api_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key",
        )

    return api_key


# Reusable dependency list for routers
API_KEY_DEPENDENCIES = [Depends(verify_api_key)] if settings.api_key_required else []

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all incoming requests and outgoing responses.

    Logs:
    - Request method, path, and client IP
    - Request duration
    - Response status code
    - Any errors that occur during request processing
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process the request and log relevant information.

        Args:
            request: The incoming request
            call_next: The next middleware or route handler

        Returns:
            Response from the route handler
        """
        # Generate a unique request ID for correlation
        request_id = str(uuid.uuid4())

        # Extract client information
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        query_params = str(request.query_params) if request.query_params else ""

        # Log request start
        start_time = time.time()
        logger.info(
            f"Request started | ID: {request_id} | {method} {path} | "
            f"Client: {client_host} | Params: {query_params}"
        )

        # Process request
        try:
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Log response
            logger.info(
                f"Request completed | ID: {request_id} | {method} {path} | "
                f"Status: {response.status_code} | Duration: {duration:.3f}s"
            )

            return response

        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time

            # Log error
            logger.error(
                f"Request failed | ID: {request_id} | {method} {path} | "
                f"Error: {type(e).__name__} | Duration: {duration:.3f}s",
                exc_info=True
            )

            # Re-raise to be handled by exception handlers
            raise


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log detailed error information for debugging.

    This middleware catches errors and logs them with additional context
    before passing them to the exception handlers.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process the request and log any errors.

        Args:
            request: The incoming request
            call_next: The next middleware or route handler

        Returns:
            Response from the route handler
        """
        try:
            return await call_next(request)
        except Exception as e:
            # Log detailed error information
            logger.error(
                f"Unhandled exception during request processing | "
                f"Path: {request.url.path} | "
                f"Method: {request.method} | "
                f"Exception: {type(e).__name__} | "
                f"Message: {str(e)}",
                exc_info=True
            )
            raise
