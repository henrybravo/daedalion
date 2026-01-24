import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

const DEFAULT_CONFIG = {
  version: 1,
  target: 'github',
  openspec: './openspec',
  output: './.github',
  ci: {
    auto_commit: false,
    commit_message: 'chore: regenerate agents from specs'
  },
  agents: {
    target: 'ide',  // 'ide' or 'sdk'
    tools: null     // null to use IDE defaults, or array of custom tool names
  }
};

export function loadConfig(cwd) {
  const configPath = join(cwd, 'daedalion.yaml');

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  const content = readFileSync(configPath, 'utf-8');
  const userConfig = yaml.parse(content) || {};

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    ci: {
      ...DEFAULT_CONFIG.ci,
      ...(userConfig.ci || {})
    },
    agents: {
      ...DEFAULT_CONFIG.agents,
      ...(userConfig.agents || {})
    }
  };
}

export function resolveOpenspecPath(cwd, config) {
  return join(cwd, config.openspec);
}

export function resolveOutputPath(cwd, config) {
  return join(cwd, config.output);
}
