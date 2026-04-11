/** Result returned by every generator */
export interface GeneratedFile {
  path: string;
  content: string;
}

/** Common options passed through commands and generators */
export interface BuildOptions {
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  withTools?: boolean;
}

/** Init command options */
export interface InitOptions {
  agentTarget?: string;
  withExample?: boolean;
  target?: string;
}

/** Parsed spec from openspec/specs/{domain}/spec.md */
export interface Spec {
  path: string;
  domain: string;
  title: string;
  frontmatter: Record<string, unknown>;
  requirements: Requirement[];
}

export interface Requirement {
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface Scenario {
  name: string;
  steps: string[];
}

/** Parsed proposal from openspec/changes/{change}/proposal.md */
export interface Proposal {
  path: string;
  changeName: string;
  title: string;
  frontmatter: Record<string, unknown>;
  why: string | null;
  what: string | null;
}

/** Parsed task list from openspec/changes/{change}/tasks.md */
export interface TasksSummary {
  groups: string[];
  items: string[];
  hasMore: boolean;
}

/** Tool definition from spec frontmatter */
export interface ToolDef {
  name: string;
  description?: string;
  inputs?: ToolInput[];
  outputs?: ToolOutput[];
  requirements?: (string | number)[];
  language?: string;
}

export interface ToolInput {
  name: string;
  type?: string;
  description?: string;
}

export interface ToolOutput {
  type?: string;
}

/** daedalion.yaml configuration */
export interface DaedalionConfig {
  version: number;
  target: string;
  openspec: string;
  output: string;
  ci: {
    enabled?: boolean;
    auto_commit: boolean;
    commit_message: string;
  };
  agents: {
    target: 'ide' | 'sdk';
    tools: string[] | null;
  };
  tools?: {
    language?: string;
  };
}

/** Manifest written by build, read by clean */
export interface Manifest {
  version: number;
  generatedAt: string;
  files: string[];
}

/** Validation error */
export interface ValidationError {
  rule: string;
  message: string;
}

/** Change parsed from openspec/changes/{change}/ */
export interface ParsedChange {
  proposal: Proposal;
  tasks: TasksSummary;
  /** Delta spec domain names for this change (alphabetical). Empty if no delta specs exist. */
  domains: string[];
}

/** Validate-only change reference */
export interface ChangeReference {
  changeName: string;
  path: string;
}
