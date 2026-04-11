# Daedalion Release Notes

## v0.3.2 (April 11, 2026)

### Bug Fixes

- **`.instructions.md` generation is now opt-in via `file_pattern` frontmatter** — Previously every spec unconditionally generated a `.github/instructions/{domain}.instructions.md` file with `applyTo: "**"`, making it always-on for every file in the workspace. This duplicated context already carried by `copilot-instructions.md` and the skills, bloating every request regardless of relevance. The `*.instructions.md` mechanism is intended for *file-scoped, always-on constraints* — rules that must fire whenever the agent touches a specific part of the codebase. Add `file_pattern: "src/payments/**"` (comma-separated globs accepted) to a spec's YAML frontmatter to opt in; Daedalion will generate the file with `applyTo: "<file_pattern>"`. Specs without `file_pattern` produce no instructions file. The example spec now includes `file_pattern: "src/example/**"` to demonstrate the feature.

- **Skill `description` expanded to 1024 characters** — `generateDescription()` was hard-capping skill descriptions at 60 characters. The official Copilot SKILL.md spec allows 1024 characters, and a short description is the most common reason skills fail to auto-load (the agent cannot determine relevance). Descriptions now include all requirement names and use the format `"<title> - <req1>, <req2>. Use when working on <domain>."`, capped at the 1024-character Copilot limit. A `description:` key in spec frontmatter still overrides the auto-generated value verbatim.

- **Removed spurious `name:` key from `daedalion-compile.prompt.md` init template** — The installed `.github/prompts/daedalion-compile.prompt.md` had a `name: daedalion-compile` frontmatter field. `name:` is not a valid `.prompt.md` frontmatter key (valid keys: `description`, `agent`, `model`, `tools`). The slash command name is derived from the filename, not from frontmatter. The field is now removed.

### Tests

- Updated `test/build.test.ts`: replaced `'generates pattern instructions for each spec domain'` with four new tests covering: no generation without `file_pattern`, correct `applyTo` value, multi-glob patterns, and per-domain selectivity in multi-spec builds.
- Added `test/build.test.ts`: skill description tests — all requirement names present, length > 60, length ≤ 1024, frontmatter override, truncation branch verification.
- Added `test/init.test.ts`: asserts `daedalion-compile.prompt.md` frontmatter contains no `name:` key.
- Updated `features-tests/scenario-a-openspec-active` fixture specs: added `file_pattern` to all 5 delta specs so the scenario continues to test instructions generation end-to-end.
- Total: 98 tests, all passing.

---

## v0.3.1 (February 24, 2026)

### Bug Fixes

- **Fixed agent tool names — `execute` replaces invalid `terminal`** — GitHub Copilot agents reported "Unknown tool 'terminal'" for every generated agent. The valid alias is `execute` (also accepts: `shell`, `Bash`, `powershell`). Default IDE tools are now `['edit', 'search', 'execute']`. Reference: [GitHub Copilot custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration).

- **Per-domain agent tools via spec frontmatter `agent_tools:`** — Add `agent_tools: ['edit', 'search', 'web']` to any `spec.md` frontmatter to override the default tools for that domain's agent. Useful for domains that need web access (`web`), GitHub tools (`github/*`), or MCP server tools. When `agent_tools` is not specified, the validated defaults apply.

### Tests

- Added agent valid tool names test to `test/build.test.ts` (asserts `execute`, not `terminal`)
- Added `agent_tools` frontmatter override test to `test/build.test.ts`
- Total: 92 tests, all passing.

---

## v0.3.0 (February 24, 2026)

### Features

- **P2: `daedalion-compile.prompt.md` super prompt** — `daedalion init` now installs `.github/prompts/daedalion-compile.prompt.md`. This format-agnostic prompt guides the IDE agent to discover spec files (canonical and delta paths), run `daedalion build`, and review the generated artifacts. It replaces the removed `daedalion-openspec-cycle.prompt.md` with a narrower scope: compilation only, not workflow coordination.

