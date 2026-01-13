from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError, HTTPException
from pathlib import Path
from contextlib import asynccontextmanager
from .config import settings
from .db.neo4j import db_lifespan, check_db_health
from .routers import mysteries, graph, nodes, tts
from .exceptions import WhiteRabbitException
from .middleware import RequestLoggingMiddleware, ErrorLoggingMiddleware
from .exception_handlers import (
    white_rabbit_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from .services.tts_model import cleanup_tts_model
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown tasks for both database and TTS model.
    """
    # Startup
    logger.info("Starting up White Rabbit API...")

    # Create audio cache directory
    audio_cache_path = Path(settings.tts_cache_dir)
    audio_cache_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Audio cache directory: {audio_cache_path.absolute()}")

    # Initialize database (using original db_lifespan)
    async with db_lifespan(app):
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
if audio_cache_path.exists():
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
