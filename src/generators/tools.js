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

function mapPythonType(type) {
  const typeMap = {
    'string': 'str',
    'String': 'str',
    'number': 'int | float',
    'Number': 'int | float',
    'object': 'dict',
    'Object': 'dict',
    'array': 'Array',
    'Array': 'Array',
    'boolean': 'bool',
    'Boolean': 'bool'
  };

  if (typeof type !== 'string') {
    return 'Any';
  }

  return typeMap[type] || type || 'Any';
}

function getAllRequirementIds(spec) {
  return spec.requirements.map((req, i) => ({
    id: `REQ-${String(i + 1).padStart(3, '0')}`,
    name: req.name
  }));
}

function filterRelevantRequirements(spec, tool) {
  if (!tool.requirements || !Array.isArray(tool.requirements)) {
    return getAllRequirementIds(spec).slice(0, 2);
  }

  const allReqs = getAllRequirementIds(spec);
  const toolReqIds = tool.requirements.map(r => {
    if (typeof r === 'string' && r.startsWith('REQ-')) {
      return r;
    }
    const idx = parseInt(r) || 1;
    return `REQ-${String(idx).padStart(3, '0')}`;
  });

  return allReqs.filter(req => toolReqIds.includes(req.id));
}

function generatePythonStub(tool, spec, filePath, options) {
  const toolReqs = filterRelevantRequirements(spec, tool);
  const toolReqIds = toolReqs.map(r => r.id);

  let content = `"""
${tool.description || tool.name}
Requirements: ${toolReqIds.join(', ') || 'TODO'}
"""

`;

  content += `def ${tool.name}(${generatePythonSignature(tool)}) -> ${mapPythonType(tool.outputs?.[0] || 'dict')}:\n`;
  content += `    """
    ${tool.description || 'TODO: Add description'}
    \n`;

  if (tool.inputs && tool.inputs.length > 0) {
    content += `    Args:\n`;
    for (const input of tool.inputs) {
      content += `        ${input.name}: ${mapPythonType(input.type || 'Any')} - ${input.description || 'TODO'}\n`;
    }
  }

  if (tool.outputs && tool.outputs.length > 0) {
    content += `    \n    Returns:\n`;
    content += `        ${mapPythonType(tool.outputs[0] || 'dict')}\n`;
  }

  if (toolReqIds.length > 0) {
    content += `    \n    Spec References:\n`;
    for (const ref of toolReqIds) {
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

function generatePythonSignature(tool) {
  if (!tool.inputs || tool.inputs.length === 0) {
    return '';
  }

  return tool.inputs.map(input => `${input.name}: ${mapPythonType(input.type)}`).join(', ');
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

function mapJSType(type) {
  const typeMap = {
    'string': 'string',
    'String': 'string',
    'number': 'number',
    'Number': 'number',
    'object': 'Object',
    'Object': 'Object',
    'array': 'Array',
    'Array': 'Array',
    'boolean': 'boolean',
    'Boolean': 'boolean'
  };

  if (typeof type !== 'string') {
    return 'any';
  }

  return typeMap[type] || type || 'any';
}

function camelCase(str) {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}