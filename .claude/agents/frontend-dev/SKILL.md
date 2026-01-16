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

## Session Learnings - 2026-01-15

### Mistakes & Fixes

- **Issue:** DBServerStatus component not respecting response format from API
  - **Root Cause:** Component expected response with nested database object but API error responses didn't match ErrorResponse type structure
  - **Fix:** Ensured API endpoint returns complete error response with `{ error, message, status_code }` fields
  - **Prevention:** Verify error response format matches the expected type before using in components. Test both success and error paths.

### Patterns Discovered

- **Pattern:** Health Check Polling with Immediate Fetch
  - **Context:** Monitoring backend status in real-time while user is on page
  - **Implementation:** Call fetch function immediately on mount, then set interval for subsequent polling
  - **Key Detail:** This prevents user from waiting for full interval duration to see initial status

- **Pattern:** API Response Type Consistency
  - **Context:** Components depend on consistent error response structure for proper error handling
  - **Implementation:** ErrorResponse type requires `error` (string), `message` (string), and `status_code` (number)
  - **Key Detail:** All error responses, whether from API endpoints or caught exceptions, must match this structure

### Debugging Wins

- **Problem:** DBServerStatus component throwing type errors when receiving API error responses
  - **Approach:** Traced error to API endpoint returning incomplete error object
  - **Tool/Technique:** Checked fetchApi type definitions to understand expected ErrorResponse structure

### Performance Notes

- Polling interval set to 10 seconds balances responsiveness with API load
- Status check is lightweight (no complex data fetching), suitable for polling frequency
- Consider adding exponential backoff if backend is consistently unavailable

---

---

## Session Learnings - 2026-01-15 (Part 2)

### Mistakes & Fixes

- **Issue:** Console.log statements left in production code during SearchBar refactoring
  - **Root Cause:** Debug logging not removed before final submission
  - **Fix:** Removed all console.log statements and replaced with proper error handling
  - **Prevention:** Use search/replace to find and remove all console.log before finalizing code

- **Issue:** SearchBar component relying on manual event listeners for click-outside detection
  - **Root Cause:** Not leveraging existing utility hooks available in codebase
  - **Fix:** Replaced manual event listener setup with `useClickOutside` hook
  - **Prevention:** Audit codebase for existing utilities before implementing custom solutions

### Patterns Discovered

- **Pattern:** Zustand Store with Abort Controller for Search State Management
  - **Context:** Managing global search state with automatic cancellation of in-flight requests
  - **Implementation:**
    ```typescript
    // searchStore.ts
    const searchStore = create((set) => ({
      query: '',
      results: [],
      abortController: null as AbortController | null,
      setQuery: (query) => set({ query }),
      abortPreviousRequest: () => {
        // Cancel in-flight request if new search initiated
        get().abortController?.abort();
      },
    }));
    ```
  - **Key Detail:** Store the AbortController instance and call abort() when initiating new searches to prevent race conditions where results arrive out of order

- **Pattern:** Type-Safe API Calls with Generics
  - **Context:** Reusable fetch utility that works with different response types
  - **Implementation:** `fetchApi<SearchResponse>('/api/search?q=...')` provides type safety for response data
  - **Key Detail:** Generic type parameter allows components to specify expected response shape without type casting

- **Pattern:** Centralized Search State with Zustand
  - **Context:** Multiple components need to access/update search state (SearchBar, Results panel)
  - **Implementation:** Store query, results, and loading state in zustand, components subscribe via custom hooks
  - **Key Detail:** Decouples components from each other - SearchBar updates query, Results component automatically updates on subscription

### Debugging Wins

- **Problem:** SearchBar component clearing results unexpectedly
  - **Approach:** Traced state updates through zustand store to identify when clearResults was being called
  - **Tool/Technique:** Added console logging temporarily to track store subscription updates

- **Problem:** Race condition in search requests (older results appearing after newer ones)
  - **Approach:** Identified that rapid successive searches weren't cancelling previous in-flight requests
  - **Tool/Technique:** Used browser Network tab to observe multiple simultaneous requests and AbortController to cancel outdated ones

### Performance Notes

- AbortController prevents wasted processing on cancelled requests and network bandwidth
- Zustand is lightweight compared to Redux for this use case (single search state object)
- Consider debouncing search input to reduce number of API calls

---

---

## Session Learnings - 2026-01-15 (Part 3 - PR #44: Theme Changes & UI Fixes)

### Mistakes & Fixes

