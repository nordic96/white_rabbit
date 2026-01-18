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

## Session Learnings - 2026-01-18 (API Key Security Refactoring - PR #54)

### Mistakes & Fixes

- **Issue:** Typo "Verifiy" instead of "Verify" in middleware.py API key validation
  - **Root Cause:** Simple typo in authentication constant name
  - **Fix:** Changed `API_KEY_VERIFIY_HEADER` to `API_KEY_VERIFY_HEADER` in middleware.py
  - **Prevention:** Use IDE spell-checker and run linters (pylint, flake8) to catch typos in identifiers

- **Issue:** Using `fetchApi` for binary audio data caused JSON parsing errors
  - **Root Cause:** `fetchApi` utility automatically parses response as JSON; used for binary (WAV) audio route which caused type mismatch
  - **Fix:** Switched audio route to use native `fetch()` API directly instead of `fetchApi` wrapper
  - **Prevention:** Know the capabilities of utility functions - `fetchApi` is JSON-only; use native fetch for binary/streaming responses

- **Issue:** API key exposed in frontend route files (9 locations with duplicate X-API-Key headers)
  - **Root Cause:** Each frontend route manually constructed X-API-Key header instead of centralizing in one place
  - **Fix:** Moved API key header injection to `fetchApi` utility function; removed from all 9 individual route files
  - **Prevention:** Apply DRY principle - implement once in utilities, use everywhere

- **Issue:** API key comparison vulnerable to timing attacks
  - **Root Cause:** Simple string equality check `if api_key == expected_key` takes different times for correct vs. wrong keys
  - **Fix:** Used `secrets.compare_digest()` for timing-safe comparison in middleware.py
  - **Prevention:** Always use `secrets.compare_digest()` for security-sensitive string comparisons (API keys, tokens, passwords)

- **Issue:** Empty API key not caught when API_KEY_REQUIRED=True
  - **Root Cause:** No validation that required config value is non-empty during startup
  - **Fix:** Added startup validation in config.py: `if API_KEY_REQUIRED and not API_KEY: raise ValueError(...)`
  - **Prevention:** For "required" config values, validate not just presence but also non-empty; add validation in settings class or at app startup

- **Issue:** API_KEY constant was exported from config module, increasing exposure surface
  - **Root Cause:** Made API key available globally to any module that imported config
  - **Fix:** Changed to inline `process.env.API_KEY` definitions within each function that needs it (especially in fetchApi and audio route)
  - **Prevention:** Follow principle of least privilege - define sensitive values as close to usage as possible, not in shared config modules

### Patterns Discovered

- **Pattern:** Centralized API Key Dependency Constant
  - **Context:** Sharing API key validation logic across multiple routers without duplicating code
  - **Implementation:**
    ```python
    # middleware.py - Define once
    API_KEY_DEPENDENCIES = Depends(verify_api_key)

    # In each router file
    from middleware import API_KEY_DEPENDENCIES

    @router.post("/endpoint")
    async def handler(verified: str = API_KEY_DEPENDENCIES):
        # verified contains the API key that passed validation
    ```
  - **Key Detail:** Instead of repeating `Depends(verify_api_key)` in 9+ routes, define constant once and import everywhere

- **Pattern:** Timing-Safe String Comparison for Security Credentials
  - **Context:** Comparing API keys, tokens, or other secrets where timing variations could leak information
  - **Implementation:**
    ```python
    import secrets

    # BAD - Timing leak: exits early on first mismatched character
    if api_key == expected_key:
        return True

    # GOOD - Constant time, compares all characters regardless
    if secrets.compare_digest(api_key, expected_key):
        return True
    ```
  - **Key Detail:** `secrets.compare_digest()` always compares full strings; prevents attackers from using response timing to guess valid keys

- **Pattern:** Inline Sensitive Configuration vs. Exported Constants
  - **Context:** Minimizing exposure of API keys and secrets to only the functions that need them
  - **Implementation:**
    ```python
    # BAD - API key available everywhere
    # config.py
    API_KEY = os.getenv("API_KEY")

    # BAD - Any module can import and access
    from config import API_KEY

    # GOOD - Define where used
    # routes/audio.py
    async def audio_handler():
        api_key = os.getenv("API_KEY")  # Only this handler accesses it
        # ...

    # utils/fetchApi.ts
    export async function fetchApi(...) {
        const headers = {
            "X-API-Key": process.env.API_KEY  // Only this utility accesses it
        }
        // ...
    }
    ```
  - **Key Detail:** Inline definitions limit attack surface; exported constants available to more code than necessary

