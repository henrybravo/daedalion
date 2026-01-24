import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { ensureDir } from '../utils.js';

export function generateTools(spec, outputDir, config = {}, options = {}) {
  const tools = extractTools(spec);
  const language = config.tools?.language || 'python';
  const generated = [];

  for (const tool of tools) {
    const stubResult = generateToolStub(tool, spec, outputDir, language, options);
    generated.push(stubResult);
  }

  return generated;
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

function generateToolStub(tool, spec, outputDir, language, options) {
  const toolsDir = join(outputDir, 'tools');
  const ext = getLanguageExt(language);
  const toolPath = join(toolsDir, `${tool.name.toLowerCase()}${ext}`);

  if (language === 'python') {
    return generatePythonStub(tool, spec, toolPath, options);
  } else if (language === 'javascript') {
    return generateJavaScriptStub(tool, spec, toolPath, options);
  }
}

function generatePythonStub(tool, spec, filePath, options) {
  const requirementRefs = findRequirementRefs(spec, tool);
  const description = tool.description || `Tool: ${tool.name}`;

  let content = `"""
${description}
Implements: ${requirementRefs.join(', ')}
"""

`;

  content += `def ${tool.name}(${generatePythonSignature(tool)}) -> ${generatePythonReturnType(tool)}:\n`;
  content += `    """
    ${tool.description || 'TODO: Add description'}
    \n`;

  if (tool.inputs && tool.inputs.length > 0) {
    content += `    Args:\n`;
    for (const input of tool.inputs) {
      content += `        ${input.name}: ${input.type || 'Any'} - ${input.description || 'TODO'}\n`;
    }
  }

  if (tool.outputs && tool.outputs.length > 0) {
    content += `    \n    Returns:\n`;
    content += `        ${tool.outputs.join(', ') || 'dict'}\n`;
  }

  if (requirementRefs.length > 0) {
    content += `    \n    Spec References:\n`;
    for (const ref of requirementRefs) {
      content += `        - ${ref}\n`;
    }
  }

  content += `    """\n`;
  content += `    raise NotImplementedError("Implement ${tool.name} logic")\n`;

  if (options.dryRun) {
    return { path: filePath, content };
  }

  ensureDir(filePath);
  writeFileSync(filePath, content, 'utf-8');
  return { path: filePath, content };
}

function generateJavaScriptStub(tool, spec, filePath, options) {
  const requirementRefs = findRequirementRefs(spec, tool);
  const description = tool.description || `Tool: ${tool.name}`;

  let content = `/**
 * ${description}
 * Implements: ${requirementRefs.join(', ')}
 */

`;

  content += `/**
 * ${tool.description || 'TODO: Add description'}
 *\n`;

  if (tool.inputs && tool.inputs.length > 0) {
    content += ` * @param {Object} params\n`;
    for (const input of tool.inputs) {
      content += ` * @param {${input.type || '*'}} ${input.name} - ${input.description || 'TODO'}\n`;
    }
  }

  if (tool.outputs && tool.outputs.length > 0) {
    content += ` * @returns {${tool.outputs[0] || 'Object'}}\n`;
  }

  if (requirementRefs.length > 0) {
    content += ` *\n * Spec References:\n`;
    for (const ref of requirementRefs) {
      content += ` * - ${ref}\n`;
    }
  }

  content += ` */\n`;
  content += `export async function ${camelCase(tool.name)}(${generateJSSignature(tool)}) {\n`;
  content += `    throw new Error('Implement ${tool.name} logic');\n`;
  content += `}\n`;

  if (options.dryRun) {
    return { path: filePath, content };
  }

  ensureDir(filePath);
  writeFileSync(filePath, content, 'utf-8');
  return { path: filePath, content };
}

function findRequirementRefs(spec, tool) {
  const refs = [];

  for (let i = 0; i < spec.requirements.length; i++) {
    const req = spec.requirements[i];
    const reqId = `REQ-${String(i + 1).padStart(3, '0')}`;
    refs.push(`${reqId}: ${req.name}`);
  }

  return refs;
}

function generatePythonSignature(tool) {
  if (!tool.inputs || tool.inputs.length === 0) {
    return '';
  }

  return tool.inputs.map(input => `${input.name}: ${input.type || 'dict'}`).join(', ');
}

function generatePythonReturnType(tool) {
  if (!tool.outputs || tool.outputs.length === 0) {
    return 'dict';
  }

  return tool.outputs[0] || 'dict';
}

function generateJSSignature(tool) {
  if (!tool.inputs || tool.inputs.length === 0) {
    return '{}';
  }

  return `{ ${tool.inputs.map(input => `${input.name}`).join(', ')} }`;
}

function getLanguageExt(language) {
  const exts = { python: '.py', javascript: '.js' };
  return exts[language] || '.py';
}

function camelCase(str) {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}