import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import type { InitOptions } from '../types.js';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

export async function init(cwd: string, options: InitOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION}`));
  console.log();

  const templatesDir: string = join(__dirname, '../../templates/init');
  const files: string[] = getAllFiles(templatesDir);
  const { agentTarget, withExample } = options;

  let created: number = 0;
  let skipped: number = 0;

  for (const file of files) {
    const relativePath: string = relative(templatesDir, file);
    const targetPath: string = join(cwd, relativePath);

    if (!withExample && isExampleFile(relativePath)) {
      continue;
    }

    if (existsSync(targetPath)) {
      console.log(chalk.yellow(`  ⚠ ${relativePath} already exists, skipping`));
      skipped++;
      continue;
    }

    const dir: string = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(file, targetPath);
    console.log(chalk.green(`  ✓ ${relativePath}`));
    created++;
  }

  if (agentTarget === 'sdk') {
    const configPath: string = join(cwd, 'daedalion.yaml');
    if (existsSync(configPath)) {
      let config: string = readFileSync(configPath, 'utf-8');
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
  if (withExample) {
    console.log('    1. Edit openspec/specs/example/spec.md with your specifications');
    console.log('    2. Run `daedalion build` to generate GitHub Copilot artifacts');
  } else {
    console.log('    1. Run `daedalion build` to generate GitHub Copilot artifacts');
  }
  console.log();
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries: string[] = readdirSync(dir);

  for (const entry of entries) {
    const fullPath: string = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isExampleFile(relativePath: string): boolean {
  return relativePath.includes('specs/example/') || 
         relativePath.includes('specs\\example\\') ||
         relativePath.includes('changes/example-feature/') ||
         relativePath.includes('changes\\example-feature\\');
}
