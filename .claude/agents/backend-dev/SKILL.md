# SKILL.md - Learnings from Code Reviews

This document captures best practices, common mistakes, and guidelines learned from PR feedback. Reference this before starting new work to maintain code quality and avoid repeating mistakes.

---

## Table of Contents

1. [Best Practices](#best-practices)
2. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
3. [Security Guidelines](#security-guidelines)
4. [Code Quality Standards](#code-quality-standards)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)

---

## Best Practices

### Configuration Management

**ALWAYS provide default values for configuration settings**
- Add sensible defaults for local development environments
- Only require sensitive values (passwords) to be explicitly set
- Example:
```python
# GOOD
neo4j_uri: str = "neo4j://localhost:7687"
neo4j_username: str = "neo4j"
neo4j_password: str  # No default - must be set

# BAD
neo4j_uri: str  # Will crash if env var missing
```

**ALWAYS maintain .env.example files**
- When adding new environment variables, immediately update `.env.example`
- Include comments explaining each variable's purpose
- This prevents confusion for new developers

**ALWAYS provide environment file fallbacks**
```python
# GOOD - Try multiple files
model_config = SettingsConfigDict(
    env_file=[".env.local", ".env"],
    env_file_encoding="utf-8"
)

# BAD - Single file only
model_config = SettingsConfigDict(env_file=".env.local")
```

### Resource Management

**ALWAYS use FastAPI's app.state for shared resources**
```python
# GOOD - Store in app.state
@asynccontextmanager
async def lifespan(app: FastAPI):
    driver = AsyncGraphDatabase.driver(uri, auth=(user, pass))
    app.state.db_driver = driver
    yield
    await app.state.db_driver.close()

# BAD - Global mutable state
global driver_instance
driver_instance = AsyncGraphDatabase.driver(uri, auth=(user, pass))
```

**ALWAYS use async context managers correctly**
- Let context managers handle commits/rollbacks automatically
- Don't explicitly call `commit()` when using `async with`
```python
# GOOD
async with session.begin_transaction() as tx:
    await tx.run(query)
    # Auto-commits on success, auto-rolls back on exception

# BAD
async with session.begin_transaction() as tx:
    await tx.run(query)
    await tx.commit()  # Unnecessary
```

### Error Handling

**ALWAYS catch specific exceptions, not bare Exception**
```python
# GOOD
from neo4j.exceptions import ServiceUnavailable, AuthError, ConfigurationError

try:
    await driver.verify_connectivity()
except ServiceUnavailable as e:
    logger.error(f"Service unavailable: {e}")
    raise HTTPException(status_code=503, detail="Database unavailable")
except AuthError as e:
    logger.error(f"Authentication failed: {e}")
    raise HTTPException(status_code=500, detail="Database authentication error")

# BAD
try:
    await driver.verify_connectivity()
except Exception as e:
    logger.error(f"Error: {type(e).__name__}")
    raise HTTPException(status_code=500, detail="Database error")
```

**ALWAYS include the actual error message in logs**
```python
# GOOD
logger.error(f"Read query failed: {e}")

# BAD
logger.error(f"Read query failed: {type(e).__name__}")  # Loses context
```

**ALWAYS handle connection failures gracefully at startup**
```python
# GOOD
try:
    driver = AsyncGraphDatabase.driver(uri, auth)
    await driver.verify_connectivity()
    logger.info("Neo4j connection established")
except Exception as e:
    logger.error(f"Failed to connect to Neo4j: {e}")
    raise  # Re-raise to prevent app startup with broken DB

# BAD
driver = AsyncGraphDatabase.driver(uri, auth)  # Crashes with no context
```

### Logging

**ALWAYS use proper logging instead of print statements**
```python
# GOOD
import logging
logger = logging.getLogger(__name__)
logger.info("Neo4j connection established")

# BAD
print("Neo4j connection established")
```

### Type Hints

**ALWAYS keep type hints accurate and consistent**
```python
# GOOD
def execute_read_query(...) -> List[Dict[str, Any]]:
    result = await result.data()  # Returns list of dicts
    return result

# BAD
def execute_read_query(...) -> List[Record]:  # Wrong type
    result = await result.data()  # Returns list of dicts
    return result
```

---

## Common Mistakes to Avoid

### Configuration Errors

- **Missing environment variables in .env.example**
  - Impact: New developers don't know what to configure
  - Fix: Update .env.example whenever adding new config

- **No default values for non-sensitive config**
  - Impact: App crashes with cryptic Pydantic errors
  - Fix: Add defaults for URIs, usernames, database names

- **Loading credentials at module scope**
  - Impact: Poor security practice, exposed globally
  - Fix: Access settings directly within functions

### Code Organization

- **Unused variables or imports**
  - Examples: `DATABASE` variable loaded but never used, `Record` imported but unused
  - Fix: Remove dead code or document future usage

- **Inconsistent naming**
  - Example: Creating aliases like `db_lifespan = lifespan` without reason
  - Fix: Use one clear name

- **Global mutable state**
  - Example: `global driver_instance`
  - Fix: Use FastAPI's dependency injection or app.state

### Error Handling

- **Missing error handling at critical points**
  - Where: Connection initialization, query execution
  - Fix: Wrap in try/except with specific exceptions

- **Losing error context**
  - Example: Only logging exception type, not message
  - Fix: Log the full exception or message

- **Inconsistent error responses**
  - Example: Docstring says function raises but actually returns error dict
  - Fix: Keep documentation in sync with implementation

### Code Quality

- **Typos in code and documentation**
  - Examples: "exploreation" → "exploration", "endpoiont" → "endpoint"
  - Fix: Proofread, use spell checker

- **Missing newlines at end of files**
  - Impact: Violates Python conventions
  - Fix: Add newline at EOF

---

## Security Guidelines

### Credential Management

**NEVER hardcode credentials**
- Always use environment variables
- Never commit .env files (verify .gitignore)

**NEVER expose credentials in logs**
- Sanitize URIs before logging
- Use proper URI parsing, not simple string splits
```python
# GOOD
from urllib.parse import urlparse
parsed = urlparse(uri)
safe_uri = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"

# BAD
safe_uri = uri.split("@")[1]  # Fails with query params
```

**NEVER log full exception messages that might contain credentials**
```python
# GOOD
logger.error(f"Connection failed: [redacted]")

# BAD
logger.error(f"Connection failed: {exception}")  # Might leak password
```

### Input Validation

**ALWAYS use parameterized queries**
```python
# GOOD
query = "CREATE (n:Node {name: $name})"
await tx.run(query, name=user_input)

# BAD
query = f"CREATE (n:Node {{name: '{user_input}'}})"  # SQL injection risk
```

**ALWAYS validate and limit inputs**
- Query string length limits
- Parameter depth/size validation
- Consider rate limiting for write operations

### Global State

**AVOID global mutable state for security and testability**
- Makes testing difficult
- Error-prone in async contexts
- Use FastAPI's dependency injection pattern

---

## Code Quality Standards

### Imports

- Remove unused imports immediately
- Group imports: stdlib, third-party, local
- Use specific imports, not wildcards

### Type Hints

- Use consistent type hint syntax
- Match return types to actual returns
- Use `Dict[str, Any]` when structure varies
- For Python 3.11+, lowercase `tuple` is acceptable

### Documentation

**Docstrings must match implementation**
- If function catches exceptions, don't say it raises them
- Update docstrings when changing behavior
- Include return type documentation

### File Conventions

- Add newline at end of file (PEP 8)
- Use consistent line endings
- Follow project formatting standards

### Performance Considerations

**Connection Pooling**
- Configure pool settings for production:
  - `max_connection_pool_size`
  - `connection_timeout`
  - `max_transaction_retry_time`

**Memory Management**
- For large result sets, use async iteration or generators
- Don't load all results with `result.data()` if dataset is large
```python
# For streaming large results
async for record in result:
    yield record
```

**Health Checks**
- Keep health check queries simple and fast
- Consider caching health status for high-traffic scenarios
- Add timeout to prevent hanging on shutdown

---

## Testing Requirements

### Every new module MUST have tests

**Unit Tests Required:**
- Connection lifecycle (startup/shutdown)
- Query execution functions with valid/invalid inputs
- Error handling paths
- All public functions

**Integration Tests Required:**
- Actual database connectivity
- CRUD operations
- Transaction atomicity
- Rollback behavior

### Testing Best Practices

**Use mocking for unit tests**
```python
from unittest.mock import AsyncMock, patch
import pytest

@pytest.mark.asyncio
async def test_health_check():
    with patch('db.neo4j.get_driver') as mock_driver:
        mock_driver.return_value = AsyncMock()
        result = await check_db_health()
        assert result["status"] == "healthy"
```

**Test error scenarios**
- Connection refused
- Invalid credentials
- Query failures
- Timeout scenarios

---

## Documentation Standards

### README Files

**MUST include when adding database/external service:**
- Setup instructions
- Environment variable documentation
- Usage examples
- Security best practices
- Error handling examples

**Example security note for README:**
```markdown
## Security Best Practices

- ALWAYS use parameterized queries, never string interpolation
- Never commit .env files
- Sanitize URIs before logging
- Use specific exception handling
```

### Code Comments

- Explain WHY, not WHAT
- Document future TODOs clearly
- Add security warnings where applicable

### API Documentation

- Use FastAPI's automatic OpenAPI generation
- Add response model examples
- Document error responses
- Include security notes

---

## Reference: PR #14 Key Issues

This section summarizes the critical issues found in PR #14 for quick reference:

### Critical Issues (Must Fix)
1. Missing Neo4j variables in `.env.example`
2. No default values in config causing startup crashes
3. Broad exception handling masking specific errors
4. Unused imports and variables (dead code)
5. Global mutable state instead of app.state
6. Missing error handling at connection initialization
7. Print statements instead of proper logging
8. Type hint mismatches

### Security Issues
1. Hardcoded credentials at module scope
2. Insufficient URI sanitization (simple split vs. proper parsing)
3. Potential credential exposure in exception logs
4. Missing input validation (length limits, depth checks)

### Missing Requirements
1. No test coverage for database module
2. No logging configuration
3. No connection pool configuration for production
4. Missing error handling documentation

---

## Checklist Before Submitting PRs

Use this checklist to self-review before submitting:

### Configuration
- [ ] Updated .env.example with new variables
- [ ] Added sensible defaults for non-sensitive config
- [ ] Configured environment file fallbacks

### Security
- [ ] No hardcoded credentials
- [ ] Proper URI/credential sanitization
- [ ] Parameterized queries (no string interpolation)
- [ ] Input validation and limits

### Error Handling
- [ ] Specific exception types (not bare Exception)
- [ ] Error messages logged with context
- [ ] Graceful handling at startup/shutdown
- [ ] Consistent error responses

### Code Quality
- [ ] No unused imports or variables
- [ ] Proper logging (not print statements)
- [ ] Accurate type hints
- [ ] Newlines at end of files
- [ ] No typos in code/docs

### Testing
- [ ] Unit tests for new modules
- [ ] Integration tests for database operations
- [ ] Error scenario tests
- [ ] Mock tests for external dependencies

### Documentation
- [ ] Updated README if needed
- [ ] Docstrings match implementation
- [ ] Security notes included
- [ ] Usage examples provided

### Performance
- [ ] Connection pooling configured
- [ ] Large result sets handled with streaming
- [ ] Health checks are fast and cacheable

---

---

## Session Learnings - 2026-01-15

### Mistakes & Fixes

- **Issue:** SQL Injection vulnerability in search_service.py
  - **Root Cause:** Using f-string interpolation for user input in Cypher queries instead of parameterized queries
  - **Fix:** Replaced `f"CALL db.index.fulltext.queryNodes('{query}')"` with parameterized query `CALL db.index.fulltext.queryNodes($query)` and passed query as named parameter
  - **Prevention:** Always use parameterized queries with `$variable` syntax and pass values as named parameters in `tx.run(query, param=value)`

### Patterns Discovered

- **Pattern:** FastAPI Router/Service/Schema Separation
  - **Context:** Building new endpoints with clean architecture separation of concerns
  - **Implementation:**
    - `schemas/search.py`: Define request/response Pydantic models
    - `services/search_service.py`: Database query logic with parameterized Cypher
    - `routers/search.py`: FastAPI route handlers that orchestrate service calls
    - `main.py`: Register routers with `app.include_router()`

- **Pattern:** Neo4j Fulltext Index Creation
  - **Context:** Implementing global search across multiple node types
  - **Implementation:** `CREATE FULLTEXT INDEX globalSearch FOR (n:Mystery|Location|TimePeriod|Category) ON EACH [n.title, n.name, n.label]`
  - **Key Detail:** Use `ON EACH [properties]` syntax when indexing properties that may not exist on all node types (handles null gracefully)

- **Pattern:** Parameterized Cypher Queries
  - **Context:** Preventing injection attacks and handling user input safely
  - **Implementation:**
    ```python
    query = "CALL db.index.fulltext.queryNodes($queryIndex, $queryString) YIELD node RETURN node"
    result = await tx.run(query, queryIndex="globalSearch", queryString=query_text)
    ```

### Debugging Wins

- **Problem:** Search returning no results or throwing index errors
  - **Approach:** Verified fulltext index exists and properties are indexed correctly using `CALL db.indexes()` in Neo4j Browser
  - **Tool/Technique:** Direct Neo4j Browser inspection to validate index structure before implementation

- **Problem:** Security vulnerability in existing code
  - **Approach:** Reviewed string interpolation patterns in legacy code and identified unparameterized query
  - **Tool/Technique:** Static code review for Cypher query construction patterns

### Performance Notes

- Fulltext index queries are efficient for global search across multiple node types
- Parameterized queries have no performance penalty over interpolation and provide security benefits
- Consider pagination for large result sets using SKIP/LIMIT in Cypher

---

**Document Version:** 2.0
**Last Updated:** 2026-01-15
**Source:** Global Search Implementation (Issue #28) + PR #14 Code Review Feedback
**Maintainer:** Claude Code Backend Agent
