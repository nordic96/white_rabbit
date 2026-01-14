# SKILL.md - Frontend Development Learnings

This document captures best practices, common mistakes, and guidelines learned from frontend development sessions.

---

## Table of Contents

1. [Next.js Patterns](#nextjs-patterns)
2. [React Patterns](#react-patterns)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Next.js Patterns

### Route Caching (App Router)

**ALWAYS disable caching for real-time endpoints**

Next.js App Router caches GET routes by default. For health checks, status monitors, and other real-time endpoints, use `force-dynamic`:

```typescript
// app/api/health/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  // This will be executed on every request, not cached
}
```

**Why this matters:** Without `force-dynamic`, cached responses are returned even when the backend state has changed. This caused issues where health check endpoints showed stale "warmed_up" status after the backend went down.

### API Proxy Pattern with Timeout

**ALWAYS use AbortController for backend proxies**

```typescript
export async function GET(): Promise<NextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const url = new URL(`${API_URL}/health`);
    const res = await fetchApi<HealthResponse>(url, {
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'NetworkError',
          message: 'Failed to fetch health',
          status_code: 500,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(res.data);
  } catch {
    return NextResponse.json(
      {
        error: 'NetworkError',
        message: 'Service unavailable',
        status_code: 500,
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Error Response Format

**ALWAYS match ErrorResponse type structure**

The `fetchApi` utility expects error responses with specific fields:

```typescript
// GOOD - Complete error response
return NextResponse.json(
  {
    error: 'NetworkError',      // Error type identifier
    message: 'Human readable message',
    status_code: 500,
  },
  { status: 500 },
);

// BAD - Incomplete error response (breaks fetchApi error handling)
return NextResponse.json(
  { error: 'Something went wrong' },
  { status: 500 },
);
```

---

## React Patterns

### Status Polling Component

**Use useEffect with setInterval for polling**

```typescript
const INTERVAL = 10000; // 10 seconds

export default function StatusComponent() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<Status>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetchApi<StatusResponse>('/api/health');
        if (res.ok) {
          setStatus(res.data.status);
          setError(null);
        } else {
          throw res.error;
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
          setStatus('unknown');
        }
      }
    }

    // Fetch immediately on mount
    fetchStatus();

    // Then poll at interval
    intervalRef.current = setInterval(fetchStatus, INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Render status indicator...
}
```

**Key points:**
- Call `fetchStatus()` immediately on mount (don't wait for first interval)
- Store interval ref for cleanup
- Reset error state on successful fetch
- Set status to 'unknown' on error

---

## TypeScript Guidelines

### Type-Safe Status Unions

**Define explicit status types**

```typescript
// GOOD - Explicit union types
export type DBStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface DBHealthResponse {
  api: string;
  database: {
    status: 'healthy' | 'unhealthy';
    database?: string;
    uri?: string;
    error?: string;
  };
}

// Component uses the union type
const [dbStatus, setDbStatus] = useState<DBStatus>('unknown');
```

---

## Common Mistakes to Avoid

### Caching Issues

- **Missing `force-dynamic` on health endpoints**
  - Impact: Stale cached responses returned
  - Fix: Add `export const dynamic = 'force-dynamic'`

### Error Handling

- **Incomplete error response format**
  - Impact: `fetchApi` can't properly create ApiError instances
  - Fix: Include `error`, `message`, and `status_code` fields

### Polling Components

- **Not fetching on mount**
  - Impact: User waits for full interval before seeing status
  - Fix: Call fetch function before setting up interval

- **Not cleaning up intervals**
  - Impact: Memory leaks, continued polling after unmount
  - Fix: Return cleanup function from useEffect

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Source:** Health Check Implementation Session
