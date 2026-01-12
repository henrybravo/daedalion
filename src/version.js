import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
export const VERSION = pkg.version;

/**
 * Get version string with commit hash for dev builds
 * @returns {string} e.g., "0.0.1" or "0.0.1-dev+abc1234"
 */
export function getVersionString() {
  const commitHash = getCommitHash();
  if (commitHash && !isReleaseBuild()) {
    return `${VERSION}-dev+${commitHash}`;
  }
  return VERSION;
}

/**
 * Get short commit hash
 * @returns {string|null}
 */
function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Check if this is a release build (tagged or npm published)
 * @returns {boolean}
 */
function isReleaseBuild() {
  // Check if running from node_modules (npm installed)
  if (__dirname.includes('node_modules')) {
    return true;
  }

  // Check if current commit is tagged
  try {
    execSync('git describe --exact-match --tags HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return true;
  } catch {
    return false;
  }
}
