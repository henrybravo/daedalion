# CI Workflow

Daedalion integrates with your CI pipeline to keep specs and Copilot artifacts in sync.

## When to Run `daedalion build`

| Event | Run build? | Priority |
|-------|------------|----------|
| After `openspec init` | Yes | Medium |
| After archiving a change | Yes | High |
| After major spec/project.md update | Yes | High |
| After minor proposal wording tweak | Optional | Low |
| Every commit | No | — |
| In CI (auto-commit enabled) | Automatic | Best |

## CI Patterns

### Pattern A: Validate Only (Default)

Fails the build if specs and generated artifacts are out of sync.

```yaml
# daedalion.yaml
ci:
  auto_commit: false
```

**Workflow behavior:**
1. Runs `daedalion build --dry-run` to check what would change
2. Runs `daedalion validate` to check sync
3. Fails if any drift detected

**Use this when:**
- You want to manually control when artifacts are regenerated
- You prefer explicit commits for generated files

### Pattern B: Auto-Commit

Automatically regenerates and commits artifacts on push to main.

```yaml
# daedalion.yaml
ci:
  auto_commit: true
  commit_message: 'chore: regenerate agents from specs'
```

**Workflow behavior:**
1. Runs `daedalion build`
2. Commits any changes with the configured message
3. Pushes to the branch

**Use this when:**
- You want zero-friction sync
- Your team trusts automated commits
- You have branch protection with required reviews

## Generated Workflow File

Daedalion generates `.github/workflows/daedalion.yml`:

```yaml
name: Daedalion Sync

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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
```

## Manual Workflow

If you prefer not to use the generated workflow:

```bash
# In your CI script
npm install -g daedalion

# Check for drift (fails if out of sync)
daedalion build --dry-run
daedalion validate

# Or regenerate and commit
daedalion build
git add .github/
git commit -m "chore: sync Copilot artifacts"
git push
```

## Validation Rules

`daedalion validate` checks:

1. **Specs have requirements** — Every spec.md has at least one `### Requirement:`
2. **Requirements have scenarios** — Every requirement has at least one `#### Scenario:`
3. **Skills exist for specs** — Every spec has a corresponding SKILL.md
4. **Prompts exist for changes** — Every active change has a prompt
5. **No orphan skills** — Every skill has a source spec

## Troubleshooting

### "Validation failed: drift detected"

Generated files don't match current specs. Run:
```bash
daedalion build
git diff .github/
```

### "No manifest found"

Run `daedalion build` first. The manifest is required for `daedalion clean` to work safely.

### "Spec has no requirements"

Add at least one requirement section:
```markdown
### Requirement: Feature Name
The system SHALL do something.

#### Scenario: Basic case
- WHEN condition
- THEN outcome
```
