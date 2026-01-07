from fastapi import FastAPI, HTTPException
from neo4j import AsyncGraphDatabase, AsyncDriver, Record
from contextlib import asynccontextmanager
from typing import Any, List, Dict, Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

URI = settings.neo4j_uri
USER = settings.neo4j_username
PASSWORD = settings.neo4j_password
DATABASE = settings.neo4j_database

driver_instance: AsyncDriver | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for Neo4j driver lifecycle.
    Handles driver initialization on startup and cleanup on shutdown.
    """
    global driver_instance
    try:
        driver_instance = AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))
        await driver_instance.verify_connectivity()
        logger.info("Neo4j connection established successfully")
        print("Neo4j connection established")
    except Exception as e:
        logger.error(f"Failed to establish Neo4j connection: {e}")
        raise

    yield

    if driver_instance is not None:
        await driver_instance.close()
        logger.info("Neo4j connection closed")
        print("Neo4j connection closed")

def get_driver() -> AsyncDriver:
    """
    Get the global Neo4j driver instance.

    Returns:
        AsyncDriver: The Neo4j async driver instance

    Raises:
        HTTPException: If driver is not initialized
    """
    if driver_instance is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection not established"
        )
    return driver_instance

async def check_db_health() -> Dict[str, Any]:
    """
    Check Neo4j database connectivity and health.

    Returns:
        Dict containing health status information

    Raises:
        Exception: If health check fails
    """
    try:
        driver = get_driver()
        await driver.verify_connectivity()

        # Execute a simple query to verify database responsiveness
        async with driver.session(database=DATABASE) as session:
            result = await session.run("RETURN 1 as health_check")
            record = await result.single()

            if record and record["health_check"] == 1:
                return {
                    "status": "healthy",
                    "database": DATABASE,
                    "uri": URI.split("@")[-1] if "@" in URI else URI  # Hide credentials
                }
            else:
                raise Exception("Health check query returned unexpected result")

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def execute_read_query(
    query: str,
    parameters: Optional[Dict[str, Any]] = None
) -> List[Record]:
    """
    Execute a read-only Cypher query.

    Args:
        query: The Cypher query string
        parameters: Optional dictionary of query parameters

    Returns:
        List of Record objects from the query result

    Raises:
        HTTPException: If query execution fails
    """
    driver = get_driver()

    try:
        async with driver.session(database=DATABASE) as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records
    except Exception as e:
        logger.error(f"Read query failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed: {str(e)}"
        )

async def execute_write_query(
    query: str,
    parameters: Optional[Dict[str, Any]] = None
) -> List[Record]:
    """
    Execute a write Cypher query (CREATE, UPDATE, DELETE).

    Args:
        query: The Cypher query string
        parameters: Optional dictionary of query parameters

    Returns:
        List of Record objects from the query result

    Raises:
        HTTPException: If query execution fails
    """
    driver = get_driver()

    try:
        async with driver.session(database=DATABASE) as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            await result.consume()  # Ensure transaction is consumed
            return records
    except Exception as e:
        logger.error(f"Write query failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database write operation failed: {str(e)}"
        )

async def execute_transaction(queries: List[tuple[str, Dict[str, Any]]]) -> bool:
    """
    Execute multiple queries in a single transaction.

    Args:
        queries: List of tuples containing (query_string, parameters)

    Returns:
        True if transaction succeeds

    Raises:
        HTTPException: If transaction fails
    """
    driver = get_driver()

    try:
        async with driver.session(database=DATABASE) as session:
            async with session.begin_transaction() as tx:
                for query, parameters in queries:
                    await tx.run(query, parameters or {})
                await tx.commit()
        return True
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction failed: {str(e)}"
        )

db_lifespan = lifespan