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

---

## Session Learnings - 2026-01-15 (Part 2 - Search API & PR Reviews)

### Mistakes & Fixes

- **Issue:** Search API endpoint missing query parameter validation
  - **Root Cause:** No validation on input length or limits before passing to database
  - **Fix:** Added Pydantic validation for query parameter (minimum 1 character, maximum 200 characters)
  - **Prevention:** Always validate user input with type checking and length constraints before using in queries

- **Issue:** Search API not handling timeout errors appropriately
  - **Root Cause:** Generic 500 response without distinguishing timeout (504) from network errors (503)
  - **Fix:** Added specific HTTP status code handling for timeout scenarios (504) and network unavailability (503)
  - **Prevention:** Map specific exception types to appropriate HTTP status codes for better client error handling

- **Issue:** Search API returning generic error objects instead of structured error responses
  - **Root Cause:** Inconsistent error response format across endpoints
  - **Fix:** Ensured all error responses include `error`, `message`, and `status_code` fields matching frontend expectations
  - **Prevention:** Define error response schema once and reuse across all endpoints

- **Issue:** Limit parameter not validated in search endpoint
  - **Root Cause:** User could request millions of results causing memory issues
  - **Fix:** Added validation that limit parameter is between 1 and 100
  - **Prevention:** Validate all query parameters with reasonable bounds

### Patterns Discovered

- **Pattern:** Structured Error Response Handling in FastAPI
  - **Context:** Providing consistent error information to frontend error handling logic
  - **Implementation:**
    ```python
    # Define consistent error response structure
    return JSONResponse(
      status_code=503,
      content={
        "error": "ServiceUnavailable",
        "message": "Search service temporarily unavailable",
        "status_code": 503
      }
    )
    ```
  - **Key Detail:** Frontend's fetchApi utility specifically expects this three-field structure; missing any field causes type mismatches

- **Pattern:** HTTP Status Code Mapping for Database Scenarios
  - **Context:** Differentiating between different failure modes to guide client retry logic
  - **Implementation:**
    - `504 Gateway Timeout`: Request timed out waiting for database response
    - `503 Service Unavailable`: Database connection/network error (backend unavailable)
    - `400 Bad Request`: Query validation failed (invalid parameters)
    - `422 Unprocessable Entity`: Malformed request body
  - **Key Detail:** Client can make better decisions about retrying (503, 504) vs. fixing request (400, 422)

- **Pattern:** Input Validation with Pydantic Query Parameters
  - **Context:** Protecting database from malformed or excessive requests
  - **Implementation:**
    ```python
    from pydantic import BaseModel, Field

    class SearchQuery(BaseModel):
        q: str = Field(min_length=1, max_length=200)
        limit: int = Field(ge=1, le=100, default=10)
    ```
  - **Key Detail:** Pydantic automatically returns 422 with validation errors, no manual checking needed

### Debugging Wins

- **Problem:** Search endpoint returning different error formats in PR review
  - **Approach:** Examined fetchApi type definitions and ErrorResponse interface to understand expected structure
  - **Tool/Technique:** Reviewed TypeScript types in frontend code to identify what backend must provide

- **Problem:** Race condition where multiple search requests complete out of order
  - **Approach:** Analyzed client-side request handling and identified that server wasn't distinguishing requests
  - **Tool/Technique:** Worked with frontend team to implement AbortController on client, confirmed backend properly handles request cancellation

### Performance Notes

- Query length validation (max 200 chars) prevents excessively complex Cypher query compilation
- Result limit validation (max 100) prevents memory bloat from large result sets
- Timeout handling with AbortController on frontend prevents server from processing abandoned requests
- Structured error responses add minimal overhead while significantly improving debuggability

---

## Git Workflow & Project Standards

### Branch Naming Convention

