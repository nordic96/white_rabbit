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

## Search API Setup

The search API requires a fulltext index to be created in Neo4j before use.

### 1. Create Fulltext Index

Run the following Cypher query in your Neo4j database (via Neo4j Browser or cypher-shell):

```cypher
CREATE FULLTEXT INDEX globalSearch IF NOT EXISTS
FOR (n:Mystery|Location|TimePeriod|Category)
ON EACH [n.title, n.name, n.label];
```

Or use the provided script:
```bash
# Using cypher-shell
cypher-shell -u neo4j -p <password> -f docs/create_fulltext_index.cypher
```

### 2. Verify Index Creation

```cypher
SHOW INDEXES WHERE name = 'globalSearch';
```

### 3. Search API Usage

```bash
# Basic search
curl "http://localhost:8000/api/search?q=bermuda"

# With limit parameter
curl "http://localhost:8000/api/search?q=ancient&limit=5"
```

Expected response:
```json
{
  "query": "bermuda",
  "total": 2,
  "results": [
    {
      "id": "uuid-123",
      "type": "Mystery",
      "text": "Bermuda Triangle",
      "score": 2.45
    },
    {
      "id": "uuid-456",
      "type": "Location",
      "text": "Bermuda",
      "score": 1.89
    }
  ]
}
```

### Search Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search query (1-200 characters) |
| limit | int | No | 10 | Max results to return (1-100) |

## Database Schema
## Models
### 1. Mystery
```text
id(uuid)
title
status //unresolved | partially_resolved | debunked
first_reported_year
last_reported_year
confidence_score
```
### 2. Location
```text
id(uuid)
name
type //city | region | country | ocean | mountain | site
laitude
longitude
```
### 3. TimePeriod
```text
id(uuid)
label
start_year
end_year
```
### 4. Person (v2 Scope)
### 5. Evidence (v2 Scope)
### 6. Category
```text
id
name
```

## Relationship Types
### Mystery Relationship
```text
(:Mystery)-[:LOCATED_AT]->(:Location)
(:Mystery)-[:OCCURRED_IN]->(:TimePeriod)
(:Mystery)-[:HAS_CATEGORY]->(:Category)
```

### Cross Mystery Links
```text
(:Mystery)-[:SIMILAR_TO {reason}]->(:Mystery)
```