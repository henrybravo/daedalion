import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { loadConfig, resolveOpenspecPath, resolveOutputPath } from '../config.js';
import { discoverSpecs } from '../discovery.js';
import { parseProposal } from '../parsers/proposal.js';
import type { Spec, ValidationError, ChangeReference, Manifest } from '../types.js';

const MANIFEST_FILENAME = '.daedalion-manifest.json';

export async function validate(cwd: string): Promise<boolean> {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION} - Validate`));
  console.log();

  const config = loadConfig(cwd);
  const openspecDir = resolveOpenspecPath(cwd, config);
  const outputDir = resolveOutputPath(cwd, config);

  const errors: ValidationError[] = [];

  const specs = await discoverSpecs(openspecDir);
  const changes = await findAndParseChanges(openspecDir);

  // Rule 1: Every spec has ≥1 requirement
  for (const spec of specs) {
    if (spec.requirements.length === 0) {
      errors.push({
        rule: 'spec-has-requirements',
        message: `Spec "${spec.path}" has no requirements.\n       Add at least one "### Requirement:" section.`
      });
    }
  }

  // Rule 2: Every requirement has ≥1 scenario
  for (const spec of specs) {
    for (const req of spec.requirements) {
      if (req.scenarios.length === 0) {
        errors.push({
          rule: 'requirement-has-scenarios',
          message: `Requirement "${req.name}" in ${spec.domain} lacks scenarios.\n       Add at least one "#### Scenario:" section.`
        });
      }
    }
  }

  // Rule 3: Generated skill exists for each spec
  for (const spec of specs) {
    const skillPath = join(outputDir, 'skills', spec.domain, 'SKILL.md');
    if (!existsSync(skillPath)) {
      errors.push({
        rule: 'skill-exists-for-spec',
        message: `Missing skill for spec ${spec.domain}.\n       Run 'daedalion build' to generate.`
      });
    }
  }

  // Rule 4: Generated prompt exists for each active change
  for (const change of changes) {
    const promptPath = join(outputDir, 'prompts', `${change.changeName}.prompt.md`);
    if (!existsSync(promptPath)) {
      errors.push({
        rule: 'prompt-exists-for-change',
        message: `Missing prompt for change ${change.changeName}.\n       Run 'daedalion build' to generate.`
      });
    }
  }

  // Rule 5: No orphaned skills (manifest-scoped)
  // Only checks skills Daedalion generated. Hand-maintained skills are not Daedalion's concern.
  // Skips entirely when no manifest exists (build has never been run).
  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  if (existsSync(manifestPath)) {
    const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const manifestSkillDomains = manifest.files
      .filter(f => f.includes('/skills/') && f.endsWith('/SKILL.md'))
      .map(f => {
        const parts = f.split('/');
        return parts[parts.indexOf('skills') + 1];
      });

    for (const domain of manifestSkillDomains) {
      const hasSpec = specs.some((s: Spec) => s.domain === domain);
      if (!hasSpec) {
        errors.push({
          rule: 'no-orphan-skills',
          message: `Orphan skill: ${domain} has no source spec.\n       Run 'daedalion build' again or add openspec/specs/${domain}/spec.md`
        });
      }
    }
  }

  if (errors.length === 0) {
    console.log(chalk.green('  ✓ All validations passed'));
    console.log();
    return true;
  }

  console.log(chalk.red(`  ✗ ${errors.length} validation error(s) found:`));
  console.log();

  for (const error of errors) {
    console.log(chalk.red(`  Error: ${error.message}`));
    console.log();
  }

  return false;
}

async function findAndParseChanges(openspecDir: string): Promise<ChangeReference[]> {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return [];
  }

  const changes: ChangeReference[] = [];
  const changeDirs = readdirSync(changesDir).filter((name: string) => {
    const fullPath = join(changesDir, name);
    return statSync(fullPath).isDirectory();
  });

  for (const changeDir of changeDirs) {
    const proposalPath = join(changesDir, changeDir, 'proposal.md');

    if (existsSync(proposalPath)) {
      const proposal = parseProposal(proposalPath);
      changes.push({
        changeName: proposal.changeName,
        path: proposalPath
      });
    }
  }

  return changes;
}
