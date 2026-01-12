# Daedalion v0.0.1 — Test Specifications

> MVP test suite. Run with `npm test` (vitest).

## Test Philosophy

- **Integration over unit**: Test CLI commands end-to-end
- **Fixtures over mocks**: Use real file I/O with temp directories
- **Snapshots for output**: Generated files compared to expected snapshots
- **Fast feedback**: All tests < 10 seconds total

## Setup

```javascript
// test/helpers.js
import { mkdtemp, rm, cp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

export async function createTempDir() {
  return mkdtemp(join(tmpdir(), 'daedalion-test-'));
}

export async function cleanTempDir(dir) {
  await rm(dir, { recursive: true, force: true });
}

export function runCLI(command, cwd) {
  return execSync(`node ${join(__dirname, '../bin/daedalion.js')} ${command}`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
}
```

---

## Test 1: Init Creates Scaffold

**Purpose**: Verify `daedalion init` bootstraps a working project.

```javascript
// test/init.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion init', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('creates openspec directory structure', () => {
    runCLI('init', tempDir);

    // Config file
    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);

    // OpenSpec structure
    expect(existsSync(join(tempDir, 'openspec/project.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/specs/example/spec.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/proposal.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/tasks.md'))).toBe(true);
  });

  it('creates valid example spec with requirements', () => {
    runCLI('init', tempDir);

    const specContent = readFileSync(
      join(tempDir, 'openspec/specs/example/spec.md'),
      'utf-8'
    );

    expect(specContent).toContain('# ');
    expect(specContent).toContain('### Requirement:');
    expect(specContent).toContain('#### Scenario:');
  });

  it('creates valid config with defaults', () => {
    runCLI('init', tempDir);

    const configContent = readFileSync(
      join(tempDir, 'daedalion.yaml'),
      'utf-8'
    );

    expect(configContent).toContain('version: 1');
    expect(configContent).toContain('target: github');
    expect(configContent).toContain('openspec: ./openspec');
    expect(configContent).toContain('output: ./.github');
  });

  it('does not overwrite existing files', () => {
    runCLI('init', tempDir);
    
    // Modify a file
    const configPath = join(tempDir, 'daedalion.yaml');
    const original = readFileSync(configPath, 'utf-8');
    
    // Run init again - should warn but not overwrite
    const output = runCLI('init', tempDir);
    
    expect(output).toContain('already exists');
    expect(readFileSync(configPath, 'utf-8')).toBe(original);
  });
});
```

---

## Test 2: Build Generates All Outputs

**Purpose**: Verify `daedalion build` produces correct skills, agents, prompts, workflow.

```javascript
// test/build.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion build', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
    runCLI('init', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('generates skill from spec', () => {
    runCLI('build', tempDir);

    const skillPath = join(tempDir, '.github/skills/example/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);

    const content = readFileSync(skillPath, 'utf-8');
    
    // Valid YAML frontmatter
    expect(content).toMatch(/^---\nname: example\n/);
    expect(content).toContain('description:');
    
    // Contains requirements from spec
    expect(content).toContain('## Requirements');
    expect(content).toContain('## Acceptance Criteria');
  });

  it('generates agent from spec domain', () => {
    runCLI('build', tempDir);

    const agentPath = join(tempDir, '.github/agents/example.agent.md');
    expect(existsSync(agentPath)).toBe(true);

    const content = readFileSync(agentPath, 'utf-8');
    
    // Valid frontmatter
    expect(content).toMatch(/^---\nname: example\n/);
    expect(content).toContain('tools:');
    
    // References skill
    expect(content).toContain('#example');
  });

  it('generates prompt from proposal', () => {
    runCLI('build', tempDir);

    const promptPath = join(tempDir, '.github/prompts/example-feature.prompt.md');
    expect(existsSync(promptPath)).toBe(true);

    const content = readFileSync(promptPath, 'utf-8');
    
    // Valid frontmatter
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('description:');
    
    // References source
    expect(content).toContain('openspec/changes/example-feature');
  });

  it('generates CI workflow', () => {
    runCLI('build', tempDir);

    const workflowPath = join(tempDir, '.github/workflows/daedalion.yml');
    expect(existsSync(workflowPath)).toBe(true);

    const content = readFileSync(workflowPath, 'utf-8');
    
    expect(content).toContain('name: Daedalion');
    expect(content).toContain('openspec/**');
    expect(content).toContain('daedalion build');
  });

  it('generates copilot-instructions.md from project.md', () => {
    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    expect(existsSync(instructionsPath)).toBe(true);

    const content = readFileSync(instructionsPath, 'utf-8');
    expect(content).toContain('# '); // Has content from project.md
  });

  it('is idempotent - running twice produces same output', () => {
    runCLI('build', tempDir);
    const firstRun = readFileSync(
      join(tempDir, '.github/skills/example/SKILL.md'),
      'utf-8'
    );

    runCLI('build', tempDir);
    const secondRun = readFileSync(
      join(tempDir, '.github/skills/example/SKILL.md'),
      'utf-8'
    );

    expect(firstRun).toBe(secondRun);
  });

  it('--dry-run shows output without writing files', () => {
    const output = runCLI('build --dry-run', tempDir);

    expect(output).toContain('SKILL.md');
    expect(output).toContain('agent.md');
    expect(existsSync(join(tempDir, '.github/skills/example/SKILL.md'))).toBe(false);
  });
});
```

---

## Test 3: Validate Catches Errors

**Purpose**: Verify `daedalion validate` enforces rules.

