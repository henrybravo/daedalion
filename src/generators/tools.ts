import { writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDir } from '../utils.js';
import type { BuildOptions, DaedalionConfig, GeneratedFile, Spec, ToolDef, ToolInput, ToolOutput } from '../types.js';

interface ReqId {
  id: string;
  name: string;
}

type SupportedLanguage = 'python' | 'javascript';

export function generateTools(
  spec: Spec,
  outputDir: string,
  config: Partial<DaedalionConfig> = {},
  options: BuildOptions = {},
): GeneratedFile[] {
  const tools: ToolDef[] = extractTools(spec);
  const language: string = config.tools?.language || 'python';
  const generated: GeneratedFile[] = [];

  for (const tool of tools) {
    const stubResult: GeneratedFile = generateToolStub(tool, spec, outputDir, language, options);
    generated.push(stubResult);
  }

  return generated;
}

function extractTools(spec: Spec): ToolDef[] {
  const tools: ToolDef[] = [];
  const frontmatter: Record<string, unknown> = spec.frontmatter || {};

  if (frontmatter.tools && Array.isArray(frontmatter.tools)) {
    for (const tool of frontmatter.tools as unknown[]) {
      if (typeof tool === 'string') {
        tools.push({ name: tool });
      } else if (typeof tool === 'object' && tool !== null && 'name' in tool) {
        tools.push(tool as ToolDef);
      }
    }
  }

  return tools;
}

function mapPythonType(type: string | undefined): string {
  const typeMap: Record<string, string> = {
    'string': 'str',
    'String': 'str',
    'number': 'int | float',
    'Number': 'int | float',
    'object': 'dict',
    'Object': 'dict',
    'array': 'Array',
    'Array': 'Array',
    'boolean': 'bool',
    'Boolean': 'bool',
  };

  if (typeof type !== 'string') {
    return 'Any';
  }

  return typeMap[type] || type || 'Any';
}

function getAllRequirementIds(spec: Spec): ReqId[] {
  return spec.requirements.map((req, i) => ({
    id: `REQ-${String(i + 1).padStart(3, '0')}`,
    name: req.name,
  }));
}

function filterRelevantRequirements(spec: Spec, tool: ToolDef): ReqId[] {
  if (!tool.requirements || !Array.isArray(tool.requirements)) {
    return getAllRequirementIds(spec).slice(0, 2);
  }

  const allReqs: ReqId[] = getAllRequirementIds(spec);
  const toolReqIds: string[] = tool.requirements.map((r) => {
    if (typeof r === 'string' && r.startsWith('REQ-')) {
      return r;
    }
    const idx: number = parseInt(String(r)) || 1;
    return `REQ-${String(idx).padStart(3, '0')}`;
  });

  return allReqs.filter((req) => toolReqIds.includes(req.id));
}

function generatePythonSignature(tool: ToolDef): string {
  if (!tool.inputs || tool.inputs.length === 0) {
    return '';
  }

  return tool.inputs.map((input) => `${input.name}: ${mapPythonType(input.type)}`).join(', ');
}

function generatePythonStub(
  tool: ToolDef,
  spec: Spec,
  filePath: string,
  options: BuildOptions,
): GeneratedFile {
  const toolReqs: ReqId[] = filterRelevantRequirements(spec, tool);
  const toolReqIds: string[] = toolReqs.map((r) => r.id);

  let content = `"""
${tool.description || tool.name}
Requirements: ${toolReqIds.join(', ') || 'TODO'}
"""

`;

  const returnType: string = mapPythonType(tool.outputs?.[0]?.type);
  content += `def ${tool.name}(${generatePythonSignature(tool)}) -> ${returnType}:\n`;
  content += `    """
    ${tool.description || 'TODO: Add description'}
    \n`;

  if (tool.inputs && tool.inputs.length > 0) {
    content += `    Args:\n`;
    for (const input of tool.inputs) {
      content += `        ${input.name}: ${mapPythonType(input.type)} - ${input.description || 'TODO'}\n`;
    }
  }

  if (tool.outputs && tool.outputs.length > 0) {
    content += `    \n    Returns:\n`;
    content += `        ${mapPythonType(tool.outputs[0]?.type)}\n`;
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

function mapJSType(type: string | undefined): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'String': 'string',
    'number': 'number',
    'Number': 'number',
    'object': 'Object',
    'Object': 'Object',
    'array': 'Array',
    'Array': 'Array',
    'boolean': 'boolean',
    'Boolean': 'boolean',
  };

  if (typeof type !== 'string') {
    return 'any';
  }

  return typeMap[type] || type || 'any';
}

function camelCase(str: string): string {
  return str.replace(/[-_](.)/g, (_: string, c: string) => c.toUpperCase());
}

function generateJSSignature(tool: ToolDef): string {
  if (!tool.inputs || tool.inputs.length === 0) {
    return '{}';
  }

  return `{ ${tool.inputs.map((input) => `${input.name}`).join(', ')} }`;
}

function generateJavaScriptStub(
  tool: ToolDef,
  spec: Spec,
  filePath: string,
  options: BuildOptions,
): GeneratedFile {
  const toolReqs: ReqId[] = filterRelevantRequirements(spec, tool);
  const toolReqIds: string[] = toolReqs.map((r) => r.id);
  const fnName: string = camelCase(tool.name);

  let content = `/**\n`;
  content += ` * ${tool.description || tool.name}\n`;
  content += ` * Requirements: ${toolReqIds.join(', ') || 'TODO'}\n`;
  content += ` */\n\n`;

  // Build JSDoc block
  content += `/**\n`;
  content += ` * ${tool.description || 'TODO: Add description'}\n`;

  if (tool.inputs && tool.inputs.length > 0) {
    for (const input of tool.inputs) {
      content += ` * @param {${mapJSType(input.type)}} ${input.name} - ${input.description || 'TODO'}\n`;
    }
  }

  if (tool.outputs && tool.outputs.length > 0) {
    content += ` * @returns {${mapJSType(tool.outputs[0]?.type)}}\n`;
  }

  if (toolReqIds.length > 0) {
    content += ` *\n`;
    content += ` * Spec References:\n`;
    for (const ref of toolReqIds) {
      content += ` *   - ${ref}\n`;
    }
  }

  content += ` */\n`;

  content += `export function ${fnName}(${generateJSSignature(tool)}) {\n`;
  content += `  throw new Error('Implement ${fnName} logic');\n`;
  content += `}\n`;

  if (options.dryRun) {
    return { path: filePath, content };
  }

  ensureDir(filePath);
  writeFileSync(filePath, content, 'utf-8');
  return { path: filePath, content };
}

function getLanguageExt(language: string): string {
  const exts: Record<string, string> = { python: '.py', javascript: '.js' };
  return exts[language] || '.py';
}

function generateToolStub(
  tool: ToolDef,
  spec: Spec,
  outputDir: string,
  language: string,
  options: BuildOptions,
): GeneratedFile {
  const toolsDir: string = join(outputDir, 'tools');
  const ext: string = getLanguageExt(language);
  const toolPath: string = join(toolsDir, `${tool.name.toLowerCase()}${ext}`);

  if (language === 'python') {
    return generatePythonStub(tool, spec, toolPath, options);
  } else if (language === 'javascript') {
    return generateJavaScriptStub(tool, spec, toolPath, options);
  }

  throw new Error(`Unsupported tool language: ${language}`);
}
