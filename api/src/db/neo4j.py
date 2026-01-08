from fastapi import FastAPI, HTTPException, Request
from neo4j import AsyncGraphDatabase, AsyncDriver, Record
from contextlib import asynccontextmanager
from typing import Any, List, Dict, Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for Neo4j driver lifecycle.
    Handles driver initialization on startup and cleanup on shutdown.
    """
    try:
        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password)
        )
        await driver.verify_connectivity()
        app.state.db_driver = driver
        logger.info("Neo4j connection established successfully")
    except Exception as e:
        logger.error(f"Failed to establish Neo4j connection: {type(e).__name__}")
        raise

    yield

    if hasattr(app.state, 'db_driver'):
        await app.state.db_driver.close()
        logger.info("Neo4j connection closed")

def get_driver(request: Request) -> AsyncDriver:
    """
    Get the Neo4j driver instance from app state.

    Args:
        request: FastAPI request object to access app state

    Returns:
        AsyncDriver: The Neo4j async driver instance

    Raises:
        HTTPException: If driver is not initialized
    """
    if not hasattr(request.app.state, 'db_driver'):
        raise HTTPException(
            status_code=503,
            detail="Database connection not established"
        )
    return request.app.state.db_driver

async def check_db_health(request: Request) -> Dict[str, Any]:
    """
    Check Neo4j database connectivity and health.

    Args:
        request: FastAPI request object to access app state

    Returns:
        Dict containing health status information

    Raises:
        Exception: If health check fails
    """
    try:
        driver = get_driver(request)
        await driver.verify_connectivity()

        # Execute a simple query to verify database responsiveness
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run("RETURN 1 as health_check")
            record = await result.single()

            if record and record["health_check"] == 1:
                # Sanitize URI to hide credentials using urllib
                from urllib.parse import urlparse
                parsed_uri = urlparse(settings.neo4j_uri)
                safe_uri = f"{parsed_uri.scheme}://{parsed_uri.hostname}:{parsed_uri.port or 7687}"

                return {
                    "status": "healthy",
                    "database": settings.neo4j_database,
                    "uri": safe_uri
                }
            else:
                raise Exception("Health check query returned unexpected result")

    except Exception as e:
        logger.error(f"Database health check failed: {type(e).__name__}")
        return {
            "status": "unhealthy",
            "error": str(type(e).__name__)
        }

async def execute_read_query(
    request: Request,
    query: str,
    parameters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Execute a read-only Cypher query.

    Args:
        request: FastAPI request object to access app state
        query: The Cypher query string
        parameters: Optional dictionary of query parameters

    Returns:
        List of dictionaries from the query result

    Raises:
        HTTPException: If query execution fails
    """
    driver = get_driver(request)

    try:
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records
    except Exception as e:
        logger.error(f"Read query failed: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed: {type(e).__name__}"
        )

async def execute_write_query(
    request: Request,
    query: str,
    parameters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Execute a write Cypher query (CREATE, UPDATE, DELETE).

    Args:
        request: FastAPI request object to access app state
        query: The Cypher query string
        parameters: Optional dictionary of query parameters

    Returns:
        List of dictionaries from the query result

    Raises:
        HTTPException: If query execution fails
    """
    driver = get_driver(request)

    try:
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            await result.consume()  # Ensure transaction is consumed
            return records
    except Exception as e:
        logger.error(f"Write query failed: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail=f"Database write operation failed: {type(e).__name__}"
        )

async def execute_transaction(
    request: Request,
    queries: List[tuple[str, Dict[str, Any]]]
) -> bool:
    """
    Execute multiple queries in a single transaction.

    Args:
        request: FastAPI request object to access app state
        queries: List of tuples containing (query_string, parameters)

    Returns:
        True if transaction succeeds

    Raises:
        HTTPException: If transaction fails
    """
    driver = get_driver(request)

    try:
        async with driver.session(database=settings.neo4j_database) as session:
            async with session.begin_transaction() as tx:
                for query, parameters in queries:
                    await tx.run(query, parameters or {})
                # Commit is automatic when exiting the context manager
        return True
    except Exception as e:
        logger.error(f"Transaction failed: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction failed: {type(e).__name__}"
        )

db_lifespan = lifespan
