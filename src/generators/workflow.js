import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function generateWorkflow(config, outputDir, options = {}) {
  const workflowPath = join(outputDir, 'workflows', 'daedalion.yml');

  const content = config.ci?.auto_commit
    ? generateAutoCommitWorkflow(config)
    : generateValidateOnlyWorkflow(config);

  if (options.dryRun) {
    return { path: workflowPath, content };
  }

  ensureDir(workflowPath);
  writeFileSync(workflowPath, content);
  return { path: workflowPath, content };
}

function generateValidateOnlyWorkflow(config) {
  return `name: Daedalion
on:
  push:
    paths: ['openspec/**']
  pull_request:
    paths: ['openspec/**']
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g daedalion
      - run: daedalion build --dry-run
      - run: daedalion validate
`;
}

function generateAutoCommitWorkflow(config) {
  const commitMessage = config.ci?.commit_message || 'chore: regenerate agents from specs';

  return `name: Daedalion
on:
  push:
    branches: [main]
    paths: ['openspec/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g daedalion
      - run: daedalion build
      - run: daedalion validate
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: '${commitMessage}'
`;
}
