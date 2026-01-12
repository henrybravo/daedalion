# Daedalion v0.0.1 — Implementation Instructions

> This document is a prompt for Claude Code (or similar AI coding agents) to implement Daedalion.

## Context

Read `ARCHITECTURE.md` first. It defines:
- Value proposition
- Directory structure (input/output)
- Mapping rules
- CLI commands
- Config schema
- Generated file examples

## Project Setup

```bash
mkdir daedalion && cd daedalion
npm init -y
```

### Dependencies

```json
{
  "name": "daedalion",
  "version": "0.0.1",
  "bin": {
    "daedalion": "./bin/daedalion.js"
  },
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "yaml": "^2.3.0",
    "gray-matter": "^4.0.3",
    "chalk": "^5.3.0",
    "glob": "^10.3.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

### Directory Structure

```
daedalion/
├── bin/
│   └── daedalion.js          # CLI entry point
├── src/
│   ├── index.js              # Main exports
│   ├── commands/
│   │   ├── init.js           # daedalion init
│   │   ├── build.js          # daedalion build
│   │   ├── validate.js       # daedalion validate
│   │   └── clean.js          # daedalion clean
│   ├── generators/
│   │   ├── skill.js          # spec → SKILL.md
│   │   ├── agent.js          # spec → agent.md
│   │   ├── prompt.js         # proposal → prompt.md
│   │   ├── workflow.js       # → daedalion.yml
│   │   └── instructions.js   # project.md → copilot-instructions.md
│   ├── parsers/
│   │   ├── spec.js           # Parse OpenSpec spec.md
│   │   ├── proposal.js       # Parse proposal.md
│   │   └── tasks.js          # Parse tasks.md
│   ├── config.js             # Load daedalion.yaml
│   └── utils.js              # Helpers
├── templates/
│   ├── init/                 # Scaffold templates
│   │   ├── daedalion.yaml
│   │   ├── openspec/
│   │   │   ├── project.md
│   │   │   ├── specs/
│   │   │   │   └── example/
│   │   │   │       └── spec.md
│   │   │   └── changes/
│   │   │       └── example-feature/
│   │   │           ├── proposal.md
│   │   │           └── tasks.md
│   └── output/               # Generation templates
│       ├── skill.md.tmpl
│       ├── agent.md.tmpl
│       ├── prompt.md.tmpl
│       └── workflow.yml.tmpl
├── test/
│   ├── init.test.js
│   ├── build.test.js
│   ├── validate.test.js
│   ├── clean.test.js
│   └── fixtures/             # Test input/output samples
└── package.json
```

## Implementation Order

### Phase 1: Core CLI

1. **bin/daedalion.js** — Commander setup with 4 commands
2. **src/config.js** — Load `daedalion.yaml`, apply defaults
3. **src/commands/init.js** — Copy templates to target dir

### Phase 2: Parsers

4. **src/parsers/spec.js** — Extract requirements + scenarios from spec.md
5. **src/parsers/proposal.js** — Extract title, why, what from proposal.md
6. **src/parsers/tasks.js** — Extract task groups + items (summarized)

### Phase 3: Generators

7. **src/generators/skill.js** — Generate SKILL.md from parsed spec + tasks
8. **src/generators/agent.js** — Generate agent.md from spec domain
9. **src/generators/prompt.js** — Generate prompt.md from proposal
10. **src/generators/instructions.js** — Generate copilot-instructions.md from project.md
11. **src/generators/workflow.js** — Generate daedalion.yml

### Phase 4: Commands

12. **src/commands/build.js** — Orchestrate parsing + generation
13. **src/commands/validate.js** — Check rules from ARCHITECTURE.md
14. **src/commands/clean.js** — Remove generated files

### Phase 5: Tests

15. Write tests per TESTS.md

## Key Implementation Details

### Spec Parser

Input: `openspec/specs/{domain}/spec.md`

```markdown
# Domain Specification

## Requirements

### Requirement: Feature Name
The system SHALL do something.

#### Scenario: Happy path
- WHEN condition
- THEN outcome
```

Output:
```javascript
{
  domain: 'auth',
  title: 'Domain Specification',
  requirements: [
    {
      name: 'Feature Name',
      description: 'The system SHALL do something.',
      scenarios: [
        {
          name: 'Happy path',
          steps: ['WHEN condition', 'THEN outcome']
        }
      ]
    }
  ]
}
```

### Skill Generator

Template (`templates/output/skill.md.tmpl`):
```yaml
---
name: {{domain}}
description: {{description}}. Use when working on {{keywords}}.
---
# {{title}}

