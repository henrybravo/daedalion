# Developer Guide

## Prerequisites

- Node.js >= 20

## Setup

```bash
git clone https://github.com/your-org/daedalion.git
cd daedalion
npm install
```

## Running Locally

```bash
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
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Project Structure

```
daedalion/
├── bin/daedalion.js          # CLI entry point (Commander)
├── src/
│   ├── index.js              # Public exports
│   ├── config.js             # Load daedalion.yaml
│   ├── utils.js              # ensureDir, helpers
│   ├── commands/
│   │   ├── init.js           # Copy templates to target
│   │   ├── build.js          # Parse specs → generate output
│   │   ├── validate.js       # Check sync rules
│   │   └── clean.js          # Remove generated files via manifest
│   ├── parsers/
│   │   ├── spec.js           # spec.md → { domain, requirements[] }
│   │   ├── proposal.js       # proposal.md → { title, why, what }
│   │   └── tasks.js          # tasks.md → { items[], hasMore }
│   └── generators/
│       ├── skill.js          # → .github/skills/{domain}/SKILL.md
│       ├── agent.js          # → .github/agents/{domain}.agent.md
│       ├── prompt.js         # → .github/prompts/{change}.prompt.md
│       ├── workflow.js       # → .github/workflows/daedalion.yml
│       └── instructions.js   # → .github/copilot-instructions.md
├── templates/init/           # Scaffold templates for `daedalion init`
├── test/                     # Vitest test suite
└── docs/                     # Extended documentation
```

## Data Flow

```
openspec/specs/{domain}/spec.md
        ↓ parseSpec()
{ domain, title, requirements[] }
        ↓ generateSkill(), generateAgent()
.github/skills/{domain}/SKILL.md
.github/agents/{domain}.agent.md

openspec/changes/{name}/proposal.md + tasks.md
        ↓ parseProposal(), parseTasks()
{ title, why, what }, { items[], hasMore }
        ↓ generatePrompt()
.github/prompts/{name}.prompt.md

openspec/project.md + AGENTS.md (if exists)
        ↓ generateInstructions()
.github/copilot-instructions.md
```

## Adding a New Command

1. Create `src/commands/yourcommand.js`:

```javascript
import chalk from 'chalk';
import { loadConfig } from '../config.js';

export async function yourcommand(cwd, options = {}) {
  console.log(chalk.bold('  Daedalion v0.0.1 - YourCommand'));
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

1. Create `src/generators/yourgen.js`:

```javascript
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDir } from '../utils.js';

export function generateYourThing(data, outputDir, options = {}) {
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

2. Call from `src/commands/build.js`:

```javascript
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
console.log(chalk.bold('  Daedalion v0.0.1'));
console.log(chalk.green(`  ✓ ${relativePath}`));
console.log(chalk.yellow(`  ⚠ ${warning}`));
console.log(chalk.red(`  ✗ ${error}`));
console.log(chalk.gray(`    (hint text)`));
```

## Design Principles

1. **Simple over clever** — String templates, not template engines
2. **Explicit over magic** — Manifest tracks what we generate
3. **Safe by default** — `clean` requires manifest, won't delete unknowns
4. **Minimal dependencies** — Only what's needed (commander, yaml, chalk, glob, gray-matter)
5. **ES Modules** — Modern JavaScript, async/await throughout

## Testing Tips

Test files live in `test/` with `.test.js` suffix:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('build', () => {
  let testDir;

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

### Version Locations

Version is defined in multiple places (keep in sync):

| File | Location |
|------|----------|
| `package.json` | `"version": "0.0.1"` |
| `bin/daedalion.js` | `displayLogo()` and `.version()` |
| `src/commands/*.js` | `chalk.bold('  Daedalion v0.0.1')` |

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

# 2. Update version in all locations
# - package.json
# - bin/daedalion.js (displayLogo + .version())
# - src/commands/*.js headers

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
node -e "
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
