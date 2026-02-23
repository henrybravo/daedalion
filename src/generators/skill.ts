import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import type { GeneratedFile, BuildOptions, Spec, Requirement, TasksSummary } from '../types.js';

export function generateSkill(
  spec: Spec,
  tasks: TasksSummary | null,
  outputDir: string,
  options: BuildOptions = {},
): GeneratedFile {
  const skillDir = join(outputDir, 'skills', spec.domain);
  const skillPath = join(skillDir, 'SKILL.md');

  const description = generateDescription(spec);
  const keywords = extractKeywords(spec);

  const specFrontmatter: Record<string, unknown> =
    spec.frontmatter && typeof spec.frontmatter === 'object'
      ? spec.frontmatter
      : {};

  const frontmatter: Record<string, unknown> = {
    name: (specFrontmatter.name as string) || spec.domain,
    description:
      (specFrontmatter.description as string) ||
      `${description}. Use when working on ${keywords}.`,
    ...specFrontmatter,
  };

  const agentInstructions =
    typeof specFrontmatter.agent_instructions === 'string'
      ? specFrontmatter.agent_instructions
      : null;

  const frontmatterYaml = YAML.stringify(frontmatter).trimEnd();

  let content = `---
${frontmatterYaml}
---
`;

  if (agentInstructions && agentInstructions.trim()) {
    content += `# Agent Instructions

${agentInstructions.trimEnd()}

`;
  }

  content += `# ${spec.title}

## Requirements
${spec.requirements.map((r: Requirement) => `- **${r.name}**: ${r.description}`).join('\n')}

## Acceptance Criteria
${generateAcceptanceCriteria(spec.requirements)}`;

  if (tasks && tasks.items.length > 0) {
    content += `

## Active Tasks
${tasks.items.map((t: string) => `- ${t}`).join('\n')}
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

function generateDescription(spec: Spec): string {
  if (spec.requirements.length === 0) {
    return spec.title;
  }

  const firstReq = spec.requirements[0];
  const desc = firstReq.description || firstReq.name;
  return desc.slice(0, 100).replace(/\.$/, '');
}

function extractKeywords(spec: Spec): string {
  const words = new Set<string>();
  words.add(spec.domain);

  for (const req of spec.requirements) {
    const nameWords = req.name.toLowerCase().split(/\s+/);
    nameWords.forEach((w: string) => {
      if (w.length > 3) words.add(w);
    });
  }

  return Array.from(words).slice(0, 5).join(', ');
}

function generateAcceptanceCriteria(requirements: Requirement[]): string {
  const criteria: string[] = [];

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
