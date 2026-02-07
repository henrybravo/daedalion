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

  it('creates openspec directory structure without examples by default', () => {
    runCLI('init', tempDir);

    // Config file
    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);

    // OpenSpec structure - only project.md
    expect(existsSync(join(tempDir, 'openspec/project.md'))).toBe(true);

    // No example files
    expect(existsSync(join(tempDir, 'openspec/specs/example/spec.md'))).toBe(false);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/proposal.md'))).toBe(false);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/tasks.md'))).toBe(false);
  });

  it('creates example files with --with-example flag', () => {
    runCLI('init --with-example', tempDir);

    // Config file
    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);

    // OpenSpec structure with examples
    expect(existsSync(join(tempDir, 'openspec/project.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/specs/example/spec.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/proposal.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/tasks.md'))).toBe(true);
  });

  it('creates valid example spec with requirements', () => {
    runCLI('init --with-example', tempDir);

    const specContent = readFileSync(
      join(tempDir, 'openspec/specs/example/spec.md'),
      'utf-8'
    );

    expect(specContent).toContain('# ');
    expect(specContent).toContain('### Requirement:');
    expect(specContent).toContain('#### Scenario:');
  });

  it('creates valid config with defaults', () => {
    runCLI('init --with-example', tempDir);

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
    runCLI('init --with-example', tempDir);

    // Modify a file
    const configPath = join(tempDir, 'daedalion.yaml');
    const original = readFileSync(configPath, 'utf-8');

    // Run init again - should warn but not overwrite
    const output = runCLI('init --with-example', tempDir);

    expect(output).toContain('already exists');
    expect(readFileSync(configPath, 'utf-8')).toBe(original);
  });
});
