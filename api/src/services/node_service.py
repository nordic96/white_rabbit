"""
Node service layer for type-based queries.
"""
from fastapi import Request, HTTPException
from typing import List
from ..db.neo4j import execute_read_query
from ..schemas.node import GenericNode, NodeListResponse
from ..schemas.common import NodeType


# Whitelist of valid node types for security
VALID_NODE_TYPES = {
    NodeType.MYSTERY.value,
    NodeType.LOCATION.value,
    NodeType.TIME_PERIOD.value,
    NodeType.CATEGORY.value
}


async def get_nodes_by_type(request: Request, node_type: NodeType) -> NodeListResponse:
    """
    Retrieve all nodes of a specific type.

    Args:
        request: FastAPI request object for database access
        node_type: Type of nodes to retrieve

    Returns:
        List of nodes with the specified type

    Raises:
        HTTPException: If node type is invalid
    """
    # Validate node type (defense in depth, even though Enum already validates)
    if node_type.value not in VALID_NODE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid node type. Must be one of: {', '.join(VALID_NODE_TYPES)}"
        )

    # Use parameterized query with node type
    # Note: Label cannot be parameterized in Cypher, but we validate against whitelist
    query = f"""
    MATCH (n:{node_type.value})
    RETURN n.id as id,
           labels(n)[0] as type,
           properties(n) as properties
    ORDER BY n.created_at DESC, n.name ASC
    """

    # Count query
    count_query = f"""
    MATCH (n:{node_type.value})
    RETURN count(n) as total
    """

    # Execute queries
    nodes_data = await execute_read_query(request, query, {})
    count_data = await execute_read_query(request, count_query, {})

    total = count_data[0]["total"] if count_data else 0

    # Convert to Pydantic models
    nodes = [
        GenericNode(
            id=item["id"],
            type=item["type"],
            properties=item["properties"]
        )
        for item in nodes_data
    ]

    return NodeListResponse(
        nodes=nodes,
        total=total,
        type=node_type.value
    )
