# Developer Guide

## Prerequisites

- Node.js >= 20

## Setup

```bash
git clone https://github.com/henrybravo/daedalion.git
cd daedalion
npm install
npm run build    # compile TypeScript to dist/
```

## Running Locally

```bash
# Build first (required — CLI imports from dist/)
npm run build

# Run CLI directly
node bin/daedalion.js init
node bin/daedalion.js build
node bin/daedalion.js validate
node bin/daedalion.js clean

# Or link globally for development
npm link
daedalion init  # now works globally
```

## Testing

```bash
npm test              # Run all tests (92 tests: unit + scenario integration, v0.3.1)
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run typecheck     # Type check without emitting
```

## Project Structure

```
daedalion/
├── bin/daedalion.js          # CLI entry point (Commander, plain JS shim)
├── src/
│   ├── types.ts              # Shared interfaces (GeneratedFile, Spec, etc.)
│   ├── index.ts              # Public exports + type re-exports
│   ├── config.ts             # Load daedalion.yaml, validate config
│   ├── utils.ts              # ensureDir, helpers
│   ├── version.ts            # VERSION const, getVersionString()
│   ├── commands/
│   │   ├── init.ts           # Copy templates to target
│   │   ├── build.ts          # Parse specs → generate output
│   │   ├── validate.ts       # Check sync rules
│   │   └── clean.ts          # Remove generated files via manifest
│   ├── parsers/
│   │   ├── spec.ts           # spec.md → { domain, requirements[] }
│   │   ├── proposal.ts       # proposal.md → { title, why, what }
│   │   └── tasks.ts          # tasks.md → { items[], hasMore }
│   └── generators/
│       ├── skill.ts                  # → .github/skills/{domain}/SKILL.md
│       ├── agent.ts                  # → .github/agents/{domain}.agent.md
│       ├── agents-index.ts           # → .github/AGENTS.md (discovery index)
│       ├── pattern-instructions.ts   # → .github/instructions/{domain}.instructions.md
│       ├── prompt.ts                 # → .github/prompts/{change}.prompt.md
│       ├── workflow.ts               # → .github/workflows/daedalion.yml
│       ├── instructions.ts           # → .github/copilot-instructions.md
│       └── tools.ts                  # → tool stubs (Python/JavaScript)
├── dist/                     # Compiled JS + declarations (git-ignored)
├── templates/init/           # Scaffold templates for `daedalion init`
├── test/                     # Vitest unit tests (.ts files)
├── features-tests/           # Scenario integration tests with fixture files
│   ├── scenario-a-openspec-active/   # OpenSpec 1.2.0 active change (delta specs)
│   ├── scenario-b-manual-specs/      # Greenfield: hand-written specs at canonical path
│   ├── scenario-c-post-archive/      # Post-archive: specs at canonical path after merge
│   ├── scenario-d-brownfield/        # Brownfield: reverse-engineered specs
│   └── scenario-e-mid-openspec/      # Mid-OpenSpec: requires user-provided fixtures
└── docs/                     # Extended documentation
```

## Data Flow

```
openspec/specs/{domain}/spec.md            ← canonical path (takes priority)
openspec/changes/*/specs/{domain}/spec.md  ← delta path (used if no canonical)
        ↓ parseSpec()
{ domain, title, requirements[] }
        ↓ generateSkill()            → returns GeneratedFile[]
.github/skills/{domain}/SKILL.md   ← hub: compact requirements list + spoke links
.github/skills/{domain}/{req}.md   ← spoke per requirement (scenario details)
        ↓ generateAgent()
.github/agents/{domain}.agent.md

openspec/changes/{name}/proposal.md + tasks.md
        ↓ parseProposal(), parseTasks()
{ title, why, what }, { items[], hasMore }
        ↓ generatePrompt()
.github/prompts/{name}.prompt.md

openspec/project.md
        ↓ generateInstructions()
.github/copilot-instructions.md

specs (all domains)
        ↓ generateAgentsIndex()
.github/AGENTS.md               ← discovery index for all compiled agents

spec (per domain)
        ↓ generatePatternInstructions()
.github/instructions/{domain}.instructions.md   ← applyTo:"**" domain context
```

## Adding a New Command

1. Create `src/commands/yourcommand.ts`:

```typescript
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { loadConfig } from '../config.js';
import type { BuildOptions } from '../types.js';

export async function yourcommand(cwd: string, options: BuildOptions = {}): Promise<void> {
  console.log(chalk.bold(`  Daedalion v${VERSION} - YourCommand`));
  const config = loadConfig(cwd);
  // ... implementation
}
```

2. Register in `bin/daedalion.js`:

```javascript
program
  .command('yourcommand')
  .description('Does something useful')
  .option('--some-flag', 'Description')
  .action(async (options) => {
    await yourcommand(process.cwd(), options);
  });
```

## Adding a New Generator

1. Create `src/generators/yourgen.ts`:

