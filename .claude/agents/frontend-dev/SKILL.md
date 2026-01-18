# SKILL.md - Frontend Development Learnings

> **Document Version:** 2.6
> **Last Updated:** 2026-01-18
> **Parent Reference:** See [`/CLAUDE.md`](/CLAUDE.md) for project-wide patterns and quick reference.

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

## Session Learnings - 2026-01-18 (Header Consolidation & Duplicate Code Removal)

### Mistakes & Fixes

- **Issue:** X-API-Key header duplicated across 9 frontend route files
  - **Root Cause:** Each route manually constructed the same header instead of centralizing in utility
  - **Fix:** Moved header injection to `fetchApi` utility function; removed from all 9 individual route files
  - **Prevention:** Apply DRY principle - implement once in utilities, use everywhere. When adding new route that needs auth header, use existing utility instead of duplicating code.

- **Issue:** Using `fetchApi` utility for binary audio data caused JSON parsing errors
  - **Root Cause:** `fetchApi` automatically parses response as JSON; unsuitable for binary (WAV) audio route
  - **Fix:** Switched audio route to use native `fetch()` API directly for binary data
  - **Prevention:** Know capabilities of utility functions - `fetchApi` is JSON-only. For binary/streaming/non-JSON responses, use native fetch API.

### Patterns Discovered

- **Pattern:** Centralized API Authentication in Utilities
  - **Context:** Multiple route handlers and components need to add API key header to requests
  - **Implementation:**
    ```typescript
    // utils/fetchApi.ts - Centralized location
    export async function fetchApi<T>(url: string | URL, options?: RequestInit) {
      const headers = {
        ...options?.headers,
        "X-API-Key": process.env.API_KEY // Only defined here
      };
      return fetch(url, { ...options, headers });
    }

    // In route handlers - just import and use
    import { fetchApi } from '@/utils/api';
    const res = await fetchApi('/api/endpoint');
    ```
  - **Key Detail:** Define sensitive values (API keys, auth tokens) as close to usage as possible, not in shared config modules. Centralize usage pattern in utilities to enforce consistency.

- **Pattern:** Detecting When to Use Native Fetch vs. Utility Wrappers
  - **Context:** Choosing between fetchApi utility and native fetch for different response types
  - **Implementation:**
    ```typescript
    // Use fetchApi for JSON responses
    const data = await fetchApi<ResponseType>('/api/endpoint');

    // Use native fetch for binary/streaming
    const audioResponse = await fetch('/api/audio/mystery-123.wav');
    const audioBlob = await audioResponse.blob();

    // Use native fetch for custom response handling
    const customRes = await fetch('/api/endpoint', {
      signal: abortController.signal  // custom abort handling
    });
    ```
  - **Key Detail:** Understand what each utility does - fetchApi assumes JSON parsing. For binary, streams, or custom parsing, use native fetch.

- **Pattern:** Identifying Duplicate Code Patterns Across Route Files
  - **Context:** Multiple route handlers with nearly identical header/auth logic
  - **Implementation:** When creating new route, check existing routes for similar patterns before implementing from scratch. Consolidate common patterns into utilities.
  - **Key Detail:** Periodically audit route files for duplication using grep; consolidate when patterns are found

### Debugging Wins

- **Problem:** Identifying all locations where API key was manually being set
  - **Approach:** Searched codebase for "X-API-Key" header patterns in frontend route files
  - **Tool/Technique:** Used `grep -r "X-API-Key" app/` to find all manual header injections; counted 9 files
  - **Result:** Consolidated all into single `fetchApi` utility for DRY principle

- **Problem:** Audio route returning JSON parse errors instead of audio data
  - **Approach:** Traced error to `fetchApi` response parsing; realized fetchApi parses all responses as JSON
  - **Tool/Technique:** Examined fetchApi utility signature; confirmed it calls `response.json()`
  - **Result:** Switched audio route to native fetch to bypass JSON parser for binary data

### Performance Notes

- Centralizing API key header in `fetchApi` eliminates 9 redundant header definitions; cleaner code with no performance impact
- Native fetch for binary data avoids unnecessary JSON parsing overhead
- DRY principle: implementing once in utilities vs. 9x duplication reduces maintenance burden by 90%

