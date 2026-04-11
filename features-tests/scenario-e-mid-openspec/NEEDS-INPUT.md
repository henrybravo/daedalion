# Scenario E — Needs User Input

**Scenario:** Brownfield project with OpenSpec already initialised and one active change in progress.

This scenario requires running `openspec init` on a real project to capture the full state
that `openspec init` creates (the `.github/skills/openspec-*/` and `opsx-*.prompt.md` files
that OpenSpec installs). These cannot be fabricated without running the real CLI.

## What the test will verify

1. Change prompt is generated correctly (proposal parsed with `## What Changes` — now fixed)
2. daedalion's `daedalion-openspec-cycle.prompt.md` coexists alongside OpenSpec's `opsx-*.prompt.md`
3. Zero domain skills generated (delta specs at wrong path — P1 gap)
4. OpenSpec-installed skills in `.github/skills/openspec-*/` are NOT overwritten by daedalion

## To provide the fixture

Run these commands on any project directory:

```bash
openspec init
# (optionally) openspec new change "my-feature"
# (optionally) /opsx:propose "describe your feature"
```

Then copy the resulting `.github/` and `openspec/` directories into:

```
features-tests/scenario-e-mid-openspec/fixtures/
```

Once fixtures are in place, the test file can be written.
The test should assert the overlap/conflict behaviour documented in:
`docs/daedalion-evolution-copilot-first.md §5`
