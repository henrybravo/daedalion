---
description: Compile specs into GitHub Copilot artifacts (agents, skills, prompts, AGENTS.md)
---

# Compile Specs

Use this prompt when specs have changed and you need to regenerate GitHub Copilot artifacts.

## When to Use

- Spec files have been added or updated
- A new change proposal has been added
- You want to regenerate all Copilot artifacts from the current spec state

## Steps

1. **Discover spec files** — look in:
   - Canonical specs: `openspec/specs/*/spec.md`
   - Delta specs: `openspec/changes/*/specs/*/spec.md`
   - Proposals: `openspec/changes/*/proposal.md`

2. **Run compilation**

   ```
   daedalion build
   ```

3. **Review generated artifacts** in `.github/`:
   - `.github/AGENTS.md` — agent discovery index
   - `.github/agents/{domain}.agent.md` — domain agents
   - `.github/skills/{domain}/SKILL.md` — domain skills
   - `.github/prompts/{change}.prompt.md` — change-specific prompts
   - `.github/copilot-instructions.md` — project context

4. **Verify** that all expected domains appear in `.github/AGENTS.md`
