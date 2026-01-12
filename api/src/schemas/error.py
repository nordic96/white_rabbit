"""
Error response schemas for consistent API error formatting.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional


class ErrorDetail(BaseModel):
    """Detailed error information."""
    field: Optional[str] = Field(None, description="Field name that caused the error (for validation errors)")
    message: str = Field(description="Error message")
    type: Optional[str] = Field(None, description="Error type or code")


class ErrorResponse(BaseModel):
    """
    Standardized error response format for all API errors.

    This ensures consistent error responses across all endpoints,
    making it easier for clients to handle errors.
    """
    error: str = Field(description="Error type or category")
    message: str = Field(description="Human-readable error message")
    status_code: int = Field(description="HTTP status code")
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional error details (optional)"
    )
    path: Optional[str] = Field(
        default=None,
        description="Request path that caused the error"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ResourceNotFound",
                "message": "Mystery with id 'nonexistent-id' not found",
                "status_code": 404,
                "details": None,
                "path": "/api/mysteries/nonexistent-id"
            }
        }


class ValidationErrorResponse(ErrorResponse):
    """
    Specialized error response for validation errors.

    Includes detailed information about which fields failed validation.
    """
    errors: list[ErrorDetail] = Field(
        default_factory=list,
        description="List of validation errors"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Input validation failed",
                "status_code": 422,
                "details": None,
                "path": "/api/mysteries",
                "errors": [
                    {
                        "field": "mystery_id",
                        "message": "String should match pattern '^[a-zA-Z0-9-_]+$'",
                        "type": "string_pattern_mismatch"
                    }
                ]
            }
        }
