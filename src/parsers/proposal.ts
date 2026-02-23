import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import matter from 'gray-matter';
import { Proposal } from '../types.js';

export function parseProposal(proposalPath: string): Proposal {
  const content: string = readFileSync(proposalPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const changeName: string = basename(dirname(proposalPath));
  const title: string = extractTitle(body);
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

function extractTitle(content: string): string {
  const match: RegExpMatchArray | null = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled Proposal';
}

function extractSection(content: string, sectionName: string): string | null {
  const lines: string[] = content.split('\n');
  let inSection = false;
  const sectionContent: string[] = [];

  for (const line of lines) {
    const sectionMatch: RegExpMatchArray | null = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (sectionMatch[1].toLowerCase() === sectionName.toLowerCase()) {
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