- **Pattern:** Dependency Injection with FastAPI Dependencies for Auth
  - **Context:** Sharing API key validation across multiple endpoints without code duplication
  - **Implementation:**
    ```python
    # Define in middleware.py
    async def verify_api_key(x_api_key: str = Header(None)) -> str:
        if not x_api_key:
            raise HTTPException(status_code=401, detail="Missing API key")
        if not secrets.compare_digest(x_api_key, settings.API_KEY):
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    API_KEY_DEPENDENCIES = Depends(verify_api_key)

    # Use in routers
    @router.get("/mysteries")
    async def get_mysteries(verified: str = API_KEY_DEPENDENCIES):
        # Endpoint automatically protected; FastAPI calls verify_api_key
    ```
  - **Key Detail:** Dependency injection ensures consistent validation; FastAPI injects verified value as parameter

### Debugging Wins

- **Problem:** Identifying all locations where API key was manually being set
  - **Approach:** Searched codebase for "X-API-Key" header patterns in frontend route files
  - **Tool/Technique:** Used `grep -r "X-API-Key" app/` to find all manual header injections; counted 9 files
  - **Result:** Consolidated all into single `fetchApi` utility for DRY principle

- **Problem:** Discovering API key was vulnerable to timing attacks
  - **Approach:** Reviewed middleware.py authentication logic and recognized simple `==` comparison
  - **Tool/Technique:** Security best practice knowledge; referenced Python secrets module documentation
  - **Result:** Implemented `secrets.compare_digest()` for constant-time comparison

- **Problem:** Audio route returning JSON parse errors instead of audio data
  - **Approach:** Traced error to `fetchApi` response parsing; realized fetchApi parses all responses as JSON
  - **Tool/Technique:** Examined fetchApi utility signature; confirmed it calls `response.json()`
  - **Result:** Switched audio route to native fetch to bypass JSON parser for binary data

- **Problem:** Understanding exposure surface of API_KEY in config.py
  - **Approach:** Reviewed principle of least privilege; traced all files that imported config module
  - **Tool/Technique:** Searched for `from config import` and `import config` to see what could access API key
  - **Result:** Defined API_KEY inline where needed instead of exporting from config

### Performance Notes

- Timing-safe comparison has negligible performance cost (<1ms difference) compared to simple `==`; security benefit far outweighs tiny overhead
- Dependency injection with FastAPI's `Depends()` is evaluated once per request; reusing constant `API_KEY_DEPENDENCIES` has no overhead vs. inline `Depends(verify_api_key)`
- Centralizing API key header in `fetchApi` eliminates 9 redundant header definitions; cleaner code with no performance impact
- Empty string validation at startup (single check) has zero runtime impact; catches misconfiguration immediately

### Security Best Practices Added

1. **Always use `secrets.compare_digest()` for security-sensitive string comparisons** - prevents timing attacks on API keys, tokens, passwords
2. **Define secrets as close to usage as possible** - minimizes exposure surface; don't export from config modules
3. **Validate "required" config values are non-empty** - catch misconfiguration at startup, not during requests
4. **Use DRY principle for auth dependencies** - define verification once, reuse across all endpoints via dependency injection
5. **Never use general utility functions for specialized data types** - don't use JSON parsers for binary; use specialized handlers

---

## Session Learnings - 2026-01-18 (Bulk Router Updates & Security Audits)

### Mistakes & Fixes

- **Issue:** Multiple router files importing outdated/incorrect dependencies
  - **Root Cause:** Dependency updates made in one router but not propagated to similar routers
  - **Fix:** Updated all 4 backend router files with consistent import pattern
  - **Prevention:** When updating router dependencies, use bulk find-and-replace across all routers to ensure consistency; verify all routers have matching imports before committing

### Patterns Discovered

- **Pattern:** Consistent Router Import Structure Across Multiple Files
  - **Context:** Multiple routers (search, graph, nodes, etc.) importing from same dependency sources
  - **Implementation:**
    ```python
    # All routers follow this pattern:
    from fastapi import APIRouter, HTTPException
    from services.search_service import SearchService
    # Dependency versions should match across all routers
    ```
  - **Key Detail:** When updating any router's imports, verify all other routers have matching versions to prevent inconsistent behavior

- **Pattern:** Bulk Refactoring Across Router Files
  - **Context:** Applying same refactoring to multiple routers (4+ files with similar structure)
  - **Implementation:** Rather than manually updating each router one-by-one, use find-replace with file-specific verification
  - **Key Detail:** Group related routers and update together in single batch operation; verify test results apply across all updated routers

### Debugging Wins

