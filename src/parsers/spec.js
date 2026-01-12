import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import matter from 'gray-matter';

export function parseSpec(specPath) {
  const content = readFileSync(specPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const domain = basename(dirname(specPath));
  const title = extractTitle(body);
  const requirements = extractRequirements(body);

  return {
    path: specPath,
    domain,
    title,
    frontmatter,
    requirements
  };
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled Specification';
}

function extractRequirements(content) {
  const requirements = [];
  const lines = content.split('\n');

  let currentRequirement = null;
  let currentScenario = null;
  let inRequirementDescription = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match ### Requirement: Name
    const reqMatch = line.match(/^###\s+Requirement:\s*(.+)$/i);
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

    // Match #### Scenario: Name
    const scenarioMatch = line.match(/^####\s+Scenario:\s*(.+)$/i);
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

    // Stop description collection at any heading
    if (line.match(/^#{1,4}\s+/)) {
      inRequirementDescription = false;
      continue;
    }

    // Collect requirement description
    if (inRequirementDescription && currentRequirement && line.trim()) {
      if (currentRequirement.description) {
        currentRequirement.description += ' ' + line.trim();
      } else {
        currentRequirement.description = line.trim();
      }
      continue;
    }

    // Collect scenario steps (lines starting with -)
    if (currentScenario && line.match(/^\s*-\s+/)) {
      const step = line.replace(/^\s*-\s+/, '').trim();
      if (step) {
        currentScenario.steps.push(step);
      }
    }
  }

  // Push last requirement/scenario
  if (currentRequirement) {
    if (currentScenario) {
      currentRequirement.scenarios.push(currentScenario);
    }
    requirements.push(currentRequirement);
  }

  return requirements;
}
