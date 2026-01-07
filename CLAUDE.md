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

Three specialized agents are configured in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| **frontend-dev** | Next.js/React/TypeScript development, UI components, Tailwind CSS styling |
| **backend-dev** | Python FastAPI development, Neo4J database operations, Cypher queries |
| **ui-ux-designer** | Design consistency review, accessibility audits, visual hierarchy analysis |

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
