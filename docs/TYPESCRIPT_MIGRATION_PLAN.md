# TypeScript Migration Plan

> **Branch:** `feature/typescript-port`
> **Status:** Planning
> **Node:** >=20 (keep current engine requirement)

---

## 1. Goals

- Full TypeScript strict mode (`"strict": true`).
- Maintain ES Module output (`"type": "module"` in package.json).
- Preserve the existing public API surface (named exports from `src/index.ts`).
- Zero runtime behaviour change — all existing tests must pass after port.
- Ship compiled JS in `dist/`; publish only `dist/`, `bin/`, `templates/`.

---

## 2. Known Bugs to Fix During Port

| File | Issue |
|------|-------|
| `src/generators/tools.js` (line ~135) | `generateJavaScriptStub` is **called but never defined** — runtime crash for `language: 'javascript'`. Define the function or throw an explicit "unsupported language" error. |

---

## 3. Tooling Setup

### 3.1 New Dev Dependencies

```
typescript ^5.5
tsx                     # for running .ts files directly in dev
@types/node ^20
vitest                  # already present — no change
```

### 3.2 tsconfig.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### 3.3 package.json Changes

```jsonc
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "bin": {
    "daedalion": "./bin/daedalion.js"
  },
  "files": ["bin/", "dist/", "templates/"],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "npm run build && npm test",
    "typecheck": "tsc --noEmit"
  }
}
```

### 3.4 bin/daedalion.js

Keep as plain JS shim — update imports to point at `../dist/commands/*.js` and `../dist/version.js`. This avoids requiring `tsx` at runtime for end-users.

### 3.5 .gitignore Addition

```
dist/
```

---

## 4. Migration Order

Port files bottom-up (leaf modules first, commands last) to keep the compiler green at each step.

### Phase 1 — Types & Leaf Utilities

| # | File | → | Notes |
|---|------|----|-------|
| 1 | `src/utils.js` | `src/utils.ts` | Pure functions, no deps. Add explicit param/return types. |
| 2 | `src/version.js` | `src/version.ts` | Uses `child_process`, `fs`, `import.meta.url`. Type the returns. |
| 3 | `src/config.js` | `src/config.ts` | Define `DaedalionConfig` interface. Export it for consumers. |

### Phase 2 — Parsers

| # | File | → | Notes |
|---|------|----|-------|
| 4 | `src/parsers/spec.js` | `src/parsers/spec.ts` | Define `Spec`, `Requirement`, `Scenario` interfaces. |
| 5 | `src/parsers/proposal.js` | `src/parsers/proposal.ts` | Define `Proposal` interface. |
| 6 | `src/parsers/tasks.js` | `src/parsers/tasks.ts` | Define `TaskGroup`, `TaskItem`, `TasksSummary` interfaces. |

### Phase 3 — Generators

| # | File | → | Notes |
|---|------|----|-------|
| 7 | `src/generators/skill.js` | `src/generators/skill.ts` | Define `GeneratedFile` interface (`{ path: string; content: string }`), reuse everywhere. |
| 8 | `src/generators/agent.js` | `src/generators/agent.ts` | |
| 9 | `src/generators/prompt.js` | `src/generators/prompt.ts` | Two exports: `generatePrompt`, `generateCyclePrompt`. |
| 10 | `src/generators/workflow.js` | `src/generators/workflow.ts` | |
| 11 | `src/generators/instructions.js` | `src/generators/instructions.ts` | |
| 12 | `src/generators/tools.js` | `src/generators/tools.ts` | **Fix the missing `generateJavaScriptStub` function.** |

### Phase 4 — Commands

| # | File | → | Notes |
|---|------|----|-------|
| 13 | `src/commands/init.js` | `src/commands/init.ts` | |
| 14 | `src/commands/build.js` | `src/commands/build.ts` | Heavy orchestrator — port last among commands. |
| 15 | `src/commands/validate.js` | `src/commands/validate.ts` | |
| 16 | `src/commands/clean.js` | `src/commands/clean.ts` | |

### Phase 5 — Barrel & CLI

| # | File | → | Notes |
|---|------|----|-------|
| 17 | `src/index.js` | `src/index.ts` | Re-exports only — straightforward. |
| 18 | `bin/daedalion.js` | Keep `.js` | Update import paths to `../dist/…`. |

### Phase 6 — Tests

| # | File | Notes |
|---|------|-------|
| 19 | `test/helpers.js` | Keep as JS or port to TS. Vitest supports both. `runCLI` still invokes `bin/daedalion.js` (unchanged). |
| 20 | All `test/*.test.js` | Port to `.test.ts` **after** all src is ported. Import from `../src/…` (vitest resolves TS). |

---

## 5. Shared Interfaces (create `src/types.ts`)

