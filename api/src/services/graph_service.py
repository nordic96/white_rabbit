"""
Graph service layer for visualization data.
"""
from fastapi import Request, HTTPException
from typing import List, Dict, Any
from ..db.neo4j import execute_read_query
from ..schemas.graph import GraphNode, GraphRelationship, GraphResponse


async def get_graph_data(request: Request, depth: int = 1) -> GraphResponse:
    """
    Retrieve graph data for NVL visualization.

    Args:
        request: FastAPI request object for database access
        depth: Traversal depth (1-3, default: 1)

    Returns:
        Graph response with nodes and relationships

    Raises:
        HTTPException: If depth is out of range
    """
    # Validate depth parameter
    if depth < 1 or depth > 3:
        raise HTTPException(
            status_code=400,
            detail="Depth must be between 1 and 3"
        )

    # Query to get nodes and relationships up to specified depth
    # Using parameterized variable-length pattern
    if depth == 1:
        path_pattern = "[r*1..1]"
    elif depth == 2:
        path_pattern = "[r*1..2]"
    else:  # depth == 3
        path_pattern = "[r*1..3]"

    query = f"""
    MATCH path = (start)-{path_pattern}-(end)
    WHERE start:Mystery OR start:Location OR start:TimePeriod OR start:Category
    WITH collect(DISTINCT path) as paths
    UNWIND paths as p
    WITH collect(DISTINCT [n IN nodes(p) | n]) as nodeLists,
         collect(DISTINCT [r IN relationships(p) | r]) as relLists
    UNWIND nodeLists as nodeList
    UNWIND nodeList as node
    WITH collect(DISTINCT node) as allNodes, relLists
    UNWIND relLists as relList
    UNWIND relList as rel
    WITH allNodes, collect(DISTINCT rel) as allRels
    UNWIND allNodes as n
    WITH allRels, labels(n)[0] as nodeType, n
    WITH allRels,
         collect({{
             id: n.id,
             label: COALESCE(n.title, n.name, n.label, n.id),
             type: nodeType,
             properties: properties(n)
         }}) as nodes
    UNWIND allRels as r
    RETURN nodes,
           collect({{
               id: toString(id(r)),
               source: startNode(r).id,
               target: endNode(r).id,
               type: type(r),
               properties: properties(r)
           }}) as relationships
    """

    parameters = {}

    result = await execute_read_query(request, query, parameters)

    if not result:
        # Return empty graph if no data
        return GraphResponse(
            nodes=[],
            relationships=[],
            metadata={"node_count": 0, "relationship_count": 0}
        )

    data = result[0]

    # Convert to Pydantic models
    nodes = [
        GraphNode(
            id=node["id"],
            label=node["label"],
            type=node["type"],
            properties=node["properties"]
        )
        for node in data.get("nodes", [])
    ]

    relationships = [
        GraphRelationship(
            id=str(rel["id"]),
            source=rel["source"],
            target=rel["target"],
            type=rel["type"],
            properties=rel["properties"]
        )
        for rel in data.get("relationships", [])
    ]

    return GraphResponse(
        nodes=nodes,
        relationships=relationships,
        metadata={
            "node_count": len(nodes),
            "relationship_count": len(relationships)
        }
    )
