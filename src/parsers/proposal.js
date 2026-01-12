import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import matter from 'gray-matter';

export function parseProposal(proposalPath) {
  const content = readFileSync(proposalPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const changeName = basename(dirname(proposalPath));
  const title = extractTitle(body);
  const why = extractSection(body, 'Why');
  const what = extractSection(body, 'What');

  return {
    path: proposalPath,
    changeName,
    title,
    frontmatter,
    why,
    what
  };
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled Proposal';
}

function extractSection(content, sectionName) {
  const lines = content.split('\n');
  let inSection = false;
  let sectionContent = [];

  for (const line of lines) {
    // Match ## Why or ## What (case insensitive)
    const sectionMatch = line.match(/^##\s+(.+)$/);
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
