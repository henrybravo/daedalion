# Daedalion

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/daedalion)](https://www.npmjs.com/package/daedalion)

> OpenSpec-to-Agent compiler for GitHub Copilot
>
> *"Write specs once, get agents automatically."*

## Overview

Daedalion generates `.github/` artifacts from OpenSpec specifications. Your specs stay the source of truth; agents stay in sync automatically.

```
OpenSpec (what) ───▶ Daedalion ───▶ GitHub Copilot (how)
```

## Installation

```bash
npm install -g daedalion
```

## Quick Start

```bash
# 1. Initialize a new project
daedalion init

# 2. Edit your specs
# - openspec/specs/example/spec.md
# - openspec/changes/example-feature/proposal.md

# 3. Generate GitHub Copilot artifacts
daedalion build

# 4. Validate everything is in sync
daedalion validate
```

## Commands

### `daedalion init`

Scaffolds a new project with example specs:

```
project/
├── daedalion.yaml
└── openspec/
    ├── project.md
    ├── specs/
    │   └── example/
    │       └── spec.md
    └── changes/
        └── example-feature/
            ├── proposal.md
            └── tasks.md
```

### `daedalion build`

Generates GitHub Copilot artifacts from your specs:

```
.github/
├── skills/
│   └── {domain}/
│       └── SKILL.md
├── agents/
│   └── {domain}.agent.md
├── prompts/
│   └── {change-name}.prompt.md
├── workflows/
│   └── daedalion.yml
└── copilot-instructions.md
```

**Flags:**
- `--dry-run` – Preview changes without writing files
- `--verbose` – Detailed output for debugging
- `--force` – Overwrite without confirmation

### `daedalion validate`

Checks that:
- Every spec has at least one requirement
- Every requirement has at least one scenario
- Generated skills exist for all specs
- Generated prompts exist for all changes
- No orphaned skills (skills without source specs)

### `daedalion clean`

Removes all generated files from `.github/` while preserving your specs and any non-Daedalion files.

## Configuration

Create `daedalion.yaml` in your project root:

```yaml
version: 1
target: github
openspec: ./openspec
output: ./.github

# Optional
project_name: my-project

# CI behavior
ci:
  auto_commit: false
  commit_message: 'chore: regenerate agents from specs'
```

## OpenSpec Format

### Specification (`specs/{domain}/spec.md`)

```markdown
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

### Proposal (`changes/{name}/proposal.md`)

```markdown
# Add Two-Factor Authentication

## Why
Security improvement for user accounts.

## What
Add OTP verification after password login.
```

### Tasks (`changes/{name}/tasks.md`)

```markdown
# Tasks

## Setup
- [ ] Add OTP library dependency
- [ ] Create database schema for OTP secrets

## Implementation
- [ ] Generate OTP secret on user enrollment
- [ ] Verify OTP during login
```

## Generated Output

### Skills

Skills are auto-loaded by GitHub Copilot when relevant:

```yaml
---
name: auth
description: User authentication with JWT. Use when working on auth, login, session.
---
# Auth Specification

## Requirements
- **User Authentication**: The system SHALL issue a JWT on successful login.

## Acceptance Criteria
### Valid credentials
- WHEN user submits valid credentials
- THEN a JWT is returned
```

### Agents

Agents are selectable personas in Copilot chat:

```yaml
---
name: auth
description: Implements auth features following specifications
tools: ['edit', 'search', 'terminal']
---
# auth Agent

You implement auth features following the specification.

## Available Skills
- **#auth** — Auth Specification - user authentication

## Workflow
1. Read the #auth skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
```

### Prompts

Prompts appear as slash commands:

```yaml
---
description: Add Two-Factor Authentication
agent: auth
---
Implement the add-2fa change proposal.

## Context
Security improvement for user accounts.

## Scope
Add OTP verification after password login.
```

## CI Integration

Daedalion generates a GitHub Actions workflow. Two patterns:

**Pattern A: Validate only (default)**
- Runs `daedalion build --dry-run` and `daedalion validate` on PRs
- Fails if specs and artifacts are out of sync

**Pattern B: Auto-commit**
- Set `ci.auto_commit: true` in config
- Automatically commits regenerated artifacts on push to main

## License

MIT
