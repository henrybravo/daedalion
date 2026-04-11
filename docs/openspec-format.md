# OpenSpec Input Format

Daedalion reads from your `openspec/` directory and generates GitHub Copilot artifacts.

## Directory Structure

```
openspec/
├── project.md              # Project context → copilot-instructions.md
├── specs/
│   └── {domain}/
│       └── spec.md         # Canonical domain specs → skills + agents
└── changes/
    └── {change-name}/
        ├── proposal.md     # Change proposal → prompts
        ├── tasks.md        # Task breakdown (optional, included in prompts)
        └── specs/
            └── {domain}/
                └── spec.md # Delta specs → skills + agents (if no canonical)
```

Daedalion discovers specs from both `openspec/specs/` (canonical) and `openspec/changes/*/specs/` (delta). Canonical specs take priority when the same domain exists in both locations. This means `daedalion build` works correctly both before and after running `/opsx:archive`.

## Specification Format

**File:** `openspec/specs/{domain}/spec.md`

```markdown
---
# Scope .instructions.md to specific files (optional)
file_pattern: "src/auth/**"

# Agent behavior guidance in SKILL.md output (optional)
agent_instructions: |
  You are an automated UAT validator.
  ## Core Workflow
  1. If specific scenarios are provided, run only those.
  2. Otherwise run all scenarios.
---

# Auth Specification

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT on successful login.

#### Scenario: Valid credentials
- WHEN user submits valid credentials
- THEN a JWT is returned

#### Scenario: Invalid credentials
- WHEN user submits invalid credentials
- THEN an error is returned
```

### Key Elements

| Element | Format | Required |
|---------|--------|----------|
| Title | `# Domain Specification` | Yes |
| Requirement | `### Requirement: Name` | At least one |
| Scenario | `#### Scenario: Name` | At least one per requirement |

### Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `file_pattern` | string | Glob (or comma-separated globs) scoping a generated `.github/instructions/{domain}.instructions.md` to specific files. When present, Copilot loads the domain's requirement summaries automatically whenever a matching file is active. Omit to skip instructions file generation entirely. Example: `"src/payments/**,src/billing/**"` |
| `agent_instructions` | string (multiline) | Injected verbatim as an `# Agent Instructions` section at the top of `SKILL.md`. Use to give the skill's agent persona-level guidance. |
| `description` | string | Overrides the auto-generated skill description in `SKILL.md` frontmatter (max 1024 chars). Useful when the auto-generated text is insufficient for reliable auto-loading. |
| `agent_tools` | list | Overrides the default tool list for this domain's `.agent.md`. Example: `['edit', 'search', 'web']`. |
| `tools` | list | Tool definitions preserved verbatim in `SKILL.md` frontmatter. |

## Proposal Format

**File:** `openspec/changes/{name}/proposal.md`

```markdown
# Add Two-Factor Authentication

## Why
Security improvement for user accounts.

## What
Add OTP verification after password login.
```

### Key Elements

| Element | Format | Required |
|---------|--------|----------|
| Title | `# Change Title` | Yes |
| Why section | `## Why` | Recommended |
| What section | `## What` | Recommended |

## Tasks Format

**File:** `openspec/changes/{name}/tasks.md`

```markdown
# Tasks

## Setup
- [ ] Add OTP library dependency
- [ ] Create database schema for OTP secrets

## Implementation
- [ ] Generate OTP secret on user enrollment
- [ ] Verify OTP during login
```

Tasks are summarized (max 10 items) and included in generated prompts.

> **Line endings:** All parsers accept both LF (`\n`) and CRLF (`\r\n`) files. Files created on Windows or by tools that produce CRLF line endings are parsed correctly.

## Project Context

**File:** `openspec/project.md`

This file contains project-wide context and conventions. Its content is included in the generated `copilot-instructions.md`.

```markdown
# Project Context

## Tech Stack
- Node.js 20+
- TypeScript

## Conventions
- Use async/await over callbacks
- All API responses follow JSON:API format
```
