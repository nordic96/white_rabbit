"""
Mystery endpoints for CRUD operations.
"""
from fastapi import APIRouter, Request, Query, Path, Depends
from typing import Optional

from ..middleware import verify_api_key
from ..config import settings
from ..schemas.mystery import MysteryListResponse, MysteryDetail
from ..schemas.common import MysteryStatus
from ..schemas.error import ErrorResponse, ValidationErrorResponse
from ..services.mystery_service import get_mysteries, get_mystery_by_id


router = APIRouter(
    prefix="/api/mysteries",
    tags=["mysteries"],
    dependencies=[Depends(verify_api_key)] if settings.api_key_required else []
)


@router.get(
    "",
    response_model=MysteryListResponse,
    responses={
        200: {"description": "Successful response with paginated list of mysteries"},
        422: {"model": ValidationErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database connection error"}
    }
)
async def list_mysteries(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return (max 100)"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    status: Optional[MysteryStatus] = Query(default=None, description="Filter by mystery status"),
    location_id: Optional[str] = Query(default=None, description="Filter by location ID"),
    time_period_id: Optional[str] = Query(default=None, description="Filter by time period ID"),
    category_id: Optional[str] = Query(default=None, description="Filter by category ID")
):
    """
    Retrieve a paginated list of mysteries.

    **Pagination:**
    - `limit`: Number of items per page (1-100, default: 20)
    - `offset`: Number of items to skip (default: 0)

    **Filtering:**
    - `status`: Optional filter by mystery status (unsolved, solved, debunked, ongoing)
    - `location_id`: Optional filter by location ID (e.g., `l-sigiriya`)
    - `time_period_id`: Optional filter by time period ID (e.g., `tp-ancient`)
    - `category_id`: Optional filter by category ID (e.g., `c-paranormal`)

    **Returns:**
    - List of mysteries with pagination metadata
    """
    mysteries, total = await get_mysteries(
        request, limit, offset, status, location_id, time_period_id, category_id
    )

    return MysteryListResponse(
        mysteries=mysteries,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get(
    "/{mystery_id}",
    response_model=MysteryDetail,
    responses={
        200: {"description": "Successful response with mystery details"},
        404: {"model": ErrorResponse, "description": "Mystery not found"},
        422: {"model": ValidationErrorResponse, "description": "Invalid mystery_id format"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database connection error"}
    }
)
async def get_mystery(
    request: Request,
    mystery_id: str = Path(
        ...,
        min_length=1,
        max_length=100,
        pattern="^[a-zA-Z0-9-_]+$",
        description="Unique identifier for the mystery (alphanumeric, hyphens, and underscores only)"
    )
):
    """
    Retrieve detailed information about a specific mystery.

    **Path Parameters:**
    - `mystery_id`: Unique identifier for the mystery (alphanumeric, hyphens, and underscores only)

    **Returns:**
    - Detailed mystery information including:
      - Basic mystery data (title, description, status)
      - Related locations
      - Related time periods
      - Related categories

    **Errors:**
    - `404`: Mystery not found
    - `422`: Invalid mystery_id format
    """
    return await get_mystery_by_id(request, mystery_id)
