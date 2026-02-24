# Daedalion - Complete Reference

This document provides comprehensive documentation for Daedalion, the Spec-to-Agent compiler for GitHub Copilot. For a quick overview, see the main [README.md](../README.md).

## Table of Contents

- [What is Daedalion?](#what-is-daedalion)
- [The OpenSpec Cycle](#the-openspec-cycle)
- [Commands Reference](#commands-reference)
- [Configuration](#configuration)
- [OpenSpec Format](#openspec-format)
- [Generated Artifacts](#generated-artifacts)
- [Spec Frontmatter](#spec-frontmatter)
- [Tool Stub Generation](#tool-stub-generation)
- [CI Integration](#ci-integration)
- [Data Flow Pipeline](#data-flow-pipeline)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What is Daedalion?

Daedalion transforms your `openspec/` specifications into native GitHub Copilot artifacts - agents, skills, prompts, and instructions. Your specs remain the source of truth; generated artifacts stay in sync automatically.

```
OpenSpec (what to build) ──▶ Daedalion ──▶ GitHub Copilot (how to build)
```

### Core Problem Solved

Daedalion ensures humans and AIs agree on **what to build** before any code is written. This prevents costly rework by:

- Enforcing spec clarity before implementation
- Requiring human review and approval at each phase
- Keeping specifications as the canonical source of truth
- Maintaining synchronization between specs and AI artifacts

When you run `daedalion build`, it generates a special prompt file - `daedalion-openspec-cycle.prompt.md` - that acts as an **AI code coordinator**. This prompt enforces the spec-driven workflow across all AI interactions.

## The OpenSpec Cycle

The generated cycle coordinator enforces four phases:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Phase 1: DRAFT                    Phase 2: REVIEW                 │
│   ┌─────────────────┐               ┌─────────────────┐             │
│   │ Create proposal │               │ Iterate specs   │             │
│   │ Create tasks.md │ ──────────▶   │ Get approval    │             │
│   │ Write spec      │               │ Confirm scope   │             │
│   │ deltas          │               └────────┬────────┘             │
│   └─────────────────┘                        │                      │
│                                              ▼                      │
│   Phase 4: ARCHIVE                  Phase 3: IMPLEMENT              │
│   ┌─────────────────┐               ┌─────────────────┐             │
│   │ Merge deltas    │               │ Follow tasks.md │             │
│   │ Move to archive │ ◀──────────   │ Check off items │             │
│   │ Update specs    │               │ Verify criteria │             │
│   └─────────────────┘               └─────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Critical Rule:** The AI coordinator blocks coding until specs are explicitly approved by a human.

## Commands Reference

### `daedalion init`

Scaffolds a new project with example specs and configuration.

**Usage:**

```bash
daedalion init [--target <mode>]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--target <mode>` | Set agent target mode: `ide` (default) or `sdk` |

**Created Structure:**

```
project/
├── daedalion.yaml              # Configuration file
└── openspec/
    ├── project.md              # Project context
    ├── specs/
    │   └── example/
    │       └── spec.md         # Example domain specification
    └── changes/
        └── example-feature/
            ├── proposal.md     # Example change proposal
            └── tasks.md        # Example task breakdown
```

**Behavior:**
- Does not overwrite existing files (safe to run multiple times)
- Creates parent directories as needed

### `daedalion build`

Generates GitHub Copilot artifacts from your OpenSpec specifications.

**Usage:**

```bash
daedalion build [--dry-run] [--verbose] [--force] [--with-tools]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview changes without writing files |
| `--verbose` | Show detailed output |
| `--force` | Overwrite files without confirmation |
| `--with-tools` | Generate tool stub files from spec definitions |

**Generated Output:**

```
.github/
├── skills/
│   └── {domain}/
│       └── SKILL.md                    # Auto-loaded skill
├── agents/
│   └── {domain}.agent.md               # Selectable agent persona
├── prompts/
│   ├── daedalion-openspec-cycle.prompt.md   # AI coordinator
│   └── {change-name}.prompt.md         # Change-specific prompts
├── workflows/
│   └── daedalion.yml                   # CI/CD workflow
├── copilot-instructions.md             # Project context
└── .daedalion-manifest.json            # Tracks generated files
```

**Examples:**

```bash
# Preview what will be generated
daedalion build --dry-run

# Generate with detailed output
daedalion build --verbose

# Force regeneration
daedalion build --force

# Include tool stubs
daedalion build --with-tools
```

### `daedalion validate`

Verifies specs and generated artifacts are in sync and well-formed.

**Usage:**

```bash
daedalion validate
```

**Validation Rules:**

1. Every spec has at least one requirement
2. Every requirement has at least one scenario
3. Generated skills exist for all specs
4. Generated prompts exist for all changes
5. No orphaned skills (skills without corresponding specs)

**Exit Codes:**

- `0` - Validation passed
- `1` - Validation failed (errors printed to stderr)

**CI Usage:**

```bash
# Fail the build if specs and artifacts drift
daedalion validate || exit 1
```

### `daedalion clean`

Removes all Daedalion-generated files while preserving everything else.

**Usage:**

```bash
daedalion clean
```

**What Gets Removed:**
- Files listed in `.daedalion-manifest.json`
- Empty directories after cleanup

**What Gets Preserved:**
- Your `openspec/` folder
- Non-Daedalion files in `.github/`
- All other project files

## Configuration

Create `daedalion.yaml` at your project root:

```yaml
version: 1
target: github
openspec: ./openspec
output: ./.github

# Optional
project_name: my-project

ci:
  auto_commit: false
  commit_message: 'chore: regenerate agents from specs'

agents:
  target: ide
  tools: null
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | number | `1` | Config schema version |
| `target` | string | `github` | Target platform (currently only `github`) |
| `openspec` | string | `./openspec` | Path to OpenSpec directory |
| `output` | string | `./.github` | Output directory for generated artifacts |
| `project_name` | string | - | Optional project name for documentation |
| `ci.auto_commit` | boolean | `false` | Auto-commit regenerated files in CI |
| `ci.commit_message` | string | see above | Commit message for auto-regeneration |
| `agents.target` | string | `ide` | Agent target mode: `ide` or `sdk` |
| `agents.tools` | array\|null | `null` | Custom tool list (null = auto-detect) |

### Agent Target Modes

Both `ide` and `sdk` modes produce artifacts that work with GitHub Copilot. The main difference is in tool handling:

**IDE Mode** (default):
- Agents reference standard Copilot IDE tools: `edit`, `search`, `terminal`
- Best for development workflows in VS Code / IDE

**SDK Mode**:
- Agents reference tools defined in spec frontmatter
- Falls back to config tools if none in spec
- Best when using custom tools or the Copilot SDK

```yaml
# IDE mode (default)
agents:
  target: ide

# SDK mode with custom tools
agents:
  target: sdk
  tools:
    - evaluate_application
    - generate_report
```

## OpenSpec Format

### Directory Structure

```
openspec/
├── project.md                  # Project context and conventions
├── specs/
│   └── {domain}/
│       └── spec.md             # Domain specification
└── changes/
    └── {change-name}/
        ├── proposal.md         # Change proposal
        └── tasks.md            # Task breakdown
```

### Specification Format

**File:** `openspec/specs/{domain}/spec.md`

```markdown
---
# Optional frontmatter
agent_instructions: |
  Custom instructions for AI agents working with this spec.
tools:
  - name: validate_input
    description: Validates user input
    inputs:
      - name: data
        type: dict
    outputs:
      - type: boolean
---

# Domain Specification

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT on successful login.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN user submits valid credentials
- THEN a JWT is returned
- AND the token expires in 24 hours

#### Scenario: Invalid credentials
- WHEN user submits invalid credentials
- THEN an error is returned
- AND no token is issued

### Requirement: Session Management
Sessions shall expire after 24 hours of inactivity.

#### Scenario: Active session
- GIVEN an authenticated user
- WHEN user makes a request within 24 hours
- THEN the session remains valid
```

**Key Elements:**

| Element | Format | Required |
|---------|--------|----------|
| Title | `# Domain Specification` | Yes |
| Requirement | `### Requirement: Name` | At least one |
| Scenario | `#### Scenario: Name` | At least one per requirement |
| Steps | Lines starting with `-` | At least one per scenario |

**Scenario Step Prefixes:**
- `GIVEN` - Preconditions
- `WHEN` - Actions
- `THEN` - Expected outcomes
- `AND` - Additional conditions

### Proposal Format

**File:** `openspec/changes/{name}/proposal.md`

```markdown
# Add Two-Factor Authentication

## Why
Security improvement to protect user accounts from unauthorized access.
Industry best practice for sensitive applications.

## What
Add OTP verification after password login:
- TOTP support (Google Authenticator compatible)
- Backup codes for account recovery
- Optional enforcement per user role
```

| Element | Format | Required |
|---------|--------|----------|
| Title | `# Change Title` | Yes |
| Why | `## Why` | Recommended |
| What | `## What` | Recommended |

### Tasks Format

**File:** `openspec/changes/{name}/tasks.md`

```markdown
# Tasks

## Setup
- [ ] Add OTP library dependency
- [ ] Create database schema for OTP secrets
- [ ] Add environment variables for OTP config

## Implementation
- [ ] Generate OTP secret on user enrollment
- [ ] Build QR code generation endpoint
- [ ] Verify OTP during login flow

## Testing
- [ ] Unit tests for OTP validation
- [ ] Integration tests for login flow
- [ ] Manual QA checklist
```

Tasks are summarized (max 10 items) and included in generated prompts.

### Project Context

**File:** `openspec/project.md`

Contains project-wide context included in `copilot-instructions.md`:

```markdown
# Project Context

## Tech Stack
- Node.js 20+
- TypeScript 5.x
- PostgreSQL 15

## Conventions
- Use async/await over callbacks
- All API responses follow JSON:API format
- Error codes follow RFC 7807

## Architecture
- Domain-driven design
- Repository pattern for data access
- Event-driven for cross-domain communication
```

## Generated Artifacts

### Skills (`SKILL.md`)

**Location:** `.github/skills/{domain}/SKILL.md`

Skills are auto-loaded by Copilot when the `#{domain}` keyword appears in chat.

**Structure:**

```markdown
---
name: auth
description: User authentication implementation. Use when working on auth, login, session.
tools:
  - name: validate_jwt
    description: Validates JWT tokens
---

# Agent Instructions

Custom instructions from spec frontmatter...

# Auth Specification

## Requirements
- **User Authentication**: The system SHALL issue a JWT on successful login
- **Session Management**: Sessions shall expire after 24 hours

## Acceptance Criteria

### Valid credentials
- GIVEN a registered user
- WHEN user submits valid credentials
- THEN a JWT is returned

## Active Tasks
- Add JWT library dependency
- Create token validation middleware
```

### Agents (`{domain}.agent.md`)

**Location:** `.github/agents/{domain}.agent.md`

Selectable agent personas that implement specific domains.

**Structure:**

```markdown
---
name: auth
description: Implements auth features following specifications
tools: ['edit', 'search', 'terminal']
---

# auth Agent

You implement auth features following the specification.

## Available Skills
- **#auth** — Auth Specification - user authentication, session management

## Workflow
1. Read the #auth skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
```

### Prompts

**Change Prompts:** `.github/prompts/{change-name}.prompt.md`

Available as slash commands in Copilot:

```markdown
---
description: Add Two-Factor Authentication
agent: auth
---

Implement the add-2fa change proposal.

## Context
Security improvement to protect user accounts...

## Scope
Add OTP verification after password login...

## Reference
- Proposal: openspec/changes/add-2fa/proposal.md
- Tasks: openspec/changes/add-2fa/tasks.md

## Skills
- #auth

## Tasks
- [ ] Add OTP library dependency
- [ ] Create database schema
```

**Cycle Coordinator:** `.github/prompts/daedalion-openspec-cycle.prompt.md`

The AI workflow coordinator that enforces the spec-driven development process.

### Copilot Instructions

**Location:** `.github/copilot-instructions.md`

Contains project context from `openspec/project.md`, always loaded by Copilot.

### Manifest

**Location:** `.github/.daedalion-manifest.json`

Tracks all generated files for safe cleanup:

```json
{
  "version": 1,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "files": [
    ".github/copilot-instructions.md",
    ".github/skills/auth/SKILL.md",
    ".github/agents/auth.agent.md",
    ".github/prompts/add-2fa.prompt.md",
    ".github/workflows/daedalion.yml"
  ]
}
```

## Spec Frontmatter

Spec files support YAML frontmatter for metadata and configuration.

### Supported Fields

```yaml
---
# Agent behavior instructions (rendered as markdown section in SKILL.md)
agent_instructions: |
  You are an automated UAT validator.
  ## Core Workflow
  1. Run scenarios in order
  2. Report failures immediately

# Tool definitions (passed through to SKILL.md, used by SDK mode)
tools:
  - name: evaluate_application
    description: Run application through decision engine
    inputs:
      - name: application
        type: dict
        description: Application data
    outputs:
      - type: dict

# Custom fields (passed through as-is to SKILL.md frontmatter)
custom_config:
  mode: strict
  timeout: 30000
---
```

### Frontmatter Behavior

| Field | Behavior |
|-------|----------|
| `agent_instructions` | Rendered as `# Agent Instructions` section in SKILL.md |
| `tools` | Passed through to SKILL.md frontmatter; used by SDK mode for agent tools |
| All other fields | Passed through to SKILL.md frontmatter unchanged |

## Tool Stub Generation

Define tools in spec frontmatter and generate implementation stubs.

### Define Tools

```yaml
---
tools:
  - name: evaluate_application
    description: Run a loan application through the decision engine
    inputs:
      - name: application
        type: dict
        description: LoanApplication dict per spec schema
    outputs:
      - type: dict
  - name: generate_report
    description: Generate a compliance report
    inputs:
      - name: results
        type: list
    outputs:
      - type: str
---
```

### Generate Stubs

```bash
daedalion build --with-tools
```

**Output:** `.github/tools/{tool_name}.py`

```python
"""
Run a loan application through the decision engine
Implements: REQ-001: Tool Stubs
"""

def evaluate_application(application: dict) -> dict:
    """
    Run a loan application through the decision engine

    Args:
        application: dict - LoanApplication dict per spec schema

    Returns:
        dict

    Spec References:
        - REQ-001: Tool Stubs
    """
    raise NotImplementedError("Implement evaluate_application logic")
```

### Type Mapping

| Spec Type | Python Type | JavaScript Type |
|-----------|-------------|-----------------|
| `str`, `string` | `str` | `string` |
| `int`, `integer` | `int` | `number` |
| `float`, `number` | `float` | `number` |
| `bool`, `boolean` | `bool` | `boolean` |
| `list`, `array` | `list` | `Array` |
| `dict`, `object` | `dict` | `object` |

## CI Integration

### Validate-Only Workflow (Default)

By default, the generated workflow validates on pull requests:

```yaml
# .github/workflows/daedalion.yml
name: Daedalion

on:
  pull_request:
    paths:
      - 'openspec/**'
      - 'daedalion.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g daedalion
      - run: daedalion validate
```

### Auto-Regenerate on Push

Enable auto-commit in `daedalion.yaml`:

```yaml
ci:
  auto_commit: true
  commit_message: 'chore: regenerate agents from specs'
```

The workflow will:
1. Run `daedalion build` on push to main
2. Commit any changes with the configured message
3. Fail if uncommitted changes exist (prevents drift)

## Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INPUT (openspec/)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  openspec/specs/{domain}/spec.md                                    │
│      │                                                              │
│      ▼ parseSpec (gray-matter)                                      │
│  { domain, title, requirements[], frontmatter }                     │
│      │                                                              │
│      ├──▶ generateSkill() ──▶ .github/skills/{domain}/SKILL.md      │
│      └──▶ generateAgent() ──▶ .github/agents/{domain}.agent.md      │
│                                                                     │
│  openspec/changes/{name}/proposal.md + tasks.md                     │
│      │                                                              │
│      ▼ parseProposal, parseTasks                                    │
│  { title, why, what }, { items[], hasMore }                         │
│      │                                                              │
│      └──▶ generatePrompt() ──▶ .github/prompts/{name}.prompt.md     │
│                                                                     │
│  openspec/project.md                                                │
│      │                                                              │
│      └──▶ generateInstructions() ──▶ .github/copilot-instructions   │
│                                                                     │
│  daedalion.yaml                                                     │
│      │                                                              │
│      ├──▶ generateWorkflow() ──▶ .github/workflows/daedalion.yml    │
│      └──▶ generateCyclePrompt() ──▶ .github/prompts/daedalion-*     │
│                                                                     │
│  spec.frontmatter.tools (with --with-tools)                         │
│      │                                                              │
│      └──▶ generateTools() ──▶ .github/tools/*.py                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         OUTPUT (.github/)                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Best Practices

### Spec Organization

1. **One domain per spec directory**
   ```
   openspec/specs/auth/spec.md       # Authentication domain
   openspec/specs/payments/spec.md   # Payments domain
   openspec/specs/users/spec.md      # User management domain
   ```

2. **Use clear requirement names**
   ```markdown
   ### Requirement: User Authentication    # Good
   ### Requirement: Auth                   # Too vague
   ```

3. **Write testable scenarios**
   ```markdown
   #### Scenario: Valid JWT returns user data
   - GIVEN a valid JWT token
   - WHEN GET /api/me is called
   - THEN HTTP 200 is returned
   - AND response contains user email
   ```

### Workflow

1. **Edit specs, not generated files**
   - Modify `openspec/changes/{name}/proposal.md`
   - Run `daedalion build`
   - Manual edits to `.github/prompts/` are overwritten

2. **Validate before commit**
   ```bash
   daedalion validate
   git add openspec/ .github/
   git commit -m "feat: add 2FA support"
   ```

3. **Preview changes first**
   ```bash
   daedalion build --dry-run
   git diff .github/
   ```

4. **Commit both sources and artifacts**
   - `openspec/` - source of truth
   - `.github/` - generated artifacts

### CI/CD

1. **Always run validate in CI**
2. **Consider auto-regenerate for main branch only**
3. **Use branch protection to require passing validation**

## Troubleshooting

### "Every requirement must have a scenario"

Ensure each `### Requirement:` block has at least one `#### Scenario:` with steps:

```markdown
### Requirement: User Login

#### Scenario: Successful login
- WHEN user enters valid credentials
- THEN user is authenticated
```

### Generated prompts have stale content

Regenerate from clean state:

```bash
daedalion clean && daedalion build
```

### Tools not appearing in agent

1. Check `agents.target: sdk` is set in `daedalion.yaml`
2. Verify tools are defined in spec frontmatter
3. Run `daedalion build --verbose` to see tool extraction

### CI workflow not triggering

1. Verify changes touch `openspec/` or `daedalion.yaml`
2. Check branch protection allows workflow creation
3. Ensure workflow file is in `.github/workflows/`

### Validation passes but prompts are outdated

The manifest may be out of sync. Run:

```bash
daedalion clean
daedalion build
daedalion validate
```

## See Also

- [OpenSpec Format](openspec-format.md) - Detailed spec syntax
- [Generated Output](generated-output.md) - Artifact file reference
- [CI Workflow](ci-workflow.md) - GitHub Actions integration
- [DEVELOPER.md](DEVELOPER.md) - Contributing and internals
- [FAQ](faq.md) - Frequently asked questions
- [When Not to Use Daedalion](when-not-to-use.md) - Limitations and alternatives
- [Release Notes](RELEASE.md) - Version history and changes
- [Main README](../README.md) - Overview and getting started
- [License](../LICENSE) - Terms and conditions
- [Changelog](CHANGELOG.md) - Detailed change log
