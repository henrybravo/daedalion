/**
 * Scenario D — Brownfield, reverse-engineered specs from existing codebase
 *
 * An existing project with code but no specs. The developer (or Copilot)
 * has written openspec/specs/{domain}/spec.md files documenting existing behaviour,
 * then run daedalion init and daedalion build.
 *
 * Two domains: orders + inventory. One active change: add-order-cancellation.
 *
 * See: docs/daedalion-evolution-copilot-first.md §11 Scenario D
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, cpSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir, runCLI } from '../../test/helpers.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

describe('Scenario D — brownfield, reverse-engineered specs', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    cpSync(FIXTURES, tempDir, { recursive: true });
    runCLI('init', tempDir);
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('generates skills for both existing domains', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/skills/orders/SKILL.md'))).toBe(true);
    expect(existsSync(join(tempDir, '.github/skills/inventory/SKILL.md'))).toBe(true);
  });

  it('generates agents for both existing domains', () => {
    runCLI('build', tempDir);
    expect(existsSync(join(tempDir, '.github/agents/orders.agent.md'))).toBe(true);
    expect(existsSync(join(tempDir, '.github/agents/inventory.agent.md'))).toBe(true);
  });

  it('generates change prompt with Why and What extracted from proposal', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/prompts/add-order-cancellation.prompt.md'),
      'utf-8'
    );
    expect(content).toContain('Customers need to cancel orders');   // Why
    expect(content).toContain('DELETE /api/v1/orders');             // What
    expect(content).toContain('Release reserved stock');            // Tasks
  });

  it('copilot-instructions.md lists both domains and project conventions', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/copilot-instructions.md'),
      'utf-8'
    );
    expect(content).toContain('orders');
    expect(content).toContain('inventory');
    expect(content).toContain('repository pattern');   // from Conventions section
    expect(content).not.toContain('# Orders API');    // no verbatim project.md copy
  });

  it('orders skill contains requirement details from reverse-engineered spec', () => {
    runCLI('build', tempDir);
    const content = readFileSync(
      join(tempDir, '.github/skills/orders/SKILL.md'),
      'utf-8'
    );
    expect(content).toContain('Create order');
    expect(content).toContain('Retrieve order');
  });
});
