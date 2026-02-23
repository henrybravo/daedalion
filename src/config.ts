import { readFileSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';
import yaml from 'yaml';
import type { DaedalionConfig } from './types.js';

const KNOWN_TOP_LEVEL_KEYS: ReadonlySet<string> = new Set([
  'version',
  'target',
  'openspec',
  'output',
  'ci',
  'agents',
  'tools',
]);

const DEFAULT_CONFIG: DaedalionConfig = {
  version: 1,
  target: 'github',
  openspec: './openspec',
  output: './.github',
  ci: {
    auto_commit: false,
    commit_message: 'chore: regenerate agents from specs',
  },
  agents: {
    target: 'ide',
    tools: null,
  },
};

/**
 * Validate that a resolved path does not escape the project root.
 * Throws if the path traverses outside `root`.
 */
function safePath(root: string, unsafePath: string): string {
  const resolved = resolve(root, unsafePath);
  const rel = relative(root, resolved);

  if (rel.startsWith('..') || resolve(root, rel) !== resolved) {
    throw new Error(
      `Path "${unsafePath}" resolves outside the project root ("${root}").`,
    );
  }

  return resolved;
}

/**
 * Validate user-supplied config values. Throws on hard errors;
 * warns (console.warn) for unknown top-level keys.
 */
function validateConfig(userConfig: Record<string, unknown>): void {
  // Warn for unknown top-level keys
  for (const key of Object.keys(userConfig)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) {
      console.warn(`daedalion: unknown config key "${key}" — ignoring.`);
    }
  }

  // version must be 1
  if (userConfig.version !== undefined && userConfig.version !== 1) {
    throw new Error(
      `Unsupported config version: ${String(userConfig.version)}. Only version 1 is supported.`,
    );
  }

  // agents.target must be 'ide' or 'sdk'
  const agents = userConfig.agents as Record<string, unknown> | undefined;
  if (agents?.target !== undefined) {
    if (agents.target !== 'ide' && agents.target !== 'sdk') {
      throw new Error(
        `Invalid agents.target: "${String(agents.target)}". Must be "ide" or "sdk".`,
      );
    }
  }

  // openspec must be a non-empty string
  if (userConfig.openspec !== undefined) {
    if (typeof userConfig.openspec !== 'string' || userConfig.openspec.trim() === '') {
      throw new Error('Config "openspec" must be a non-empty string.');
    }
  }

  // output must be a non-empty string
  if (userConfig.output !== undefined) {
    if (typeof userConfig.output !== 'string' || userConfig.output.trim() === '') {
      throw new Error('Config "output" must be a non-empty string.');
    }
  }
}

export function loadConfig(cwd: string): DaedalionConfig {
  const configPath: string = join(cwd, 'daedalion.yaml');

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  const content: string = readFileSync(configPath, 'utf-8');
  const userConfig: Record<string, unknown> = (yaml.parse(content) as Record<string, unknown>) || {};

  validateConfig(userConfig);

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    ci: {
      ...DEFAULT_CONFIG.ci,
      ...((userConfig.ci as Record<string, unknown>) || {}),
    },
    agents: {
      ...DEFAULT_CONFIG.agents,
      ...((userConfig.agents as Record<string, unknown>) || {}),
    },
  } as DaedalionConfig;
}

export function resolveOpenspecPath(cwd: string, config: DaedalionConfig): string {
  return safePath(cwd, config.openspec);
}

export function resolveOutputPath(cwd: string, config: DaedalionConfig): string {
  return safePath(cwd, config.output);
}