**Updated naming standard (replaces #27 with issue_27 format):**

- Feature branches: `issue_[number]` for work on specific issues
- Development branches: `dev_[feature_name]` for feature development
- Previous format `issue_#[number]` should not be used going forward

Example:
```bash
# Create branch for issue #27
git checkout -b issue_27

# Create branch for new feature
git checkout -b dev_search_optimization
```

---

---

## Session Learnings - 2026-01-16

### Mistakes & Fixes

- **Issue:** TTS cache cleanup was never executed, leading to unbounded disk usage
  - **Root Cause:** Cache cleanup logic was defined but never scheduled or triggered by any event
  - **Fix:** Implemented background cleanup triggered on every TTS request that checks TTL (7 days) and total size (1GB limit)
  - **Prevention:** When implementing cache, immediately add cleanup logic triggered by requests or use a background task scheduler

- **Issue:** Path traversal vulnerability in TTS cache directory validation
  - **Root Cause:** No validation that cache file paths stayed within the cache directory; user-supplied filenames could escape with `../`
  - **Fix:** Added path validation using `Path(cache_dir).resolve()` and comparison to ensure all cached files are within bounds
  - **Prevention:** Always validate paths with `.resolve()` and check that resolved path is within expected directory before file operations

- **Issue:** TTS service could spawn unlimited threads for concurrent requests
  - **Root Cause:** No bounds on thread pool executor for CPU-intensive TTS operations
  - **Fix:** Bounded ThreadPoolExecutor with `max_workers=4` to prevent thread explosion under load
  - **Prevention:** Always set `max_workers` limit when using ThreadPoolExecutor; test with concurrent requests to verify limits work

- **Issue:** TTS API had no rate limiting, vulnerable to DoS attacks
  - **Root Cause:** No request throttling implemented for expensive operations
  - **Fix:** Implemented slowapi Limiter with TTS endpoint limited to 10 requests/minute and search limited to 60 requests/minute
  - **Prevention:** Add rate limiting to all expensive endpoints; use different limits for different operation costs

- **Issue:** TTS API accepted requests with no length validation
  - **Root Cause:** No Pydantic validation on TTSRequest input
  - **Fix:** Added `max_length=5000` validation to text field in TTSRequest schema
  - **Prevention:** Always validate input sizes at API boundary using Pydantic Field constraints

- **Issue:** Neo4j globalSearch index might not exist on production startup
  - **Root Cause:** Index was created manually in development; no verification on app startup
  - **Fix:** Added index existence verification on startup; create index if missing (idempotent operation)
  - **Prevention:** Always verify critical indices/constraints exist on startup; use idempotent creation queries

### Patterns Discovered

- **Pattern:** Background Cache Cleanup Triggered by Requests
  - **Context:** Implementing cache with TTL and size limits without external task scheduler
  - **Implementation:**
    ```python
    async def cleanup_tts_cache():
        now = time.time()
        cutoff = now - (7 * 24 * 60 * 60)  # 7 days in seconds
        for file in cache_dir.glob("*.wav"):
            if file.stat().st_mtime < cutoff:
                file.unlink()

    # Call cleanup on every TTS request
    @app.post("/tts")
    async def text_to_speech(request: TTSRequest):
        await cleanup_tts_cache()  # Lightweight check
        # ... rest of handler
    ```
  - **Key Detail:** Cleanup should be lightweight and async; run at request time rather than blocking startup

- **Pattern:** Path Traversal Prevention with resolve()
  - **Context:** Ensuring uploaded/derived file paths cannot escape intended directory
  - **Implementation:**
    ```python
    cache_dir = Path(settings.tts_cache_dir).resolve()
    file_path = cache_dir / filename

    # Verify file is within cache directory
    if not str(file_path.resolve()).startswith(str(cache_dir)):
        raise ValueError("Invalid cache path")
    ```
  - **Key Detail:** Use `.resolve()` to eliminate `..` and symlinks; compare string representations after resolution

- **Pattern:** Rate Limiting with slowapi for FastAPI
  - **Context:** Protecting expensive endpoints from DoS attacks
  - **Implementation:**
    ```python
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    @app.post("/tts")
    @limiter.limit("10/minute")
    async def text_to_speech(request: TTSRequest, _: Request):
        # ...
    ```
  - **Key Detail:** Limiter counts per IP address by default; use rate strings like "10/minute", "100/hour"

- **Pattern:** Bounding Thread Pool for CPU-Intensive Operations
  - **Context:** Preventing thread explosion when running TTS (CPU-bound) in thread pool
  - **Implementation:**
    ```python
    executor = ThreadPoolExecutor(max_workers=4)
    loop = asyncio.get_event_loop()

    # In async handler
    result = await loop.run_in_executor(executor, cpu_intensive_function, args)
    ```
  - **Key Detail:** Rule of thumb: `max_workers = cpu_count` for CPU-bound; 2-4x for I/O-bound; TTS (CPU-bound) should be low

- **Pattern:** Pydantic Input Validation with Field Constraints
  - **Context:** Validating request body parameters at API boundary before processing
  - **Implementation:**
    ```python
    from pydantic import BaseModel, Field

    class TTSRequest(BaseModel):
        text: str = Field(max_length=5000)
        voice: str = Field(default="default")
    ```
  - **Key Detail:** Pydantic automatically returns 422 with validation errors; no manual checks needed

- **Pattern:** Idempotent Index Creation on Startup
  - **Context:** Ensuring Neo4j indices exist without failing if already created
  - **Implementation:**
    ```python
    # Idempotent: safe to run multiple times
    query = "CREATE FULLTEXT INDEX IF NOT EXISTS globalSearch FOR (...)"
    await session.run(query)
    ```
  - **Key Detail:** Use `IF NOT EXISTS` clause; verification queries are fast and prevent crashes

### Debugging Wins

- **Problem:** False positive error response field issue (#7)
  - **Approach:** Examined frontend ApiError class to understand how status_code field was handled
  - **Tool/Technique:** Read TypeScript type definition in `utils/api.ts` to see status_code was renamed to statusCode during mapping
  - **Insight:** The "error" was not a bug; frontend's ApiError class correctly maps snake_case to camelCase via constructor. Problem was misunderstanding frontend data transformation logic

- **Problem:** TTS requests failing intermittently under load
  - **Approach:** Checked for resource exhaustion by monitoring thread count and identifying unbounded thread creation
  - **Tool/Technique:** Added logging to track concurrent requests and observed thread pool growth; added `max_workers` limit and verified with load test

- **Problem:** Cache disk usage growing unbounded
  - **Approach:** Identified no cleanup mechanism was in place; verified cache directory size
  - **Tool/Technique:** Added file stat checking with TTL logic; implemented background cleanup triggered on requests

### Performance Notes

- TTS rate limiting (10/min) prevents DOS while allowing typical user interaction (1-2 requests per user session)
- ThreadPoolExecutor with max_workers=4 prevents thread context switching overhead; TTS is CPU-bound so low worker count is optimal
- Cache cleanup triggered on requests is efficient; checking old files (TTL > 7 days) has minimal overhead
- Index existence check on startup is fast (single metadata query) and idempotent; safe to run on every startup
- Input length validation (5000 chars) prevents TTS model from processing excessively long requests
- Rate limiting at 60/min for search is permissive for legitimate use; TTS at 10/min is conservative given CPU cost

---

**Document Version:** 2.2
**Last Updated:** 2026-01-16
**Source:** PR #44 (UI Theme Fixes) + PR #46 (TTS Cache/Security/Rate Limiting) + PR Review False Positive Investigation
**Maintainer:** Claude Code Backend Agent

---

## Session Learnings - 2026-01-17 (Deployment Strategy & Configuration)

### Mistakes & Fixes

- **Issue:** Attempting to deploy large ML models (Kokoro TTS) to serverless platform
  - **Root Cause:** Underestimated serverless function limitations (250MB package size limit, 10-60s timeouts, no persistent connections)
  - **Fix:** Designed pre-generated audio strategy: generate audio locally, store in GitHub Pages as CDN, toggle TTS_ENABLED=false in production, return cached URLs
  - **Prevention:** Research platform constraints (Vercel, Lambda, CloudFlare) before designing backend architecture; serverless unsuitable for large models or long-running operations

- **Issue:** TTS model initialization taking too long in production environment
  - **Root Cause:** Model loading happens at request time in serverless cold starts (10-30s overhead)
  - **Fix:** Switched to pre-computed audio files served from static CDN; initialization only occurs in local development
  - **Prevention:** For heavy computations, pre-process offline and serve results; avoid re-computing in production endpoints

- **Issue:** Neo4j connection pooling incompatible with serverless architecture
  - **Root Cause:** Serverless functions have ephemeral execution contexts; connection pools expect persistent lifetime
  - **Fix:** Recognized this as architectural limitation; connection pooling remains for Python backend (non-serverless), replaced with simple stateless connections for serverless edge functions if needed
  - **Prevention:** Understand execution model of target platform; persistent resources like connection pools require long-lived processes

### Patterns Discovered

- **Pattern:** Environment-Based Feature Toggles for Deployment Flexibility
  - **Context:** Disabling expensive operations (TTS model loading) in production while keeping code intact for development
  - **Implementation:**
    ```python
    # Backend settings
    TTS_ENABLED: bool = Field(default=True, description="Enable TTS synthesis (disable for serverless)")
    AUDIO_BASE_URL: str = Field(default="http://localhost:3000/audio", description="CDN base URL for pre-generated audio")

    # Frontend settings (NEXT_PUBLIC_ prefix makes them available in browser)
    NEXT_PUBLIC_AUDIO_BASE_URL=https://cdn.example.com/audio
    ```
  - **Key Detail:** Toggle feature at config boundary, not in code paths; allows same codebase for dev and prod

- **Pattern:** Pre-Generated Audio with Static CDN Strategy
  - **Context:** Serving TTS audio without running expensive ML inference on every request
  - **Implementation:**
    1. Generate audio files locally during development: `python scripts/generate_audio.py`
    2. Upload to GitHub Pages or similar static CDN
    3. Backend returns pre-computed URLs: `GET /mystery/{id}` returns `{ ..., audio_url: "https://cdn/mystery-123.wav" }`
    4. Toggle `TTS_ENABLED=false` in production; skip model initialization
    5. Frontend plays audio from URL without waiting for synthesis
  - **Key Detail:** Moves compute cost from request time (10-30s cold start) to deployment time (once per release); supports serverless deployment

- **Pattern:** Multi-Layer Configuration with Environment Fallbacks
  - **Context:** Supporting different deployment environments (local, staging, production) with appropriate defaults
  - **Implementation:**
    ```python
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        tts_enabled: bool = True  # Default for local development
        audio_base_url: str = "http://localhost:3000/audio"  # Local dev fallback

        model_config = SettingsConfigDict(
            env_file=[".env.production", ".env.local", ".env"]
        )
    ```
  - **Key Detail:** Load config files in priority order (most specific first); fall back to defaults; allows per-environment overrides without code changes

- **Pattern:** Serverless Limitations Checklist for Architecture Decision
  - **Context:** Evaluating whether serverless is appropriate for new features
  - **Key Constraints to Verify:**
    - Function size: Kokoro model alone is 2GB+ (exceeds 250MB limit)
    - Timeout: TTS inference takes 30-60s (exceeds 60s limit)
    - Connection persistence: Neo4j pools require persistent TCP (incompatible with ephemeral execution)
    - Cold starts: Lambda/Vercel cold start adds 5-10s overhead per idle period
    - Memory: Large models need 1-2GB RAM minimum
  - **Decision:** Pre-compute/cache results for serverless; use persistent backend (Python FastAPI on Heroku/Railway) for stateful operations

### Debugging Wins

- **Problem:** Understanding Vercel deployment limitations for Python backend
  - **Approach:** Researched Vercel documentation and tested function size limits; identified Kokoro model was 2GB (8x too large)
  - **Tool/Technique:** Examined package contents and compiled size; read official Vercel docs on max_function_size and timeout configurations

- **Problem:** Recognizing architectural mismatch between requirements and platform
  - **Approach:** Traced execution flow (cold start → model load → inference) and mapped to platform constraints (timeout, size, ephemeral execution)
  - **Tool/Technique:** Created timeline document showing why serverless incompatible; proposed alternative architecture (pre-generation + CDN)

- **Problem:** Understanding how to maintain feature in code without expensive runtime cost
  - **Approach:** Designed toggle pattern (TTS_ENABLED) allowing same codebase to work in dev (with inference) and prod (with pre-generated files)
  - **Tool/Technique:** Configuration pattern allows feature complete in development; disabled in production via environment toggle

### Performance Notes

- Pre-generated audio eliminates 30-60s TTS inference from request path; response time drops from 40-70s to <200ms
- Static CDN serving audio (GitHub Pages, CloudFlare) provides global edge caching; reduces bandwidth costs vs. streaming from backend
- Feature toggle approach allows local testing of full TTS pipeline without paying production costs; developers test inference locally before pushing
- Configuration pattern scales to other expensive operations (image generation, video processing, complex analytics) with same pre-generation + CDN approach

### Architecture Insights

- **Serverless vs. Persistent Backend Trade-offs:**
  - Serverless: Stateless, auto-scaling, pay-per-request (good for APIs with variable load, short operations)
  - Persistent (Heroku, Railway): Runs continuously, connection pooling, persistent state (good for long operations, real-time features, database pooling)
  - White Rabbit: Hybrid approach appropriate:
    - Persistent Python backend for Neo4j operations (connection pooling, complex queries)
    - Serverless Next.js frontend for HTTP scaling
    - Pre-generated content in static CDN for expensive offline computation (TTS)

- **When to Pre-Compute:**
  - Operation cost > Request timeout OR
  - Operation size > Serverless package limit OR
  - Result cacheable for many users
  - Examples: TTS, image generation, complex report generation, data preprocessing

---
