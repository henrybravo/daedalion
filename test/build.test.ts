import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from './helpers.js';

describe('daedalion build', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    runCLI('init --with-example', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('generates skill from spec', () => {
    runCLI('build', tempDir);

    const skillPath = join(tempDir, '.github/skills/example/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);

    const content = readFileSync(skillPath, 'utf-8');

    expect(content).toMatch(/^---\nname: example\n/);
    expect(content).toContain('description:');
    expect(content).toContain('## Requirements');
    expect(content).toContain('## Acceptance Criteria');
  });

  it('preserves tools from spec frontmatter in SKILL.md', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');

    const specWithTools = `---
tools:
  - name: my_tool
    description: Does something
    inputs:
      - name: param
        type: string
    outputs:
      - type: dict
---
${original}`;

    writeFileSync(specPath, specWithTools);
    runCLI('build', tempDir);

    const skillPath = join(tempDir, '.github/skills/example/SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');

    expect(content).toContain('tools:');
    expect(content).toContain('name: my_tool');
    expect(content).toContain('inputs:');
    expect(content).toContain('outputs:');
  });

  it('passes through custom frontmatter fields to SKILL.md', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');

    const specWithCustomFields = `---
custom_config:
  mode: strict
  timeout: 30
validation_rules:
  - name: rule_one
    expected: success
---
${original}`;

    writeFileSync(specPath, specWithCustomFields);
    runCLI('build', tempDir);

    const skillPath = join(tempDir, '.github/skills/example/SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');

    expect(content).toContain('custom_config:');
    expect(content).toContain('mode: strict');
    expect(content).toContain('timeout: 30');
    expect(content).toContain('validation_rules:');
    expect(content).toContain('name: rule_one');
    expect(content).toContain('expected: success');
  });

  it('renders agent instructions section when provided', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');

    const specWithInstructions = `---
agent_instructions: |
  You are a UAT validator.
  ## Core Workflow
  1. If specific scenarios provided, run only those.
  2. Otherwise run all scenarios.
---
${original}`;

    writeFileSync(specPath, specWithInstructions);
    runCLI('build', tempDir);

    const skillPath = join(tempDir, '.github/skills/example/SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');

    expect(content).toContain('# Agent Instructions');
    expect(content).toContain('You are a UAT validator.');
    expect(content).toContain('## Core Workflow');
    expect(content).toContain('1. If specific scenarios provided, run only those.');
    expect(content).toContain('# Example Specification');
  });

  it('generates agent from spec domain', () => {
    runCLI('build', tempDir);

    const agentPath = join(tempDir, '.github/agents/example.agent.md');
    expect(existsSync(agentPath)).toBe(true);

    const content = readFileSync(agentPath, 'utf-8');

    expect(content).toMatch(/^---\nname: example\n/);
    expect(content).toContain('tools:');
    expect(content).toContain('#example');
  });

  it('generates prompt from proposal', () => {
    runCLI('build', tempDir);

    const promptPath = join(tempDir, '.github/prompts/example-feature.prompt.md');
    expect(existsSync(promptPath)).toBe(true);

    const content = readFileSync(promptPath, 'utf-8');

    expect(content).toMatch(/^---\n/);
    expect(content).toContain('description:');
    expect(content).toContain('openspec/changes/example-feature');
  });

  it('generates openspec cycle prompt', () => {
    runCLI('build', tempDir);

    const promptPath = join(tempDir, '.github/prompts/daedalion-openspec-cycle.prompt.md');
    expect(existsSync(promptPath)).toBe(true);

    const content = readFileSync(promptPath, 'utf-8');
    expect(content).toContain('OpenSpec cycle coordinator');
    expect(content).toContain('@openspec-proposal.prompt.md');
    expect(content).toContain('@openspec-apply.prompt.md');
    expect(content).toContain('@openspec-archive.prompt.md');
    expect(content).toContain('openspec view');
    expect(content).toContain('openspec --help');
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
    expect(content).toContain('# ');
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
