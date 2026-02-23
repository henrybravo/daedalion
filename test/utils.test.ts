import { describe, it, expect } from 'vitest';
import { join, relative } from 'path';
import { ensureDir, extractFirstHeading, extractDescription, slugify } from '../src/utils.js';
import { mkdtemp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';

describe('utils', () => {
  describe('ensureDir', () => {
    it('creates parent directories for a file path', async () => {
      const tempDir: string = await mkdtemp(join(tmpdir(), 'daedalion-utils-test-'));
      try {
        const filePath: string = join(tempDir, 'a', 'b', 'c', 'file.txt');
        ensureDir(filePath);

        expect(existsSync(join(tempDir, 'a', 'b', 'c'))).toBe(true);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('extractFirstHeading', () => {
    it('extracts h1 heading', () => {
      const content: string = '# My Title\n\nSome content';
      expect(extractFirstHeading(content)).toBe('My Title');
    });

    it('returns null when no heading found', () => {
      const content: string = 'No heading here';
      expect(extractFirstHeading(content)).toBe(null);
    });

    it('handles heading with extra spaces', () => {
      const content: string = '#   Spaced Title  \n';
      expect(extractFirstHeading(content)).toBe('Spaced Title');
    });
  });

  describe('extractDescription', () => {
    it('extracts first paragraph after heading', () => {
      const content: string = '# Title\n\nThis is the description.\n\n## Next section';
      expect(extractDescription(content)).toContain('This is the description');
    });

    it('skips frontmatter', () => {
      const content: string = '---\ntitle: Test\n---\n# Title\n\nActual description';
      expect(extractDescription(content)).toContain('Actual description');
    });

    it('returns null for empty content', () => {
      const content: string = '# Title\n\n## Section';
      expect(extractDescription(content)).toBe(null);
    });
  });

  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('HelloWorld')).toBe('helloworld');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello@World!')).toBe('hello-world');
    });

    it('removes leading and trailing hyphens', () => {
      expect(slugify('--hello--')).toBe('hello');
    });

    it('handles multiple consecutive special chars', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });
  });
});

describe('path handling', () => {
  it('relative() works correctly for cross-platform paths', () => {
    const base: string = join('/project', 'templates', 'init');
    const file: string = join(base, 'openspec', 'project.md');

    const relativePath: string = relative(base, file);

    expect(relativePath).toBe(join('openspec', 'project.md'));
    expect(relativePath).not.toContain(base);
  });

  it('relative() handles nested directories correctly', () => {
    const cwd: string = join('/Users', 'test', 'myproject');
    const filePath: string = join(cwd, '.github', 'skills', 'auth', 'SKILL.md');

    const relativePath: string = relative(cwd, filePath);

    expect(relativePath).toBe(join('.github', 'skills', 'auth', 'SKILL.md'));
  });

  it('relative() returns empty string for same paths', () => {
    const path: string = join('/some', 'path');
    expect(relative(path, path)).toBe('');
  });
});
