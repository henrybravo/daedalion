import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

// Read version from package.json
const pkg: { version: string } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
export const VERSION: string = pkg.version;

export function getVersionString(): string {
  const commitHash: string | null = getCommitHash();
  if (commitHash && !isReleaseBuild()) {
    return `${VERSION}-dev+${commitHash}`;
  }
  return VERSION;
}

function getCommitHash(): string | null {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true
    }).trim();
  } catch {
    return null;
  }
}

function isReleaseBuild(): boolean {
  if (__dirname.includes('node_modules')) {
    return true;
  }

  try {
    execSync('git describe --exact-match --tags HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true
    });
    return true;
  } catch {
    return false;
  }
}
