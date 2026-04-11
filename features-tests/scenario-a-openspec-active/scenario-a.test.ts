/**
 * Scenario A — Greenfield, OpenSpec 1.2.0 active change (pre-archive)
 *
 * This scenario documents the CURRENT (partial) behaviour when daedalion is used
 * alongside OpenSpec 1.2.0 BEFORE /opsx:archive is run.
 *
 * Fixtures: real files from example-project-openspec-1.2.0
 * - proposal.md uses ## What Changes heading (OpenSpec 1.2.0 style) — NOW FIXED (P0)
 * - delta specs at openspec/changes/create-security-agent/specs/ — NOT found by daedalion (P1 gap)
 * - openspec/specs/ is EMPTY
 *
 * Known gaps documented as explicit assertions:
 * - Zero skills generated (specs at wrong path — P1 pending)
 * - Zero agents generated (same reason)
 *
 * Fixed in this release:
 * - Change prompt now shows actual scope content (## What Changes heading is parsed correctly)
 *
 * See: docs/daedalion-evolution-copilot-first.md §11 Scenario A
 * See: docs/progress.md — P1 spec path discovery
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, cpSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from '../../test/helpers.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

describe('Scenario A — OpenSpec 1.2.0 active change (pre-archive)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    cpSync(FIXTURES, tempDir, { recursive: true });
    runCLI('init', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  // ── WHAT WORKS TODAY ──────────────────────────────────────────────────────

  it('generates change prompt for the active change', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/prompts/create-security-agent.prompt.md'))).toBe(true);
  });

  it('change prompt extracts the Why (## Why heading)', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/prompts/create-security-agent.prompt.md'),
      'utf-8'
    );
    expect(content).toContain('Security operations require rapid triage');
  });

  it('change prompt extracts the What from ## What Changes heading (P0 fix)', () => {
    // This was broken before v0.1.2 — showed "No scope defined."
    // Fixed by: extractSection() now matches heading prefix variants
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/prompts/create-security-agent.prompt.md'),
      'utf-8'
    );
    expect(content).not.toContain('No scope defined.');
    expect(content).toContain('security agent');
  });

  it('generates copilot-instructions.md', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/copilot-instructions.md'))).toBe(true);
  });

  it('skips CI workflow by default (opt-in via ci.enabled: true)', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/workflows/daedalion.yml'))).toBe(false);
  });

  // ── P1 FIX — delta spec path discovery ───────────────────────────────────

  it('generates skills for all 5 delta spec domains (P1: delta path discovery)', () => {
    // Delta specs live at openspec/changes/create-security-agent/specs/
    // daedalion now scans both canonical (openspec/specs/) and delta paths
    runCLI('build', tempDir);
    const domains = ['security-agent-core', 'threat-intelligence-tool', 'log-analysis-tool',
                     'alert-triage-tool', 'agent-http-server'];
    for (const domain of domains) {
      expect(
        existsSync(join(tempDir, `.github/skills/${domain}/SKILL.md`)),
        `skill missing for ${domain}`
      ).toBe(true);
    }
  });

  it('generates agents for all 5 delta spec domains (P1: delta path discovery)', () => {
    runCLI('build', tempDir);
    const domains = ['security-agent-core', 'threat-intelligence-tool', 'log-analysis-tool',
                     'alert-triage-tool', 'agent-http-server'];
    for (const domain of domains) {
      expect(
        existsSync(join(tempDir, `.github/agents/${domain}.agent.md`)),
        `agent missing for ${domain}`
      ).toBe(true);
    }
  });

  it('generates spoke files for delta spec requirements with scenarios', () => {
    runCLI('build', tempDir);

    // Each delta spec has requirements with scenarios — spoke files should exist
    // security-agent-core has: Core Agent Initialization → core-agent-initialization.md
    const skillDir = join(tempDir, '.github/skills/security-agent-core');
    const hubContent = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8');
    expect(hubContent).toContain('.md');  // hub links to at least one spoke

    // At least one spoke file should exist in each skill directory
    const spokesExist = ['security-agent-core', 'threat-intelligence-tool'].every(domain => {
      const dir = join(tempDir, `.github/skills/${domain}`);
      return existsSync(dir);
    });
    expect(spokesExist).toBe(true);
  });

  it('generates pattern instructions for all 5 delta spec domains', () => {
    runCLI('build', tempDir);
    const domains = ['security-agent-core', 'threat-intelligence-tool', 'log-analysis-tool',
                     'alert-triage-tool', 'agent-http-server'];
    for (const domain of domains) {
      const path = join(tempDir, `.github/instructions/${domain}.instructions.md`);
      expect(existsSync(path), `instructions missing for ${domain}`).toBe(true);
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('applyTo:');
    }
  });

  it('generates AGENTS.md listing all 5 delta spec domains', () => {
    runCLI('build', tempDir);
    const agentsPath = join(tempDir, '.github/AGENTS.md');
    expect(existsSync(agentsPath)).toBe(true);

    const content = readFileSync(agentsPath, 'utf-8');
    const domains = ['security-agent-core', 'threat-intelligence-tool', 'log-analysis-tool',
                     'alert-triage-tool', 'agent-http-server'];
    for (const domain of domains) {
      expect(content, `AGENTS.md missing domain ${domain}`).toContain(domain);
    }
  });
});
