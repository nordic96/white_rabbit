# Error Handling & Response Models

This document describes the error handling strategy and response formats for the White Rabbit API.

## Overview

The API implements a comprehensive error handling system with:
- Custom exception classes for different error types
- Global exception handlers for consistent error responses
- Request/response logging middleware
- Standardized error response format

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "ErrorTypeName",
  "message": "Human-readable error message",
  "status_code": 404,
  "details": {
    "additional": "context"
  },
  "path": "/api/mysteries/invalid-id"
}
```

## Custom Exception Classes

### WhiteRabbitException (Base)
Base exception for all custom API errors.

**Attributes:**
- `message`: Human-readable error message
- `status_code`: HTTP status code
- `details`: Optional dictionary with additional context

### DatabaseConnectionError
**Status Code:** 503 (Service Unavailable)
**When raised:** Database connection fails or driver is not initialized

**Example:**
```json
{
  "error": "DatabaseConnectionError",
  "message": "Database connection not established",
  "status_code": 503,
  "details": {
    "reason": "Driver not initialized"
  },
  "path": "/api/mysteries"
}
```

### DatabaseQueryError
**Status Code:** 500 (Internal Server Error)
**When raised:** Database query execution fails

**Example:**
```json
{
  "error": "DatabaseQueryError",
  "message": "Database read operation failed",
  "status_code": 500,
  "details": {
    "error_type": "ClientError",
    "query": "MATCH (m:Mystery) WHERE..."
  },
  "path": "/api/mysteries"
}
```

### ResourceNotFoundError
**Status Code:** 404 (Not Found)
**When raised:** Requested resource doesn't exist

**Example:**
```json
{
  "error": "ResourceNotFoundError",
  "message": "Mystery with id 'nonexistent-id' not found",
  "status_code": 404,
  "path": "/api/mysteries/nonexistent-id"
}
```

### ValidationError
**Status Code:** 422 (Unprocessable Entity)
**When raised:** Input validation fails

**Example:**
```json
{
  "error": "ValidationError",
  "message": "Input validation failed",
  "status_code": 422,
  "details": {
    "error_count": 2
  },
  "path": "/api/mysteries",
  "errors": [
    {
      "field": "mystery_id",
      "message": "String should match pattern '^[a-zA-Z0-9-_]+$'",
      "type": "string_pattern_mismatch"
    },
    {
      "field": "status",
      "message": "Input should be 'unresolved', 'resolved', 'partially_resolved' or 'debunked'",
      "type": "enum"
    }
  ]
}
```

### InvalidNodeTypeError
**Status Code:** 400 (Bad Request)
**When raised:** Invalid node type is requested

**Example:**
```json
{
  "error": "InvalidNodeTypeError",
  "message": "Invalid node type 'InvalidType'. Valid types are: Mystery, Location, TimePeriod, Category",
  "status_code": 400,
  "path": "/api/nodes/InvalidType"
}
```

### InvalidParameterError
**Status Code:** 400 (Bad Request)
**When raised:** Invalid parameter value is provided

**Example:**
```json
{
  "error": "InvalidParameterError",
  "message": "Invalid parameter 'depth': Must be between 1 and 3",
  "status_code": 400,
  "path": "/api/graph"
}
```

## Logging

### Request Logging
Every request is logged with:
- Request ID (for correlation)
- HTTP method and path
- Client IP address
- Query parameters
- Request duration
- Response status code

**Example log:**
```
2026-01-08 20:00:00 - src.middleware - INFO - Request started | ID: 140234567890123 | GET /api/mysteries | Client: 127.0.0.1 | Params: limit=20&offset=0
2026-01-08 20:00:01 - src.middleware - INFO - Request completed | ID: 140234567890123 | GET /api/mysteries | Status: 200 | Duration: 0.142s
```

### Error Logging
Errors are logged with:
- Error type and message
- Request path and method
- Stack trace (for unhandled exceptions)
- Request duration

**Example log:**
```
2026-01-08 20:00:00 - src.middleware - ERROR - Request failed | ID: 140234567890123 | GET /api/mysteries/invalid | Error: ResourceNotFoundError | Duration: 0.023s
```

## Exception Handlers

### 1. WhiteRabbitException Handler
Catches all custom `WhiteRabbitException` subclasses and returns standardized error responses.

### 2. HTTPException Handler
Catches FastAPI's built-in `HTTPException` and converts it to our standard format.

### 3. ValidationError Handler
Catches Pydantic validation errors and returns detailed field-level error information.

### 4. Generic Exception Handler
Catch-all handler for unexpected errors. Returns a generic 500 error without exposing internal details.

## Middleware

### RequestLoggingMiddleware
Logs all incoming requests and outgoing responses with timing information.

### ErrorLoggingMiddleware
Logs detailed error information for debugging before passing to exception handlers.

## Best Practices

### For API Consumers

1. **Always check `status_code`** to determine the error category
2. **Parse the `error` field** to identify the specific error type
3. **Display `message` to users** - it's always human-readable
4. **Use `details` for debugging** - contains additional context
5. **For validation errors**, check the `errors` array for field-specific issues

### For API Developers

1. **Use custom exceptions** instead of raising HTTPException
2. **Provide helpful error messages** that guide users to fix the issue
3. **Include relevant context** in the `details` dictionary
4. **Log errors appropriately** - use ERROR for unexpected issues, WARNING for expected errors

## Example Usage

### Raising Custom Exceptions

```python
from src.exceptions import ResourceNotFoundError, InvalidParameterError

# Resource not found
if not mystery:
    raise ResourceNotFoundError(
        resource_type="Mystery",
        resource_id=mystery_id
    )

# Invalid parameter
if depth < 1 or depth > 3:
    raise InvalidParameterError(
        parameter="depth",
        reason="Must be between 1 and 3"
    )
```

### Handling Errors in Client Code

```typescript
try {
  const response = await fetch('/api/mysteries/invalid-id');
  const data = await response.json();

  if (!response.ok) {
    // Handle error based on status code
    switch (data.status_code) {
      case 404:
        console.error('Resource not found:', data.message);
        break;
      case 422:
        console.error('Validation error:', data.errors);
        break;
      case 500:
        console.error('Server error:', data.message);
        break;
      default:
        console.error('Unknown error:', data.message);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```
