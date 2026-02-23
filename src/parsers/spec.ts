import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import matter from 'gray-matter';
import { Spec, Requirement, Scenario } from '../types.js';

export function parseSpec(specPath: string): Spec {
  const content: string = readFileSync(specPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const domain: string = basename(dirname(specPath));
  const title: string = extractTitle(body);
  const requirements: Requirement[] = extractRequirements(body);

  return {
    path: specPath,
    domain,
    title,
    frontmatter: frontmatter as Record<string, unknown>,
    requirements
  };
}

function extractTitle(content: string): string {
  const match: RegExpMatchArray | null = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled Specification';
}

function extractRequirements(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines: string[] = content.split('\n');

  let currentRequirement: Requirement | null = null;
  let currentScenario: Scenario | null = null;
  let inRequirementDescription: boolean = false;

  for (let i = 0; i < lines.length; i++) {
    const line: string = lines[i];

    const reqMatch: RegExpMatchArray | null = line.match(/^###\s+Requirement:\s*(.+)$/i);
    if (reqMatch) {
      if (currentRequirement) {
        if (currentScenario) {
          currentRequirement.scenarios.push(currentScenario);
        }
        requirements.push(currentRequirement);
      }
      currentRequirement = {
        name: reqMatch[1].trim(),
        description: '',
        scenarios: []
      };
      currentScenario = null;
      inRequirementDescription = true;
      continue;
    }

    const scenarioMatch: RegExpMatchArray | null = line.match(/^####\s+Scenario:\s*(.+)$/i);
    if (scenarioMatch && currentRequirement) {
      if (currentScenario) {
        currentRequirement.scenarios.push(currentScenario);
      }
      currentScenario = {
        name: scenarioMatch[1].trim(),
        steps: []
      };
      inRequirementDescription = false;
      continue;
    }

    if (line.match(/^#{1,4}\s+/)) {
      inRequirementDescription = false;
      continue;
    }

    if (inRequirementDescription && currentRequirement && line.trim()) {
      if (currentRequirement.description) {
        currentRequirement.description += ' ' + line.trim();
      } else {
        currentRequirement.description = line.trim();
      }
      continue;
    }

    if (currentScenario && line.match(/^\s*-\s+/)) {
      const step: string = line.replace(/^\s*-\s+/, '').trim();
      if (step) {
        currentScenario.steps.push(step);
      }
    }
  }

  if (currentRequirement) {
    if (currentScenario) {
      currentRequirement.scenarios.push(currentScenario);
    }
    requirements.push(currentRequirement);
  }

  return requirements;
}
