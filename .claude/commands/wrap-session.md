---
description: Wrap up the current session - extract learnings, find automation opportunities, update docs, and suggest next steps
allowed-tools: Read, Glob, Grep, Edit, Task
---

# Session Wrap-Up Workflow

You are coordinating a session wrap-up workflow. Execute the following phases:

## Phase 1: Analysis (Run these agents sequentially)

### 1. Learning Extractor
Use the Task tool with `subagent_type: learning-extractor` to analyze this session for:
- Mistakes made and how they were resolved
- New patterns or techniques discovered
- Debugging approaches that worked well
- Performance insights gained

The agent will append findings to `.claude/agents/SKILL.md`.

### 2. Automation Scout
Use the Task tool with `subagent_type: automation-scout` to identify:
- Repetitive tasks that could become slash commands
- Manual processes that could be automated
- Patterns that warrant new agents
- Workflow optimizations

The agent will append findings to `.claude/agents/SKILL.md`.

### 3. Doc Updator
Use the Task tool with `subagent_type: doc-updator` to suggest and apply updates to:
- `CLAUDE.md` for project-wide documentation
- Agent instructions if patterns changed
- New sections for undocumented features

The agent will edit `CLAUDE.md` directly.

### 4. Followup Suggestor
Use the Task tool with `subagent_type: followup-suggestor` to identify:
- Incomplete work items from this session
- Technical debt introduced
- Testing gaps
- Prioritized list for next session

Print the followup items to console (don't persist).

## Phase 2: Consolidation

### 5. Duplicate Checker
Use the Task tool with `subagent_type: duplicate-checker` to review:
- All changes made by Phase 1 agents
- Existing content in `.claude/` directory
- Look for overlapping or redundant content
- Suggest consolidation opportunities

Print a summary of any duplicates or consolidation recommendations.

## Final Summary

After all phases complete, provide a brief summary:
- Key learnings captured
- Automation opportunities identified
- Documentation updates made
- Priority items for next session
- Any duplicates or redundancies found
