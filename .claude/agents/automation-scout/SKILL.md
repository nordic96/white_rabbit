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

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Source:** Health Check Implementation Session + FastAPI Search Implementation + Agent Directory Restructuring
