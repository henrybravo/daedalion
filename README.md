# Daedalion

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/daedalion)](https://www.npmjs.com/package/daedalion)

> OpenSpec-to-Agent compiler for GitHub Copilot
>
> *"Write specs, get agents automatically."*

## Overview

Daedalion turns your `openspec/` specifications into native GitHub Copilot artifacts — agents, skills, prompts, and instructions. Your specs stay the source of truth; agents stay in sync automatically.

```
OpenSpec (what) ───▶ Daedalion ───▶ GitHub Copilot (how)
```

## Why Daedalion

GitHub Copilot supports multiple instruction formats:

- **`AGENTS.md`** — Agent instructions (read natively, nearest file takes precedence)
- **`.github/copilot-instructions.md`** — Always-loaded project context
- **`.github/agents/*.agent.md`** — Selectable agent personas
- **`.github/skills/*/*.md`** — Auto-loaded when keywords like #auth appear
- **`.github/prompts/*.prompt.md`** — Custom slash commands

OpenSpec creates a root `AGENTS.md` for workflow instructions, but you still need domain-specific skills, agents, and prompts.

**Daedalion generates these automatically:** one command creates all native Copilot artifacts from your specs.

## Quick Start

```bash
# If starting fresh with OpenSpec
npm install -g openspec daedalion
openspec init        # Creates openspec/ structure + AGENTS.md
daedalion init       # Adds daedalion.yaml + example specs

# Generate Copilot artifacts
daedalion build

# Verify everything is in sync
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

**Flags:**
- `--target <mode>` – Set agent target mode: `ide` (default) or `sdk`

**Examples:**

```bash
# Default IDE mode
daedalion init

# SDK mode for CI pipelines
daedalion init --target sdk
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
- `--with-tools` – Generate tool stub files from specs

### `daedalion validate`

Checks that:
- Every spec has at least one requirement
- Every requirement has at least one scenario
- Generated skills exist for all specs
- Generated prompts exist for all changes
- No orphaned skills (skills without source specs)

### `daedalion clean`

Removes all generated files from `.github/` while preserving your specs and any non-Daedalion files.

| Command | Description |
|---------|-------------|
| `daedalion init` | Scaffold config + example specs | 
| `daedalion build` | Generate `.github/` artifacts from specs |
| `daedalion validate` | Check specs and generated files are in sync |
| `daedalion clean` | Remove only Daedalion-generated files |

**Build flags:** `--dry-run`, `--verbose`, `--force`

## Generated Output

```
.github/
├── copilot-instructions.md    # Project context + OpenSpec workflow reference
├── agents/{domain}.agent.md   # Per-domain agent personas
├── skills/{domain}/SKILL.md   # Auto-loaded skill files
├── prompts/{change}.prompt.md # Slash commands for active changes
├── workflows/daedalion.yml    # CI workflow
└── .daedalion-manifest.json   # Tracks generated files (for clean)
```

## Configuration

Create `daedalion.yaml`:

```yaml
version: 1
target: github
openspec: ./openspec
output: ./.github

project_name: my-project  # optional

ci:
  auto_commit: false
  commit_message: 'chore: regenerate agents from specs'

# Agent output configuration
agents:
  target: ide  # 'ide' or 'sdk'
  tools: null  # null to use IDE defaults, or array of custom tool names
```

### Agent Output Configuration

For running agents in CI pipelines via GitHub Copilot SDK (where tools are Python/JS functions registered programmatically):

```yaml
agents:
  target: sdk
  tools:
    - evaluate_application
    - generate_synthetic_applicant
    - compare_decisions
```

Generated `.github/agents/*.agent.md` will include your custom tools instead of IDE defaults (`edit`, `search`, `terminal`).

**Tip:** Use `daedalion init --target sdk` to set SDK mode from the start.

### Tool Stub Generation

Define tools in spec frontmatter and generate stub code:

```yaml
---
domain: example
title: Example Specification
tools:
  - name: evaluate_application
    description: Run a loan application through the decision engine
    inputs:
      - name: application
        type: dict
        description: LoanApplication dict per spec schema
    outputs:
      - dict
---
```

Run `daedalion build --with-tools` to generate `.github/tools/evaluate_application.py`:

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

## How It Works

1. **Specs** (`openspec/specs/{domain}/spec.md`) → **Skills** + **Agents**
2. **Changes** (`openspec/changes/{name}/proposal.md`) → **Prompts**
3. **project.md** → **copilot-instructions.md`
4. **Specs** (with `--with-tools`) → **Tool stubs** in `.github/tools/`

Note: GitHub Copilot reads `AGENTS.md` natively, so Daedalion doesn't duplicate that content.

The `clean` command uses a manifest to remove only Daedalion-generated files, preserving `openspec-*.prompt.md` and other non-Daedalion content.

## CI Integration

Generated workflow supports two patterns:

- **Validate only (default):** Fails if specs and artifacts drift
- **Auto-commit:** Set `ci.auto_commit: true` to regenerate on push

## License

MIT
