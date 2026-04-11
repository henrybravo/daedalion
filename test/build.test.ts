import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
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

  it('agent default tools use valid Copilot aliases (execute not terminal)', () => {
    // 'terminal' is not a valid GitHub Copilot agent tool alias — produces "Unknown tool" error
    // 'execute' is the correct alias (also accepts: 'shell', 'Bash', 'powershell')
    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/agents/example.agent.md'), 'utf-8');
    expect(content).not.toContain("'terminal'");
    expect(content).toContain("'execute'");
  });

  it('agent uses agent_tools from spec frontmatter when specified', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');
    writeFileSync(specPath, `---\nagent_tools:\n  - edit\n  - search\n  - web\n---\n${original}`);
    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/agents/example.agent.md'), 'utf-8');
    expect(content).toContain("'edit'");
    expect(content).toContain("'search'");
    expect(content).toContain("'web'");
    expect(content).not.toContain("'execute'");
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

  it('does NOT generate daedalion-openspec-cycle.prompt.md (removed — conflicts with OpenSpec workflow)', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/prompts/daedalion-openspec-cycle.prompt.md'))).toBe(false);
  });

  it('generates spoke files for requirements with scenarios (modular skills)', () => {
    runCLI('build', tempDir);

    const skillDir = join(tempDir, '.github/skills/example');

    // Hub should link to spoke files
    const hub = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8');
    expect(hub).toContain('user-greeting.md');
    expect(hub).toContain('session-management.md');

    // Spoke files should exist
    expect(existsSync(join(skillDir, 'user-greeting.md'))).toBe(true);
    expect(existsSync(join(skillDir, 'session-management.md'))).toBe(true);

    // Spoke contains scenario steps
    const spoke = readFileSync(join(skillDir, 'user-greeting.md'), 'utf-8');
    expect(spoke).toContain('Known user logs in');
    expect(spoke).toContain('Welcome, Alice');
  });

  it('SKILL.md description includes all requirement names and is not truncated at 60 chars', () => {
    runCLI('build', tempDir);
    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
    // Must mention all requirement names (example spec has User Greeting + Session Management)
    expect(content).toMatch(/description:.*user greeting/i);
    expect(content).toMatch(/description:.*session management/i);
    // Must be longer than the old 60-char cap
    const descMatch = content.match(/^description: (.+)$/m);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeGreaterThan(60);
    // Must not exceed 1024 chars
    expect(descMatch![1].length).toBeLessThanOrEqual(1024);
  });

  it('SKILL.md description uses verbatim frontmatter description when provided', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');
    writeFileSync(specPath, `---\ndescription: Hand-crafted description for example domain\n---\n${original}`);
    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
    expect(content).toContain('Hand-crafted description for example domain');
    expect(content).not.toContain('Example Specification -');
  });

  it('SKILL.md description is capped at 1024 chars even when auto-generated text would be longer', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const longReqs = Array.from({ length: 30 }, (_, i) =>
      `### Requirement: A Very Long Requirement Name Number ${i + 1}\n\nDescription for req ${i + 1}.`
    ).join('\n\n');
    writeFileSync(specPath, `# Long Spec\n\n## Requirements\n\n${longReqs}\n`);
    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
    const descMatch = content.match(/^description: (.+)$/m);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeLessThanOrEqual(1024);
  });

  it('SKILL.md description fits on a single line (no YAML continuation indentation)', () => {
    runCLI('build', tempDir);
    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
    // Extract frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(fmMatch).not.toBeNull();
    // No indented continuation lines (e.g. "  value continuation")
    const frontmatter = fmMatch![1];
    expect(frontmatter).not.toMatch(/\n {2,}/);
  });

  it('generates pattern instructions for each spec domain', () => {
    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/instructions/example.instructions.md');
    expect(existsSync(instructionsPath)).toBe(true);

    const content = readFileSync(instructionsPath, 'utf-8');

    expect(content).toContain('applyTo:');
    expect(content).toContain('example');
  });

  it('generates AGENTS.md listing all domains', () => {
    runCLI('build', tempDir);

    const agentsPath = join(tempDir, '.github/AGENTS.md');
    expect(existsSync(agentsPath)).toBe(true);

    const content = readFileSync(agentsPath, 'utf-8');

    expect(content).toContain('# Agents');
    expect(content).toContain('example');
    expect(content).toContain('.github/agents/example.agent.md');
  });

  it('generates CI workflow when ci.enabled is true', () => {
    // Opt-in to CI by setting ci.enabled: true in config
    const configPath = join(tempDir, 'daedalion.yaml');
    const config = readFileSync(configPath, 'utf-8');
    writeFileSync(configPath, config.replace('enabled: false', 'enabled: true'));

    runCLI('build', tempDir);

    const workflowPath = join(tempDir, '.github/workflows/daedalion.yml');
    expect(existsSync(workflowPath)).toBe(true);

    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('name: Daedalion');
    expect(content).toContain('openspec/**');
    expect(content).toContain('daedalion build');
  });

  it('skips CI workflow when ci.enabled is false (default)', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/workflows/daedalion.yml'))).toBe(false);
  });

  it('generates copilot-instructions.md from project.md', () => {
    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    expect(existsSync(instructionsPath)).toBe(true);

    const content = readFileSync(instructionsPath, 'utf-8');
    expect(content).toContain('# Copilot Instructions');
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

  it('copilot-instructions.md lists spec domains and omits verbatim project.md content', () => {
    // Add an auth spec alongside the existing example spec
    const authSpecDir = join(tempDir, 'openspec/specs/auth');
    mkdirSync(authSpecDir, { recursive: true });
    writeFileSync(join(authSpecDir, 'spec.md'), `---
name: auth
description: Authentication domain
---
# Auth Specification

## REQ-001: Login

Users can log in with email and password.

### Scenario: Successful login

- Given a registered user
- When they submit valid credentials
- Then they receive an auth token
`);

    // Write a project.md with a ## Conventions section
    writeFileSync(join(tempDir, 'openspec/project.md'), `# My Acme Project

This is the project overview. It contains lots of context.

## Goals

- Build great software
- Ship fast

## Conventions

- Use kebab-case for file names
- Every feature needs a spec before implementation

## Extra Section

Some extra content that should not appear verbatim.
`);

    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    const content = readFileSync(instructionsPath, 'utf-8');

    // Must list the auth domain
    expect(content).toContain('auth');

    // Must include pointer to .github/skills/ and .github/agents/
    expect(content).toContain('.github/skills/');
    expect(content).toContain('.github/agents/');

    // Must include the Conventions section content
    expect(content).toContain('Use kebab-case for file names');

    // Must NOT reproduce the verbatim project.md title or extra sections
    expect(content).not.toContain('# My Acme Project');
    expect(content).not.toContain('## Extra Section');
    expect(content).not.toContain('Some extra content that should not appear verbatim.');
  });
});
