import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { glob } from 'glob';
import { loadConfig, resolveOpenspecPath, resolveOutputPath } from '../config.js';
import { parseSpec } from '../parsers/spec.js';
import { parseProposal } from '../parsers/proposal.js';
import { parseTasks } from '../parsers/tasks.js';
import { generateSkill } from '../generators/skill.js';
import { generateAgent } from '../generators/agent.js';
import { generatePrompt } from '../generators/prompt.js';
import { generateWorkflow } from '../generators/workflow.js';
import { generateInstructions } from '../generators/instructions.js';
import { generateTools } from '../generators/tools.js';
import { generateAgentsIndex } from '../generators/agents-index.js';
import { generatePatternInstructions } from '../generators/pattern-instructions.js';
import { ensureDir } from '../utils.js';
import type {
  BuildOptions,
  GeneratedFile,
  Manifest,
  ParsedChange,
  Spec,
  TasksSummary,
} from '../types.js';

const MANIFEST_FILENAME = '.daedalion-manifest.json';

export async function build(cwd: string, options: BuildOptions = {}): Promise<GeneratedFile[]> {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION}`));
  console.log();

  const config = loadConfig(cwd);
  const openspecDir = resolveOpenspecPath(cwd, config);
  const outputDir = resolveOutputPath(cwd, config);

  if (!existsSync(openspecDir)) {
    throw new Error(`OpenSpec directory not found: ${openspecDir}\n       Run 'daedalion init' first.`);
  }

  const generatedFiles: GeneratedFile[] = [];

  // Parse specs
  console.log('  Parsing specs...');
  const specs = await findAndParseSpecs(openspecDir, options);
  for (const spec of specs) {
    console.log(chalk.gray(`    ✓ ${relative(cwd, spec.path)}`));
  }

  // Parse changes
  console.log();
  console.log('  Parsing changes...');
  const changes = await findAndParseChanges(openspecDir, options);
  for (const change of changes) {
    console.log(chalk.gray(`    ✓ ${relative(cwd, change.proposal.path)}`));
  }

  // Aggregate tasks from all changes for skills
  const allTasks = aggregateTasks(changes);

  // Generate outputs
  console.log();
  console.log('  Generating...');

  // Generate skills and agents from specs
  for (const spec of specs) {
    const tasks = allTasks[spec.domain] || null;
    const skillResults = generateSkill(spec, tasks, outputDir, options);
    for (const skillResult of skillResults) {
      generatedFiles.push(skillResult);
      logGenerated(skillResult.path, cwd, options);
    }

    const agentResult = generateAgent(spec, outputDir, options, config);
    generatedFiles.push(agentResult);
    logGenerated(agentResult.path, cwd, options);

    const patternInstructionsResult = generatePatternInstructions(spec, outputDir, options);
    if (patternInstructionsResult !== null) {
      generatedFiles.push(patternInstructionsResult);
      logGenerated(patternInstructionsResult.path, cwd, options);
    }
  }

  // Generate tool stubs if --with-tools flag is set
  if (options.withTools) {
    console.log(chalk.gray(`    (generating tool stubs)`));
    for (const spec of specs) {
      const toolResults = generateTools(spec, outputDir, config, options);
      for (const toolResult of toolResults) {
        generatedFiles.push(toolResult);
        logGenerated(toolResult.path, cwd, options);
      }
    }
  }

  // Generate AGENTS.md index
  const agentsIndexResult = generateAgentsIndex(specs, outputDir, options);
  generatedFiles.push(agentsIndexResult);
  logGenerated(agentsIndexResult.path, cwd, options);

  // Generate prompts from changes
  for (const change of changes) {
    const promptResult = generatePrompt(change.proposal, change.tasks, 'default', ['default'], outputDir, options);
    generatedFiles.push(promptResult);
    logGenerated(promptResult.path, cwd, options);
  }

  // Generate CI workflow (opt-in: only when ci.enabled is explicitly true)
  if (config.ci?.enabled === true) {
    const workflowResult = generateWorkflow(config, outputDir, options);
    generatedFiles.push(workflowResult);
    logGenerated(workflowResult.path, cwd, options);
  }

  // Generate copilot-instructions.md
  const instructionsResult = generateInstructions(openspecDir, outputDir, options, specs);
  generatedFiles.push(instructionsResult);
  logGenerated(instructionsResult.path, cwd, options);

  // Write manifest of generated files (for clean command)
  if (!options.dryRun) {
    writeManifest(outputDir, generatedFiles, cwd);
  }

  console.log();
  if (options.dryRun) {
    console.log(chalk.yellow(`  Dry run complete. ${generatedFiles.length} files would be generated.`));
  } else {
    console.log(chalk.green(`  Done. ${generatedFiles.length} files generated.`));
  }
  console.log();

  return generatedFiles;
}

function writeManifest(outputDir: string, generatedFiles: GeneratedFile[], cwd: string): void {
  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  const manifest: Manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: generatedFiles.map(f => relative(cwd, f.path))
  };
  ensureDir(manifestPath);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

async function findAndParseSpecs(openspecDir: string, _options: BuildOptions): Promise<Spec[]> {
  const specsByDomain = new Map<string, Spec>();

  // 1. Canonical specs: openspec/specs/*/spec.md (always take priority)
  const canonicalDir = join(openspecDir, 'specs');
  if (existsSync(canonicalDir)) {
    const files = await glob('*/spec.md', { cwd: canonicalDir });
    for (const file of files) {
      const spec = parseSpec(join(canonicalDir, file));
      specsByDomain.set(spec.domain, spec);
    }
  }

  // 2. Delta specs: openspec/changes/*/specs/*/spec.md
  //    Only used when no canonical spec exists for that domain
  const changesDir = join(openspecDir, 'changes');
  if (existsSync(changesDir)) {
    const files = await glob('*/specs/*/spec.md', { cwd: changesDir });
    for (const file of files) {
      const spec = parseSpec(join(changesDir, file));
      if (!specsByDomain.has(spec.domain)) {
        specsByDomain.set(spec.domain, spec);
      }
    }
  }

  return Array.from(specsByDomain.values());
}

async function findAndParseChanges(openspecDir: string, _options: BuildOptions): Promise<ParsedChange[]> {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return [];
  }

  const changes: ParsedChange[] = [];
  const changeDirs = readdirSync(changesDir).filter(name => {
    const fullPath = join(changesDir, name);
    return statSync(fullPath).isDirectory();
  });

  for (const changeDir of changeDirs) {
    const proposalPath = join(changesDir, changeDir, 'proposal.md');
    const tasksPath = join(changesDir, changeDir, 'tasks.md');

    if (existsSync(proposalPath)) {
      changes.push({
        proposal: parseProposal(proposalPath),
        tasks: parseTasks(tasksPath),
        domains: [],
      });
    }
  }

  return changes;
}

function aggregateTasks(changes: ParsedChange[]): Record<string, TasksSummary> {
  const tasksByDomain: Record<string, TasksSummary> = {};
  for (const change of changes) {
    if (!tasksByDomain['default']) {
      tasksByDomain['default'] = { groups: [], items: [], hasMore: false };
    }
    tasksByDomain['default'].items.push(...change.tasks.items);
    tasksByDomain['default'].hasMore = tasksByDomain['default'].hasMore || change.tasks.hasMore;
  }
  return tasksByDomain;
}

function findDomainForChange(change: ParsedChange, specs: Spec[]): string {
  if (specs.length > 0) {
    return specs[0].domain;
  }
  return 'default';
}

function logGenerated(filePath: string, cwd: string, options: BuildOptions): void {
  const relativePath = relative(cwd, filePath);
  if (options.dryRun) {
    console.log(chalk.yellow(`    → ${relativePath}`));
  } else {
    console.log(chalk.green(`    ✓ ${relativePath}`));
  }
}
