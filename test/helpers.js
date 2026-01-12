import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createTempDir() {
  return mkdtemp(join(tmpdir(), 'daedalion-test-'));
}

export async function cleanTempDir(dir) {
  await rm(dir, { recursive: true, force: true });
}

export function runCLI(command, cwd) {
  try {
    return execSync(`node ${join(__dirname, '../bin/daedalion.js')} ${command}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    // If the command fails, throw an error with stderr info
    const err = new Error(error.message);
    err.stderr = error.stderr;
    err.stdout = error.stdout;
    throw err;
  }
}
