from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException
from .config import settings
from .db.neo4j import db_lifespan, check_db_health
from .routers import mysteries, graph, nodes
from .exceptions import WhiteRabbitException
from .middleware import RequestLoggingMiddleware, ErrorLoggingMiddleware
from .exception_handlers import (
    white_rabbit_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="White Rabbit API",
    description="FastAPI backend for White Rabbit mystery exploration project",
    version="0.0.1",
    lifespan=db_lifespan
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

# Include routers
app.include_router(mysteries.router)
app.include_router(graph.router)
app.include_router(nodes.router)

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