```typescript
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDir } from '../utils.js';
import type { GeneratedFile, BuildOptions } from '../types.js';

export function generateYourThing(
  data: { something: string },
  outputDir: string,
  options: BuildOptions = {}
): GeneratedFile {
  const outputPath = join(outputDir, 'your-file.md');
  const content = `# Generated\n\n${data.something}`;

  if (options.dryRun) {
    return { path: outputPath, content };
  }

  ensureDir(outputPath);
  writeFileSync(outputPath, content);
  return { path: outputPath, content };
}
```

2. Call from `src/commands/build.ts`:

```typescript
const result = generateYourThing(data, outputDir, options);
generatedFiles.push(result);
logGenerated(result.path, cwd, options);
```

## Parser Output Schemas

### parseSpec(filePath)

```javascript
{
  path: '/abs/path/to/spec.md',
  domain: 'auth',           // from directory name
  title: 'Auth Specification',
  requirements: [
    {
      name: 'User Authentication',
      description: 'The system SHALL issue a JWT...',
      scenarios: [
        { name: 'Valid credentials', steps: ['WHEN...', 'THEN...'] }
      ]
    }
  ]
}
```

### parseProposal(filePath)

```javascript
{
  path: '/abs/path/to/proposal.md',
  name: 'add-2fa',          // from directory name
  title: 'Add Two-Factor Authentication',
  why: 'Security improvement...',
  what: 'Add OTP verification...'
}
```

### parseTasks(filePath)

```javascript
{
  groups: ['Setup', 'Implementation'],
  items: ['Add OTP library', 'Create schema', ...],
  hasMore: true  // if capped at maxItems
}
```

## Manifest System

The `build` command writes `.github/.daedalion-manifest.json`:

```json
{
  "version": 1,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "files": [
    ".github/copilot-instructions.md",
    ".github/skills/auth/SKILL.md",
    ...
  ]
}
```

The `clean` command reads this manifest to remove only Daedalion-generated files, preserving:
- `openspec-*.prompt.md` (created by OpenSpec)
- Any manually created files

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation error, missing files |
| 2 | Config error |

## CLI Output Style

Use chalk for consistent output:

```javascript
console.log(chalk.bold(`  Daedalion v${VERSION}`));
console.log(chalk.green(`  ✓ ${relativePath}`));
console.log(chalk.yellow(`  ⚠ ${warning}`));
console.log(chalk.red(`  ✗ ${error}`));
console.log(chalk.gray(`    (hint text)`));
```

## Design Principles

1. **Simple over clever** — String templates, not template engines
2. **Explicit over magic** — Manifest tracks what we generate
3. **Safe by default** — `clean` validates manifest, won't delete unknowns or files outside output dir
4. **Minimal dependencies** — Only what's needed (commander, yaml, chalk, glob, gray-matter)
5. **ES Modules** — Modern JavaScript, async/await throughout
6. **Strict TypeScript** — All parameters and returns typed, shared interfaces in `src/types.ts`
7. **Security by default** — Path traversal protection, config validation, safe child_process usage

## Testing Tips

Unit test files live in `test/` with `.test.ts` suffix. Integration scenario tests live in `features-tests/`:

```bash
# Run all tests
npm test

# Run only unit tests
npx vitest run test/

# Run only scenario tests
npx vitest run features-tests/
```

**Fixture files** in `features-tests/*/fixtures/` may use either LF or CRLF line endings. Parsers normalize CRLF via `split(/\r?\n/)`.

Unit test files use `.test.ts` suffix:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('build', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'daedalion-test-'));
    // setup test fixtures
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('generates skill from spec', async () => {
    // ...
  });
});
```

## Versioning & Releases

### Version Source

Version is centralized in `package.json` and imported via `src/version.ts`:

| File | Purpose |
|------|---------|
| `package.json` | Single source of truth for version |
| `src/version.ts` | Exports `VERSION` and `getVersionString()` |

All commands import from `version.ts`:
```typescript
import { VERSION } from '../version.js';
console.log(chalk.bold(`  Daedalion v${VERSION}`));
```

### Dev Builds

During development, the CLI shows commit hash for traceability:

```
Version: 0.0.1-dev+abc1234
```

To get current commit hash:
```bash
git rev-parse --short HEAD
```

### Release Checklist

```bash
# 1. Ensure tests pass
npm test

# 2. Update version in package.json (single source of truth)
npm version patch  # or minor, major

# 3. Update CHANGELOG.md (if exists)

# 4. Commit version bump
git add -A
git commit -m "chore: bump version to X.Y.Z"

# 5. Tag release
git tag -a vX.Y.Z -m "Release X.Y.Z"
git push origin main --tags

# 6. Publish to npm
npm publish
```

### GitHub Release Commands (`gh release`)

Use GitHub CLI to create a GitHub Release from the version tag after publishing to npm.

```bash
# 1. Make sure gh is authenticated
gh auth status

# 2. Set the version tag (must match package.json version)
VERSION="vX.Y.Z"

# 3. Create and push tag (skip if tag already exists)
git tag -a "$VERSION" -m "Release ${VERSION#v}"
git push origin "$VERSION"

# 4. Create GitHub release notes automatically and publish release
gh release create "$VERSION" \
  --title "$VERSION" \
  --generate-notes
```

For draft flow:

```bash
gh release create "$VERSION" \
  --title "$VERSION" \
  --generate-notes \
  --draft
```

For prereleases (alpha/beta/rc):

```bash
# Example: v0.4.0-beta.1
VERSION="vX.Y.Z-beta.N"
gh release create "$VERSION" \
  --title "$VERSION" \
  --generate-notes \
  --prerelease
```

### Semantic Versioning

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | Major (X.0.0) | Remove command, change output format |
| New features | Minor (0.X.0) | Add command, new config option |
| Bug fixes | Patch (0.0.X) | Fix parser, correct output |

### Pre-release Versions

```bash
# Alpha/beta releases
npm version prerelease --preid=alpha  # 0.0.2-alpha.0
npm version prerelease --preid=beta   # 0.0.2-beta.0

# Publish with tag
npm publish --tag next
```

## Common Tasks

### Debug a parser

```bash
npx tsx -e "
import { parseSpec } from './src/parsers/spec.js';
console.log(JSON.stringify(parseSpec('./openspec/specs/example/spec.md'), null, 2));
"
```

### Test build in example-project

```bash
cd example-project
node ../bin/daedalion.js build --dry-run
```

### Check what clean would remove

```bash
cat .github/.daedalion-manifest.json | jq '.files'
```
