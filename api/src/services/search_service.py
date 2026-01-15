"""
Search service for fulltext search across Mystery, Location, TimePeriod, and Category nodes.
"""
from fastapi import Request
from typing import List, Dict, Any
from ..db.neo4j import execute_read_query
from ..schemas.search import SearchResultItem
import logging

logger = logging.getLogger(__name__)


async def search_global(
    request: Request,
    query: str,
    limit: int = 10
) -> List[SearchResultItem]:
    """
    Execute a fulltext search across all indexed node types.

    Args:
        request: FastAPI request object for database access
        query: Search query string
        limit: Maximum number of results to return

    Returns:
        List of SearchResultItem with id, type, text, and score
    """
    # Use parameterized query to prevent injection attacks
    cypher_query = """
    CALL db.index.fulltext.queryNodes("globalSearch", $searchTerm)
    YIELD node, score
    RETURN node.id AS id,
           labels(node)[0] AS type,
           coalesce(node.title, node.name, node.label) AS text,
           score
    ORDER BY score DESC
    LIMIT $limit
    """

    parameters: Dict[str, Any] = {
        "searchTerm": query,
        "limit": limit
    }

    logger.info(f"Executing global search for query: '{query}' with limit: {limit}")

    results = await execute_read_query(request, cypher_query, parameters)

    return [
        SearchResultItem(
            id=record["id"],
            type=record["type"],
            text=record["text"],
            score=record["score"]
        )
        for record in results
    ]