```javascript
// test/validate.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion validate', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
    runCLI('init', tempDir);
    runCLI('build', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('passes on valid project', () => {
    const output = runCLI('validate', tempDir);
    expect(output).toContain('✓');
  });

  it('fails when spec has no requirements', () => {
    // Create invalid spec
    const specPath = join(tempDir, 'openspec/specs/broken/spec.md');
    mkdirSync(join(tempDir, 'openspec/specs/broken'), { recursive: true });
    writeFileSync(specPath, '# Broken Spec\n\nNo requirements here.');

    let error;
    try {
      runCLI('validate', tempDir);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.stderr || error.message).toContain('has no requirements');
  });

  it('fails when requirement lacks scenarios', () => {
    // Modify spec to have requirement without scenario
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    writeFileSync(specPath, `# Example Spec

## Requirements

### Requirement: Missing Scenarios
The system SHALL do something.
`);

    let error;
    try {
      runCLI('validate', tempDir);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.stderr || error.message).toContain('lacks scenarios');
  });

  it('fails when skill missing for spec', () => {
    // Create spec without building
    const specPath = join(tempDir, 'openspec/specs/orphan/spec.md');
    mkdirSync(join(tempDir, 'openspec/specs/orphan'), { recursive: true });
    writeFileSync(specPath, `# Orphan Spec

## Requirements

### Requirement: Test
SHALL test.

#### Scenario: Test
- WHEN test
- THEN pass
`);

    let error;
    try {
      runCLI('validate', tempDir);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.stderr || error.message).toContain('Missing skill');
  });
});
```

---

## Test 4: Clean Removes Generated Files

**Purpose**: Verify `daedalion clean` removes only generated files.

```javascript
// test/clean.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion clean', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
    runCLI('init', tempDir);
    runCLI('build', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('removes generated .github/ contents', () => {
    expect(existsSync(join(tempDir, '.github/skills/example/SKILL.md'))).toBe(true);

    runCLI('clean', tempDir);

    expect(existsSync(join(tempDir, '.github/skills/example/SKILL.md'))).toBe(false);
    expect(existsSync(join(tempDir, '.github/agents/example.agent.md'))).toBe(false);
    expect(existsSync(join(tempDir, '.github/prompts/example-feature.prompt.md'))).toBe(false);
  });

  it('preserves openspec/ source files', () => {
    runCLI('clean', tempDir);

    expect(existsSync(join(tempDir, 'openspec/specs/example/spec.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/proposal.md'))).toBe(true);
  });

  it('preserves non-daedalion .github/ files', () => {
    // Create a manual file in .github/
    const manualFile = join(tempDir, '.github/CODEOWNERS');
    writeFileSync(manualFile, '* @owner');

    runCLI('clean', tempDir);

    expect(existsSync(manualFile)).toBe(true);
  });

  it('preserves daedalion.yaml config', () => {
    runCLI('clean', tempDir);
    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);
  });
});
```

---

## Test 5: Config Override

**Purpose**: Verify custom config paths are respected.

```javascript
// test/config.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('config override', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('respects custom openspec path', () => {
    // Create custom structure
    mkdirSync(join(tempDir, 'custom-specs/specs/test'), { recursive: true });
    mkdirSync(join(tempDir, 'custom-specs/changes/test-change'), { recursive: true });
    
    writeFileSync(join(tempDir, 'custom-specs/project.md'), '# Custom Project');
    writeFileSync(join(tempDir, 'custom-specs/specs/test/spec.md'), `# Test Spec

## Requirements

### Requirement: Custom
SHALL be custom.

#### Scenario: Works
- WHEN custom
- THEN works
`);
    writeFileSync(join(tempDir, 'custom-specs/changes/test-change/proposal.md'), `# Test Change

## Why
Testing.

## What
Test.
`);
    writeFileSync(join(tempDir, 'custom-specs/changes/test-change/tasks.md'), '- [ ] Test task');

    // Custom config
    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
target: github
openspec: ./custom-specs
output: ./.github
`);

    runCLI('build', tempDir);

    expect(existsSync(join(tempDir, '.github/skills/test/SKILL.md'))).toBe(true);
  });

  it('respects custom output path', () => {
    runCLI('init', tempDir);

    // Modify config for custom output
    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
target: github
openspec: ./openspec
output: ./custom-output
`);

    runCLI('build', tempDir);

    expect(existsSync(join(tempDir, 'custom-output/skills/example/SKILL.md'))).toBe(true);
    expect(existsSync(join(tempDir, '.github/skills/example/SKILL.md'))).toBe(false);
  });

  it('generates validate-only workflow when auto_commit is false', () => {
    runCLI('init', tempDir);

    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
target: github
openspec: ./openspec
output: ./.github
ci:
  auto_commit: false
`);

    runCLI('build', tempDir);

    const workflow = readFileSync(
      join(tempDir, '.github/workflows/daedalion.yml'),
      'utf-8'
    );

    expect(workflow).toContain('--dry-run');
    expect(workflow).not.toContain('git-auto-commit');
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/build.test.js

# Watch mode during development
npm test -- --watch

# With coverage
npm test -- --coverage
```

## Test Fixtures

Place reusable fixtures in `test/fixtures/`:

```
test/fixtures/
├── valid-project/          # Complete valid project
│   ├── daedalion.yaml
│   └── openspec/
├── invalid-spec/           # Spec without requirements
├── invalid-requirement/    # Requirement without scenarios
└── expected-output/        # Snapshot of expected generated files
```

## Coverage Target

For v0.0.1: **80% line coverage** on `src/` files.

Critical paths (must be 100%):
- `src/commands/build.js`
- `src/generators/*.js`
- `src/parsers/*.js`
