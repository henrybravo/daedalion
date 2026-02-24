import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { GeneratedFile, BuildOptions, Spec, Requirement } from '../types.js';

export function generatePatternInstructions(
  spec: Spec,
  outputDir: string,
  options: BuildOptions = {},
): GeneratedFile {
  const instructionsPath = join(outputDir, 'instructions', `${spec.domain}.instructions.md`);

  const requirementsSummary = spec.requirements
    .slice(0, 5)
    .map((r: Requirement) => `- **${r.name}**: ${r.description}`)
    .join('\n');

  const content = `---
applyTo: "**"
---
# ${spec.title}

Domain: \`${spec.domain}\` · Skill: \`#${spec.domain}\`

## Requirements

${requirementsSummary || `See \`.github/skills/${spec.domain}/SKILL.md\` for full requirements.`}
`;

  if (options.dryRun) {
    return { path: instructionsPath, content };
  }

  ensureDir(instructionsPath);
  writeFileSync(instructionsPath, content);
  return { path: instructionsPath, content };
}
