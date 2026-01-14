# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

White Rabbit is a web application exploring world's unsolved mysteries using Neo4J's knowledge database. The project combines a Next.js frontend with a planned Python/FastAPI backend for Neo4J graph database operations.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is currently configured.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript 5.9
- **Styling:** Tailwind CSS 4 with PostCSS
- **Backend (planned):** Python FastAPI for Neo4J CRUD operations
- **Database (planned):** Neo4J graph database

## Architecture

```
app/                 # Next.js App Router (pages and layouts)
api/                 # Backend API directory (currently empty, planned for FastAPI)
public/              # Static assets
.claude/agents/      # Custom Claude Code agent definitions
```

### Path Aliases

TypeScript is configured with `@/*` mapping to the project root for imports.

## Git Workflow

- **develop:** Feature development branch
- **master:** Production/release branch
- Create feature branches from `develop`
- PRs to `develop` trigger automated Claude code review

## GitHub Actions

Two Claude-powered workflows are configured:
1. **claude.yml:** Interactive assistance when @claude is mentioned in issues/PRs
2. **claude-code-review.yml:** Automatic code review on PRs

## Custom Agents

Specialized agents are configured in `.claude/agents/` with subdirectory organization:

| Agent | Location | Purpose |
|-------|----------|---------|
| **frontend-dev** | `.claude/agents/frontend-dev/` | Next.js/React/TypeScript development, UI components, Tailwind CSS styling |
| **backend-dev** | `.claude/agents/backend-dev/` | Python FastAPI development, Neo4J database operations, Cypher queries |
| **ui-ux-designer** | `.claude/agents/ui-ux-designer/` | Design consistency review, accessibility audits, visual hierarchy analysis |

Each agent has its own configuration file (`[agent-name].md`) and specialized guidelines (`SKILL.md`).

All agents have access to Playwright MCP for browser automation and testing.

### Usage

```
Use the frontend-dev agent to build a new React component
Use the backend-dev agent to create a FastAPI endpoint for mysteries
Use the ui-ux-designer agent to review the homepage design consistency
```

## MCP Servers

Playwright MCP is configured project-wide in `.mcp.json` for browser automation capabilities:
- Visual testing and screenshots
- Responsive design validation
- User interaction automation
- Accessibility testing

## API Endpoints

### Global Search - `GET /api/search`

Performs fulltext search across all indexed node types (Mystery, Location, TimePeriod, Category).

**Query Parameters:**
- `q` (string, required): Search query (1-200 characters)
- `limit` (integer, optional): Maximum results to return, default: 10, max: 100

**Example Request:**
```
GET /api/search?q=atlantis&limit=20
```

**Response:**
```json
{
  "query": "atlantis",
  "total": 2,
  "results": [
    {
      "id": "mystery_001",
      "type": "Mystery",
      "text": "Lost City of Atlantis",
      "score": 3.45
    },
    {
      "id": "location_015",
      "type": "Location",
      "text": "Santorini",
      "score": 2.12
    }
  ]
}
```

Results are sorted by relevance score (highest first). Uses Neo4j fulltext index for efficient searching.

## Development Patterns

### Neo4j Cypher Query Security

Always use parameterized queries to prevent injection attacks. Never interpolate user input directly into Cypher strings.

**Vulnerable (avoid):**
```python
# DO NOT DO THIS
cypher_query = f'MATCH (n) WHERE n.name = "{user_input}" RETURN n'
```

**Secure (correct):**
```python
cypher_query = "MATCH (n) WHERE n.name = $name RETURN n"
parameters = {"name": user_input}
results = await execute_read_query(request, cypher_query, parameters)
```

All parameters are passed separately from the query string to prevent injection.

### Next.js API Routes - Route Caching

Next.js App Router caches GET routes by default for performance. When building real-time endpoints (health checks, status monitors), use the dynamic export to force re-evaluation on every request:

```typescript
// app/api/health/route.ts
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Endpoint logic here
}
```

Without this, cached responses may be stale. Always use `force-dynamic` for endpoints that should reflect current state.

### API Error Response Format

The frontend fetchApi utility expects error responses to match a specific ErrorResponse type structure:

```typescript
{
  error: string;      // Error type/category
  message: string;    // Human-readable message
  status_code: number; // HTTP status code
}
```

API routes must return errors in this format for error handling to work correctly. Example:

```typescript
return Response.json(
  {
    error: 'SERVICE_UNAVAILABLE',
    message: 'Backend service is unreachable',
    status_code: 503,
  },
  { status: 503 }
);
```

### Health Check Proxy Pattern

Backend health checks should be proxied through Next.js API routes with timeout protection:

```typescript
export async function GET(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch('http://localhost:8000/health', {
      signal: controller.signal,
    });
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error: 'SERVICE_UNAVAILABLE',
        message: 'Backend service is unreachable',
        status_code: 503,
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Status Monitoring Components

Use a polling pattern with useEffect and setInterval for real-time status components:

```typescript
export function DBServerStatus() {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setStatus(response.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
      setLastCheck(new Date());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, []);

  // Component JSX here
}
```

Configure polling intervals based on use case - health endpoints typically poll every 30-60 seconds to minimize overhead.
