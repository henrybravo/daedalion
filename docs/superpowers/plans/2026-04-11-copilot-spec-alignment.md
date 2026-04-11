# Copilot Spec Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three generators that diverge from the GitHub Copilot / VS Code customisation spec: conditionalise `.instructions.md` generation on a `file_pattern` frontmatter field, expand skill descriptions beyond the arbitrary 60-char cap, and remove the spurious `name:` key from the init prompt template.

**Architecture:** All three fixes are isolated to individual generator files; the only cross-cutting change is `build.ts` handling the nullable return from `generatePatternInstructions`. Tests follow the existing pattern: `runCLI` against a temp dir with `--with-example`, then assert on generated file content.

**Tech Stack:** TypeScript, Vitest, Node.js CLI (`bin/daedalion.js`), `npm run build` (tsc), `npm test` (vitest run)

---

## File Map

| File | Change |
|------|--------|
| `templates/init/.github/prompts/daedalion-compile.prompt.md` | Remove `name:` line |
| `test/init.test.ts` | Add test: installed prompt has no `name:` key |
| `src/generators/skill.ts` | Rewrite `generateDescription()` — richer text, 1024-char cap |
| `test/build.test.ts` | Update + add description tests; update + add instructions tests |
| `src/generators/pattern-instructions.ts` | Return `null` when `file_pattern` absent; use it when present |
| `src/commands/build.ts` | Handle `null` return from `generatePatternInstructions` |

---

## Task 1: Remove spurious `name:` from init prompt template

