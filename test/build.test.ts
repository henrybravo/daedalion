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
      `### Requirement: A Very Long Requirement Name Number ${i + 1}\n\nDescription for requirement ${i + 1}.\n`
    ).join('\n');
    writeFileSync(specPath, `# Long Spec Title For Testing\n\n## Requirements\n\n${longReqs}`);
    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
    const descMatch = content.match(/^description: (.+)$/m);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeLessThanOrEqual(1024);
    // Must be close to 1024 — proves the truncation branch was actually reached
    expect(descMatch![1].length).toBeGreaterThan(900);
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

  it('does NOT generate pattern instructions when file_pattern is absent from spec', () => {
    runCLI('build', tempDir);
    // Example spec has no file_pattern → no instructions file
    expect(existsSync(join(tempDir, '.github/instructions/example.instructions.md'))).toBe(false);
  });

  it('generates pattern instructions with correct applyTo when file_pattern is present', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');
    writeFileSync(specPath, `---\nfile_pattern: "src/example/**"\n---\n${original}`);
    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/instructions/example.instructions.md');
    expect(existsSync(instructionsPath)).toBe(true);
    const content = readFileSync(instructionsPath, 'utf-8');
    expect(content).toContain('applyTo: "src/example/**"');
    expect(content).toContain('example');
  });

  it('generates pattern instructions with multi-glob applyTo', () => {
    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');
    writeFileSync(specPath, `---\nfile_pattern: "src/a/**,src/b/**"\n---\n${original}`);
    runCLI('build', tempDir);

    const content = readFileSync(
      join(tempDir, '.github/instructions/example.instructions.md'),
      'utf-8'
    );
    expect(content).toContain('applyTo: "src/a/**,src/b/**"');
  });

  it('only generates instructions file for specs that have file_pattern', () => {
    const authSpecDir = join(tempDir, 'openspec/specs/auth');
    mkdirSync(authSpecDir, { recursive: true });
    writeFileSync(join(authSpecDir, 'spec.md'), `# Auth Specification\n\n## Requirements\n\n### Requirement: Login\n\nUsers can log in.\n`);

    const specPath = join(tempDir, 'openspec/specs/example/spec.md');
    const original = readFileSync(specPath, 'utf-8');
    writeFileSync(specPath, `---\nfile_pattern: "src/example/**"\n---\n${original}`);

    runCLI('build', tempDir);

    expect(existsSync(join(tempDir, '.github/instructions/example.instructions.md'))).toBe(true);
    expect(existsSync(join(tempDir, '.github/instructions/auth.instructions.md'))).toBe(false);
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

  it('extracts conventions when source heading is "## Project Conventions"', () => {
    // Add a spec so build does not skip generating instructions
    mkdirSync(join(tempDir, 'openspec/specs/auth'), { recursive: true });
    writeFileSync(join(tempDir, 'openspec/specs/auth/spec.md'), `# Auth Spec

## Requirements

### Requirement: Login

The system SHALL allow users to log in.

### Scenario: Successful login

- Given a registered user
- When they submit valid credentials
- Then they receive an auth token
`);

    writeFileSync(join(tempDir, 'openspec/project.md'), `# My Acme Project

## Goals

- Ship fast

## Project Conventions

- Use kebab-case for file names
- Every feature needs a spec before implementation
`);

    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    const content = readFileSync(instructionsPath, 'utf-8');

    // Source heading was "## Project Conventions" — must still surface the content
    expect(content).toContain('Use kebab-case for file names');
    // Output heading is normalised to "## Conventions" regardless of source
    expect(content).toMatch(/^## Conventions\s*$/m);
    // Must NOT include the source-side "## Project Conventions" heading verbatim
    expect(content).not.toContain('## Project Conventions');
  });

  it('extracts conventions with mixed-case heading "## project conventions"', () => {
    mkdirSync(join(tempDir, 'openspec/specs/auth'), { recursive: true });
    writeFileSync(join(tempDir, 'openspec/specs/auth/spec.md'), `# Auth Spec

## Requirements

### Requirement: Login

The system SHALL allow users to log in.

### Scenario: Successful login

- Given a user
- When they log in
- Then it works
`);

    writeFileSync(join(tempDir, 'openspec/project.md'), `# Project

## project conventions

- lowercase headings should still match
`);

    runCLI('build', tempDir);

    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    const content = readFileSync(instructionsPath, 'utf-8');

    expect(content).toContain('lowercase headings should still match');
  });

  it('emits flat SKILL.md (no spoke files) when agents.target is sdk', () => {
    // Override the default daedalion.yaml written by `init --with-example`
    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
openspec: ./openspec
output: ./.github
agents:
  target: sdk
`);

    runCLI('build', tempDir);

    const skillDir = join(tempDir, '.github/skills/example');
    const skillPath = join(skillDir, 'SKILL.md');

    expect(existsSync(skillPath)).toBe(true);

    // The example spec has two requirements; in IDE mode this produces two spoke files.
    // In SDK mode the spokes must NOT exist.
    expect(existsSync(join(skillDir, 'user-greeting.md'))).toBe(false);
    expect(existsSync(join(skillDir, 'session-management.md'))).toBe(false);

    const content = readFileSync(skillPath, 'utf-8');

    // Acceptance criteria must contain inlined scenarios, not links
    expect(content).toContain('## Acceptance Criteria');
    expect(content).toContain('### User Greeting');
    expect(content).toContain('### Session Management');
    expect(content).toContain('#### Known user logs in');
    expect(content).toContain('Welcome, Alice!');

    // No markdown links to spoke files
    expect(content).not.toMatch(/\[.+\]\(\.\/[a-z-]+\.md\)/);
  });

  it('emits hub + spoke files when agents.target is ide (default behavior unchanged)', () => {
    // Default config from `init --with-example` is target: ide
    runCLI('build', tempDir);

    const skillDir = join(tempDir, '.github/skills/example');

    expect(existsSync(join(skillDir, 'SKILL.md'))).toBe(true);
    expect(existsSync(join(skillDir, 'user-greeting.md'))).toBe(true);
    expect(existsSync(join(skillDir, 'session-management.md'))).toBe(true);

    const skillContent = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8');
    // Hub mode uses links, not inlined `#### <scenario>` headings
    expect(skillContent).toContain('[User Greeting](./user-greeting.md)');
    expect(skillContent).not.toContain('#### Known user logs in');
  });

  it('omits scenario-less requirements from Acceptance Criteria in sdk mode', () => {
    writeFileSync(join(tempDir, 'daedalion.yaml'), `version: 1
openspec: ./openspec
output: ./.github
agents:
  target: sdk
`);

    // Replace example spec with one that has a scenario-less requirement
    writeFileSync(join(tempDir, 'openspec/specs/example/spec.md'), `# Example

## Requirements

### Requirement: Has Scenarios

The system SHALL do a thing.

#### Scenario: It works

- GIVEN setup
- WHEN action
- THEN result

### Requirement: No Scenarios

The system SHALL also document this requirement without scenarios.
`);

    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');

    // Both requirements appear in the Requirements list
    expect(content).toContain('**Has Scenarios**');
    expect(content).toContain('**No Scenarios**');

    // Only the scenario-bearing one appears under Acceptance Criteria
    expect(content).toContain('### Has Scenarios');
    expect(content).not.toContain('### No Scenarios');
  });

  it('change prompt uses agent: default and #default skill when change has no delta specs', () => {
    // example-feature has no delta specs by default after init
    runCLI('build', tempDir);
    const content = readFileSync(join(tempDir, '.github/prompts/example-feature.prompt.md'), 'utf-8');
    expect(content).toContain('agent: default');
    expect(content).toContain('- #default');
  });

  it('change prompt lists all delta-spec domain skills when change spans multiple domains', () => {
    // Add two delta specs to the example-feature change
    mkdirSync(join(tempDir, 'openspec/changes/example-feature/specs/domain-a'), { recursive: true });
    writeFileSync(
      join(tempDir, 'openspec/changes/example-feature/specs/domain-a/spec.md'),
      `# Domain A\n\n## Requirements\n\n### Requirement: A Req\n\nShall do A.\n\n#### Scenario: S\n- WHEN x\n- THEN y\n`
    );
    mkdirSync(join(tempDir, 'openspec/changes/example-feature/specs/domain-b'), { recursive: true });
    writeFileSync(
      join(tempDir, 'openspec/changes/example-feature/specs/domain-b/spec.md'),
      `# Domain B\n\n## Requirements\n\n### Requirement: B Req\n\nShall do B.\n\n#### Scenario: S\n- WHEN x\n- THEN y\n`
    );

    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/prompts/example-feature.prompt.md'), 'utf-8');
    expect(content).toContain('- #domain-a');
    expect(content).toContain('- #domain-b');
  });

  it('change prompt uses primary_domain frontmatter as agent when specified', () => {
    mkdirSync(join(tempDir, 'openspec/changes/example-feature/specs/domain-a'), { recursive: true });
    writeFileSync(
      join(tempDir, 'openspec/changes/example-feature/specs/domain-a/spec.md'),
      `# Domain A\n\n## Requirements\n\n### Requirement: A Req\n\nShall do A.\n\n#### Scenario: S\n- WHEN x\n- THEN y\n`
    );
    mkdirSync(join(tempDir, 'openspec/changes/example-feature/specs/domain-b'), { recursive: true });
    writeFileSync(
      join(tempDir, 'openspec/changes/example-feature/specs/domain-b/spec.md'),
      `# Domain B\n\n## Requirements\n\n### Requirement: B Req\n\nShall do B.\n\n#### Scenario: S\n- WHEN x\n- THEN y\n`
    );

    // Nominate domain-b as primary
    const proposalPath = join(tempDir, 'openspec/changes/example-feature/proposal.md');
    const original = readFileSync(proposalPath, 'utf-8');
    writeFileSync(proposalPath, `---\nprimary_domain: domain-b\n---\n${original}`);

    runCLI('build', tempDir);

    const content = readFileSync(join(tempDir, '.github/prompts/example-feature.prompt.md'), 'utf-8');
    expect(content).toContain('agent: domain-b');
    expect(content).toContain('- #domain-a');
    expect(content).toContain('- #domain-b');
  });
});
