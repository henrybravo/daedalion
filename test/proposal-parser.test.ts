import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanTempDir } from './helpers.js';
import { parseProposal } from '../src/parsers/proposal.js';

describe('parseProposal - section heading variants', () => {
  let tempDir: string;
  let changeName: string;

  function writeProposal(content: string): string {
    changeName = 'test-change';
    const changeDir = join(tempDir, 'openspec/changes', changeName);
    mkdirSync(changeDir, { recursive: true });
    const proposalPath = join(changeDir, 'proposal.md');
    writeFileSync(proposalPath, content);
    return proposalPath;
  }

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanTempDir(tempDir);
  });

  it('extracts what from ## What (classic style)', () => {
    const path = writeProposal(`# Classic Proposal\n\n## Why\n\nThe reason.\n\n## What\n\nThe scope content.\n`);
    const proposal = parseProposal(path);
    expect(proposal.what).toContain('The scope content.');
  });

  it('extracts what from ## What Changes (OpenSpec 1.2.0 style)', () => {
    const path = writeProposal(`# OpenSpec Proposal\n\n## Why\n\nSecurity ops need this.\n\n## What Changes\n\nIntroduce a new security agent.\n`);
    const proposal = parseProposal(path);
    expect(proposal.what).not.toBeNull();
    expect(proposal.what).toContain('Introduce a new security agent.');
  });

  it('extracts what from ## What: (colon suffix style)', () => {
    const path = writeProposal(`# Colon Proposal\n\n## Why\n\nNeed it.\n\n## What:\n\nBuild the feature.\n`);
    const proposal = parseProposal(path);
    expect(proposal.what).not.toBeNull();
    expect(proposal.what).toContain('Build the feature.');
  });

  it('returns null for what when no What section exists', () => {
    const path = writeProposal(`# No What\n\n## Why\n\nOnly a why section.\n`);
    const proposal = parseProposal(path);
    expect(proposal.what).toBeNull();
  });

  it('extracts why from ## Why Changes variant', () => {
    const path = writeProposal(`# Variant\n\n## Why Changes\n\nBecause we need this.\n\n## What\n\nDo the thing.\n`);
    const proposal = parseProposal(path);
    expect(proposal.why).not.toBeNull();
    expect(proposal.why).toContain('Because we need this.');
  });

  it('derives title from change name when proposal has no # Title (OpenSpec 1.2.0 format)', () => {
    // OpenSpec 1.2.0 proposals start with ## Why — no # Title line
    const path = writeProposal(`## Why\n\nSecurity ops need this.\n\n## What Changes\n\nBuild the security agent.\n`);
    const proposal = parseProposal(path);
    expect(proposal.title).toBe('Test Change');
    expect(proposal.title).not.toBe('Untitled Proposal');
  });
});
