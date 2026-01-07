from fastapi import FastAPI
from neo4j import AsyncGraphDatabase, AsyncDriver
from contextlib import asynccontextmanager
from ..config import settings

URI = settings.neo4j_uri
USER = settings.neo4j_username
PASSWORD = settings.neo4j_password
DATABASE = settings.neo4j_database

driver_instance: AsyncDriver | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver_instance
    driver_instance = AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))
    await driver_instance.verify_connectivity()
    print("Neo4j connection established")
    yield
    
    if driver_instance is not None:
        await driver_instance.close()
        print("Neo4j connection closed")
        
db_lifespan = lifespan