- **Problem:** Inconsistent imports across router files causing potential type mismatches
  - **Approach:** Searched for import patterns across all router files to identify mismatches
  - **Tool/Technique:** Used `grep -r "from.*import"` to find all import statements and compared versions
  - **Result:** Identified missing updates in 3 of 4 routers; applied batch updates

### Performance Notes

- Batch updating routers prevents import inconsistency bugs
- Consistent imports across routers enables safe dependency version upgrades
- Grouping router updates reduces testing overhead (test once for consistency rather than per-router)

---

**Document Version:** 2.5
**Last Updated:** 2026-01-18
**Source:** PR #54 (API Key Security Refactoring) + PR Review Response + Bulk Router Updates Session + Client/Server API Separation Session
**Maintainer:** Claude Code Backend Agent

---

## Automation Opportunities - 2026-01-18

### Potential Commands

- **`/audit-dependencies`**
  - **Purpose:** Verify all routers have consistent import versions and dependency structure
  - **Trigger:** After updating any router; bulk dependency refactors; pre-merge checks
  - **Complexity:** Medium
  - **Implementation Notes:** Compare import statements across all routers (search_router.py, graph_router.py, etc.); flag mismatches; suggest unified imports

- **`/add-dependency-injection`**
  - **Purpose:** Add `Depends(verify_api_key)` decorator to all unprotected router endpoints
  - **Trigger:** After updating authentication requirements; PR review step for new endpoints
  - **Complexity:** Medium
  - **Implementation Notes:** Scan routers for endpoints without auth decorator; interactive mode to confirm which endpoints should be protected; apply changes

- **`/find-hardcoded-secrets`**
  - **Purpose:** Search for hardcoded credentials, API keys, passwords in Python code
  - **Trigger:** Scheduled security audits; pre-deployment checks; code review
  - **Complexity:** Low
  - **Implementation Notes:** Search for patterns like "password=", "api_key=", string literals that look like secrets; compare against environment variables

- **`/bulk-router-update`**
  - **Purpose:** Apply same import/dependency change across multiple router files simultaneously
  - **Trigger:** When updating shared dependencies; refactoring service layer imports
  - **Complexity:** Medium
  - **Implementation Notes:** Accept find pattern, replacement pattern, file glob; apply to all matching routers; verify syntax

### Workflow Improvements

- **Current:** Manually update imports in one router → manually check 3 other routers → manually apply same changes to each
  - **Proposed:** `/audit-dependencies` to find mismatches → `/bulk-router-update` to apply changes to all at once → single test run
  - **Benefit:** Reduces 20+ minutes of repetitive updates to 3-5 minutes; ensures consistency; prevents missed routers

- **Current:** Manually add `Depends(verify_api_key)` to each new endpoint in each router
  - **Proposed:** Pre-commit hook or `/add-dependency-injection` command that audits routers and suggests missing protections
  - **Benefit:** Prevents accidentally exposing unprotected endpoints; centralizes auth logic verification

- **Current:** Manual grep search for potential hardcoded secrets in PR reviews
  - **Proposed:** `/find-hardcoded-secrets` command with regex patterns for common credential formats
  - **Benefit:** Catches secrets before they reach main branch; faster than manual review; prevents accidental exposure

- **Current:** Separate dependency updates across 4 routers requires 4 separate edit operations
  - **Proposed:** Single bulk operation that groups routers and applies changes together
  - **Benefit:** Atomic consistency across related files; single verification; less error-prone

### Agent Ideas

- **Agent Name:** Router Configuration Auditor
  - **Specialization:** Verifying router consistency, dependency injection, and security across multiple FastAPI routers
  - **Tools Needed:** Grep, Python AST parser for dependency analysis, file editing for bulk updates
  - **Key Responsibilities:**
    1. Audit all routers for import consistency; flag version mismatches
    2. Verify all endpoints have appropriate security decorators (`@limiter.limit()`, `Depends(verify_api_key)`)
    3. Check for hardcoded credentials or sensitive strings
    4. Generate consistency report comparing all routers
    5. Apply bulk updates to multiple routers with verification
  - **Trigger Scenarios:**
    - After updating any router (suggest consistency audit)
    - New security requirements (add to all routers)
    - Dependency updates (apply to all consistently)
    - Pre-PR checks on router files

### Security Audit Pattern

The development session revealed a scalable pattern for security audits:

1. **Identify Pattern:** Search for specific security-sensitive code (e.g., "X-API-Key" headers, hardcoded passwords, missing auth decorators)
2. **Classify Files:** Determine which files need changes based on file type/location
3. **Bulk Update:** Apply changes consistently across all classified files
4. **Verify:** Test that changes work across all files; no regressions