### Code Quality Improvements

- Removed 9x duplicate header code snippets (20+ lines reduced)
- Eliminated exposure surface of API_KEY by defining inline where needed instead of exporting from shared modules
- Improved code clarity by using appropriate tool for each data type (fetchApi for JSON, native fetch for binary)

---

## Session Learnings - 2026-01-18 (Footer Component & i18n Integration)

### Mistakes & Fixes

- **Issue:** Attempting to use useTranslations hook in component without 'use client' directive
  - **Root Cause:** `useTranslations` is a client-side hook from next-intl; components must be Client Components to use React hooks
  - **Fix:** Added `'use client'` directive at top of Footer component (before imports)
  - **Prevention:** When using React hooks or browser APIs in Next.js App Router, always add `'use client'` directive to make component a Client Component

### Patterns Discovered

- **Pattern:** Footer Component with Responsive Layout
  - **Context:** Creating a standard footer with sections for company info, social links, and legal links
  - **Implementation:**
    ```typescript
    // components/Footer.tsx
    'use client';

    import { useTranslations } from 'next-intl';
    import Link from 'next/link';

    export function Footer() {
      const t = useTranslations('footer');

      return (
        <footer className="bg-slate-950 text-slate-200 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Company Info */}
              <div>
                <h3 className="font-bold text-white mb-4">{t('about.title')}</h3>
                <p className="text-sm">{t('about.description')}</p>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="font-bold text-white mb-4">{t('social.title')}</h3>
                <div className="flex gap-4">
                  <a href={t('social.twitter')} target="_blank" rel="noopener noreferrer">
                    {t('social.twitterLabel')}
                  </a>
                  <a href={t('social.github')} target="_blank" rel="noopener noreferrer">
                    {t('social.githubLabel')}
                  </a>
                </div>
              </div>

              {/* Legal Links */}
              <div>
                <h3 className="font-bold text-white mb-4">{t('legal.title')}</h3>
                <div className="space-y-2">
                  <Link href="/privacy" className="text-sm hover:text-white transition">
                    {t('legal.privacy')}
                  </Link>
                  <Link href="/terms" className="text-sm hover:text-white transition">
                    {t('legal.terms')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-slate-700 mt-8 pt-4">
              <p className="text-xs text-slate-400">{t('disclaimer')}</p>
            </div>

            {/* Copyright */}
            <div className="text-center mt-4 text-xs text-slate-400">
              <p>© 2026 White Rabbit. {t('copyright')}</p>
            </div>
          </div>
        </footer>
      );
    }
    ```
  - **Key Detail:** Use semantic `<footer>` element; leverage Tailwind's responsive grid (`grid-cols-1 md:grid-cols-3`) for mobile-to-desktop layout; use next-intl for all user-facing strings

- **Pattern:** Using next-intl useTranslations Hook
  - **Context:** Adding internationalization to React components
  - **Implementation:**
    ```typescript
    'use client';
    import { useTranslations } from 'next-intl';

    export function MyComponent() {
      const t = useTranslations('namespace');
      return <h1>{t('key')}</h1>;  // Gets translation from namespace.key
    }
    ```
  - **Key Detail:** The `useTranslations('namespace')` function accepts a namespace; all subsequent `t('key')` calls look up `namespace.key` in translation files. This organizes translations by feature/component.

- **Pattern:** Responsive Grid Layout for Footer Sections
  - **Context:** Organizing footer content across multiple columns that stack on mobile
  - **Implementation:** Use `grid grid-cols-1 md:grid-cols-3` to create single-column layout on mobile (sm), three-column on medium+ screens
  - **Key Detail:** Mobile-first approach; base `grid-cols-1` applies to all screens, `md:` prefix overrides for medium and larger breakpoints

- **Pattern:** External Links with Security Attributes
  - **Context:** Linking to social media or external sites from footer
  - **Implementation:**
    ```typescript
    <a href={t('social.twitter')} target="_blank" rel="noopener noreferrer">
      Twitter
    </a>
    ```
  - **Key Detail:** Always use `target="_blank"` to open in new tab, and `rel="noopener noreferrer"` for security (prevents window.opener attacks); the URL should be translated if locale-specific

### Debugging Wins

