# Daedalion Release Notes

## v0.1.0 (February 23, 2026)

### Highlights

Daedalion is now written in **TypeScript** with strict mode enabled. This release includes a complete port of all source modules, shared type definitions, security hardening, and a bug fix — with zero changes to runtime behaviour. All 48 tests pass.

### New Features

**Full TypeScript Codebase**
- All 16 source modules ported to strict TypeScript (`ES2022`, `Node16`).
- All 8 test files ported to TypeScript.
- Shared type definitions exported via `src/types.ts` — consumers get full type safety.
- Compiled output ships in `dist/`; type declarations (`.d.ts`) included.

**Type-Safe Public API**
- All interfaces exported: `GeneratedFile`, `BuildOptions`, `InitOptions`, `Spec`, `Requirement`, `Scenario`, `Proposal`, `TasksSummary`, `ToolDef`, `DaedalionConfig`, `Manifest`, `ValidationError`, `ParsedChange`, `ChangeReference`.
- `package.json` includes `types` and `exports` fields for proper IDE resolution.

**CI Workflow**
- Added `.github/workflows/ci.yml` — runs type check, build, and tests on Node 20 and 22.

### Bug Fixes

- **Fixed `generateJavaScriptStub`**: The function was called in `tools.ts` but never defined, causing a runtime crash when generating JavaScript tool stubs. It is now fully implemented with JSDoc annotations.
- **Unsupported tool language**: `generateToolStub` now throws a descriptive error instead of returning `undefined` for unknown languages.

### Security Improvements

- **Path traversal protection**: `safePath()` in `config.ts` validates that resolved `openspec` and `output` paths do not escape the project root.
- **Config validation**: `validateConfig()` checks schema version, `agents.target` enum, non-empty strings, and warns on unknown keys.
- **Manifest integrity**: `clean` command now validates manifest schema (`version` is number, `files` is `string[]`) and refuses to delete files outside the configured output directory.
- **Safer `execSync`**: Git commands in `version.ts` use `timeout: 5000` and `windowsHide: true`.
- **Node version guard**: CLI entry point checks `process.versions.node >= 20` at startup.

### Developer Experience

- New scripts: `npm run build` (tsc), `npm run typecheck` (tsc --noEmit), `npm run dev` (tsx).
- `prepublishOnly` runs build + test automatically.
- `vitest.config.ts` supports both `.ts` and `.js` test files.

### Breaking Changes

- **Source files moved**: `src/*.js` → `src/*.ts`. If you imported directly from `src/`, update paths or import from the package root (recommended).
- **Published files changed**: Package now ships `dist/` instead of `src/`. The public API (`import { ... } from 'daedalion'`) is unchanged.
- **Node.js >= 20 enforced at runtime** (previously only declared in `engines`).

---

## v0.0.2 (February 7, 2026)

### New Features

**Minimal Init by Default**
- `daedalion init` now creates a minimal project structure (config + project.md only)
- Use `--with-example` flag to include example specs and change files
- Reduces clutter for users who want to start fresh without example boilerplate

**Tool Definition Preservation**
- Tool definitions in spec.md YAML frontmatter are now preserved in generated SKILL.md files
- Enables single source of truth for tool contracts in specs
- Supports full IDE context and agent guidance with tool definitions
- Custom frontmatter fields are also preserved (e.g., `custom_config`, `validation_rules`)

### Breaking Changes

- `daedalion init` no longer creates example files by default
  - **Migration**: Use `daedalion init --with-example` to get the previous behavior

### Bug Fixes

- Fixed issue where tool definitions from spec YAML frontmatter were not included in generated SKILL.md
- Improved frontmatter merging to preserve all spec properties

---

## v0.0.1 — Initial Release

## Summary

Daedalion is a **spec-alignment tool for AI-assisted development**.
It compiles OpenSpec specifications into native GitHub Copilot artifacts so that humans and AIs operate from the same, explicit source of truth.

This release focuses on **workflow clarity, drift prevention, and repeatability** — not hard enforcement or AI control.

## What Daedalion Does

Daedalion transforms your `openspec/` directory into:

* Copilot agents (`.github/agents/*.agent.md`)
* Auto-loaded skills (`.github/skills/*/SKILL.md`)
* Slash-command prompts (`.github/prompts/*.prompt.md`)
* Project instructions (`.github/copilot-instructions.md`)
* An optional CI workflow (`.github/workflows/daedalion.yml`)

The centerpiece is the generated workflow prompt:

```
.github/prompts/daedalion-openspec-cycle.prompt.md
```

This file acts as an **AI workflow coordinator**, guiding Copilot through a spec-driven cycle:

1. Draft proposal + spec deltas
2. Human review and explicit approval
3. Task-driven implementation
4. Archival and merge back into canonical specs

## What Daedalion Is *Not*

Daedalion does **not**:

* Enforce AI behavior at a system level
* Prevent a user from asking Copilot to “just write the code”
* Guarantee semantic correctness or architectural soundness
* Replace human review, judgment, or accountability

If a user explicitly instructs the AI to ignore the workflow, the AI may comply.
This is a known and accepted limitation.

Daedalion is **alignment infrastructure**, not AI control.

## Why It Exists

AI-assisted development breaks down when:

* Specs drift from implementation
* Context is lost across sessions
* Humans and AIs disagree on scope
* Approval is implied instead of explicit

Daedalion exists to make those failures **visible and reviewable** by:

* Keeping specs as the canonical source of truth
* Generating AI artifacts directly from those specs
* Detecting drift via validation and CI
* Making workflow steps explicit instead of implicit

Bypassing the workflow is always possible — but no longer invisible.

## Validation Scope

`daedalion validate` provides **structural and referential validation**, including:

* Every requirement has at least one scenario
* Generated artifacts exist for all specs and changes
* No orphaned skills or prompts remain
* Specs and artifacts are in sync

Validation does **not** attempt:

* Semantic analysis
* Detection of contradictory requirements
* Non-functional requirement enforcement
* Task completeness verification

These remain human responsibilities by design.

## Artifact Volume and Scale

Daedalion intentionally generates multiple Copilot artifacts to keep context **explicit and scoped**.

In larger projects, this can create `.github/` directory growth.

Recommended practices:

* Limit active domains (≤5 works best with current Copilot behavior)
* Archive completed changes promptly
* Treat generated artifacts as ephemeral build output
* Use `daedalion clean` to reset from source specs

Daedalion optimizes for **clarity during active work**, not permanent accumulation.

## CI and Auto-Commit Behavior

By default:

* CI runs `daedalion validate`
* Builds fail on detected drift

Auto-commit of regenerated artifacts is **disabled by default**.

Auto-commit is intended for:

* Small teams
* Personal projects
* Rapid iteration environments

For most teams, manual regeneration and review is recommended to preserve clear history and accountability.

## Who This Release Is For

Daedalion works best for teams that:

* Already value written specifications
* Use GitHub Copilot as a serious development tool
* Want AI output aligned to human-approved intent
* Prefer explicit workflow over improvisation

Daedalion is **not** designed for:

* Vibe-coding workflows
* Zero-process development
* AI-first, spec-later approaches

## Final Note

Daedalion does not try to make AI obedient.

It makes **AI-assisted development legible, reviewable, and aligned** — so teams can move faster *without losing control*.
