import { describe, it, expect } from 'vitest';
import { VERSION, getVersionString } from '../src/version.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

describe('version', () => {
  it('exports VERSION from package.json', () => {
    const pkg: { version: string } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    expect(VERSION).toBe(pkg.version);
  });

  it('VERSION matches semver format', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('getVersionString returns a string', () => {
    const versionStr: string = getVersionString();
    expect(typeof versionStr).toBe('string');
    expect(versionStr.length).toBeGreaterThan(0);
  });

  it('getVersionString includes base version', () => {
    const versionStr: string = getVersionString();
    expect(versionStr).toContain(VERSION.split('-')[0].split('.')[0]);
  });

  it('getVersionString returns dev format in dev environment', () => {
    const versionStr: string = getVersionString();
    if (versionStr.includes('-dev+')) {
      expect(versionStr).toMatch(/^\d+\.\d+\.\d+-dev\+[a-f0-9]+$/);
    } else {
      expect(versionStr).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