- **Problem:** Component failing with error about useTranslations in Server Component
  - **Approach:** Read error message indicating hooks can't be used in Server Components; checked component for missing `'use client'` directive
  - **Tool/Technique:** Next.js error message clearly indicated the issue; added directive to fix
  - **Result:** Component now renders correctly with translations

### Performance Notes

- Footer is a Client Component but doesn't require expensive operations; lightweight re-render on locale changes
- Responsive grid layout requires no JavaScript; pure CSS via Tailwind classes
- Translation strings are loaded from i18n infrastructure; footer rendering is fast after translations cached

---

**Document Version:** 2.6
**Last Updated:** 2026-01-18
**Source:** Health Check Implementation + Global Search Session + SearchBar Refactoring (Issue #27) + PR #44 Theme Changes & UI Fixes + PR #54 Header Consolidation + Client/Server API Separation Session + Footer Component & i18n Integration Session
**Maintainer:** Claude Code Frontend Agent
**Cross-References:** See [`/CLAUDE.md`](/CLAUDE.md) for quick reference patterns; see [`backend-dev/SKILL.md`](../backend-dev/SKILL.md) for API security implementation details.

---

## Automation Opportunities - 2026-01-18

### Potential Commands

- **`/migrate-imports`**
  - **Purpose:** Bulk migrate import paths across frontend code (e.g., `from '@/utils'` → `from '@/utils/networkUtils'` for API routes, or `clientFetch` for client components)
  - **Trigger:** When creating new utility exports or refactoring API boundaries
  - **Complexity:** Medium
  - **Implementation Notes:** Should accept source pattern, destination pattern, and file filter (e.g., "app/api/**" for routes only)

- **`/find-duplicate-headers`**
  - **Purpose:** Scan codebase for duplicate header injection code (like X-API-Key header in 9 route files)
  - **Trigger:** Before API security refactors; scheduled security audits
  - **Complexity:** Low
  - **Implementation Notes:** Search for common patterns like API key headers, CORS headers, auth tokens; group results by pattern

- **`/audit-client-server-boundary`**
  - **Purpose:** Verify client components never import from server-only modules (e.g., routes importing networkUtils)
  - **Trigger:** After adding new `server-only` directives; pre-deployment security check
  - **Complexity:** Medium
  - **Implementation Notes:** Use TypeScript's module resolution to detect `server-only` imports in client code; flag violations with file locations

- **`/add-translation-keys`**
  - **Purpose:** Automatically add new translation keys to messages/en.json with useTranslations hook setup in component
  - **Trigger:** When creating new i18n-enabled components or pages
  - **Complexity:** Low
  - **Implementation Notes:** Accept component file path and feature namespace; add 'use client' directive if missing; generate useTranslations hook; add to messages/en.json with scaffolding values

- **`/scaffold-component-from-pattern`**
  - **Purpose:** Generate new responsive components from existing patterns (Footer, Header, etc.) with proper styling and i18n
  - **Trigger:** When building similar layout components; creating standard page sections
  - **Complexity:** Medium
  - **Implementation Notes:** Accept component type (footer, header, sidebar); generate Tailwind responsive layout, 'use client' directive, useTranslations hook, and translation keys scaffolding

### Workflow Improvements

- **Current:** Manual grep to find all X-API-Key headers → manually update 9 files → test each
  - **Proposed:** `/migrate-imports` command to identify duplicate code patterns + auto-consolidate into utility → single verification test
  - **Benefit:** Reduces 30+ minutes of manual work to 2-3 minutes; prevents missing files

- **Current:** Manually classify files as "client" or "server" when refactoring utilities
  - **Proposed:** Create classification map in `.claude/config/boundaries.json` defining file patterns and their classification; reference during imports
  - **Benefit:** Prevents developer error in classification; enables automation for boundary audits

- **Current:** Update barrel exports (index.ts) manually when hiding server-only code
  - **Proposed:** `/update-barrel-exports` command to automatically regenerate index.ts exports based on file classification
  - **Complexity:** Medium
  - **Benefit:** Prevents accidentally re-exporting server code through index

- **Current:** Create new component → add 'use client' → add useTranslations hook → manually create translation keys in messages/en.json → verify structure
  - **Proposed:** `/add-translation-keys` command that automates steps 2-4; generates complete i18n setup in one operation
  - **Benefit:** Reduces 5-10 minutes of boilerplate work to 30 seconds; ensures consistent i18n structure

- **Current:** Build responsive footer/header manually, repeat Tailwind classes, manually structure for mobile-first → verify on multiple screens
  - **Proposed:** `/scaffold-component-from-pattern` generates pre-styled component with tested Tailwind classes, grid layouts, semantic HTML
  - **Benefit:** Reduces component creation from 20 minutes to 2 minutes; ensures accessibility and mobile-first approach

### Agent Ideas

- **Agent Name:** Security Boundary Enforcer
  - **Specialization:** Detecting and preventing secrets/server-only code from leaking to client bundles
  - **Tools Needed:** Grep, TypeScript compiler for module analysis, file I/O for refactoring
  - **Key Responsibilities:**
    1. Find all `server-only` directives; verify no client code imports them
    2. Detect environment variable usage; flag `process.env.API_KEY` in bundled code
    3. Classify files as client/server; suggest utility reorganization
    4. Generate reports of exposure surface (where secrets are defined)
  - **Trigger Scenarios:** On every PR to develop; scheduled pre-deployment audits

- **Agent Name:** i18n Component Generator
  - **Specialization:** Creating translation-ready React components with proper i18n setup
  - **Tools Needed:** File I/O for component and translation generation, TypeScript template generation
  - **Key Responsibilities:**
    1. Generate component with 'use client' directive if needed
    2. Set up useTranslations hook with namespace
    3. Create translation key scaffolding in messages/en.json
    4. Add semantic HTML and accessibility attributes
    5. Generate responsive Tailwind classes
  - **Trigger Scenarios:**
    - When creating new layout components
    - When converting existing components to i18n
    - When adding new features that need multi-language support
    - During localization efforts (adding new locales)

### Pattern: Responsive Component Pattern Library

Development session revealed reusable patterns for layout components:

**Footer Component Pattern:**
```
- 'use client' directive (Client Component)
- useTranslations hook with 'footer' namespace
- Responsive grid: grid-cols-1 md:grid-cols-3 (mobile: 1 col, desktop: 3 cols)
- Semantic sections: <footer>, <div> with role=region
- Social links with target="_blank" rel="noopener noreferrer"
- Disclaimer section in <div> with border-top and smaller text
- Copyright notice at bottom with centered text
- Tailwind classes: bg-slate-950 text-slate-200 for dark theme
```

**Translation Key Structure:**
```json
{
  "footer": {
    "about": { "title": "About", "description": "..." },
    "social": { "title": "Follow Us", "twitter": "url", "twitterLabel": "Twitter", ... },
    "legal": { "title": "Legal", "privacy": "Privacy Policy", "terms": "Terms of Service" },
    "disclaimer": "Educational purposes only...",
    "copyright": "All rights reserved."
  }
}
```

This pattern applicable to:
- Header components (logo, nav, social links)
- Sidebar navigation sections
- Card/grid layouts with responsive breakpoints
- Dialog/modal wrappers with semantic HTML

**Recommended Implementation:**
- Create `.claude/templates/components/` directory with scaffolds
- Build CLI tool to generate from templates with i18n integration
- Add validation for Tailwind responsive prefixes usage
- Generate TypeScript types for translation keys

---

## Session Learnings - 2026-01-18 (Client/Server API Separation - Critical Security Fix)

### Mistakes & Fixes

- **Issue:** API_KEY exposed in client-side code (stores, components, route handlers) - major security vulnerability
  - **Root Cause:** `fetchApi` utility with API_KEY was imported in client bundles; no separation between client and server utilities
  - **Fix:** Created three-tier API structure:
    1. `utils/apiTypes.ts` - Shared types and error classes (client-safe, no secrets)
    2. `utils/clientApi.ts` - Client-side `clientFetch` without API_KEY (for client components/stores)
    3. `utils/networkUtils.ts` - Server-only `fetchApi` with API_KEY (marked with `import 'server-only'`)
    4. `utils/index.ts` - Exports only client-safe utilities
  - **Prevention:** Never import server-side utilities in client code; use TypeScript `server-only` directive; separate concerns by file
  - **Architecture Diagram:**
    ```
    Client (stores, components)
      └── clientFetch() from @/utils (NO API_KEY)
            │
            ▼
    Next.js API Routes (/api/*)
      └── fetchApi() from @/utils/networkUtils (API_KEY injected here)
            │
            ▼
    Backend API (FastAPI)
    ```

- **Issue:** Updated 4 stores to use `clientFetch` but missed 2 ServerStatus components
  - **Root Cause:** Not all files importing fetchApi were identified during refactor
  - **Fix:** Searched for all imports of fetchApi and updated remaining ServerStatus components to use clientFetch
  - **Prevention:** Use grep to find all imports of changed utilities before considering refactor complete

- **Issue:** 8 API route files still importing fetchApi from wrong location
  - **Root Cause:** Routes should import from `@/utils/networkUtils` (server-only) not the index barrel export
  - **Fix:** Updated all 8 routes to import from `@/utils/networkUtils` directly
  - **Prevention:** Create distinct import paths for server vs. client utilities; avoid re-exporting server code through barrel exports

### Patterns Discovered

- **Pattern:** Three-Tier API Utility Structure for Security
  - **Context:** Separating client-safe API utilities from server-only utilities in fullstack Next.js app
  - **Implementation:**
    ```typescript
    // utils/apiTypes.ts - SAFE (no secrets)
    export type ApiResponse<T> = {
      ok: boolean;
      data?: T;
      error?: ApiError;
    };
    export class ApiError extends Error {
      constructor(public status: number, public message: string) {
        super(message);
      }
    }

    // utils/clientApi.ts - CLIENT ONLY
    export async function clientFetch<T>(
      endpoint: string,
      options?: RequestOptions
    ): Promise<ApiResponse<T>> {
      const response = await fetch(endpoint, options);
      // NO API_KEY ADDED HERE
      return response.json();
    }

    // utils/networkUtils.ts - SERVER ONLY
    import 'server-only';  // Prevents accidental client import
    export async function fetchApi<T>(
      endpoint: string,
      options?: RequestOptions
    ): Promise<ApiResponse<T>> {
      const headers = {
        'X-API-Key': process.env.API_KEY || '',
        ...options?.headers,
      };
      return fetch(endpoint, { ...options, headers });
    }

    // utils/index.ts - SAFE EXPORTS ONLY
    export { clientFetch } from './clientApi';
    export type { ApiResponse } from './apiTypes';
    export { ApiError } from './apiTypes';
    // NEVER export fetchApi from here
    ```
  - **Key Detail:** Use `server-only` directive to prevent accidental client-side bundling; separate by filename for clarity; never re-export server code through barrel exports

- **Pattern:** Client/Server Boundary Enforcement with TypeScript
  - **Context:** Preventing secrets from leaking to browser bundles in Next.js
  - **Implementation:** Mark server-only modules with `import 'server-only'` at top; TypeScript build will fail if client imports them
  - **Key Detail:** This is TypeScript compile-time protection; combined with barrel export discipline, prevents secrets in bundles

- **Pattern:** API Route Import Pattern
  - **Context:** Routes should always use server-only utilities for backend communication
  - **Implementation:**
    ```typescript
    // app/api/mystery/route.ts
    import { fetchApi } from '@/utils/networkUtils';  // DIRECT import, not from index

    export async function GET(request: Request) {
      const data = await fetchApi('/backend/mystery');
      return Response.json(data);
    }
    ```
  - **Key Detail:** API routes are server-side; always import from `networkUtils` not index barrel export

### Debugging Wins

- **Problem:** Identifying all locations where API_KEY was exposed
  - **Approach:** Searched for all imports of `fetchApi` from index; identified which files should use client vs. server versions
  - **Tool/Technique:** Used grep to find `from '@/utils'` and `from '@/utils/index'` patterns; verified each usage
  - **Result:** Created comprehensive list of 12+ files to update; tracked progress systematically

- **Problem:** Determining whether component is client or server
  - **Approach:** Checked for use of browser APIs (hooks, useState, useEffect); server components don't use these
  - **Tool/Technique:** Examined component structure; if uses hooks → client, if uses directly in SSR → server
  - **Result:** Correctly classified stores (client) and API routes (server)

- **Problem:** Understanding Next.js `server-only` directive
  - **Approach:** Tested by trying to import `server-only` module in client and observing build error
  - **Tool/Technique:** Reviewed Next.js documentation on server/client boundaries
  - **Result:** Understood compile-time protection; confirmed safe to use

### Performance Notes

- Three-tier structure has zero performance impact; same fetch calls, just better organized
- `server-only` directive is compile-time check; adds no runtime overhead
- Client-side code is now cleaner (no API_KEY logic); slightly smaller bundle

### Security Impact (Critical)

- **Before:** API_KEY exposed in client bundle (every browser had access to backend auth)
- **After:** API_KEY only exists on server; client code has no access to secrets
- **Risk Eliminated:** XSS attack could no longer extract API_KEY from bundled code

---

## Session Learnings - 2026-01-17 (Accessibility & React Keys)

### Mistakes & Fixes

- **Issue:** React key warning in LoadingSpinner component using array `.map()` on Array(n)
  - **Root Cause:** Using `Array(n).map((_, i) => ...)` creates array with holes; sparse arrays have unreliable indices, causing key warnings
  - **Fix:** Replaced `Array(count).map((_, i) => <div key={i}>...)` with `Array(count).fill(null).map((_, i) => <div key={i}>...)` or better yet `.repeat()` with string generation
  - **Prevention:** Use `.fill(null)` when creating arrays of exact length, or use `.repeat()` for string-based key generation; avoid relying on sparse array indices

- **Issue:** LoadingSpinner missing semantic structure and ARIA attributes
  - **Root Cause:** Using non-semantic `<span>` elements for status container; no ARIA attributes for accessibility
  - **Fix:** Changed root container from `<span>` to `<p>` element, added `role="status"` and `aria-live="polite"` for screen readers, added `aria-hidden="true"` to decorative spinner elements
  - **Prevention:** Always use semantic HTML elements (p, div, section) for content containers; add ARIA attributes for components with dynamic content or decorative elements

### Patterns Discovered

- **Pattern:** Array Generation with `.repeat()` for Safe Keys
  - **Context:** Creating multiple identical elements (spinner dots, skeleton lines) with stable React keys
  - **Implementation:**
    ```typescript
    // Safe way to generate arrays with stable keys
    const dots = "...".repeat(count).split("").map((_, i) => (
      <span key={i} className="dot" />
    ));

    // Alternative: Array(n).fill(null)
    const dots = Array(count).fill(null).map((_, i) => (
      <span key={i} className="dot" />
    ));
    ```
  - **Key Detail:** Avoid Array(n).map() which creates sparse arrays; fill or use string repeat for dense arrays with reliable indices

- **Pattern:** ARIA Attributes for Loading States
  - **Context:** Communicating loading state to screen reader users
  - **Implementation:**
    ```typescript
    <p role="status" aria-live="polite" aria-hidden={isDecorative}>
      Loading message or decorative spinner
    </p>
    ```
  - **Key Detail:** `role="status"` announces content changes to screen readers; `aria-live="polite"` waits for pause before announcing; `aria-hidden="true"` hides purely decorative elements

- **Pattern:** Semantic HTML Elements for Content Containers
  - **Context:** Improving semantic meaning and accessibility of UI components
  - **Implementation:** Replace generic `<span>` or `<div>` with appropriate semantic elements:
    - Use `<p>` for text/status messages
    - Use `<section>` for major content regions
    - Use `<article>` for self-contained content
  - **Key Detail:** Semantic elements improve both accessibility and SEO; screen readers provide better context when navigating semantic structure

### Debugging Wins

- **Problem:** React console warnings about non-unique keys in LoadingSpinner
  - **Approach:** Examined array creation method and identified sparse array issue
  - **Tool/Technique:** Used React DevTools to inspect rendered elements and verify key values; checked console warnings for specific guidance on missing keys

### Performance Notes

- Using `.repeat()` and `.fill()` have equivalent performance; both create dense arrays suitable for iteration
- ARIA attributes add zero runtime overhead; purely declarative metadata for assistive technologies
- Semantic HTML has negligible performance impact but significantly improves code clarity and maintainability

---
