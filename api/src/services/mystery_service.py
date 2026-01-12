"""
Mystery service layer for database operations.
"""
from fastapi import Request
from typing import List, Optional, Dict, Any
from ..db.neo4j import execute_read_query
from ..schemas.mystery import MysteryListItem, MysteryDetail, LocationNode, TimePeriodNode, CategoryNode, SimilarMysteryNode
from ..schemas.common import MysteryStatus
from ..exceptions import ResourceNotFoundError, DatabaseQueryError
import logging

logger = logging.getLogger(__name__)

async def get_mysteries(
    request: Request,
    limit: int = 20,
    offset: int = 0,
    status: Optional[MysteryStatus] = None
) -> tuple[List[MysteryListItem], int]:
    """
    Retrieve paginated list of mysteries with optional status filter.

    Args:
        request: FastAPI request object for database access
        limit: Number of items to return (max 100)
        offset: Number of items to skip
        status: Optional status filter

    Returns:
        Tuple of (list of mysteries, total count)
    """
    # Build query with optional status filter
    where_clause = "WHERE m.status = $status" if status else ""

    # Query for mysteries with pagination
    query = f"""
    MATCH (m:Mystery)
    {where_clause}
    RETURN m.id as id,
           m.title as title,
           m.status as status,
           m.confidence_score as confidence_score,
           m.image_source as image_source,
           m.video_source as video_source,
           m.first_reported_year as first_reported_year,
           m.last_reported_year as last_reported_year
    ORDER BY m.first_reported_year DESC
    SKIP $offset
    LIMIT $limit
    """

    # Count query for total
    count_query = f"""
    MATCH (m:Mystery)
    {where_clause}
    RETURN count(m) as total
    """

    parameters = {
        "limit": limit,
        "offset": offset
    }

    if status:
        parameters["status"] = status.value

    # Execute queries
    mysteries_data = await execute_read_query(request, query, parameters)
    count_data = await execute_read_query(request, count_query, parameters if status else {})

    total = count_data[0]["total"] if count_data else 0
    logger.info(f"Total {total} Mystery Data Found")

    # Convert to Pydantic models
    mysteries = [
        MysteryListItem(
            id=item["id"],
            title=item["title"],
            status=MysteryStatus(item["status"]),
            image_source=item.get("image_source"),
            video_source=item.get("video_source"),  
            confidence_score=item.get("confidence_score"),
            first_reported_year=item.get("first_reported_year"),
            last_reported_year=item.get("last_reported_year"),
        )
        for item in mysteries_data
    ]

    return mysteries, total


async def get_mystery_by_id(request: Request, mystery_id: str) -> MysteryDetail:
    """
    Retrieve a single mystery with all related nodes.

    Args:
        request: FastAPI request object for database access
        mystery_id: Unique identifier for the mystery

    Returns:
        Detailed mystery with related nodes

    Raises:
        HTTPException: If mystery not found
    """
    query = """
    MATCH (m:Mystery {id: $mystery_id})
    OPTIONAL MATCH (m)-[:LOCATED_AT]->(l:Location)
    OPTIONAL MATCH (m)-[:OCCURRED_IN]->(t:TimePeriod)
    OPTIONAL MATCH (m)-[:HAS_CATEGORY]->(c:Category)
    OPTIONAL MATCH (m)-[sim:SIMILAR_TO]->(similar:Mystery)
    RETURN m,
           collect(DISTINCT l) as locations,
           collect(DISTINCT t) as time_periods,
           collect(DISTINCT c) as categories,
           collect(DISTINCT {id: similar.id, title: similar.title, score: sim.score, reasons: sim.reasons}) as similar_mysteries
    """

    parameters = {"mystery_id": mystery_id}

    result = await execute_read_query(request, query, parameters)

    if not result or not result[0].get("m"):
        raise ResourceNotFoundError(resource_type="Mystery", resource_id=mystery_id)

    data = result[0]
    mystery_node = data["m"]

    # Parse locations
    locations = [
        LocationNode(
            id=loc["id"],
            name=loc["name"],
            latitude=loc.get("latitude"),
            longitude=loc.get("longitude"),
            country=loc.get("country")
        )
        for loc in data["locations"]
        if loc is not None
    ]

    # Parse time periods
    time_periods = [
        TimePeriodNode(
            id=tp["id"],
            label=tp["label"],
            start_year=tp.get("start_year"),
            end_year=tp.get("end_year")
        )
        for tp in data["time_periods"]
        if tp is not None
    ]

    # Parse categories
    categories = [
        CategoryNode(
            id=cat["id"],
            name=cat["name"],
        )
        for cat in data["categories"]
        if cat is not None
    ]

    # Parse similar mysteries
    similar_mysteries = [
        SimilarMysteryNode(
            id=sim["id"],
            title=sim["title"],
            score=sim["score"],
            reasons=sim["reasons"] if sim["reasons"] else []
        )
        for sim in data["similar_mysteries"]
        if sim is not None and sim.get("id") is not None
    ]

    return MysteryDetail(
        id=mystery_node["id"],
        title=mystery_node["title"],
        status=MysteryStatus(mystery_node["status"]),
        image_source=mystery_node.get("image_source"),
        video_source=mystery_node.get("video_source"),
        confidence_score=mystery_node.get("confidence_score"),
        first_reported_year=mystery_node.get("first_reported_year"),
        last_reported_year=mystery_node.get("last_reported_year"),
        locations=locations,
        time_periods=time_periods,
        categories=categories,
        similar_mysteries=similar_mysteries
    )
