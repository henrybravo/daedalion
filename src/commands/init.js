import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { VERSION } from '../version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function init(cwd, options = {}) {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION}`));
  console.log();

  const templatesDir = join(__dirname, '../../templates/init');
  const files = getAllFiles(templatesDir);
  const { agentTarget } = options;

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const relativePath = relative(templatesDir, file);
    const targetPath = join(cwd, relativePath);

    if (existsSync(targetPath)) {
      console.log(chalk.yellow(`  ⚠ ${relativePath} already exists, skipping`));
      skipped++;
      continue;
    }

    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(file, targetPath);
    console.log(chalk.green(`  ✓ ${relativePath}`));
    created++;
  }

  if (agentTarget === 'sdk') {
    const configPath = join(cwd, 'daedalion.yaml');
    if (existsSync(configPath)) {
      let config = readFileSync(configPath, 'utf-8');
      config = config.replace(/agents:\s*\n\s*target:\s*ide/, 'agents:\n  target: sdk');
      writeFileSync(configPath, config);
      console.log(chalk.cyan(`  ✓ Updated daedalion.yaml with SDK target`));
    }
  }

  console.log();
  if (created > 0) {
    console.log(chalk.green(`  Done. ${created} files created.`));
  }
  if (skipped > 0) {
    console.log(chalk.yellow(`  ${skipped} files skipped (already exist).`));
  }

  if (agentTarget === 'sdk') {
    console.log();
    console.log(chalk.cyan(`  Agent target set to SDK (for CI pipelines)`));
    console.log(chalk.gray(`  Edit daedalion.yaml to add custom tool names under agents.tools`));
  }

  console.log();
  console.log('  Next steps:');
  console.log('    1. Edit openspec/specs/example/spec.md with your specifications');
  console.log('    2. Run `daedalion build` to generate GitHub Copilot artifacts');
  console.log();
}

function getAllFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
