import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import type { GeneratedFile, BuildOptions, Spec, Requirement, Scenario, TasksSummary } from '../types.js';

export function generateSkill(
  spec: Spec,
  tasks: TasksSummary | null,
  outputDir: string,
  options: BuildOptions = {},
): GeneratedFile[] {
  const skillDir = join(outputDir, 'skills', spec.domain);
  const skillPath = join(skillDir, 'SKILL.md');

  const description = generateDescription(spec);

  const specFrontmatter: Record<string, unknown> =
    spec.frontmatter && typeof spec.frontmatter === 'object'
      ? spec.frontmatter
      : {};

  const frontmatter: Record<string, unknown> = {
    name: (specFrontmatter.name as string) || spec.domain,
    description: (specFrontmatter.description as string) || description,
    ...specFrontmatter,
  };

  const agentInstructions =
    typeof specFrontmatter.agent_instructions === 'string'
      ? specFrontmatter.agent_instructions
      : null;

  const frontmatterYaml = YAML.stringify(frontmatter, null, { lineWidth: 0 }).trimEnd();

  // Determine which requirements get spoke files
  const requirementsWithScenarios = spec.requirements.filter(
    (r: Requirement) => r.scenarios.length > 0
  );

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
`;

  if (requirementsWithScenarios.length > 0) {
    content += requirementsWithScenarios
      .map((r: Requirement) => `- [${r.name}](./${toSlug(r.name)}.md)`)
      .join('\n');
  } else {
    content += '_No scenarios defined._';
  }

  if (tasks && tasks.items.length > 0) {
    content += `

## Active Tasks
${tasks.items.map((t: string) => `- ${t}`).join('\n')}
${tasks.hasMore ? `\n> Full task list: openspec/changes/*/tasks.md` : ''}`;
  }

  content += '\n';

  const results: GeneratedFile[] = [];

  if (!options.dryRun) {
    ensureDir(skillPath);
    writeFileSync(skillPath, content);
  }
  results.push({ path: skillPath, content });

  // Generate one spoke file per requirement that has scenarios
  for (const req of requirementsWithScenarios) {
    const spokePath = join(skillDir, `${toSlug(req.name)}.md`);
    const spokeContent = generateSpoke(req);

    if (!options.dryRun) {
      ensureDir(spokePath);
      writeFileSync(spokePath, spokeContent);
    }
    results.push({ path: spokePath, content: spokeContent });
  }

  return results;
}

function generateDescription(spec: Spec): string {
  const domain = spec.domain;
  if (spec.requirements.length === 0) {
    return `Use when working on ${domain}`.slice(0, 60);
  }
  const reqName = spec.requirements[0].name;
  return `Use when working on ${domain} - ${reqName}`.slice(0, 60);
}

function generateSpoke(req: Requirement): string {
  const lines: string[] = [`# ${req.name}`, ''];

  for (const scenario of req.scenarios) {
    lines.push(`### ${scenario.name}`);
    for (const step of (scenario as Scenario).steps) {
      lines.push(`- ${step}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** "User Greeting" → "user-greeting" */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
