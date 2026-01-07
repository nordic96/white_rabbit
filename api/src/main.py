from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db.neo4j import db_lifespan

app = FastAPI(lifespan=db_lifespan)

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
async def health_check():
    """
    Health Check endpoiont for monitoring service availability.
    """
    return { "status": "ok" }