- **P2: Pattern-specific `*.instructions.md` generation** — `daedalion build` now generates `.github/instructions/{domain}.instructions.md` for each spec domain. Each file has `applyTo: "**"` so Copilot loads domain context automatically, and includes the domain's requirement summaries. These are tracked in the manifest and removed by `daedalion clean`.

- **P1: Skill description format** — `generateDescription()` now produces `"Use when working on {domain} - {req_name}"` (max 60 chars). Format puts "Use when" first to answer "when to invoke" directly. Avoids YAML quoting (no colon in value). Simplified the description template to drop the redundant `keywords` suffix.

- **CI disabled by default** — `daedalion build` no longer generates `.github/workflows/daedalion.yml` by default. Set `ci: enabled: true` in `daedalion.yaml` to opt-in. This eliminates false-positive CI failures with delta-spec workflows where `daedalion validate` does not have all canonical specs yet. The default `daedalion.yaml` template now includes `ci: enabled: false` with an explanatory comment.

### Tests

- Added `daedalion-compile.prompt.md` test to `test/init.test.ts`
- Added `{domain}.instructions.md` test to `test/build.test.ts`
- Added 5-domain pattern instructions test to `features-tests/scenario-a-openspec-active/scenario-a.test.ts`
- **P2: Modular skills (hub + spoke)** — `generateSkill()` now returns `GeneratedFile[]`. The hub `SKILL.md` contains the compact requirements list with links to spoke files; each spoke `{requirement-slug}.md` contains the scenario steps for one requirement. Spoke files are tracked in the manifest and removed by `daedalion clean`. Design decisions: partitioned by requirement (deterministic, no spec annotations needed); requirements with no scenarios stay in hub only.

  Example output for a spec with two requirements:
  ```
  .github/skills/example/
  ├── SKILL.md               ← hub
  ├── user-greeting.md       ← spoke
  └── session-management.md  ← spoke
  ```

- Added skill description format test to `test/build.test.ts`
- Added CI opt-in tests to `test/build.test.ts` (`ci.enabled: true` generates, default skips)
- Updated `test/config.test.ts` CI workflow tests to set `ci.enabled: true`
- Updated `features-tests/scenario-a,b` CI tests to assert workflow is NOT generated by default
- Added modular skills test to `test/build.test.ts` (spoke files + hub links)
- Added spoke files test to `features-tests/scenario-a-openspec-active/scenario-a.test.ts`
- Total: 90 tests, all passing.

---

## v0.2.0 (February 24, 2026)

### Features

- **P1: `AGENTS.md` generation** — `daedalion build` now generates `.github/AGENTS.md`, a discovery index listing all compiled agents with their domain, a concise description (first requirement name), and a link to the `.github/agents/{domain}.agent.md` file. Tracked in the Daedalion manifest so `daedalion clean` removes it safely. In Scenario A (OpenSpec 1.2.0 with 5 delta specs), `AGENTS.md` lists all 5 domains automatically.

### Tests

- Added AGENTS.md test to `test/build.test.ts`
- Added AGENTS.md test to `features-tests/scenario-a-openspec-active/scenario-a.test.ts` (5 domains)
- Total: 83 tests, all passing.

---

## v0.1.4 (February 24, 2026)

### Features

- **P1: Delta spec path discovery** — `daedalion build` now discovers specs in both `openspec/specs/*/spec.md` (canonical) and `openspec/changes/*/specs/*/spec.md` (delta). Canonical specs take priority when a domain exists in both locations. This is the primary use case when working with OpenSpec 1.2.0 before `/opsx:archive` — all delta specs are now compiled into skills and agents automatically. In the real workflow (`openspec init` → `/opsx:propose` → `daedalion build`), this increases generated artifacts from 4 to 14 for a 5-domain change.

### Cleanup

- **Removed `agents.target` and `agents.tools` from default `daedalion.yaml` template** — The ide/sdk distinction adds noise without value in the default case. Agent output defaults to IDE-compatible format. Users who need SDK agent format can add `agents: target: sdk` manually.

### Bug Fixes

