import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('config override', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('respects custom openspec path', () => {
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

    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
target: github
openspec: ./custom-specs
output: ./.github
`);

    runCLI('build', tempDir);

    expect(existsSync(join(tempDir, '.github/skills/test/SKILL.md'))).toBe(true);
  });

  it('respects custom output path', () => {
    runCLI('init --with-example', tempDir);

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
    runCLI('init --with-example', tempDir);

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

  it('generates auto-commit workflow when auto_commit is true', () => {
    runCLI('init --with-example', tempDir);

    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
target: github
openspec: ./openspec
output: ./.github
ci:
  auto_commit: true
`);

    runCLI('build', tempDir);

    const workflow = readFileSync(
      join(tempDir, '.github/workflows/daedalion.yml'),
      'utf-8'
    );

    expect(workflow).toContain('git-auto-commit');
    expect(workflow).not.toContain('--dry-run');
  });
});
