/**
 * Scenario B — Greenfield, manual specs at canonical path
 *
 * Developer writes spec files by hand in openspec/specs/{domain}/
 * and change files in openspec/changes/{change-name}/.
 * This is the "happy path" that works fully today.
 *
 * See: docs/daedalion-evolution-copilot-first.md §11 Scenario B
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from '../../test/helpers.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

describe('Scenario B — greenfield, manual specs at canonical path', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    // Copy fixtures into temp dir (simulates a manually set-up project)
    cpSync(FIXTURES, tempDir, { recursive: true });
    // Run daedalion init to create daedalion.yaml
    runCLI('init', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('generates skill for the auth domain', () => {
    runCLI('build', tempDir);
    const skillPath = join(tempDir, '.github/skills/auth/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---\nname: auth\n/);
    expect(content).toContain('## Requirements');
    expect(content).toContain('User Login');
  });

  it('generates agent for the auth domain', () => {
    runCLI('build', tempDir);
    const agentPath = join(tempDir, '.github/agents/auth.agent.md');
    expect(existsSync(agentPath)).toBe(true);
    const content = readFileSync(agentPath, 'utf-8');
    expect(content).toContain('auth');
  });

  it('generates change prompt with Why and What content', () => {
    runCLI('build', tempDir);
    const promptPath = join(tempDir, '.github/prompts/add-oauth.prompt.md');
    expect(existsSync(promptPath)).toBe(true);
    const content = readFileSync(promptPath, 'utf-8');
    // Why section extracted
    expect(content).toContain('Users want to log in with GitHub and Google');
    // What section extracted (standard ## What heading)
    expect(content).toContain('Add OAuth2 provider configuration');
    // Tasks embedded
    expect(content).toContain('Add OAuth2 dependencies');
  });

  it('generates copilot-instructions.md with auth domain and conventions', () => {
    runCLI('build', tempDir);
    const instructionsPath = join(tempDir, '.github/copilot-instructions.md');
    expect(existsSync(instructionsPath)).toBe(true);
    const content = readFileSync(instructionsPath, 'utf-8');
    // Domain listed
    expect(content).toContain('auth');
    // Skill/agent pointers present
    expect(content).toContain('.github/skills/');
    expect(content).toContain('.github/agents/');
    // Conventions extracted from project.md
    expect(content).toContain('kebab-case');
    // Project title NOT verbatim copied
    expect(content).not.toContain('# Auth Service');
  });

  it('skips CI workflow by default (opt-in via ci.enabled: true)', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/workflows/daedalion.yml'))).toBe(false);
  });

  it('writes manifest tracking all generated files', () => {
    runCLI('build', tempDir);
    const manifest = JSON.parse(
      readFileSync(join(tempDir, '.github/.daedalion-manifest.json'), 'utf-8')
    );
    expect(manifest.files).toContain('.github/skills/auth/SKILL.md');
    expect(manifest.files).toContain('.github/agents/auth.agent.md');
    expect(manifest.files).toContain('.github/prompts/add-oauth.prompt.md');
    expect(manifest.files).toContain('.github/copilot-instructions.md');
  });
});
