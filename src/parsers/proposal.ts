import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import matter from 'gray-matter';
import { Proposal } from '../types.js';

export function parseProposal(proposalPath: string): Proposal {
  const content: string = readFileSync(proposalPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const changeName: string = basename(dirname(proposalPath));
  const title: string = extractTitle(body) ?? toTitleCase(changeName);
  const why: string | null = extractSection(body, 'Why');
  const what: string | null = extractSection(body, 'What');

  return {
    path: proposalPath,
    changeName,
    title,
    frontmatter: frontmatter as Record<string, unknown>,
    why,
    what
  };
}

function extractTitle(content: string): string | null {
  const match: RegExpMatchArray | null = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function toTitleCase(kebab: string): string {
  return kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractSection(content: string, sectionName: string): string | null {
  const lines: string[] = content.split(/\r?\n/);
  let inSection = false;
  const sectionContent: string[] = [];

  for (const line of lines) {
    const sectionMatch: RegExpMatchArray | null = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const heading = sectionMatch[1].toLowerCase();
      const name = sectionName.toLowerCase();
      if (heading === name || heading.startsWith(name + ' ') || heading.startsWith(name + ':')) {
        inSection = true;
        continue;
      } else if (inSection) {
        break;
      }
    }

    if (inSection && line.trim()) {
      sectionContent.push(line.trim());
    }
  }

  return sectionContent.join('\n') || null;
}
