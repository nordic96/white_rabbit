from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db.neo4j import db_lifespan, check_db_health

app = FastAPI(
    title="White Rabbit API",
    description="FastAPI backend for White Rabbit mystery exploration project",
    version="0.0.1",
    lifespan=db_lifespan
)

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