- **Issue:** Mystery node color inconsistency between GraphMap.tsx and CSS
  - **Root Cause:** Color definition (#7f00ff) in GraphMap.tsx's NodeColorMap didn't match globals.css definition (#4142f3), causing visual mismatches when the theme was updated
  - **Fix:** Updated NodeColorMap in GraphMap.tsx to match the correct color definition (#4142f3) from globals.css
  - **Prevention:** Maintain a single source of truth for color definitions; consider extracting NodeColorMap to a constants file (e.g., constants/colors.ts) that both components and CSS can import, or add linting rules to catch color inconsistencies

- **Issue:** Unused dark: Tailwind class prefixes scattered across 10+ components after dark mode removal
  - **Root Cause:** Dark mode was removed from the project but the dark: prefixes were left in place, cluttering the codebase and confusing future maintainers
  - **Fix:** Used Grep to find all occurrences of dark: classes and removed them from affected components
  - **Prevention:** When removing features (like dark mode), create a systematic cleanup checklist and use Grep to verify all related code is removed. Consider a pre-commit hook that flags deprecated patterns using eslint-comments/no-unused-disable

- **Issue:** Prettier formatting violations in multiline JSX expressions
  - **Root Cause:** Complex multiline JSX wasn't properly formatted according to Prettier standards
  - **Fix:** Applied Prettier formatting fixes to ensure consistent code style across the component
  - **Prevention:** Configure pre-commit hooks with Prettier to catch formatting issues before they reach code review

- **Issue:** Unused eslint-disable directive left in code
  - **Root Cause:** ESLint disable comments were added during development but not removed after the underlying issue was resolved
  - **Fix:** Removed the unused eslint-disable directive during cleanup
  - **Prevention:** Use ESLint rules that flag unused directives to catch these automatically during linting

### Patterns Discovered

- **Pattern:** Tailwind Responsive Classes for Mobile-First Design
  - **Context:** Fixing touch target sizes for mobile devices (SearchBar component)
  - **Implementation:** Use format `py-2 sm:py-1` where the base class applies to mobile and sm: prefix overrides for larger screens. This ensures proper spacing on small screens while optimizing for larger displays
  - **Example:** SearchBar padding set to `py-2` for mobile with `sm:py-1` for tablet/desktop, improving accessibility on touch devices
  - **Key Detail:** Base class is the mobile-first approach, then override with responsive prefixes for larger breakpoints

- **Pattern:** Centralized Color Definitions with NodeColorMap
  - **Context:** Maintaining consistent node colors across graph visualizations
  - **Implementation:** Define color mappings in TypeScript (NodeColorMap object) that are used in React components. Keep these in sync with CSS global variables for consistency
  - **Example:**
    ```typescript
    const NodeColorMap: Record<string, string> = {
      Mystery: '#4142f3',
      Person: '#9f1239',
      Place: '#ea580c',
    };
    ```
  - **Key Detail:** Maps node types to their visual colors. This approach allows dynamic color changes in JavaScript while maintaining CSS-based fallbacks for consistency

- **Pattern:** Systematic Code Cleanup with Grep
  - **Context:** Finding and removing deprecated patterns (dark: classes) across large codebases
  - **Implementation:** Use Grep with specific patterns and file type filters to identify all occurrences. Execute targeted removals based on the results
  - **Grep Example:** `grep -r "dark:" --glob="**/*.tsx" --glob="**/*.ts"` to find all dark mode prefixes
  - **Key Detail:** Always verify results with count output_mode first, then execute removals file-by-file to ensure accuracy

### Debugging Wins

- **Problem:** Identifying all components affected by dark mode removal
  - **Approach:** Used Grep to systematically search for `dark:` class prefixes across the codebase, then verified the list of files to ensure complete cleanup
  - **Tool/Technique:** Grep with glob patterns to filter TypeScript/JSX files, output_mode set to "files_with_matches" to see all affected files
  - **Result:** Successfully removed dark: prefixes from all 10 components without missing any

- **Problem:** Verifying color consistency between GraphMap logic and styles
  - **Approach:** Cross-referenced the NodeColorMap in GraphMap.tsx with the corresponding colors in globals.css to ensure values matched
  - **Tool/Technique:** Manual code review of both files side-by-side, visual inspection of the rendered graph component to verify colors matched
  - **Result:** Identified the color mismatch (#7f00ff vs #4142f3) and corrected it to match the theme

### Performance Notes

- Mobile touch targets (py-2 for small screens) improve usability without sacrificing performance
- Centralizing color definitions in TypeScript reduces CSS specificity issues and improves maintainability
- Removing unused dark: classes reduces CSS bundle size slightly and improves code clarity

### Component Updates

Components modified in this session:
- GraphMap.tsx (color definition fix, added GraphLegend)
- SearchBar.tsx (responsive touch targets with py-2 sm:py-1)
- 10+ components (removed dark: class prefixes)

---

**Document Version:** 2.2
**Last Updated:** 2026-01-15
**Source:** Health Check Implementation + Global Search Session + SearchBar Refactoring (Issue #27) + PR #44 Theme Changes & UI Fixes
