import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { glob } from 'glob';
import { loadConfig, resolveOpenspecPath, resolveOutputPath } from '../config.js';
import { parseSpec } from '../parsers/spec.js';
import { parseProposal } from '../parsers/proposal.js';

export async function validate(cwd) {
  console.log();
  console.log(chalk.bold('  Daedalion v0.0.1 - Validate'));
  console.log();

  const config = loadConfig(cwd);
  const openspecDir = resolveOpenspecPath(cwd, config);
  const outputDir = resolveOutputPath(cwd, config);

  const errors = [];

  // Parse all specs
  const specs = await findAndParseSpecs(openspecDir);
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

  // Rule 5: No orphaned skills
  const skillsDir = join(outputDir, 'skills');
  if (existsSync(skillsDir)) {
    const skillDirs = readdirSync(skillsDir).filter(name => {
      const fullPath = join(skillsDir, name);
      return statSync(fullPath).isDirectory();
    });

    for (const skillName of skillDirs) {
      const hasSpec = specs.some(s => s.domain === skillName);
      if (!hasSpec) {
        errors.push({
          rule: 'no-orphan-skills',
          message: `Orphan skill: ${skillName} has no source spec.\n       Remove .github/skills/${skillName}/ or create openspec/specs/${skillName}/spec.md`
        });
      }
    }
  }

  // Output results
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

async function findAndParseSpecs(openspecDir) {
  const specsDir = join(openspecDir, 'specs');
  if (!existsSync(specsDir)) {
    return [];
  }

  const specFiles = await glob('*/spec.md', { cwd: specsDir });
  return specFiles.map(file => parseSpec(join(specsDir, file)));
}

async function findAndParseChanges(openspecDir) {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return [];
  }

  const changes = [];
  const changeDirs = readdirSync(changesDir).filter(name => {
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
