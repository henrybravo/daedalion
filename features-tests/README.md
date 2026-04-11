# Daedalion Feature Tests

End-to-end scenario tests that validate daedalion's compilation output against real-world usage patterns.
Each scenario corresponds to a documented use case in `docs/daedalion-evolution-copilot-first.md §11`.

## Scenarios

| Scenario | Directory | Status | Input |
|----------|-----------|--------|-------|
| A | `scenario-a-openspec-active/` | ⚠️ Partial (P1 gap documented) | OpenSpec 1.2.0 delta specs (from example project) |
| B | `scenario-b-manual-specs/` | ✅ Full happy path | Manual spec files at canonical path |
| C | `scenario-c-post-archive/` | ✅ Full happy path | Canonical specs (post-archive state) |
| D | `scenario-d-brownfield/` | ✅ Full happy path | Reverse-engineered specs from existing code |
| E | `scenario-e-mid-openspec/` | ⚠️ Needs user input | Requires OpenSpec CLI to generate fixture |

## Running

```bash
# All feature tests
npx vitest run features-tests/

# Single scenario
npx vitest run features-tests/scenario-b-manual-specs/
```

## Fixture conventions

Each scenario has a `fixtures/` directory containing the input files that would exist in a real project
before `daedalion build` is run. Tests copy fixtures into a temp directory, run `daedalion build`, and
assert on the generated output.

## Adding new scenarios

1. Create `features-tests/scenario-x-name/`
2. Add `fixtures/` with the input files
3. Write `scenario-x.test.ts` using the shared helpers from `../test/helpers.ts`
4. Document the scenario in this README and in `docs/daedalion-evolution-copilot-first.md §11`