- **Proposal title derived from change name** — OpenSpec 1.2.0 proposals start with `## Why` (no `# Title` heading). Previously the title fell back to "Untitled Proposal" causing `description: Untitled Proposal` in generated change prompts. The parser now derives the title from the change directory name via title-case conversion (`create-security-agent` → `Create Security Agent`).

- **Spec title derived from domain name** — Delta specs (`## ADDED Requirements`) have no `# Title` heading. Previously the title fell back to "Untitled Specification" causing poor SKILL.md descriptions. The parser now derives the title from the domain directory name (`security-agent-core` → `Security Agent Core`).

- **SKILL.md YAML description single-line** — The `yaml` library wraps strings longer than ~80 chars into multi-line YAML values with indented continuation lines, which VS Code's frontmatter parser rejects as "Unexpected indentation". Fixed by: (1) passing `{ lineWidth: 0 }` to `YAML.stringify` to disable wrapping; (2) using the requirement NAME instead of description as the skill description (requirement names are concise; descriptions are verbose).

- **Removed `daedalion-openspec-cycle.prompt.md`** — This generated prompt claimed to coordinate the OpenSpec development workflow, but OpenSpec already installs its own `opsx-propose`, `opsx-apply`, `opsx-archive`, and `opsx-explore` prompts. Having two competing workflow coordinators confused the IDE agent. The cycle prompt is no longer generated; OpenSpec's own prompts are the canonical workflow coordinators.

### Tests

- Updated `features-tests/scenario-a-openspec-active/scenario-a.test.ts`: converted two "KNOWN GAP" tests (asserting 0 skills/agents) to positive assertions (5 skills + 5 agents generated from delta specs).
- Added test: `does NOT generate daedalion-openspec-cycle.prompt.md`
- Added test: `SKILL.md description fits on a single line (no YAML continuation indentation)`
- Total: 81 tests, all passing.

---

## v0.1.3 (February 24, 2026)

### Bug Fixes

- **Fixed CRLF line endings in spec, proposal, and tasks parsers** — All three parsers (`spec.ts`, `proposal.ts`, `tasks.ts`) previously used `split('\n')` to process file content. Files with Windows-style CRLF (`\r\n`) line endings caused regex patterns using `.` and `$` anchors to silently fail: `.` does not match `\r` in JavaScript, and `$` does not match before `\r` in non-multiline mode. The parsers now use `split(/\r?\n/)`, handling both LF and CRLF files correctly. This affected requirement extraction, proposal section parsing (`## Why`, `## What`), and task item parsing.

### Tests

- Added `features-tests/` directory with integration-level scenario tests using real fixture files.
- Scenarios A–D cover: OpenSpec 1.2.0 active change (A), greenfield manual specs (B), post-archive canonical specs (C), and brownfield reverse-engineered specs (D).
- Total: 79 tests, all passing.

---

## v0.1.2 (February 24, 2026)

### Bug Fixes

- **Fixed proposal parser: `## What Changes` heading variant** — `extractSection()` previously required exact heading text match. OpenSpec 1.2.0 generates `## What Changes` instead of `## What`, causing every generated change prompt to show `Scope: No scope defined.`. The parser now matches headings that start with the section name (`## What`, `## What Changes`, `## What:` all resolve correctly). Same fix applies to `## Why` variants.

- **Fixed `copilot-instructions.md` generation** — The generator previously copied `openspec/project.md` verbatim into every Copilot session. The file now derives structured content from available spec data: lists all spec domains with skill/agent pointers, extracts only the `## Conventions` section from `project.md` (if present), and adds a working-with-specs reference. All other `project.md` content is excluded.

### Tests

- Added `test/proposal-parser.test.ts` (5 tests) covering `## What`, `## What Changes`, `## What:`, no-section, and `## Why Changes` variants.
- Added `test/build.test.ts` test asserting `copilot-instructions.md` lists spec domains and does not reproduce verbatim project.md content.
- Total: 56 tests, all passing.

---

## v0.1.1 (February 24, 2026)

### Bug Fixes

- **Fixed `init` next steps output**: Running `daedalion init` without `--with-example` no longer suggests editing `openspec/specs/example/spec.md` in the next steps, since that file is not created. The message now only appears when `--with-example` is passed.

---

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
