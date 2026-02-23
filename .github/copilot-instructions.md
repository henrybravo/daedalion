# Project Guidelines

## Code Style

- **ES Modules only** — `import`/`export`, no CommonJS. Use `fileURLToPath(import.meta.url)` for `__dirname` equivalents (see [src/version.js](../src/version.js)).
- **Named exports, no default exports** — each module exports one primary function (e.g., `export function parseSpec(...)`).
- **camelCase** functions, **UPPER_CASE** constants, **kebab-case** filenames.
- Generators and parsers are **synchronous** (`readFileSync`/`writeFileSync`); commands are **async**.
- All generators support `options.dryRun` — return `{ path, content }` without writing files.

## Architecture

```
bin/daedalion.js          CLI entry (Commander.js)
src/index.js              Barrel file — public API re-exports
src/commands/             async (cwd, options) → orchestrate parsers + generators
src/parsers/              sync, read markdown → structured data (regex on headings)
src/generators/           sync, (data, outputDir, options) → { path, content }
src/config.js             loads daedalion.yaml, merges with DEFAULT_CONFIG
templates/init/           scaffolding templates for `init` command
```

**Data flow:** `openspec/specs/*/spec.md` → `parseSpec()` → `generateSkill()` + `generateAgent()`. Changes flow through `parseProposal()` / `parseTasks()` → `generatePrompt()`. Config drives `generateWorkflow()`.

**Manifest system:** `.github/.daedalion-manifest.json` tracks all generated files. `clean` only removes manifest-tracked files.

## Build and Test

```sh
npm install               # install deps (Node.js >= 20 required)
npm test                  # vitest run — full test suite
npm run test:watch        # vitest in watch mode
npm run test:coverage     # vitest with coverage
node bin/daedalion.js <cmd>  # run CLI locally (init|build|validate|clean)
```

No build/compile step — runs as plain JS. No linter configured.

## Project Conventions

- **String templates, not template engines** — generators build markdown via concatenation ([src/generators/skill.js](../src/generators/skill.js)).
- **Integration tests** — tests scaffold temp dirs via `createTempDir()`, run full CLI with `runCLI(command, cwd)`, assert on file existence and content ([test/helpers.js](../test/helpers.js)).
- **Domain = directory name** — `basename(dirname(specPath))` determines the domain key used in generated output.
- **Exit codes:** 0 = success, 1 = validation/missing files, 2 = config error. Commands throw `Error`; CLI catches and prints with `chalk.red`.
- **Version source of truth:** `package.json` → read by [src/version.js](../src/version.js). Dev builds append git hash.
- **Release flow:** `npm test` → `npm version patch|minor|major` → tag → push → `npm publish`.

## Integration Points

- **Input:** OpenSpec-formatted markdown in `openspec/` (companion tool: [openspec CLI](https://www.npmjs.com/package/openspec)).
- **Output:** GitHub Copilot artifacts in `.github/` (agents, skills, prompts, instructions, workflow).
- **Dependencies:** commander, chalk, glob, gray-matter, yaml. Dev: vitest.
- Entirely local — no network calls, no API keys.
