import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateAgent(spec, outputDir, options = {}, config = {}) {
  const agentPath = join(outputDir, 'agents', `${spec.domain}.agent.md`);

  const skillDescription = generateSkillDescription(spec);
  const agentConfig = config.agents || {};
  const target = agentConfig.target || 'ide';

  let tools;
  let workflow;

  if (target === 'sdk') {
    const specTools = extractTools(spec);
    tools = specTools.length > 0 ? specTools.map(t => t.name) : (agentConfig.tools || []);
    workflow = generateSDKWorkflow(spec, tools);
  } else {
    tools = ['edit', 'search', 'terminal'];
    workflow = generateIDEWorkflow(spec);
  }

  const toolsYaml = tools.length > 0
    ? `tools: [${tools.map(t => `'${t}'`).join(', ')}]`
    : '';

  const content = `---
name: ${spec.domain}
description: Implements ${spec.domain} features following specifications
${toolsYaml}
---
# ${spec.domain} Agent

${workflow}
`;

  if (options.dryRun) {
    return { path: agentPath, content };
  }

  ensureDir(agentPath);
  writeFileSync(agentPath, content);
  return { path: agentPath, content };
}

function extractTools(spec) {
  const tools = [];
  const frontmatter = spec.frontmatter || {};

  if (frontmatter.tools && Array.isArray(frontmatter.tools)) {
    for (const tool of frontmatter.tools) {
      if (typeof tool === 'string') {
        tools.push({ name: tool });
      } else if (tool.name) {
        tools.push(tool);
      }
    }
  }

  return tools;
}

function generateIDEWorkflow(spec) {
  const skillDescription = generateSkillDescription(spec);

  return `You implement ${spec.domain} features following the specification.

## Available Skills
- **#${spec.domain}** — ${skillDescription}

## Workflow
1. Read the #${spec.domain} skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
`;
}

function generateSDKWorkflow(spec, tools) {
  const skillDescription = generateSkillDescription(spec);

  if (tools.length === 0) {
    return `You implement ${spec.domain} features following the specification.

## Available Skills
- **#${spec.domain}** — ${skillDescription}

## Workflow
1. Read the #${spec.domain} skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
`;
  }

  return `You implement ${spec.domain} features following the specification.

## Available Skills
- **#${spec.domain}** — ${skillDescription}

## Available Tools
${tools.map(t => `- **${t}**` ).join('\n')}

## Workflow
1. Read the #${spec.domain} skill for requirements
2. Use available tools to implement following acceptance criteria
3. Verify all scenarios pass
`;
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
