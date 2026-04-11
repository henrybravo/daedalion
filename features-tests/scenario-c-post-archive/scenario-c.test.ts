/**
 * Scenario C — Greenfield, OpenSpec post-archive state
 *
 * After /opsx:archive runs, delta specs are moved from
 * openspec/changes/{name}/specs/ to openspec/specs/.
 * This simulates that state: 5 canonical specs at the correct path.
 * daedalion build should produce all 5 skills and 5 agents.
 *
 * Fixtures: real spec files from the example-project-openspec-1.2.0
 * (the security agent domains created by /opsx:propose).
 *
 * See: docs/daedalion-evolution-copilot-first.md §11 Scenario C
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, cpSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from '../../test/helpers.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

const EXPECTED_DOMAINS = [
  'security-agent-core',
  'threat-intelligence-tool',
  'log-analysis-tool',
  'alert-triage-tool',
  'agent-http-server',
];

describe('Scenario C — post-archive, 5 canonical security agent specs', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    cpSync(FIXTURES, tempDir, { recursive: true });
    runCLI('init', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('generates a SKILL.md for each of the 5 domains', () => {
    runCLI('build', tempDir);
    for (const domain of EXPECTED_DOMAINS) {
      const skillPath = join(tempDir, `.github/skills/${domain}/SKILL.md`);
      expect(existsSync(skillPath), `skill missing for domain: ${domain}`).toBe(true);
    }
  });

  it('generates an agent file for each of the 5 domains', () => {
    runCLI('build', tempDir);
    for (const domain of EXPECTED_DOMAINS) {
      const agentPath = join(tempDir, `.github/agents/${domain}.agent.md`);
      expect(existsSync(agentPath), `agent missing for domain: ${domain}`).toBe(true);
    }
  });

  it('security-agent-core skill contains parsed requirements', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/skills/security-agent-core/SKILL.md'),
      'utf-8'
    );
    expect(content).toContain('## Requirements');
    expect(content).toContain('Agent initialization');
  });

  it('copilot-instructions.md lists all 5 domains', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/copilot-instructions.md'),
      'utf-8'
    );
    for (const domain of EXPECTED_DOMAINS) {
      expect(content, `domain missing from instructions: ${domain}`).toContain(domain);
    }
    expect(content).toContain('snake_case');  // from Conventions section
  });

  it('manifest tracks all 5 skills and 5 agents', () => {
    runCLI('build', tempDir);
    const manifest = JSON.parse(
      readFileSync(join(tempDir, '.github/.daedalion-manifest.json'), 'utf-8')
    );
    for (const domain of EXPECTED_DOMAINS) {
      expect(manifest.files).toContain(`.github/skills/${domain}/SKILL.md`);
      expect(manifest.files).toContain(`.github/agents/${domain}.agent.md`);
    }
  });
});
