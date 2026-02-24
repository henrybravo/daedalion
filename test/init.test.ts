import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion init', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('creates openspec directory structure without examples by default', () => {
    runCLI('init', tempDir);

    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/project.md'))).toBe(true);
    expect(existsSync(join(tempDir, 'openspec/specs/example/spec.md'))).toBe(false);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/proposal.md'))).toBe(false);
    expect(existsSync(join(tempDir, 'openspec/changes/example-feature/tasks.md'))).toBe(false);
  });

  it('creates example files with --with-example flag', () => {
    runCLI('init --with-example', tempDir);

    expect(existsSync(join(tempDir, 'daedalion.yaml'))).toBe(true);
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
    expect(configContent).toContain('enabled: false');
  });

  it('does not mention example spec in next steps without --with-example', () => {
    const output = runCLI('init', tempDir);

    expect(output).not.toContain('openspec/specs/example/spec.md');
    expect(output).toContain('daedalion build');
  });

  it('mentions example spec in next steps with --with-example', () => {
    const output = runCLI('init --with-example', tempDir);

    expect(output).toContain('openspec/specs/example/spec.md');
    expect(output).toContain('daedalion build');
  });

  it('does not overwrite existing files', () => {
    runCLI('init --with-example', tempDir);

    const configPath = join(tempDir, 'daedalion.yaml');
    const original = readFileSync(configPath, 'utf-8');

    const output = runCLI('init --with-example', tempDir);

    expect(output).toContain('already exists');
    expect(readFileSync(configPath, 'utf-8')).toBe(original);
  });
});
