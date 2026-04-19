import { existsSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import chalk from 'chalk';
import { VERSION } from '../version.js';
import { loadConfig, resolveOpenspecPath, resolveOutputPath } from '../config.js';
import { discoverSpecs, discoverChanges } from '../discovery.js';
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
  const specs = await discoverSpecs(openspecDir);
  for (const spec of specs) {
    console.log(chalk.gray(`    ✓ ${relative(cwd, spec.path)}`));
  }

  // Parse changes
  console.log();
  console.log('  Parsing changes...');
  const changes = await discoverChanges(openspecDir);
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
    const skillResults = generateSkill(spec, tasks, outputDir, options, config);
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
    const rawPrimary = change.proposal.frontmatter?.primary_domain;
    const primaryDomain =
      typeof rawPrimary === 'string' && rawPrimary.length > 0
        ? rawPrimary
        : (change.domains[0] ?? 'default');
    const allDomains = change.domains.length > 0 ? change.domains : ['default'];
    const promptResult = generatePrompt(change.proposal, change.tasks, primaryDomain, allDomains, outputDir, options);
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

function logGenerated(filePath: string, cwd: string, options: BuildOptions): void {
  const relativePath = relative(cwd, filePath);
  if (options.dryRun) {
    console.log(chalk.yellow(`    → ${relativePath}`));
  } else {
    console.log(chalk.green(`    ✓ ${relativePath}`));
  }
}
