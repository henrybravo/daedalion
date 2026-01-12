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
