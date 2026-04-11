import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { GeneratedFile, BuildOptions, Spec, Requirement } from '../types.js';

export function generatePatternInstructions(
  spec: Spec,
  outputDir: string,
  options: BuildOptions = {},
): GeneratedFile | null {
  const raw = spec.frontmatter?.file_pattern;
  const filePattern = typeof raw === 'string' && raw.length > 0 ? raw : null;
  if (!filePattern) return null;

  const instructionsPath = join(outputDir, 'instructions', `${spec.domain}.instructions.md`);

  const requirementsSummary = spec.requirements
    .slice(0, 5)
    .map((r: Requirement) => `- **${r.name}**: ${r.description}`)
    .join('\n');

  const content = `---\napplyTo: "${filePattern}"\n---\n# ${spec.title}\n\nDomain: \`${spec.domain}\` · Skill: \`#${spec.domain}\`\n\n## Requirements\n\n${requirementsSummary || `See \`.github/skills/${spec.domain}/SKILL.md\` for full requirements.`}\n`;

  if (options.dryRun) {
    return { path: instructionsPath, content };
  }

  ensureDir(instructionsPath);
  writeFileSync(instructionsPath, content);
  return { path: instructionsPath, content };
}
