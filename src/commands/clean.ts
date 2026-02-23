import { existsSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { loadConfig, resolveOutputPath } from '../config.js';
import type { Manifest } from '../types.js';

const MANIFEST_FILENAME = '.daedalion-manifest.json';

/**
 * Validate that the parsed JSON conforms to the {@link Manifest} shape.
 * Throws a descriptive error when the structure is invalid.
 */
function validateManifest(data: unknown): Manifest {
  if (
    typeof data !== 'object' ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error('Manifest is not a valid JSON object.');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') {
    throw new Error(
      `Manifest "version" must be a number, got ${typeof obj.version}.`,
    );
  }

  if (!Array.isArray(obj.files)) {
    throw new Error('Manifest "files" must be an array.');
  }

  for (const entry of obj.files) {
    if (typeof entry !== 'string') {
      throw new Error(
        `Every entry in manifest "files" must be a string, got ${typeof entry}.`,
      );
    }
  }

  return obj as unknown as Manifest;
}

/**
 * Return `true` when `target` is safely contained inside `base`.
 * Prevents path-traversal attacks that could delete files outside the output
 * directory.
 */
function isSafePath(base: string, target: string): boolean {
  const resolved = resolve(target);
  const rel = relative(base, resolved);
  return !rel.startsWith('..') && !resolve(base, rel).startsWith('..');
}

export async function clean(cwd: string): Promise<void> {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION} - Clean`));
  console.log();

  const config = loadConfig(cwd);
  const outputDir: string = resolveOutputPath(cwd, config);

  if (!existsSync(outputDir)) {
    console.log(chalk.yellow('  No output directory found. Nothing to clean.'));
    console.log();
    return;
  }

  const manifestPath: string = join(outputDir, MANIFEST_FILENAME);

  if (!existsSync(manifestPath)) {
    console.log(chalk.yellow('  No manifest found. Run `daedalion build` first to generate a manifest.'));
    console.log(chalk.gray('  (Clean requires a manifest to avoid deleting non-Daedalion files)'));
    console.log();
    return;
  }

  const raw: unknown = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const manifest: Manifest = validateManifest(raw);
  const filesToRemove: string[] = manifest.files;

  let removed = 0;
  const cleanedDirs = new Set<string>();

  for (const relativePath of filesToRemove) {
    const fullPath: string = join(cwd, relativePath);

    if (!isSafePath(outputDir, fullPath)) {
      console.log(
        chalk.red(`  ✗ Skipped unsafe path: ${relativePath}`),
      );
      continue;
    }

    if (existsSync(fullPath)) {
      rmSync(fullPath, { force: true });
      console.log(chalk.green(`  ✓ Removed ${relativePath}`));
      removed++;

      cleanedDirs.add(dirname(fullPath));
    }
  }

  rmSync(manifestPath, { force: true });
  console.log(chalk.green(`  ✓ Removed .github/${MANIFEST_FILENAME}`));

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

function cleanEmptyDirs(dir: string, stopAt: string): void {
  if (dir === stopAt || !existsSync(dir)) {
    return;
  }

  try {
    const contents: string[] = readdirSync(dir);
    if (contents.length === 0) {
      rmSync(dir, { recursive: true, force: true });
      cleanEmptyDirs(dirname(dir), stopAt);
    }
  } catch {
    // Directory might have been removed already
  }
}
