"""
Mystery endpoints for CRUD operations.
"""
from fastapi import APIRouter, Request, Query
from typing import Optional
from ..schemas.mystery import MysteryListResponse, MysteryDetail
from ..schemas.common import MysteryStatus
from ..services.mystery_service import get_mysteries, get_mystery_by_id


router = APIRouter(
    prefix="/api/mysteries",
    tags=["mysteries"]
)


@router.get("", response_model=MysteryListResponse)
async def list_mysteries(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return (max 100)"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    status: Optional[MysteryStatus] = Query(default=None, description="Filter by mystery status")
):
    """
    Retrieve a paginated list of mysteries.

    **Pagination:**
    - `limit`: Number of items per page (1-100, default: 20)
    - `offset`: Number of items to skip (default: 0)

    **Filtering:**
    - `status`: Optional filter by mystery status (unsolved, solved, debunked, ongoing)

    **Returns:**
    - List of mysteries with pagination metadata
    """
    mysteries, total = await get_mysteries(request, limit, offset, status)

    return MysteryListResponse(
        mysteries=mysteries,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{mystery_id}", response_model=MysteryDetail)
async def get_mystery(
    request: Request,
    mystery_id: str
):
    """
    Retrieve detailed information about a specific mystery.

    **Path Parameters:**
    - `mystery_id`: Unique identifier for the mystery

    **Returns:**
    - Detailed mystery information including:
      - Basic mystery data (title, description, status)
      - Related locations
      - Related time periods
      - Related categories

    **Errors:**
    - `404`: Mystery not found
    """
    return await get_mystery_by_id(request, mystery_id)
