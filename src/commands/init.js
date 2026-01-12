import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function init(cwd) {
  console.log();
  console.log(chalk.bold('  Daedalion v0.0.1'));
  console.log();

  const templatesDir = join(__dirname, '../../templates/init');
  const files = getAllFiles(templatesDir);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const relativePath = file.replace(templatesDir + '/', '');
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

  console.log();
  if (created > 0) {
    console.log(chalk.green(`  Done. ${created} files created.`));
  }
  if (skipped > 0) {
    console.log(chalk.yellow(`  ${skipped} files skipped (already exist).`));
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