This pattern could be automated for:
- API key injection locations (consolidate to utilities)
- Rate limiting decorators (ensure all expensive endpoints protected)
- Error handling (ensure all routers catch specific exceptions, not bare Exception)
- Parameterized queries (verify all database access uses parameters, not f-strings)

**Recommended Implementation:**
- Create audit templates for each security concern
- Build CLI tool to run audits and report violations
- Generate suggested fixes with impact analysis
- Allow dry-run mode before applying changes

---

## Session Learnings - 2026-01-18 (Comprehensive Client/Server API Separation & Security)

### Mistakes & Fixes

- **Issue:** Timing attack vulnerability in API key comparison
  - **Root Cause:** Using simple string equality `if api_key == expected_key` which returns early on first mismatch, leaking timing information
  - **Fix:** Replaced with `secrets.compare_digest()` which always compares full strings in constant time
  - **Prevention:** Always use `secrets.compare_digest()` for any security-sensitive string comparison (API keys, tokens, passwords)

- **Issue:** Empty API key not validated when API_KEY_REQUIRED=True
  - **Root Cause:** Config validation didn't check that required values were non-empty, only that they existed
  - **Fix:** Added Pydantic field validator: `if api_key_required and not api_key: raise ValueError("API_KEY required but empty")`
  - **Prevention:** For "required" config values, validate both existence AND non-empty state at startup

- **Issue:** Broken audio route due to using JSON parser on binary data
  - **Root Cause:** Audio route was trying to use `fetchApi` utility which parses all responses as JSON
  - **Fix:** Switched audio route to native `fetch()` for binary data handling; only JSON routes use fetchApi
  - **Prevention:** Know the capabilities of utility functions; use specialized handlers for binary/streaming data

- **Issue:** API_KEY_DEPENDENCIES constant had typo "VERIFIY" instead of "VERIFY"
  - **Root Cause:** Simple typo in identifier name
  - **Fix:** Corrected to `API_KEY_VERIFY_HEADER`
  - **Prevention:** Use IDE spell-checker and linters (pylint, flake8) to catch typos

- **Issue:** Middleware couldn't be tested without circular imports
  - **Root Cause:** API_KEY_DEPENDENCIES defined in middleware but imported in routers; circular dependency potential
  - **Fix:** Defined `API_KEY_DEPENDENCIES = Depends(verify_api_key)` constant in middleware for reuse across routers
  - **Prevention:** Define shared dependency constants in central location (middleware); import in routers

### Patterns Discovered

- **Pattern:** Centralized API Key Dependency Injection
  - **Context:** Multiple routers need to require API key validation without duplicating verification code
  - **Implementation:**
    ```python
    # middleware.py - Define once
    from fastapi import Depends, Request, Header, HTTPException
    import secrets

    async def verify_api_key(x_api_key: str = Header(None)) -> str:
        """Verify API key from X-API-Key header using timing-safe comparison."""
        if not settings.api_key_required:
            return ""

        if not x_api_key or not secrets.compare_digest(x_api_key, settings.api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
        return x_api_key

    # Reusable dependency constant
    API_KEY_DEPENDENCIES = Depends(verify_api_key)

    # In routers - just import and use
    from middleware import API_KEY_DEPENDENCIES

    @router.post("/endpoint")
    async def handler(_: str = API_KEY_DEPENDENCIES):
        # Endpoint automatically protected; verification happens before handler
    ```
  - **Key Detail:** Define dependency constant once in middleware; reuse across all routers via import; FastAPI injects verified result

- **Pattern:** Timing-Safe Credential Comparison
  - **Context:** Comparing API keys, tokens, or passwords where timing variations could leak information to attackers
  - **Implementation:**
    ```python
    import secrets

    # Bad - Exits on first mismatched character (0.1ms for wrong first char, 10ms for correct key)
    if api_key == expected_key:
        return True

    # Good - Always compares full strings (constant ~10ms regardless of match)
    if secrets.compare_digest(api_key, expected_key):
        return True
    ```
  - **Key Detail:** Timing attacks are real; attackers can use response time differences to brute-force credentials; `secrets.compare_digest()` prevents this

