import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateSkill(spec, tasks, outputDir, options = {}) {
  const skillDir = join(outputDir, 'skills', spec.domain);
  const skillPath = join(skillDir, 'SKILL.md');

  const description = generateDescription(spec);
  const keywords = extractKeywords(spec);

  let content = `---
name: ${spec.domain}
description: ${description}. Use when working on ${keywords}.
---
# ${spec.title}

## Requirements
${spec.requirements.map(r => `- **${r.name}**: ${r.description}`).join('\n')}

## Acceptance Criteria
${generateAcceptanceCriteria(spec.requirements)}`;

  if (tasks && tasks.items.length > 0) {
    content += `

## Active Tasks
${tasks.items.map(t => `- ${t}`).join('\n')}
${tasks.hasMore ? `\n> Full task list: openspec/changes/*/tasks.md` : ''}`;
  }

  content += '\n';

  if (options.dryRun) {
    return { path: skillPath, content };
  }

  ensureDir(skillPath);
  writeFileSync(skillPath, content);
  return { path: skillPath, content };
}

function generateDescription(spec) {
  if (spec.requirements.length === 0) {
    return spec.title;
  }

  const firstReq = spec.requirements[0];
  const desc = firstReq.description || firstReq.name;
  return desc.slice(0, 100).replace(/\.$/, '');
}

function extractKeywords(spec) {
  const words = new Set();
  words.add(spec.domain);

  for (const req of spec.requirements) {
    const nameWords = req.name.toLowerCase().split(/\s+/);
    nameWords.forEach(w => {
      if (w.length > 3) words.add(w);
    });
  }

  return Array.from(words).slice(0, 5).join(', ');
}

function generateAcceptanceCriteria(requirements) {
  const criteria = [];

  for (const req of requirements) {
    for (const scenario of req.scenarios) {
      criteria.push(`### ${scenario.name}`);
      for (const step of scenario.steps) {
        criteria.push(`- ${step}`);
      }
      criteria.push('');
    }
  }

  return criteria.join('\n').trim();
}
