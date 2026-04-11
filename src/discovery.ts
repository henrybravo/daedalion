import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { parseSpec } from './parsers/spec.js';
import { parseProposal } from './parsers/proposal.js';
import { parseTasks } from './parsers/tasks.js';
import type { ParsedChange, Spec } from './types.js';

/**
 * Discovers all specs for the project: canonical specs take priority;
 * delta specs fill in any domain not yet promoted to canonical.
 *
 * Canonical: openspec/specs/<domain>/spec.md
 * Delta:     openspec/changes/<change>/specs/<domain>/spec.md
 */
export async function discoverSpecs(openspecDir: string): Promise<Spec[]> {
  const specsByDomain = new Map<string, Spec>();

  // 1. Canonical specs always win
  const canonicalDir = join(openspecDir, 'specs');
  if (existsSync(canonicalDir)) {
    const files = await glob('*/spec.md', { cwd: canonicalDir });
    for (const file of files) {
      const spec = parseSpec(join(canonicalDir, file));
      specsByDomain.set(spec.domain, spec);
    }
  }

  // 2. Delta specs fill in domains not yet promoted
  const changesDir = join(openspecDir, 'changes');
  if (existsSync(changesDir)) {
    const files = await glob('*/specs/*/spec.md', { cwd: changesDir });
    for (const file of files) {
      const spec = parseSpec(join(changesDir, file));
      if (!specsByDomain.has(spec.domain)) {
        specsByDomain.set(spec.domain, spec);
      }
    }
  }

  return Array.from(specsByDomain.values());
}

/**
 * Discovers all active changes, capturing the delta-spec domains each change
 * introduces. `domains` is sorted alphabetically and is empty when the change
 * has no delta specs.
 */
export async function discoverChanges(openspecDir: string): Promise<ParsedChange[]> {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return [];
  }

  const changes: ParsedChange[] = [];
  const changeDirs = readdirSync(changesDir).filter(name => {
    const fullPath = join(changesDir, name);
    return statSync(fullPath).isDirectory();
  });

  for (const changeDir of changeDirs) {
    const changeFullPath = join(changesDir, changeDir);
    const proposalPath = join(changeFullPath, 'proposal.md');
    const tasksPath = join(changeFullPath, 'tasks.md');

    if (!existsSync(proposalPath)) continue;

    // Collect delta spec domain names for this change
    const deltaSpecsDir = join(changeFullPath, 'specs');
    let domains: string[] = [];
    if (existsSync(deltaSpecsDir)) {
      const specFiles = await glob('*/spec.md', { cwd: deltaSpecsDir });
      domains = specFiles.map(f => f.replace('/spec.md', '')).sort();
    }

    changes.push({
      proposal: parseProposal(proposalPath),
      tasks: parseTasks(tasksPath),
      domains,
    });
  }

  return changes;
}
