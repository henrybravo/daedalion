import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

export function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function extractFirstHeading(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

export function extractDescription(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let description = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
      inFrontmatter = true;
      continue;
    }

    if (inFrontmatter) continue;

    if (line.startsWith('#')) continue;

    if (line.trim() && !line.startsWith('##')) {
      description.push(line.trim());
      if (description.length >= 2) break;
    }

    if (line.startsWith('##')) break;
  }

  return description.join(' ').slice(0, 200) || null;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
