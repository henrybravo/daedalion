import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

export interface CLIError extends Error {
  stderr: string;
  stdout: string;
}

export async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'daedalion-test-'));
}

export async function cleanTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export function runCLI(command: string, cwd: string): string {
  try {
    return execSync(`node ${join(__dirname, '../bin/daedalion.js')} ${command}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    } as ExecSyncOptionsWithStringEncoding);
  } catch (error: unknown) {
    const execError = error as { message: string; stderr?: string; stdout?: string };
    const err: CLIError = Object.assign(new Error(execError.message), {
      stderr: execError.stderr ?? '',
      stdout: execError.stdout ?? '',
    });
    throw err;
  }
}