- **Pattern:** Startup Validation for Required Configuration
  - **Context:** Catching misconfiguration (missing API_KEY when API_KEY_REQUIRED=true) at startup instead of at first request
  - **Implementation:**
    ```python
    from pydantic import BaseSettings, Field, field_validator

    class Settings(BaseSettings):
        api_key_required: bool = Field(default=False)
        api_key: str = Field(default="")

        @field_validator('api_key')
        def validate_api_key(cls, v: str, info) -> str:
            """Ensure API_KEY is non-empty when required."""
            if info.data.get('api_key_required') and not v:
                raise ValueError("API_KEY is required when API_KEY_REQUIRED=true but was empty")
            return v
    ```
  - **Key Detail:** Pydantic validators run at config load time; catches issues immediately instead of on first request

- **Pattern:** Least Privilege Principle for Secrets
  - **Context:** Minimizing exposure surface of sensitive values (API keys, database passwords)
  - **Implementation:**
    ```python
    # Bad - API key available everywhere
    from config import api_key

    # Good - Define where used
    async def verify_api_key(x_api_key: str = Header(None)) -> str:
        api_key = settings.api_key  # Only this function accesses it
        if not secrets.compare_digest(x_api_key, api_key):
            raise HTTPException(status_code=401)
    ```
  - **Key Detail:** Import secrets directly in functions/handlers where needed; don't expose through module-level imports

- **Pattern:** Backend → Next.js API → Client Request Flow
  - **Context:** Proper layering of API authentication across fullstack Next.js + FastAPI backend
  - **Implementation:**
    ```
    Browser Client
      ↓ HTTP request
    Next.js API Route (app/api/mystery/route.ts)
      ↓ fetchApi() adds X-API-Key header
    FastAPI Backend (api/src/main.py)
      ↓ verify_api_key() validates header
    Database Query
    ```
  - **Key Detail:** API key only added at API route layer (server-side); client code never has access to secrets; backend validates on every request

### Debugging Wins

- **Problem:** Identifying all locations where API_KEY was being set
  - **Approach:** Searched for X-API-Key header patterns across frontend code
  - **Tool/Technique:** Used `grep -r "X-API-Key"` to find manual header injections in 9 frontend route files
  - **Result:** Consolidated all into single `fetchApi` utility in backend

- **Problem:** Discovering timing attack vulnerability
  - **Approach:** Reviewed middleware.py authentication logic and recognized simple `==` comparison
  - **Tool/Technique:** Security best practice knowledge; consulted Python secrets module documentation
  - **Result:** Implemented `secrets.compare_digest()` for constant-time comparison

- **Problem:** Understanding why audio route was broken
  - **Approach:** Traced error to `fetchApi` response parsing; realized it parses all responses as JSON
  - **Tool/Technique:** Examined fetchApi utility code; confirmed it calls `response.json()`
  - **Result:** Switched audio route to native fetch to bypass JSON parser for binary data

- **Problem:** Ensuring API key validation happens on every request
  - **Approach:** Traced dependency injection flow through FastAPI middleware
  - **Tool/Technique:** Verified that `Depends()` decorators are invoked before route handlers
  - **Result:** Confirmed validation happens for all decorated routes

### Performance Notes

- Timing-safe comparison has <1ms overhead compared to regular `==`; security benefit far outweighs cost
- Dependency injection with `Depends()` evaluated once per request; reusing constant has no overhead
- Startup validation (single check) has zero runtime cost; prevents bugs at deployment time
- API_KEY_DEPENDENCIES constant in middleware prevents code duplication across 8+ routers

### Security Best Practices Enforced

1. **Always use `secrets.compare_digest()` for security-sensitive comparisons** - prevents timing attacks
2. **Validate required config values are non-empty at startup** - catch misconfiguration immediately
3. **Use dependency injection for auth validation** - centralize logic, prevent duplication
4. **Follow least privilege principle** - define secrets close to usage, minimize exposure
5. **Maintain client/server boundary** - client code never has access to API_KEY

### Architecture Insights

**Complete Request Flow:**

1. **Client (Browser):** Makes HTTP request to `GET /api/mystery/123`
2. **Next.js Route Handler:** Receives request, imports `fetchApi` from `@/utils/networkUtils` (server-only)
3. **fetchApi Adds Header:** Injects `X-API-Key: ${process.env.API_KEY}` from environment
4. **Backend Receives:** FastAPI endpoint gets request with X-API-Key header
5. **Middleware Validates:** `verify_api_key()` uses `secrets.compare_digest()` to validate against `settings.api_key`
6. **Route Handler Executes:** If validation passes, Neo4j query runs
7. **Response Returned:** Data sent back through Next.js to client

**Key Security Properties:**
- Client never has API_KEY (only server environment)
- Every request validated with timing-safe comparison
- Empty API keys caught at startup, not at request time
- Dependency injection prevents validation bypass

---
