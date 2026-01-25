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
import { generatePrompt, generateCyclePrompt } from '../generators/prompt.js';
import { generateWorkflow } from '../generators/workflow.js';
import { generateInstructions } from '../generators/instructions.js';
import { generateTools } from '../generators/tools.js';
import { ensureDir } from '../utils.js';

const MANIFEST_FILENAME = '.daedalion-manifest.json';

export async function build(cwd, options = {}) {
  console.log();
  console.log(chalk.bold(`  Daedalion v${VERSION}`));
  console.log();

  const config = loadConfig(cwd);
  const openspecDir = resolveOpenspecPath(cwd, config);
  const outputDir = resolveOutputPath(cwd, config);

  if (!existsSync(openspecDir)) {
    throw new Error(`OpenSpec directory not found: ${openspecDir}\n       Run 'daedalion init' first.`);
  }

  const generatedFiles = [];

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
    const skillResult = generateSkill(spec, tasks, outputDir, options);
    generatedFiles.push(skillResult);
    logGenerated(skillResult.path, cwd, options);

    const agentResult = generateAgent(spec, outputDir, options, config);
    generatedFiles.push(agentResult);
    logGenerated(agentResult.path, cwd, options);
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

  // Generate prompts from changes
  for (const change of changes) {
    const domain = findDomainForChange(change, specs);
    const promptResult = generatePrompt(change.proposal, change.tasks, domain, outputDir, options);
    generatedFiles.push(promptResult);
    logGenerated(promptResult.path, cwd, options);
  }

  // Generate OpenSpec cycle prompt
  const cyclePromptResult = generateCyclePrompt(outputDir, options);
  generatedFiles.push(cyclePromptResult);
  logGenerated(cyclePromptResult.path, cwd, options);

  // Generate workflow
  const workflowResult = generateWorkflow(config, outputDir, options);
  generatedFiles.push(workflowResult);
  logGenerated(workflowResult.path, cwd, options);

  // Generate copilot-instructions.md
  const instructionsResult = generateInstructions(openspecDir, outputDir, options);
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

function writeManifest(outputDir, generatedFiles, cwd) {
  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: generatedFiles.map(f => relative(cwd, f.path))
  };
  ensureDir(manifestPath);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

async function findAndParseSpecs(openspecDir, options) {
  const specsDir = join(openspecDir, 'specs');
  if (!existsSync(specsDir)) {
    return [];
  }

  const specFiles = await glob('*/spec.md', { cwd: specsDir });
  return specFiles.map(file => parseSpec(join(specsDir, file)));
}

async function findAndParseChanges(openspecDir, options) {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return [];
  }

  const changes = [];
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
        tasks: parseTasks(tasksPath)
      });
    }
  }

  return changes;
}

function aggregateTasks(changes) {
  const tasksByDomain = {};
  for (const change of changes) {
    // For now, associate all tasks with a generic key
    // In a real implementation, you might parse domain from proposal
    if (!tasksByDomain['default']) {
      tasksByDomain['default'] = { groups: [], items: [], hasMore: false };
    }
    tasksByDomain['default'].items.push(...change.tasks.items);
    tasksByDomain['default'].hasMore = tasksByDomain['default'].hasMore || change.tasks.hasMore;
  }
  return tasksByDomain;
}

function findDomainForChange(change, specs) {
  // Try to match change to a spec domain
  // For now, use the first spec's domain or 'default'
  if (specs.length > 0) {
    return specs[0].domain;
  }
  return 'default';
}

function logGenerated(filePath, cwd, options) {
  const relativePath = relative(cwd, filePath);
  if (options.dryRun) {
    console.log(chalk.yellow(`    → ${relativePath}`));
  } else {
    console.log(chalk.green(`    ✓ ${relativePath}`));
  }
}
