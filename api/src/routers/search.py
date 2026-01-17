"""
Search endpoints for global fulltext search across Mystery, Location, TimePeriod, and Category nodes.
"""
from fastapi import APIRouter, Request, Query
import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from ..schemas.search import SearchResponse
from ..schemas.error import ErrorResponse, ValidationErrorResponse
from ..services.search_service import search_global
from ..config import settings

logger = logging.getLogger(__name__)

# Get limiter for rate limiting
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/api/search",
    tags=["search"]
)


@router.get(
    "",
    response_model=SearchResponse,
    responses={
        200: {"description": "Successful search results"},
        422: {"model": ValidationErrorResponse, "description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database connection error"}
    }
)
@limiter.limit(settings.rate_limit_search)
async def global_search(
    request: Request,
    q: str = Query(
        ...,
        min_length=1,
        max_length=200,
        description="Search query string"
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of results to return (1-100)"
    )
):
    """
    Perform a global fulltext search across all node types.

    Rate limited to 60 requests per minute per IP.

    **Query Parameters:**
    - `q`: Search query string (required, 1-200 characters)
    - `limit`: Maximum number of results (1-100, default: 10)

    **Returns:**
    - Search results containing matching nodes from:
      - Mystery (matched by title)
      - Location (matched by name)
      - TimePeriod (matched by label)
      - Category (matched by name)

    **Results are sorted by relevance score (descending).**
    """
    results = await search_global(request, q, limit)

    return SearchResponse(
        query=q,
        total=len(results),
        results=results
    )
