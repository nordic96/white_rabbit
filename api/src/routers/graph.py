"""
Graph visualization endpoints for NVL integration.
"""
from fastapi import APIRouter, Query, Request

from ..middleware import API_KEY_DEPENDENCIES
from ..schemas.graph import GraphResponse
from ..services.graph_service import get_graph_data


router = APIRouter(
    prefix="/api/graph",
    tags=["graph"],
    dependencies=API_KEY_DEPENDENCIES
)


@router.get("", response_model=GraphResponse)
async def get_graph(
    request: Request,
    depth: int = Query(default=1, ge=1, le=3, description="Graph traversal depth (1-3)"),
    node_limit: int = Query(default=500, ge=1, le=1000, description="Maximum number of nodes to return (1-1000)")
):
    """
    Retrieve graph data for visualization.

    **Query Parameters:**
    - `depth`: Traversal depth for graph exploration (1-3, default: 1)
      - Depth 1: Direct connections only
      - Depth 2: Friends of friends
      - Depth 3: Extended network
    - `node_limit`: Maximum number of nodes to return (1-1000, default: 500)
      - Limits result size for performance optimization

    **Returns:**
    - Graph structure with:
      - `nodes`: Array of graph nodes (Mystery, Location, TimePeriod, Category)
      - `relationships`: Array of edges connecting nodes
      - `metadata`: Count information (node_count, relationship_count)

    **Use Case:**
    - Designed for NVL (Neo4j Visualization Library) integration
    - Supports interactive graph exploration in the frontend

    **Errors:**
    - `400`: Invalid depth parameter (must be 1-3) or node_limit (must be 1-1000)
    """
    return await get_graph_data(request, depth, node_limit)