**Files:**
- Modify: `templates/init/.github/prompts/daedalion-compile.prompt.md`
- Test: `test/init.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `test/init.test.ts`, inside the `describe('daedalion init', ...)` block, after the existing `'installs daedalion-compile.prompt.md for spec compilation'` test:

```typescript
it('daedalion-compile.prompt.md frontmatter must not contain a name: key', () => {
  runCLI('init', tempDir);
  const content = readFileSync(
    join(tempDir, '.github/prompts/daedalion-compile.prompt.md'),
    'utf-8'
  );
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  expect(fmMatch).not.toBeNull();
  expect(fmMatch![1]).not.toMatch(/^name:/m);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .worktrees/fix/copilot-spec-alignment
npm run build && npx vitest run test/init.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `expect(fmMatch![1]).not.toMatch(/^name:/m)` because the template currently has `name: daedalion-compile`.

- [ ] **Step 3: Fix the template**

In `templates/init/.github/prompts/daedalion-compile.prompt.md`, change:

```markdown
---
name: daedalion-compile
description: Compile specs into GitHub Copilot artifacts (agents, skills, prompts, AGENTS.md)
---
```

to:

```markdown
---
description: Compile specs into GitHub Copilot artifacts (agents, skills, prompts, AGENTS.md)
---
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run build && npx vitest run test/init.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: all init tests PASS.

- [ ] **Step 5: Commit**

```bash
git add templates/init/.github/prompts/daedalion-compile.prompt.md test/init.test.ts
git commit -m "fix: remove invalid name: key from daedalion-compile.prompt.md template"
```

---

## Task 2: Fix skill description truncation (60 → 1024 chars)

**Files:**
- Modify: `src/generators/skill.ts:103-110`
- Test: `test/build.test.ts`

- [ ] **Step 1: Write failing tests**

In `test/build.test.ts`, replace the existing test:

```typescript
it('SKILL.md description is discovery-optimized (starts with "Use when")', () => {
  runCLI('build', tempDir);
  const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
  expect(content).toMatch(/description: Use when working on example/);
});
```

with:

```typescript
it('SKILL.md description includes all requirement names and is not truncated at 60 chars', () => {
  runCLI('build', tempDir);
  const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
  // Must mention all requirement names (example spec has User Greeting + Session Management)
  expect(content).toMatch(/description:.*user greeting/i);
  expect(content).toMatch(/description:.*session management/i);
  // Must be longer than the old 60-char cap
  const descMatch = content.match(/^description: (.+)$/m);
  expect(descMatch).not.toBeNull();
  expect(descMatch![1].length).toBeGreaterThan(60);
  // Must not exceed 1024 chars
  expect(descMatch![1].length).toBeLessThanOrEqual(1024);
});
```

Add these new tests in the same `describe` block, after the description test above:

```typescript
it('SKILL.md description uses verbatim frontmatter description when provided', () => {
  const specPath = join(tempDir, 'openspec/specs/example/spec.md');
  const original = readFileSync(specPath, 'utf-8');
  writeFileSync(specPath, `---\ndescription: Hand-crafted description for example domain\n---\n${original}`);
  runCLI('build', tempDir);

  const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
  expect(content).toContain('Hand-crafted description for example domain');
  expect(content).not.toContain('Example Specification -');
});

it('SKILL.md description is capped at 1024 chars even when auto-generated text would be longer', () => {
  // Build a spec with many long-named requirements
  const specPath = join(tempDir, 'openspec/specs/example/spec.md');
  const longReqs = Array.from({ length: 30 }, (_, i) =>
    `### Requirement: A Very Long Requirement Name Number ${i + 1}\n\nDescription for req ${i + 1}.`
  ).join('\n\n');
  writeFileSync(specPath, `# Long Spec\n\n## Requirements\n\n${longReqs}\n`);
  runCLI('build', tempDir);

  const content = readFileSync(join(tempDir, '.github/skills/example/SKILL.md'), 'utf-8');
  const descMatch = content.match(/^description: (.+)$/m);
  expect(descMatch).not.toBeNull();
  expect(descMatch![1].length).toBeLessThanOrEqual(1024);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run build && npx vitest run test/build.test.ts --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|✓|✗|×)" | head -30
```

Expected: the renamed test and the two new tests FAIL; existing tests continue to PASS.

- [ ] **Step 3: Fix `generateDescription` in `src/generators/skill.ts`**

Replace the function at lines 103–110:

```typescript
function generateDescription(spec: Spec): string {
  const domain = spec.domain;
  if (spec.requirements.length === 0) {
    return `Use when working on ${domain}.`;
  }
  const reqNames = spec.requirements
    .map(r => r.name.toLowerCase())
    .join(', ');
  const description = `${spec.title} - ${reqNames}. Use when working on ${domain}, implementing ${reqNames}.`;
  return description.slice(0, 1024);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run build && npx vitest run test/build.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all 20+ build tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/generators/skill.ts test/build.test.ts
git commit -m "fix: expand skill description beyond 60-char cap (use 1024-char Copilot limit)"
```

---

## Task 3: Conditionalise pattern instructions on `file_pattern` frontmatter

**Files:**
- Modify: `src/generators/pattern-instructions.ts`
- Modify: `src/commands/build.ts:80-83`
- Test: `test/build.test.ts`

- [ ] **Step 1: Write failing tests**

In `test/build.test.ts`, replace the existing test:

```typescript
it('generates pattern instructions for each spec domain', () => {
  runCLI('build', tempDir);
  const instructionsPath = join(tempDir, '.github/instructions/example.instructions.md');
  expect(existsSync(instructionsPath)).toBe(true);
  const content = readFileSync(instructionsPath, 'utf-8');
  expect(content).toContain('applyTo:');
  expect(content).toContain('example');
});
```

with:

```typescript
it('does NOT generate pattern instructions when file_pattern is absent from spec', () => {
  runCLI('build', tempDir);
  // Example spec has no file_pattern → no instructions file
  expect(existsSync(join(tempDir, '.github/instructions/example.instructions.md'))).toBe(false);
});
```

Then add these new tests after it:

```typescript
it('generates pattern instructions with correct applyTo when file_pattern is present', () => {
  const specPath = join(tempDir, 'openspec/specs/example/spec.md');
  const original = readFileSync(specPath, 'utf-8');
  writeFileSync(specPath, `---\nfile_pattern: "src/example/**"\n---\n${original}`);
  runCLI('build', tempDir);

  const instructionsPath = join(tempDir, '.github/instructions/example.instructions.md');
  expect(existsSync(instructionsPath)).toBe(true);
  const content = readFileSync(instructionsPath, 'utf-8');
  expect(content).toContain('applyTo: "src/example/**"');
  expect(content).toContain('example');
});

it('generates pattern instructions with multi-glob applyTo', () => {
  const specPath = join(tempDir, 'openspec/specs/example/spec.md');
  const original = readFileSync(specPath, 'utf-8');
  writeFileSync(specPath, `---\nfile_pattern: "src/a/**,src/b/**"\n---\n${original}`);
  runCLI('build', tempDir);

  const content = readFileSync(
    join(tempDir, '.github/instructions/example.instructions.md'),
    'utf-8'
  );
  expect(content).toContain('applyTo: "src/a/**,src/b/**"');
});

it('only generates instructions file for specs that have file_pattern', () => {
  // Add a second spec without file_pattern
  const authSpecDir = join(tempDir, 'openspec/specs/auth');
  mkdirSync(authSpecDir, { recursive: true });
  writeFileSync(join(authSpecDir, 'spec.md'), `# Auth Specification\n\n## Requirements\n\n### Requirement: Login\n\nUsers can log in.\n`);

  // Give file_pattern only to example
  const specPath = join(tempDir, 'openspec/specs/example/spec.md');
  const original = readFileSync(specPath, 'utf-8');
  writeFileSync(specPath, `---\nfile_pattern: "src/example/**"\n---\n${original}`);

  runCLI('build', tempDir);

  expect(existsSync(join(tempDir, '.github/instructions/example.instructions.md'))).toBe(true);
  expect(existsSync(join(tempDir, '.github/instructions/auth.instructions.md'))).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run build && npx vitest run test/build.test.ts --reporter=verbose 2>&1 | grep -E "(FAIL|✓|✗|×)" | head -30
```

Expected: the renamed test and the three new tests FAIL.

- [ ] **Step 3: Fix `src/generators/pattern-instructions.ts`**

Replace the entire file content with:

```typescript
import { ensureDir } from '../utils.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { GeneratedFile, BuildOptions, Spec, Requirement } from '../types.js';

export function generatePatternInstructions(
  spec: Spec,
  outputDir: string,
  options: BuildOptions = {},
): GeneratedFile | null {
  const filePattern = spec.frontmatter?.file_pattern as string | undefined;
  if (!filePattern) return null;

  const instructionsPath = join(outputDir, 'instructions', `${spec.domain}.instructions.md`);

  const requirementsSummary = spec.requirements
    .slice(0, 5)
    .map((r: Requirement) => `- **${r.name}**: ${r.description}`)
    .join('\n');

  const content = `---\napplyTo: "${filePattern}"\n---\n# ${spec.title}\n\nDomain: \`${spec.domain}\` · Skill: \`#${spec.domain}\`\n\n## Requirements\n\n${requirementsSummary || `See \`.github/skills/${spec.domain}/SKILL.md\` for full requirements.`}\n`;

  if (options.dryRun) {
    return { path: instructionsPath, content };
  }

  ensureDir(instructionsPath);
  writeFileSync(instructionsPath, content);
  return { path: instructionsPath, content };
}
```

- [ ] **Step 4: Fix `src/commands/build.ts` to handle nullable return**

Replace lines 80–83 in `src/commands/build.ts`:

```typescript
    const patternInstructionsResult = generatePatternInstructions(spec, outputDir, options);
    generatedFiles.push(patternInstructionsResult);
    logGenerated(patternInstructionsResult.path, cwd, options);
```

with:

```typescript
    const patternInstructionsResult = generatePatternInstructions(spec, outputDir, options);
    if (patternInstructionsResult !== null) {
      generatedFiles.push(patternInstructionsResult);
      logGenerated(patternInstructionsResult.path, cwd, options);
    }
```

- [ ] **Step 5: Run full test suite**

```bash
npm run build && npm test 2>&1 | tail -20
```

Expected: all tests PASS (66+ tests, 0 failures).

- [ ] **Step 6: Commit**

```bash
git add src/generators/pattern-instructions.ts src/commands/build.ts test/build.test.ts
git commit -m "fix: only generate .instructions.md when file_pattern frontmatter is present"
```

---

## Final Verification

- [ ] Run full test suite one last time:

```bash
npm run build && npm test
```

Expected: all tests pass with 0 failures.
