import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateAgent(spec, outputDir, options = {}) {
  const agentPath = join(outputDir, 'agents', `${spec.domain}.agent.md`);

  const skillDescription = generateSkillDescription(spec);

  const content = `---
name: ${spec.domain}
description: Implements ${spec.domain} features following specifications
tools: ['edit', 'search', 'terminal']
---
# ${spec.domain} Agent

You implement ${spec.domain} features following the specification.

## Available Skills
- **#${spec.domain}** — ${skillDescription}

## Workflow
1. Read the #${spec.domain} skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
`;

  if (options.dryRun) {
    return { path: agentPath, content };
  }

  ensureDir(agentPath);
  writeFileSync(agentPath, content);
  return { path: agentPath, content };
}

function generateSkillDescription(spec) {
  if (spec.requirements.length === 0) {
    return `${spec.title} requirements and acceptance criteria`;
  }

  const reqNames = spec.requirements
    .slice(0, 3)
    .map(r => r.name.toLowerCase())
    .join(', ');

  return `${spec.title} - ${reqNames}`;
}
