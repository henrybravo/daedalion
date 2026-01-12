import { describe, it, expect } from 'vitest';
import { VERSION, getVersionString } from '../src/version.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('version', () => {
  it('exports VERSION from package.json', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    expect(VERSION).toBe(pkg.version);
  });

  it('VERSION matches semver format', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('getVersionString returns a string', () => {
    const versionStr = getVersionString();
    expect(typeof versionStr).toBe('string');
    expect(versionStr.length).toBeGreaterThan(0);
  });

  it('getVersionString includes base version', () => {
    const versionStr = getVersionString();
    expect(versionStr).toContain(VERSION.split('-')[0].split('.')[0]); // major version
  });

  it('getVersionString returns dev format in dev environment', () => {
    const versionStr = getVersionString();
    // In dev environment (not in node_modules and not tagged), should include commit hash
    // Format: "0.0.1-dev+abc1234" or just "0.0.1" if tagged/released
    if (versionStr.includes('-dev+')) {
      expect(versionStr).toMatch(/^\d+\.\d+\.\d+-dev\+[a-f0-9]+$/);
    } else {
      expect(versionStr).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
