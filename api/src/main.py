from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError, HTTPException
from pathlib import Path
from contextlib import asynccontextmanager
import os
import logging

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .db.neo4j import db_lifespan, check_db_health, get_driver
from .routers import mysteries, graph, nodes, tts, search
from .exceptions import WhiteRabbitException, DatabaseIndexError, CacheDirectoryError
from .middleware import RequestLoggingMiddleware, ErrorLoggingMiddleware
from .exception_handlers import (
    white_rabbit_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from .services.tts_model import cleanup_tts_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


def validate_cache_directory(cache_path: Path) -> None:
    """
    Validate cache directory path and permissions.

    Args:
        cache_path: Path to the cache directory

    Raises:
        CacheDirectoryError: If directory is invalid or inaccessible
    """
    resolved_path = cache_path.resolve()
    app_root = Path.cwd().resolve()

    # Security check: ensure cache directory is within app root
    try:
        resolved_path.relative_to(app_root)
    except ValueError:
        raise CacheDirectoryError(
            message=f"Cache directory must be within application root",
            details={"cache_dir": str(resolved_path), "app_root": str(app_root)}
        )

    # Create directory if it doesn't exist
    resolved_path.mkdir(parents=True, exist_ok=True)

    # Check write permissions
    if not os.access(resolved_path, os.W_OK):
        raise CacheDirectoryError(
            message=f"No write permission for cache directory",
            details={"cache_dir": str(resolved_path)}
        )

    logger.info(f"Cache directory validated: {resolved_path}")


async def verify_search_index(app: FastAPI) -> None:
    """
    Verify that the globalSearch fulltext index exists in Neo4j.

    Args:
        app: FastAPI application instance

    Raises:
        DatabaseIndexError: If the required index is not found
    """
    try:
        driver = app.state.db_driver
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(
                "SHOW INDEXES YIELD name WHERE name = 'globalSearch' RETURN name"
            )
            record = await result.single()

            if not record:
                logger.error("Missing globalSearch index! Run api/docs/create_fulltext_index.cypher")
                raise DatabaseIndexError(
                    index_name="globalSearch",
                    details={"hint": "Run: api/docs/create_fulltext_index.cypher"}
                )

            logger.info("globalSearch index verified successfully")

    except DatabaseIndexError:
        raise
    except Exception as e:
        logger.warning(f"Could not verify search index: {type(e).__name__}: {e}")
        # Don't fail startup for index check errors, just warn


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown tasks for both database and TTS model.
    """
    # Startup
    logger.info("Starting up White Rabbit API...")

    # Validate and create audio cache directory with security checks
    audio_cache_path = Path(settings.tts_cache_dir)
    validate_cache_directory(audio_cache_path)
    logger.info(f"Audio cache directory: {audio_cache_path.absolute()}")

    # Initialize database (using original db_lifespan)
    async with db_lifespan(app):
        # Verify search index exists after DB connection
        await verify_search_index(app)
        yield

    # Shutdown
    logger.info("Shutting down White Rabbit API...")
    await cleanup_tts_model()
    logger.info("TTS model cleanup complete")


app = FastAPI(
    title="White Rabbit API",
    description="FastAPI backend for White Rabbit mystery exploration project",
    version="0.0.1",
    lifespan=app_lifespan
)

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register exception handlers (order matters - most specific first)
app.add_exception_handler(WhiteRabbitException, white_rabbit_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Add middleware (order matters - executed in reverse order of addition)
# CORS should be last to ensure it's applied to all responses
origins = [
    settings.origin_url,
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware for logging and error handling
app.add_middleware(ErrorLoggingMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Mount static files for audio cache
audio_cache_path = Path(settings.tts_cache_dir)
app.mount(
    settings.static_audio_url_prefix,
    StaticFiles(directory=str(audio_cache_path)),
    name="audio"
)
logger.info(f"Mounted static audio files at {settings.static_audio_url_prefix}")

# Include routers
app.include_router(mysteries.router)
app.include_router(graph.router)
app.include_router(nodes.router)
app.include_router(tts.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return { "message": "hello world" }

@app.get("/health")
async def health_check(request: Request):
    """
    Health check endpoint for monitoring service and database availability.
    Verifies both API server and Neo4j database connectivity.
    """
    db_health = await check_db_health(request)

    return {
        "api": "ok",
        "database": db_health
    }
