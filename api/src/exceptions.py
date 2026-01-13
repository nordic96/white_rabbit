"""
Custom exception classes for the White Rabbit API.

These exceptions provide consistent error handling across the application
with proper HTTP status codes and error messages.
"""
from typing import Any, Dict, Optional


class WhiteRabbitException(Exception):
    """
    Base exception for all White Rabbit API errors.

    Attributes:
        message: Human-readable error message
        status_code: HTTP status code to return
        details: Additional error details (optional)
    """
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseConnectionError(WhiteRabbitException):
    """Raised when database connection fails."""
    def __init__(self, message: str = "Database connection failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=503, details=details)


class DatabaseQueryError(WhiteRabbitException):
    """Raised when a database query fails."""
    def __init__(self, message: str = "Database query failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, details=details)


class ResourceNotFoundError(WhiteRabbitException):
    """Raised when a requested resource is not found."""
    def __init__(self, resource_type: str, resource_id: str, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} with id '{resource_id}' not found"
        super().__init__(message=message, status_code=404, details=details)


class ValidationError(WhiteRabbitException):
    """Raised when input validation fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=422, details=details)


class InvalidNodeTypeError(WhiteRabbitException):
    """Raised when an invalid node type is requested."""
    def __init__(self, node_type: str, valid_types: list, details: Optional[Dict[str, Any]] = None):
        message = f"Invalid node type '{node_type}'. Valid types are: {', '.join(valid_types)}"
        super().__init__(message=message, status_code=400, details=details)


class InvalidParameterError(WhiteRabbitException):
    """Raised when an invalid parameter is provided."""
    def __init__(self, parameter: str, reason: str, details: Optional[Dict[str, Any]] = None):
        message = f"Invalid parameter '{parameter}': {reason}"
        super().__init__(message=message, status_code=400, details=details)


class TTSGenerationError(WhiteRabbitException):
    """Raised when TTS audio generation fails."""
    def __init__(self, message: str = "TTS audio generation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, details=details)


class TTSModelNotReadyError(WhiteRabbitException):
    """Raised when TTS model is not ready or failed to load."""
    def __init__(self, message: str = "TTS model is not ready", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=503, details=details)


class TextTooLongError(WhiteRabbitException):
    """Raised when input text exceeds maximum length for TTS."""
    def __init__(self, text_length: int, max_length: int, details: Optional[Dict[str, Any]] = None):
        message = f"Text length ({text_length}) exceeds maximum allowed length ({max_length})"
        super().__init__(message=message, status_code=400, details=details)
