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
    expect(error.stderr || error.stdout || error.message).toContain('has no requirements');
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
    expect(error.stderr || error.stdout || error.message).toContain('lacks scenarios');
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
    expect(error.stderr || error.stdout || error.message).toContain('Missing skill');
  });
});
