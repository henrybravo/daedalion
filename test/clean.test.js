import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync } from 'fs';
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