## Requirements
{{#each requirements}}
- **{{name}}**: {{description}}
{{/each}}

## Acceptance Criteria
{{#each requirements}}
{{#each scenarios}}
### {{name}}
{{#each steps}}
- {{this}}
{{/each}}
{{/each}}
{{/each}}

{{#if tasks}}
## Active Tasks
{{#each tasks}}
- {{this}}
{{/each}}
> Full task list: openspec/changes/{{changeName}}/tasks.md
{{/if}}
```

### Agent Generator

Template (`templates/output/agent.md.tmpl`):
```yaml
---
name: {{domain}}
description: Implements {{domain}} features following specifications
tools: ['edit', 'search', 'terminal']
---
# {{domain}} Agent

You implement {{domain}} features following the specification.

## Available Skills
- **#{{domain}}** — {{skillDescription}}

## Workflow
1. Read the #{{domain}} skill for requirements
2. Implement following acceptance criteria
3. Verify all scenarios pass
```

### Prompt Generator

Template (`templates/output/prompt.md.tmpl`):
```yaml
---
description: {{proposalTitle}}
agent: {{domain}}
---
Implement the {{changeName}} change proposal.

## Context
{{proposalWhy}}

## Scope
{{proposalWhat}}

## Reference
- Proposal: openspec/changes/{{changeName}}/proposal.md
- Tasks: openspec/changes/{{changeName}}/tasks.md

## Skills
- #{{domain}}
```

### Task Summarization

```javascript
function summarizeTasks(tasksContent, maxItems = 10) {
  // Parse markdown tasks
  // Extract headings as groups
  // Extract top-level items only (lines starting with - [ ])
  // Cap at maxItems
  // Return { groups: [...], items: [...], hasMore: boolean }
}
```

### Validation Rules (src/commands/validate.js)

```javascript
const rules = [
  {
    name: 'spec-has-requirements',
    check: (spec) => spec.requirements.length > 0,
    error: (spec) => `Spec ${spec.path} has no requirements`
  },
  {
    name: 'requirement-has-scenarios',
    check: (req) => req.scenarios.length > 0,
    error: (req) => `Requirement "${req.name}" lacks scenarios`
  },
  {
    name: 'skill-exists-for-spec',
    check: (spec, output) => fs.existsSync(`${output}/skills/${spec.domain}/SKILL.md`),
    error: (spec) => `Missing skill for spec ${spec.domain}`
  },
  {
    name: 'prompt-exists-for-change',
    check: (change, output) => fs.existsSync(`${output}/prompts/${change.name}.prompt.md`),
    error: (change) => `Missing prompt for change ${change.name}`
  },
  {
    name: 'no-orphan-skills',
    check: (skill, specs) => specs.some(s => s.domain === skill.name),
    error: (skill) => `Orphan skill: ${skill.name} has no source spec`
  }
];
```

## CLI Output Style

Use chalk for colored output:

```
$ daedalion build

  Daedalion v0.0.1

  Parsing specs...
    ✓ openspec/specs/auth/spec.md
    ✓ openspec/specs/api/spec.md

  Parsing changes...
    ✓ openspec/changes/add-2fa/proposal.md

  Generating...
    ✓ .github/skills/auth/SKILL.md
    ✓ .github/skills/api/SKILL.md
    ✓ .github/agents/auth.agent.md
    ✓ .github/agents/api.agent.md
    ✓ .github/prompts/add-2fa.prompt.md
    ✓ .github/workflows/daedalion.yml
    ✓ .github/copilot-instructions.md

  Done. 7 files generated.
```

## Error Handling

- Exit 0: Success
- Exit 1: Validation errors or missing files
- Exit 2: Config errors

Always show actionable error messages:
```
Error: Spec "openspec/specs/auth/spec.md" has no requirements.
       Add at least one "### Requirement:" section.
```

## Don't Over-Engineer

- No plugin system (v0.0.1)
- No custom templates (use built-in)
- No watch mode (v0.0.1)
- No interactive prompts (silent or verbose only)
- String templates, not a template engine (unless trivial)

## Definition of Done

- [ ] `npm install -g daedalion` works
- [ ] `daedalion init` creates scaffold
- [ ] `daedalion build` generates all 5 output types
- [ ] `daedalion validate` checks all rules
- [ ] `daedalion clean` removes generated files
- [ ] `daedalion build --dry-run` shows preview
- [ ] All tests pass (see TESTS.md)
- [ ] README.md with usage examples
