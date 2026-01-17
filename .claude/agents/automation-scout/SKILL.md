# SKILL.md - Automation Discovery Patterns

This document captures best practices for identifying automation opportunities in development workflows.

---

## Table of Contents

1. [Identification Patterns](#identification-patterns)
2. [Automation Candidates](#automation-candidates)
3. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Identification Patterns

*No entries yet. Learnings will be added from future sessions.*

---

## Automation Candidates

*No entries yet. Learnings will be added from future sessions.*

---

## Common Mistakes to Avoid

*No entries yet. Learnings will be added from future sessions.*

---

## Session Learnings - 2026-01-15

### Patterns Identified for Automation

#### 1. Health Check Implementation Pattern (Frontend + Backend)

**Repetitive Tasks Observed:**
- Created Next.js API proxy route for backend health check
- Created React polling component (TTSServerStatus, DBServerStatus)
- Both follow identical polling pattern with interval logic, error handling, UI rendering
- Same pattern will be needed for each new backend service added (search, recommendations, etc.)

**Current Implementation:**
1. Manual creation of API route at `/app/api/[service]/health/route.ts`
2. Manual creation of polling component at `/components/ServerStatus/[Service]ServerStatus.tsx`
3. Both files contain nearly identical structure with minor naming differences
4. Must manually update parent component to include new status component
5. Must manually add types to `/types/index.ts` for each new service

**Opportunities:**

- **`/generate-status-checker`** (High Impact)
  - **Purpose:** Generate paired API route + React component + types for a new service health check
  - **Trigger:** When adding a new external service (TTS, search, graph processor, etc.)
  - **Input:** Service name, endpoint URL, timeout (optional)
  - **Output:** Ready-to-use API route and component files
  - **Benefit:** Eliminates 90% of boilerplate, ensures consistency, prevents copy-paste errors
  - **Complexity:** Medium

#### 2. FastAPI Endpoint Scaffolding Pattern

**Repetitive Tasks Observed:**
- Creating new endpoints follows schema → service → router → main.py registration pattern
- All endpoints created for mysteries, graph, nodes, tts, search follow identical architecture
- Requires manual creation of: Pydantic schema, service layer with database logic, FastAPI router, router registration

**Current Implementation:**
1. Create `/schemas/[feature].py` with Pydantic models
2. Create `/services/[feature]_service.py` with database logic
3. Create `/routers/[feature].py` with FastAPI route handlers
4. Manually register in `main.py` with `app.include_router()`
5. Must remember to import router in main.py
6. Must handle error responses and parameterized queries consistently

**Opportunities:**

- **`/scaffold-fastapi-endpoint`** (High Impact)
  - **Purpose:** Generate schema, service, and router files for a new FastAPI feature
  - **Trigger:** When implementing new Neo4j query endpoints
  - **Input:** Feature name, operation (CRUD operation), Neo4j query structure
  - **Output:** Three files with proper imports, parameterized queries, error handling
  - **Benefit:** Reduces backend creation time by 70%, enforces security best practices (parameterized queries), maintains code structure consistency
  - **Complexity:** High (requires query template knowledge)

- **`/register-router`** (Low Impact)
  - **Purpose:** Automatically add router import and registration to `main.py`
  - **Trigger:** After creating new FastAPI router file
  - **Input:** Router module name
  - **Output:** Updated main.py with imports and registration
  - **Benefit:** Eliminates manual edits, prevents registration typos
  - **Complexity:** Low

#### 3. Agent Directory Structure Pattern

**Repetitive Tasks Observed:**
- Created 8 agent subdirectories with identical structure
- Each agent got: agent definition markdown, SKILL.md template, identical boilerplate
- Manual process: create directory, create files, update references
- Pattern observed: automation-scout, backend-dev, frontend-dev, ui-ux-designer, doc-updator, duplicate-checker, followup-suggestor, learning-extractor

**Current Implementation:**
1. Manually create `/agents/[agent-name]/` directory
2. Create `[agent-name].md` with agent definition
3. Create `SKILL.md` with template sections
4. Update agent references elsewhere

**Opportunities:**

- **`/scaffold-agent`** (Medium Impact, Low Complexity)
  - **Purpose:** Generate complete agent directory structure with files
  - **Trigger:** When adding a new specialized agent
  - **Input:** Agent name, description, primary tools, specialization
  - **Output:** Complete agent directory with definition markdown and SKILL.md template
  - **Benefit:** Creates consistency across agents, reduces setup time, ensures all agents have documentation template
  - **Complexity:** Low

### Workflow Optimization Opportunities

#### Current: Sequential Health Check Component Creation
```
1. Manually code API route
2. Manually code React component
3. Manually update types
4. Manually add to parent layout
5. Test in browser
```

**Proposed:** `/generate-status-checker` command
```
1. Run command with service name
2. Review generated files
3. Add to parent layout
4. Test in browser
```
**Benefit:** 5-10 minutes saved per new service, error prevention

#### Current: Sequential FastAPI Endpoint Creation
```
1. Design schema (5 min)
2. Write service with parameterized queries (15 min)
3. Create router (10 min)
4. Register in main.py (2 min)
5. Test endpoint (10 min)
```

**Proposed:** `/scaffold-fastapi-endpoint` command
```
1. Run command with feature name and query template
2. Review generated code for query correctness
3. Adjust business logic if needed
4. Test endpoint (10 min)
```
**Benefit:** 20-25 minutes saved per endpoint, enforces parameterized queries, prevents SQL injection

### Agent Ideas

- **Agent Name:** fastapi-scaffold
  - **Specialization:** Generate FastAPI endpoint boilerplate (schemas, services, routers)
  - **Tools Needed:** Read, Write, Edit, Glob, Grep
  - **Use Case:** When implementing new Neo4j query endpoints following established patterns
  - **Output:** Three files (schema.py, service.py, router.py) ready for customization

- **Agent Name:** component-generator
  - **Specialization:** Generate paired frontend components with backend API routes
  - **Tools Needed:** Read, Write, Edit, Glob
  - **Use Case:** Status monitors, health checks, polling patterns, data displays
  - **Output:** React component + API route + type definitions

---

## Session Learnings - 2026-01-15 (Part 2 - PR Review & Refactoring)

### Patterns Identified for Automation

#### 1. PR Feedback Review & Issue Identification

**Repetitive Tasks Observed:**
- Reading PR comments via gh CLI to extract feedback
- Manually categorizing issues by severity (critical, high, medium)
- Cross-referencing PR comments with code to identify patterns
- Creating task list of fixes needed
- Committing fixes with clear commit messages

**Current Implementation:**
1. Use `gh pr view [PR-number]` to read feedback
2. Manually scan comments for actionable issues
3. Prioritize by severity level
4. Make individual commits per fix category
5. Verify fixes against original feedback

**Opportunities:**

- **`/review-pr-feedback`** (Medium Impact)
  - **Purpose:** Automated PR feedback extraction, categorization, and task list generation
  - **Trigger:** When working on addressing PR feedback
  - **Input:** PR number, repository
  - **Output:** Structured list of issues categorized by severity with code locations
  - **Benefit:** Eliminates manual scanning, ensures no feedback is missed, creates prioritized action list
  - **Complexity:** Medium (requires gh CLI integration)

#### 2. Utility-Based Refactoring Pattern (Replace Raw Fetch/useState/EventListeners)

**Repetitive Tasks Observed:**
- Identifying components using raw `fetch()` instead of `fetchApi` utility
- Converting local `useState` to `zustand` store state
- Replacing manual event listeners with custom hooks like `useClickOutside`
- Process: search codebase → identify pattern → apply refactor → test

**Current Implementation:**
1. Manually search for patterns (e.g., `fetch(` or `useState`)
2. Review each instance to determine if refactor applies
3. Replace fetch with fetchApi import
4. Move state to zustand store
5. Test component behavior

**Opportunities:**

- **`/apply-utility-refactoring`** (High Impact)
  - **Purpose:** Automated refactoring of components to use established utilities
  - **Trigger:** Before PR submission or during code review
  - **Input:** Component file path, refactoring type (fetch → fetchApi, useState → zustand, manual listeners → hooks)
  - **Output:** Refactored component file with imports updated
  - **Benefit:** Ensures consistency across codebase, reduces code duplication, prevents reinventing solutions
  - **Complexity:** High (requires AST parsing and careful refactoring logic)

- **`/find-utility-candidates`** (Medium Impact)
  - **Purpose:** Scan codebase and identify components that could benefit from utility refactoring
  - **Trigger:** During code review preparation or sprint planning
  - **Input:** Target directory (optional), refactoring type filter
  - **Output:** List of files with line numbers showing where refactoring could apply
  - **Benefit:** Identifies optimization opportunities systematically
  - **Complexity:** Medium

#### 3. Input Validation & Error Handling Pattern Addition

**Repetitive Tasks Observed:**
- Adding query parameter validation to API routes (min/max length, type checking)
- Adding timeout/AbortController protection to fetch operations
- Adding structured error response handling with `{ error, message, status_code }`
- Process: identify endpoint → add validation → add error handling → test

**Current Implementation:**
1. Manually locate API route files
2. Add Pydantic validation to query parameters
3. Add try/catch with structured error responses
4. Test with invalid inputs
5. Verify error response format matches expectations

**Opportunities:**

- **`/add-input-validation`** (Medium Impact)
  - **Purpose:** Add parameterized validation to API endpoints
  - **Trigger:** When creating new or updating existing endpoints
  - **Input:** API route file path, parameter definitions (name, type, min/max)
  - **Output:** Updated route with Pydantic validation or TypeScript type guards
  - **Benefit:** Prevents malformed requests from reaching database, ensures consistent validation
  - **Complexity:** Medium

- **`/secure-api-endpoint`** (Medium Impact)
  - **Purpose:** Add timeout protection, error handling, and structured responses to an endpoint
  - **Trigger:** When creating new API proxy or database endpoints
  - **Input:** API route file path, timeout duration
  - **Output:** Updated endpoint with AbortController, try/catch, and ErrorResponse format
  - **Benefit:** Prevents hanging requests, ensures consistent error format across API
  - **Complexity:** Medium

#### 4. Code Review Checklist & Self-Validation Pattern

**Repetitive Tasks Observed:**
- Self-reviewing code before PR submission against known patterns
- Checking for common mistakes (console.log statements, missing validation, etc.)
- Verifying error response format consistency
- Manual verification of TypeScript types match runtime values
- Ensuring new patterns are documented

**Current Implementation:**
1. Read backend-dev and frontend-dev SKILL.md for checklist
2. Manually scan changed files for violations
3. Make corrections
4. Re-read to verify all items checked

**Opportunities:**

- **`/pre-submit-review`** (Medium Impact)
  - **Purpose:** Automated pre-submission code review against project standards
  - **Trigger:** Before committing or pushing changes
  - **Input:** Files to review (or scan entire changed files)
  - **Output:** Structured report of violations and suggestions
  - **Benefit:** Catches issues before PR review, reduces feedback cycles
  - **Complexity:** Medium

### Workflow Optimization Opportunities

#### Current: Sequential PR Feedback Processing
```
1. Read PR with gh CLI
2. Manually scan comments for issues
3. Categorize by severity
4. Make fixes one category at a time
5. Test and commit
6. Verify all feedback addressed
```

**Proposed:** `/review-pr-feedback` command
```
1. Run command with PR number
2. Review structured output of issues
3. Make targeted fixes
4. Test priority items
5. Mark issues as complete
```
**Benefit:** 10-15 minutes saved per PR, no missed feedback

#### Current: Sequential Utility Refactoring
```
1. Grep for pattern (fetch, useState, listeners)
2. Manually review each instance
3. Decide if refactor applies
4. Refactor one component
5. Test component
6. Repeat for next component
```

**Proposed:** `/find-utility-candidates` then `/apply-utility-refactoring`
```
1. Run find-utility-candidates for fetch patterns
2. Review list of candidates
3. Run apply-utility-refactoring on selected files
4. Review changes
5. Test refactored components
```
**Benefit:** 30-45 minutes saved per refactoring session, consistency guaranteed

#### Current: Manual Pre-Submission Validation
```
1. Check SKILL.md checklist
2. Scan files for console.log, missing imports
3. Verify error response formats
4. Check type hints match implementation
5. Manually fix each issue
6. Re-check
```

**Proposed:** `/pre-submit-review` command
```
1. Run pre-submit-review
2. Review report and fix critical issues
3. Address non-critical suggestions
4. Re-run to verify clean
5. Submit PR
```
**Benefit:** 5-10 minutes saved per submission, fewer revision requests

### Agent Ideas

- **Agent Name:** code-reviewer
  - **Specialization:** Pre-submission code review against project standards (SKILL.md checklists)
  - **Tools Needed:** Read, Grep, Glob, output analysis
  - **Use Case:** Validate code before PR submission, identify violations of established patterns
  - **Output:** Structured report with violation locations and remediation suggestions

- **Agent Name:** refactoring-optimizer
  - **Specialization:** Identify and apply utility-based refactorings across codebase
  - **Tools Needed:** Glob, Grep, Read, Edit (with AST parsing capability)
  - **Use Case:** Systematically modernize components to use established utilities (fetchApi, zustand, custom hooks)
  - **Output:** List of candidates + refactored components

- **Agent Name:** pr-feedback-processor
  - **Specialization:** Extract, categorize, and organize PR review feedback
  - **Tools Needed:** Grep, Read, Task system for gh CLI integration
  - **Use Case:** Structured approach to addressing code review feedback
  - **Output:** Prioritized action list with code locations

---

## Automation Opportunities - 2026-01-16

### Patterns Identified for Automation

#### 1. Styling Refactoring Pattern (Dark Mode Removal/Theme Updates)

**Repetitive Tasks Observed:**
- Used Grep to find all files with `dark:` prefixes across 10+ components
- Manually removed dark: prefixes one file at a time
- Updated color values to match theme specification
- Process required: search → identify → edit → verify across all affected files

**Current Implementation:**
1. Run Grep query to find pattern (e.g., `dark:` or specific class patterns)
2. Identify files that need updates
3. Manually open each file and remove/update classes
4. Verify changes don't break styling
5. Test visual appearance after changes
6. Repeat for next pattern

**Opportunities:**

- **`/find-styling-candidates`** (Medium Impact)
  - **Purpose:** Identify all files containing specific styling patterns that need refactoring
  - **Trigger:** When planning theme updates, dark mode removal, or class migration
  - **Input:** Styling pattern to find (e.g., "dark:", "old-color-", "deprecated-class"), target directory (optional)
  - **Output:** Organized list of files with line numbers and context showing pattern locations
  - **Benefit:** Eliminates manual grep iterations, provides complete inventory of affected files, enables bulk refactoring planning
  - **Complexity:** Low

- **`/apply-styling-refactor`** (High Impact)
  - **Purpose:** Automated batch refactoring of styling patterns across multiple files
  - **Trigger:** After identifying styling patterns that need bulk updates
  - **Input:** Styling pattern, replacement pattern/value, file list (or glob pattern), dry-run option
  - **Output:** Refactored files with clear changelog showing what was updated in each
  - **Benefit:** Reduces manual file edits from 30+ minutes to 2-3 minutes, prevents inconsistent refactoring, tracks changes clearly
  - **Complexity:** Medium

#### 2. Security/Performance Enhancement Pattern (Input Validation, Rate Limiting, Cache Cleanup)

**Repetitive Tasks Observed:**
- Added rate limiting to multiple endpoints following identical pattern
- Added input validation to multiple schemas with similar validation rules
- Added cache cleanup mechanisms following same pattern
- Each addition required: identifying endpoints → writing validation/limiting code → testing with invalid inputs
- Code patterns were nearly identical across different endpoints with minor naming differences

**Current Implementation:**
1. Identify endpoint that needs enhancement (validation/rate limiting/cache cleanup)
2. Research correct implementation pattern from existing code
3. Manually write validation/limiting/cleanup code
4. Add appropriate error handling
5. Test with edge cases (null, empty, oversized, etc.)
6. Repeat for next endpoint

**Opportunities:**

- **`/add-rate-limiting`** (Medium Impact)
  - **Purpose:** Add rate limiting configuration to an API endpoint
  - **Trigger:** When creating new endpoint or hardening existing endpoint against abuse
  - **Input:** API route file path, rate limit (requests per window), time window (seconds)
  - **Output:** Updated endpoint with rate limiting middleware and proper error response
  - **Benefit:** Standardizes rate limiting across API, prevents duplicate implementation logic, ensures consistent abuse protection
  - **Complexity:** Medium

- **`/add-input-validation`** (High Impact)
  - **Purpose:** Add comprehensive input validation to API endpoint schemas
  - **Trigger:** When creating new endpoint or during security hardening review
  - **Input:** API route file path, parameter definitions with validation rules (min/max length, type, pattern, etc.)
  - **Output:** Updated endpoint with validation logic and structured error responses
  - **Benefit:** Prevents malformed requests from reaching application logic, ensures data integrity, reduces error handling code in endpoints
  - **Complexity:** Medium

- **`/add-cache-cleanup`** (Low Impact)
  - **Purpose:** Add cache eviction/cleanup mechanism to endpoints
  - **Trigger:** When implementing caching for data that changes
  - **Input:** Cache key pattern, eviction strategy (TTL, LRU, immediate invalidation trigger)
  - **Output:** Updated endpoint/service with cache cleanup logic
  - **Benefit:** Prevents stale data from being served, reduces memory bloat from cache accumulation
  - **Complexity:** Low

- **`/security-hardening-checklist`** (Medium Impact)
  - **Purpose:** Review endpoint for common security issues: missing validation, missing rate limiting, missing cache cleanup, insecure error messages
  - **Trigger:** Before PR submission or during security review phase
  - **Input:** API endpoint file paths (or scan directory)
  - **Output:** Report of security gaps with recommendations and code suggestions
  - **Benefit:** Prevents security vulnerabilities from reaching production, ensures consistent security posture
  - **Complexity:** Medium

#### 3. PR Review Workflow Optimization

**Repetitive Tasks Observed:**
- Read PR review comments from Claude
- Manually identified critical vs high priority issues
- Created branch for fixes
- Applied fixes to multiple files
- Committed and pushed changes
- Created PR with fixes
- Process involved multiple sequential steps with decision points

**Current Implementation:**
1. Check PR review feedback (via gh pr view or comments)
2. Read through all feedback manually
3. Categorize issues by priority (critical, high, medium)
4. Create feature branch for fixes
5. Apply fixes one category at a time
6. Commit with descriptive messages per category
7. Push and create new PR
8. Verify feedback was addressed

**Opportunities:**

- **`/batch-apply-code-fixes`** (Medium Impact)
  - **Purpose:** Apply a series of related code fixes from review feedback in single workflow
  - **Trigger:** After extracting issues from PR review
  - **Input:** Issue list with file locations and expected changes, branch name for commits
  - **Output:** Branch with organized commits per issue category, summary of changes
  - **Benefit:** Reduces manual file jumping between fixes, creates organized commit history by category, ensures no feedback missed
  - **Complexity:** Medium

- **`/generate-commit-message`** (Low Impact)
  - **Purpose:** Generate clear, descriptive commit messages from code changes
  - **Trigger:** After making fixes or refactoring
  - **Input:** Changed files (staged or unstaged), optional context/issue category
  - **Output:** Suggested commit message(s) in conventional format
  - **Benefit:** Ensures consistent commit message quality, faster commit creation
  - **Complexity:** Low

### Workflow Improvement Opportunities

#### Current: Manual Styling Refactoring
```
1. Run Grep to find pattern
2. Open first file
3. Remove/update classes manually
4. Save and test
5. Repeat for next file (10+ files)
6. Spot-check for consistency
```
**Estimated Time:** 20-30 minutes for 10+ files

**Proposed:** `/find-styling-candidates` + `/apply-styling-refactor`
```
1. Run find-styling-candidates with pattern
2. Review output to understand scope
3. Run apply-styling-refactor with pattern + replacement
4. Spot-check results
5. Commit changes
```
**Estimated Time:** 3-5 minutes for 10+ files
**Benefit:** 75% time reduction, eliminates manual inconsistency errors, maintains clear change history

#### Current: Manual Security Hardening
```
1. Open endpoint file
2. Add validation schema manually
3. Write validation logic
4. Add rate limiting headers
5. Add error handling
6. Test with invalid inputs
7. Repeat for next endpoint
```
**Estimated Time:** 15-20 minutes per endpoint

**Proposed:** `/security-hardening-checklist` + `/add-input-validation` + `/add-rate-limiting`
```
1. Run security-hardening-checklist on endpoints
2. Review report of gaps
3. Run add-input-validation for parameters
4. Run add-rate-limiting for abuse protection
5. Review generated code
6. Test key scenarios
```
**Estimated Time:** 5-8 minutes per endpoint
**Benefit:** 60% time reduction, consistent security posture, prevents missed hardening steps

#### Current: Sequential PR Fix Application
```
1. Read all feedback
2. Manually categorize issues
3. Create branch
4. Fix critical issues one by one
5. Commit after each group
6. Fix high priority issues
7. Repeat for lower priorities
8. Verify all addressed
```
**Estimated Time:** 15-25 minutes per PR

**Proposed:** `/batch-apply-code-fixes` with organized issue list
```
1. Extract issues from feedback to structured list
2. Run batch-apply-code-fixes with priority grouping
3. Review generated commits
4. Verify fixes against original feedback
```
**Estimated Time:** 5-10 minutes per PR
**Benefit:** 50% time reduction, organized commit history, no missed feedback items

### Agent Ideas

- **Agent Name:** style-refactoring-bot
  - **Specialization:** Identify and apply bulk styling refactoring across codebase
  - **Tools Needed:** Glob, Grep, Read, Edit, output analysis
  - **Use Case:** Theme migration, dark mode removal, CSS class standardization, color value updates
  - **Output:** Refactored components with clear changelog + verification report

- **Agent Name:** security-hardener
  - **Specialization:** Identify security gaps and apply hardening measures to endpoints
  - **Tools Needed:** Glob, Grep, Read, Edit, AST parsing
  - **Use Case:** Pre-PR security review, systematic endpoint hardening, preventing vulnerabilities
  - **Output:** Security report + code suggestions + refactored endpoints with validation/rate limiting

- **Agent Name:** pr-fix-applier
  - **Specialization:** Batch apply code fixes from PR review feedback with organized commits
  - **Tools Needed:** Glob, Grep, Read, Edit, Bash (git operations)
  - **Use Case:** Efficiently addressing PR feedback with clean commit history
  - **Output:** Feature branch with organized commits per issue category + summary report

### Commands Not Yet Suggested But Could Be Useful

- **`/audit-styling`** - Full codebase styling audit identifying deprecated classes, inconsistent patterns, theme violations
- **`/endpoint-security-audit`** - Scan all API endpoints for missing validation, rate limiting, error handling consistency
- **`/commit-message-linter`** - Validate commit messages follow conventional format

### Connections to Existing Automations

- Relates to existing `/pre-submit-review` concept (could combine into unified code quality check)
- Complements existing `/review-pr-feedback` (this provides tools to apply the feedback)
- Different from `/apply-utility-refactoring` (which focuses on code patterns) but similar pattern

---

---

## Automation Opportunities - 2026-01-17

### Patterns Identified for Automation

#### 1. Batch Deployment Configuration Pattern (Vercel Setup)

**Repetitive Tasks Observed:**
- Created identical vercel.json configuration files for both api/ and web/ directories
- Each required manual creation of build/framework settings with correct src/dest mappings
- Pattern: vercel.json for FastAPI backend (Python build, route routing) + vercel.json for Next.js frontend (framework config)
- Would be needed for each new monorepo service added (new FastAPI service, additional Next.js app, etc.)

**Current Implementation:**
1. Create `/api/vercel.json` with Python builder and route mappings
2. Create `/web/vercel.json` with Next.js framework and build settings
3. Manually configure build and route rules for each service
4. Test deployment on Vercel

**Opportunities:**

- **`/init-vercel-config`** (Low Impact)
  - **Purpose:** Generate appropriate vercel.json for a given service type
  - **Trigger:** When adding new service directory or deploying to Vercel
  - **Input:** Service directory path, service type (nextjs, python, node, etc.), build command (optional)
  - **Output:** Pre-configured vercel.json ready for Vercel deployment
  - **Benefit:** Prevents configuration typos, ensures consistent Vercel setup across services
  - **Complexity:** Low

#### 2. Batch Audio Asset Generation & CDN Integration Pattern

**Repetitive Tasks Observed:**
- Created Python script (generate_audio.py) to batch-generate audio files from JSON quote data
- Script follows pattern: load data → process items → save outputs
- Environment-based config switching (TTS_ENABLED toggle, AUDIO_BASE_URL for CDN)
- Multi-stage workflow: generate locally → upload to GitHub Pages/CDN → update environment variables → disable TTS in production
- Similar pattern will be needed for other bulk asset generation (thumbnails, transcripts, metadata generation, etc.)

**Current Implementation:**
1. Create script that loads data from source (JSON, database)
2. Iterate through items, processing each with TTS/ML model
3. Save outputs to directory
4. Manual instructions for uploading and configuring CDN
5. Manual environment variable updates

**Opportunities:**

- **`/scaffold-batch-processor`** (Medium Impact)
  - **Purpose:** Generate batch processing script template for data transformation pipelines
  - **Trigger:** When implementing bulk data processing (audio generation, thumbnail creation, transcript generation, etc.)
  - **Input:** Input data source (JSON file, database query), processing type (TTS, image resize, extraction, etc.), output format/directory
  - **Output:** Templated Python script with proper error handling, progress tracking, skip logic for existing files
  - **Benefit:** Reduces script creation time by 60%, ensures consistent error handling and progress reporting across batch jobs
  - **Complexity:** Medium

- **`/generate-cdn-upload-instructions`** (Low Impact)
  - **Purpose:** Generate step-by-step instructions for uploading batch-generated assets to GitHub Pages or CDN
  - **Trigger:** After batch asset generation completes
  - **Input:** Asset type (audio, images, etc.), output directory, target CDN (GitHub Pages, AWS S3, Cloudflare, etc.)
  - **Output:** Structured instructions with commands and environment variable updates needed
  - **Benefit:** Standardizes asset deployment process, prevents manual errors in CDN setup
  - **Complexity:** Low

- **`/environment-toggle-generator`** (Low Impact)
  - **Purpose:** Generate environment variable schema and toggle documentation for production/development switching
  - **Trigger:** When implementing feature with environment-based switching (e.g., TTS_ENABLED)
  - **Input:** Feature name, configuration parameters (booleans and string values), environment values per stage
  - **Output:** .env.example with documentation, configuration schema/Pydantic model, environment toggle documentation
  - **Benefit:** Ensures consistent environment variable naming, prevents missing environment config entries, documents all toggles
  - **Complexity:** Low

#### 3. Accessibility Enhancement Pattern (ARIA Attributes)

**Repetitive Tasks Observed:**
- Added ARIA attributes (aria-label, aria-busy, role) to loading spinner and status components
- Pattern: identify component needing accessibility → determine appropriate ARIA attributes → add to JSX
- Same pattern applies to any interactive components (buttons, dialogs, status indicators, etc.)
- Likely will need accessibility audit and fixes across multiple components as application grows

**Current Implementation:**
1. Identify component lacking accessibility attributes
2. Determine appropriate ARIA attributes based on component purpose
3. Add attributes to JSX elements
4. Test with screen reader or accessibility checker

**Opportunities:**

- **`/audit-component-accessibility`** (Medium Impact)
  - **Purpose:** Scan components for missing accessibility attributes and suggest improvements
  - **Trigger:** During accessibility review, before release, or as part of code quality checks
  - **Input:** Component directory or file paths
  - **Output:** Report of accessibility gaps with specific recommendations (missing aria-labels, incomplete role definitions, etc.)
  - **Benefit:** Identifies accessibility issues systematically, prevents shipping inaccessible components, ensures WCAG compliance
  - **Complexity:** Medium

- **`/add-aria-attributes`** (Medium Impact)
  - **Purpose:** Automatically add appropriate ARIA attributes to components based on their type and role
  - **Trigger:** When creating new interactive component or fixing accessibility issue
  - **Input:** Component file path, component type (button, spinner, modal, form, etc.)
  - **Output:** Updated component with appropriate aria-label, aria-busy, role, aria-describedby, etc.
  - **Benefit:** Ensures consistency in accessibility implementation, reduces manual ARIA attribute decisions
  - **Complexity:** Medium

#### 4. Issue & PR Template Pattern (GitHub Automation)

**Repetitive Tasks Observed:**
- Created detailed GitHub issues with structured sections (description, code snippets, architecture diagrams, environment variables, task checklists)
- Created PRs with structured bodies (summary, architecture, changes, test plan)
- Both follow consistent formatting patterns with clear sections
- Manual process each time: create issue/PR → structure sections → add checklist items

**Current Implementation:**
1. Manually create GitHub issue with structured body
2. Add sections for description, code snippets, diagrams
3. Include environment variables if relevant
4. Add checklist of tasks
5. Manually create PR with summary/architecture/changes/test plan sections

**Opportunities:**

- **`/create-structured-issue`** (Medium Impact)
  - **Purpose:** Generate GitHub issue template with pre-structured sections
  - **Trigger:** When creating new feature/bug/task issue
  - **Input:** Issue title, issue type (feature/bug/task), description summary, list of task items
  - **Output:** Formatted GitHub issue body ready for posting (or creates issue directly)
  - **Benefit:** Ensures consistent issue structure, reduces manual formatting, prevents missing required sections
  - **Complexity:** Medium

- **`/create-structured-pr`** (Medium Impact)
  - **Purpose:** Generate GitHub PR body with architecture, changes, and test plan sections
  - **Trigger:** When creating PR after completing feature work
  - **Input:** Changed files, commit messages/summary, any architecture changes, test coverage info
  - **Output:** Formatted GitHub PR body ready for posting with all required sections
  - **Benefit:** Ensures PRs have complete information for reviewers, reduces back-and-forth for missing context
  - **Complexity:** Medium

### Workflow Optimization Opportunities

#### Current: Manual Batch Audio Generation & CDN Setup
```
1. Create generate_audio.py script manually
2. Install dependencies
3. Run script locally to generate .wav files
4. Manually create GitHub Pages repo or CDN setup
5. Upload audio files manually
6. Update AUDIO_BASE_URL environment variable manually
7. Set TTS_ENABLED=false in production
8. Test that audio CDN URLs work
```
**Estimated Time:** 30-45 minutes for complete setup + deployment

**Proposed:** `/scaffold-batch-processor` + `/generate-cdn-upload-instructions` + `/environment-toggle-generator`
```
1. Run scaffold-batch-processor with TTS config
2. Review generated script template
3. Run script to generate audio
4. Run generate-cdn-upload-instructions
5. Follow generated instructions for CDN upload
6. Apply environment variables from generated schema
7. Test
```
**Estimated Time:** 10-15 minutes (script generation + execution + environment config)
**Benefit:** 60% time reduction, consistent error handling, clear documentation for deployment

#### Current: Manual GitHub Issue/PR Creation
```
1. Open GitHub issue form
2. Manually type formatted sections
3. Add code snippets or diagrams manually
4. Create checklist items one by one
5. Verify formatting
6. Post issue
7. Repeat for PR with different sections
```
**Estimated Time:** 10-15 minutes per issue/PR

**Proposed:** `/create-structured-issue` + `/create-structured-pr`
```
1. Provide issue summary and type
2. Run command to generate formatted issue body
3. Review and adjust if needed
4. Post or have command create directly
5. Use `/create-structured-pr` after feature complete
```
**Estimated Time:** 2-3 minutes per issue/PR
**Benefit:** 70% time reduction, consistent formatting, no missed sections

#### Current: Sequential Accessibility Improvements
```
1. Manually identify component needing accessibility fixes
2. Determine appropriate ARIA attributes
3. Edit component to add attributes
4. Test with screen reader
5. Repeat for next component
```
**Estimated Time:** 10-15 minutes per component

**Proposed:** `/audit-component-accessibility` + `/add-aria-attributes`
```
1. Run audit-component-accessibility on component directory
2. Review report of issues
3. Run add-aria-attributes on specific components
4. Review generated ARIA attributes
5. Test selected components
```
**Estimated Time:** 2-3 minutes per component
**Benefit:** Bulk identification of accessibility issues, faster fixes, consistency in ARIA implementation

### Agent Ideas

- **Agent Name:** deployment-configurator
  - **Specialization:** Generate deployment configurations (vercel.json, docker files, environment schemas)
  - **Tools Needed:** Read, Glob, Edit
  - **Use Case:** Setting up services for Vercel, Docker, or other platforms; ensuring correct build and routing configuration
  - **Output:** Pre-configured deployment files ready for the target platform

- **Agent Name:** batch-processor-generator
  - **Specialization:** Generate batch data processing scripts (audio generation, thumbnail creation, metadata extraction, etc.)
  - **Tools Needed:** Read, Glob, Edit, template system
  - **Use Case:** Bulk asset generation, data transformation pipelines, batch cleanup/migration scripts
  - **Output:** Templated Python script with error handling, progress tracking, and skip logic

- **Agent Name:** accessibility-auditor
  - **Specialization:** Audit components for accessibility gaps and suggest ARIA attribute improvements
  - **Tools Needed:** Glob, Grep, Read, output analysis
  - **Use Case:** Systematic accessibility review, WCAG compliance checking, component hardening
  - **Output:** Accessibility audit report + specific ARIA suggestions + refactored components

- **Agent Name:** github-issue-generator
  - **Specialization:** Generate structured GitHub issues and PR bodies with all required sections
  - **Tools Needed:** Read, Edit, Glob, git integration
  - **Use Case:** Creating consistent feature requests, bug reports, PR documentation
  - **Output:** Formatted GitHub issue/PR body ready for posting or created directly

### Connections to Existing Automations

- **batch-processor-generator** relates to existing `/scaffold-fastapi-endpoint` and `/apply-utility-refactoring` (all are code generation patterns)
- **deployment-configurator** could extend existing Vercel setup patterns; complements `/scaffold-agent`
- **accessibility-auditor** aligns with existing `/audit-styling` and code quality check concepts
- **github-issue-generator** complements existing PR feedback processing (`/review-pr-feedback`, `/batch-apply-code-fixes`)

### Quick Wins (High Impact, Low Complexity)

1. **`/init-vercel-config`** - 5 minutes to implement, prevents configuration errors
2. **`/environment-toggle-generator`** - 10 minutes to implement, documents all environment-based features
3. **`/generate-cdn-upload-instructions`** - 10 minutes to implement, standardizes asset deployment

---

**Document Version:** 2.2
**Last Updated:** 2026-01-17
**Source:** Batch Audio Generation + Vercel Configuration + Accessibility Fixes + GitHub Workflow Session
