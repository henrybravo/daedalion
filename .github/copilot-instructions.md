# Project Guidelines

## Code Style

- **TypeScript with strict mode** — all source in `src/*.ts`, compiled to `dist/`.
- **ES Modules only** — `import`/`export`, no CommonJS. Use `fileURLToPath(import.meta.url)` for `__dirname` equivalents (see [src/version.ts](../src/version.ts)).
- **Named exports, no default exports** — each module exports one primary function (e.g., `export function parseSpec(...)`).
- **Explicit types** — all function parameters and return types are annotated. Shared interfaces live in [src/types.ts](../src/types.ts).
- **camelCase** functions, **UPPER_CASE** constants, **kebab-case** filenames.
- Generators and parsers are **synchronous** (`readFileSync`/`writeFileSync`); commands are **async**.
- All generators support `options.dryRun` — return `{ path, content }` without writing files.

## Architecture

```
bin/daedalion.js          CLI entry (Commander.js, plain JS shim)
src/types.ts              Shared interfaces (GeneratedFile, Spec, etc.)
src/index.ts              Barrel file — public API re-exports
src/commands/             async (cwd, options) → orchestrate parsers + generators
src/parsers/              sync, read markdown → structured data (regex on headings)
src/generators/           sync, (data, outputDir, options) → { path, content }
src/config.ts             loads daedalion.yaml, merges with DEFAULT_CONFIG, validates
templates/init/           scaffolding templates for `init` command
dist/                     compiled JS output (git-ignored)
```

**Data flow:** `openspec/specs/*/spec.md` → `parseSpec()` → `generateSkill()` + `generateAgent()`. Changes flow through `parseProposal()` / `parseTasks()` → `generatePrompt()`. Config drives `generateWorkflow()`.

**Manifest system:** `.github/.daedalion-manifest.json` tracks all generated files. `clean` validates the manifest and only removes manifest-tracked files within the output directory.

## Build and Test

```sh
npm install               # install deps (Node.js >= 20 required)
npm run build             # tsc — compile src/ to dist/
npm run typecheck         # tsc --noEmit — type check only
npm test                  # vitest run — full test suite (48 tests)
npm run test:watch        # vitest in watch mode
npm run test:coverage     # vitest with coverage
node bin/daedalion.js <cmd>  # run CLI locally (init|build|validate|clean)
```

## Project Conventions

- **String templates, not template engines** — generators build markdown via concatenation ([src/generators/skill.ts](../src/generators/skill.ts)).
- **Integration tests** — tests scaffold temp dirs via `createTempDir()`, run full CLI with `runCLI(command, cwd)`, assert on file existence and content ([test/helpers.ts](../test/helpers.ts)).
- **Domain = directory name** — `basename(dirname(specPath))` determines the domain key used in generated output.
- **Exit codes:** 0 = success, 1 = validation/missing files, 2 = config error. Commands throw `Error`; CLI catches and prints with `chalk.red`.
- **Version source of truth:** `package.json` → read by [src/version.ts](../src/version.ts). Dev builds append git hash.
- **Release flow:** `npm test` → `npm version patch|minor|major` → tag → push → `npm publish`.

## Integration Points

- **Input:** OpenSpec-formatted markdown in `openspec/` (companion tool: [openspec CLI](https://www.npmjs.com/package/openspec)).
- **Output:** GitHub Copilot artifacts in `.github/` (agents, skills, prompts, instructions, workflow).
- **Dependencies:** commander, chalk, glob, gray-matter, yaml. Dev: typescript, tsx, @types/node, vitest.
- Entirely local — no network calls, no API keys.
