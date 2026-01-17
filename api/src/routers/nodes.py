"""
Node endpoints for type-based queries.
"""
from fastapi import APIRouter, Request, Path, Depends

from ..middleware import verify_api_key

from ..config import settings
from ..schemas.node import NodeListResponse
from ..schemas.common import NodeType
from ..services.node_service import get_nodes_by_type


router = APIRouter(
    prefix="/api/nodes",
    tags=["nodes"],
    dependencies=[Depends(verify_api_key)] if settings.api_key_required else []
)


@router.get("/{node_type}", response_model=NodeListResponse)
async def get_nodes(
    request: Request,
    node_type: NodeType = Path(description="Type of nodes to retrieve")
):
    """
    Retrieve all nodes of a specific type.

    **Path Parameters:**
    - `node_type`: Type of nodes to retrieve
      - `Mystery`: Mystery entries
      - `Location`: Geographic locations
      - `TimePeriod`: Temporal contexts
      - `Category`: Mystery categories

    **Returns:**
    - List of all nodes matching the specified type
    - Total count of nodes
    - Node type queried

    **Use Case:**
    - Retrieve all locations for a dropdown/filter
    - List all categories for navigation
    - Get all time periods for timeline visualization

    **Errors:**
    - `400`: Invalid node type
    """
    return await get_nodes_by_type(request, node_type)
