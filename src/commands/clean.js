import { existsSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { loadConfig, resolveOutputPath } from '../config.js';

const MANIFEST_FILENAME = '.daedalion-manifest.json';

export async function clean(cwd) {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION} - Clean`));
  console.log();

  const config = loadConfig(cwd);
  const outputDir = resolveOutputPath(cwd, config);

  if (!existsSync(outputDir)) {
    console.log(chalk.yellow('  No output directory found. Nothing to clean.'));
    console.log();
    return;
  }

  const manifestPath = join(outputDir, MANIFEST_FILENAME);

  if (!existsSync(manifestPath)) {
    console.log(chalk.yellow('  No manifest found. Run `daedalion build` first to generate a manifest.'));
    console.log(chalk.gray('  (Clean requires a manifest to avoid deleting non-Daedalion files)'));
    console.log();
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const filesToRemove = manifest.files || [];

  let removed = 0;
  const cleanedDirs = new Set();

  for (const relativePath of filesToRemove) {
    const fullPath = join(cwd, relativePath);

    if (existsSync(fullPath)) {
      rmSync(fullPath, { force: true });
      console.log(chalk.green(`  ✓ Removed ${relativePath}`));
      removed++;

      // Track parent directories for cleanup
      cleanedDirs.add(dirname(fullPath));
    }
  }

  // Remove the manifest itself
  rmSync(manifestPath, { force: true });
  console.log(chalk.green(`  ✓ Removed .github/${MANIFEST_FILENAME}`));

  // Clean up empty directories (skills/domain/, agents/, etc.)
  for (const dir of cleanedDirs) {
    cleanEmptyDirs(dir, outputDir);
  }

  console.log();
  if (removed > 0) {
    console.log(chalk.green(`  Done. ${removed} files removed.`));
  } else {
    console.log(chalk.yellow('  No generated files found to clean.'));
  }
  console.log();
}

// Recursively remove empty directories up to (but not including) the output dir
function cleanEmptyDirs(dir, stopAt) {
  if (dir === stopAt || !existsSync(dir)) {
    return;
  }

  try {
    const contents = readdirSync(dir);
    if (contents.length === 0) {
      rmSync(dir, { recursive: true, force: true });
      // Check parent directory too
      cleanEmptyDirs(dirname(dir), stopAt);
    }
  } catch {
    // Directory might have been removed already
  }
}
