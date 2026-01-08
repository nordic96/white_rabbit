# WhiteRabbit API - Project Guide
>Guide for Python First-Timers

## Activation & Dependency Installation
### 1. Activate .venv
Prefer to have `pyenv` installed before start working on development.

```bash
#When Activating project's virtual env
source .venv/bin/activate

#When you wish to deactivate simply run,
deactivate
```

### 2. Install Project Dependencies
Read `pyproject.toml` file for all dependencies needed for this project

```bash
pip install -e .
```

Congratulations! You are all set up for running this project!

## Dev Server

### 1. Running FastAPI Dev Server
```bash
fastapi dev src/main.py

#if fastapi fails, run this
uvicorn src.main:app --reload
```

### 2. Reading the Swagger Docs Page (Auto-Generated)

>Access from localhost:8000/docs

## Environment Variables

Create a `.env.local` file based on `.env.example`:

### 1. `ORIGIN_URL` - Frontend URL for CORS

### 2. Neo4J Database Configuration
- `NEO4J_URI` - Neo4J connection URI (e.g., `neo4j+s://xxx.databases.neo4j.io`)
- `NEO4J_USERNAME` - Neo4J authentication username (default: `neo4j`)
- `NEO4J_PASSWORD` - Neo4J authentication password
- `NEO4J_DATABASE` - Neo4J database name (default: `neo4j`)

## Database Utilities

The `src/db/neo4j.py` module provides utility functions for Cypher query execution:

### Execute Read Query
```python
from src.db import execute_read_query

records = await execute_read_query(
    "MATCH (n:Mystery) RETURN n LIMIT 10",
    parameters={}
)
```

### Execute Write Query
```python
from src.db import execute_write_query

records = await execute_write_query(
    "CREATE (m:Mystery {name: $name}) RETURN m",
    parameters={"name": "Bermuda Triangle"}
)
```

### Execute Transaction
```python
from src.db import execute_transaction

queries = [
    ("CREATE (m:Mystery {name: $name})", {"name": "Mystery 1"}),
    ("CREATE (p:Person {name: $name})", {"name": "John Doe"}),
]

success = await execute_transaction(queries)
```

### Health Check Endpoint

Check API and database connectivity:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "api": "ok",
  "database": {
    "status": "healthy",
    "database": "neo4j",
    "uri": "neo4j+s://xxx.databases.neo4j.io"
  }
}
```