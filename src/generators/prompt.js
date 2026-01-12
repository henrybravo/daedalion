import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function generatePrompt(proposal, tasks, domain, outputDir, options = {}) {
  const promptPath = join(outputDir, 'prompts', `${proposal.changeName}.prompt.md`);

  const content = `---
description: ${proposal.title}
agent: ${domain || 'default'}
---
Implement the ${proposal.changeName} change proposal.

## Context
${proposal.why || 'No context provided.'}

## Scope
${proposal.what || 'No scope defined.'}

## Reference
- Proposal: openspec/changes/${proposal.changeName}/proposal.md
- Tasks: openspec/changes/${proposal.changeName}/tasks.md

## Skills
- #${domain || 'default'}
${tasks && tasks.items.length > 0 ? `
## Tasks
${tasks.items.map(t => `- [ ] ${t}`).join('\n')}
${tasks.hasMore ? `\n> See full list in tasks.md` : ''}` : ''}
`;

  if (options.dryRun) {
    return { path: promptPath, content };
  }

  ensureDir(promptPath);
  writeFileSync(promptPath, content);
  return { path: promptPath, content };
}
