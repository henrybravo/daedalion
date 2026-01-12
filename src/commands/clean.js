import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { loadConfig, resolveOutputPath } from '../config.js';

// Directories/files that Daedalion generates
const GENERATED_PATHS = [
  'skills',
  'agents',
  'prompts',
  'workflows/daedalion.yml',
  'copilot-instructions.md'
];

export async function clean(cwd) {
  console.log();
  console.log(chalk.bold('  Daedalion v0.0.1 - Clean'));
  console.log();

  const config = loadConfig(cwd);
  const outputDir = resolveOutputPath(cwd, config);

  if (!existsSync(outputDir)) {
    console.log(chalk.yellow('  No output directory found. Nothing to clean.'));
    console.log();
    return;
  }

  let removed = 0;

  for (const path of GENERATED_PATHS) {
    const fullPath = join(outputDir, path);

    if (existsSync(fullPath)) {
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        rmSync(fullPath, { recursive: true, force: true });
        console.log(chalk.green(`  ✓ Removed ${path}/`));
      } else {
        rmSync(fullPath, { force: true });
        console.log(chalk.green(`  ✓ Removed ${path}`));
      }
      removed++;
    }
  }

  // Clean up empty workflows directory if daedalion.yml was the only file
  const workflowsDir = join(outputDir, 'workflows');
  if (existsSync(workflowsDir)) {
    const remaining = readdirSync(workflowsDir);
    if (remaining.length === 0) {
      rmSync(workflowsDir, { recursive: true, force: true });
    }
  }

  console.log();
  if (removed > 0) {
    console.log(chalk.green(`  Done. ${removed} items removed.`));
  } else {
    console.log(chalk.yellow('  No generated files found to clean.'));
  }
  console.log();
}
