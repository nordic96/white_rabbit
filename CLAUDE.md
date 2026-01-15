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

### Branch Naming Convention

Use one of these formats for feature branches:
- `issue_[number]` - For issues (e.g., `issue_42`)
- `dev_[feature]` - For general development (e.g., `dev_search_refinement`)

**Important:** Avoid using the `#` character in branch names (not all systems support it).

### PR Review Workflow

When reviewing PRs locally:
```bash
gh pr view [number] --comments  # Read all PR comments including reviews
```

When addressing review comments, prioritize:
1. Critical priority issues first
2. High priority issues second
3. Suggestions and improvements last

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

## UI Components & Styling

### Theme & Color Palette

The application uses a dark theme by default. All color definitions are maintained in `app/globals.css` as CSS custom properties for consistency across components:

```css
/* Primary Node Type Colors */
--color-mystery-purple: #4142f3
--color-category-yellow: #fedf66
--color-location-pink: #ff79c6
--color-tp-skyblue: #8be9fd
--color-primary-navy: #1f1e81

/* UI Colors */
--color-dark-gray: #212121
--color-dark-secondary: #303030
```

These colors map to Neo4j node types and are used throughout the application for visual consistency.

### GraphLegend Component

Location: `components/GraphMap/GraphLegend.tsx`

Displays a legend showing all graph node types with their corresponding colors and icons:
- **Mystery** (purple #4142f3) - Question mark icon
- **Location** (pink #ff79c6) - Location marker icon
- **Time Period** (sky blue #8be9fd) - Clock icon
- **Category** (yellow #fedf66) - Tag icon

The component uses a fixed LEGEND_ITEMS array that mirrors the NodeColorMap in GraphMap.tsx. If adding new node types, update both locations.

Usage: Integrated into GraphMap component's absolute positioned top-left overlay.

### Node Color Mapping

The `NodeColorMap` in `components/GraphMap/GraphMap.tsx` defines colors for all graph node types:

```typescript
const NodeColorMap: Record<NodeType, string> = {
  Category: '#fedf66',
  Location: '#ff79c6',
  Mystery: '#4142f3',
  TimePeriod: '#8be9fd',
};
```

This map is used when rendering nodes in the Neo4j visualization library (NVL). Keep this synchronized with:
1. LEGEND_ITEMS in GraphLegend.tsx
2. CSS custom properties in globals.css
3. Any design system documentation

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

### API Route Query Parameter Validation

All API routes that accept query parameters must validate them before processing:

```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limitParam = searchParams.get('limit');

  // Validate required parameters
  if (!query || query.length === 0) {
    return Response.json(
      {
        error: 'INVALID_QUERY',
        message: 'Query parameter is required and must not be empty',
        status_code: 400,
      },
      { status: 400 }
    );
  }

  // Validate parameter length constraints
  if (query.length > 200) {
    return Response.json(
      {
        error: 'QUERY_TOO_LONG',
        message: 'Query must be 200 characters or less',
        status_code: 400,
      },
      { status: 400 }
    );
  }

  // Validate numeric parameters
  let limit = 10;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return Response.json(
        {
          error: 'INVALID_LIMIT',
          message: 'Limit must be a number between 1 and 100',
          status_code: 400,
        },
        { status: 400 }
      );
    }
    limit = parsedLimit;
  }

  // Process validated parameters
}
```

Always propagate error responses with the standard ErrorResponse format for consistency with frontend error handling.

### API Route Timeout Protection

Use AbortController with setTimeout for backend calls to prevent hanging requests:

```typescript
export async function GET(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch('http://localhost:8000/endpoint', {
      signal: controller.signal,
    });
    // Handle response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json(
        {
          error: 'REQUEST_TIMEOUT',
          message: 'Backend service request timed out',
          status_code: 504,
        },
        { status: 504 }
      );
    }
    // Handle other errors
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Frontend State Management with Zustand

Use Zustand stores for client-side state that interacts with the API. Implement AbortController for race condition prevention:

```typescript
import { create } from 'zustand';

interface SearchStore {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  abortController: AbortController | null;
  search: (query: string) => Promise<void>;
  reset: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  results: [],
  isLoading: false,
  error: null,
  abortController: null,

  search: async (query: string) => {
    set({ isLoading: true, error: null });

    // Cancel previous request if it's still in flight
    const prevController = useSearchStore.getState().abortController;
    if (prevController) {
      prevController.abort();
    }

    const controller = new AbortController();
    set({ abortController: controller });

    try {
      const response = await fetchApi<SearchResponse>('/api/search', {
        query_params: { q: query, limit: 20 },
        signal: controller.signal,
      });

      set({ results: response.results, error: null });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        set({ error: error.message });
      }
    } finally {
      set({ isLoading: false, abortController: null });
    }
  },

  reset: () => {
    set({
      results: [],
      isLoading: false,
      error: null,
      abortController: null,
    });
  },
}));
```

**Key patterns:**
- Cancel previous requests before starting new ones to prevent stale updates
- Use fetchApi with type generics for type-safe API calls
- Clean up AbortController in finally block
- Propagate API error responses to store state

### Reusing Existing Hooks

Prefer existing custom hooks over manual event listener implementation:
- Use `useClickOutside` for closing modals/dropdowns instead of manually adding document click listeners
- Check existing hooks in `app/hooks/` before creating new ones
- Document hook behavior in their JSDoc comments

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