```ts
/** Result returned by every generator */
export interface GeneratedFile {
  path: string;
  content: string;
}

/** Common options passed through commands and generators */
export interface BuildOptions {
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  withTools?: boolean;
}

/** Parsed spec from openspec/specs/*/spec.md */
export interface Spec {
  path: string;
  domain: string;
  title: string;
  frontmatter: Record<string, unknown>;
  requirements: Requirement[];
}

export interface Requirement {
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface Scenario {
  name: string;
  steps: string[];
}

/** Parsed proposal from openspec/changes/*/proposal.md */
export interface Proposal {
  path: string;
  changeName: string;
  title: string;
  frontmatter: Record<string, unknown>;
  why: string | null;
  what: string | null;
}

/** Parsed task list from openspec/changes/*/tasks.md */
export interface TasksSummary {
  groups: TaskGroup[];
  items: TaskItem[];
  hasMore: boolean;
}

export interface TaskGroup {
  level: number;
  name: string;
}

export interface TaskItem {
  text: string;
  checked: boolean;
}

/** daedalion.yaml configuration */
export interface DaedalionConfig {
  version: number;
  target: string;
  openspec: string;
  output: string;
  ci: {
    auto_commit: boolean;
    commit_message: string;
  };
  agents: {
    target: 'ide' | 'sdk';
    tools: string[] | null;
  };
}
```

---

## 6. Per-File Migration Checklist

For **each** file conversion, follow this sequence:

1. Rename `.js` → `.ts`.
2. Add explicit types to all function parameters and return values.
3. Replace `any` with proper types (use the shared interfaces above).
4. Run `npx tsc --noEmit` — fix all errors before moving on.
5. Run `npm test` — all existing tests must still pass.
6. Commit with message: `refactor(ts): port <module> to TypeScript`.

---

## 7. Security & Robustness Improvements

Apply these during the port — they are not separate tasks but inline enhancements.

### 7.1 Path Traversal Protection

`src/config.ts` and generators currently `join(cwd, userInput)` without validation. Add a guard:

```ts
import { resolve, relative } from 'path';

export function safePath(base: string, userPath: string): string {
  const resolved = resolve(base, userPath);
  const rel = relative(base, resolved);
  if (rel.startsWith('..') || resolve(resolved) !== resolved) {
    throw new Error(`Path escapes project root: ${userPath}`);
  }
  return resolved;
}
```

Use `safePath` wherever `config.openspec` or `config.output` is resolved.

### 7.2 Input Validation on Config Load

Currently `loadConfig` merges user YAML without validation. Add runtime checks:

- `config.version` must be `1` (known schema).
- `config.agents.target` must be `'ide' | 'sdk'`.
- `config.openspec` / `config.output` must be non-empty strings.
- Reject unknown top-level keys (warn, don't crash).

Consider using a lightweight validator like [zod](https://zod.dev) (zero deps, ~13KB) since you're already adding TypeScript.

### 7.3 Safer `child_process` Usage in `version.ts`

`execSync('git rev-parse --short HEAD')` is safe today (no user input) but wrap it explicitly:

```ts
execSync('git rev-parse --short HEAD', {
  encoding: 'utf-8',
  stdio: ['pipe', 'pipe', 'ignore'],
  timeout: 5000,     // prevent hanging
  windowsHide: true, // suppress console window on Windows
});
```

### 7.4 Manifest Integrity

The `.daedalion-manifest.json` is trusted blindly by `clean`. Add:

- Schema validation when reading (at minimum check `version` and `files` is `string[]`).
- Refuse to delete files outside `config.output` directory.

---

## 8. Recommended Improvements (Beyond Security)

### 8.1 Strict Null Checks Reveal Hidden Bugs

Several parsers return `null` for optional fields (`description`, `why`, `what`) but consumers don't guard against it. TypeScript's `strictNullChecks` will surface these — fix them during port.

### 8.2 Define the `generateJavaScriptStub` Function

The function is called in [src/generators/tools.js](src/generators/tools.js) line ~135 but never defined. Either:
- Implement it (analogous to `generatePythonStub`), or
- Throw a descriptive error: `throw new Error('JavaScript tool stubs are not yet supported')`.

### 8.3 Add `engines.node` Check at CLI Startup

The CLI requires Node >=20 but never checks. Add a guard in `bin/daedalion.js`:

```js
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error('Daedalion requires Node.js >= 20');
  process.exit(1);
}
```

### 8.4 Deterministic Task Aggregation

`aggregateTasks` in `build.ts` groups all tasks under a `'default'` key regardless of domain. This means multi-domain projects blend tasks incorrectly. Map tasks by the change's `frontmatter.domain` or the matched spec domain instead.

### 8.5 Export Types for Consumers

Since this is an npm package with a public API (`src/index.ts`), emit `.d.ts` files so consumers get type safety. The proposed `tsconfig.json` already enables `declaration: true`.

---

## 9. CI Pipeline Update

Update the GitHub workflow (generated by daedalion itself for the project repo, if applicable) or add a simple `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

---

## 10. Definition of Done

- [ ] All 16 source files ported to `.ts` with strict types.
- [ ] `src/types.ts` contains all shared interfaces.
- [ ] `npx tsc` compiles with zero errors.
- [ ] All existing tests pass (`npm test`).
- [ ] `generateJavaScriptStub` bug is resolved.
- [ ] Path traversal guards added to config/output resolution.
- [ ] Config validation added to `loadConfig`.
- [ ] Manifest validation added to `clean`.
- [ ] `bin/daedalion.js` updated to import from `dist/`.
- [ ] CI runs typecheck + build + test.
- [ ] `npm pack` produces a working package with type declarations.
