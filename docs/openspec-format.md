# OpenSpec Input Format

Daedalion reads from your `openspec/` directory and generates GitHub Copilot artifacts.

## Directory Structure

```
openspec/
├── project.md              # Project context → copilot-instructions.md
├── specs/
│   └── {domain}/
│       └── spec.md         # Domain specs → skills + agents
└── changes/
    └── {change-name}/
        ├── proposal.md     # Change proposal → prompts
        └── tasks.md        # Task breakdown (optional, included in prompts)
```

## Specification Format

**File:** `openspec/specs/{domain}/spec.md`

```markdown
# Optional frontmatter for metadata and instructions
---
# Example of agent behavior guidance in SKILL.md output
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

## Project Context

**File:** `openspec/project.md`

This file contains project-wide context and conventions. Its content is included in the generated `copilot-instructions.md`.

```markdown
# Project Context

## Tech Stack
- Node.js 20+
- TypeScript
- PostgreSQL

## Conventions
- Use async/await over callbacks
- All API responses follow JSON:API format
```
