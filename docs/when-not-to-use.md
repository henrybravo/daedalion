# When *Not* to Use Daedalion

Daedalion is intentionally opinionated. It is not meant for every team or every workflow. This page exists to help you decide **quickly and honestly**.

## Do NOT use Daedalion if…

### You want instant code with zero friction

If your workflow is:

* “Ask Copilot”
* “Paste code”
* “Ship”

Daedalion will feel slow and annoying. It introduces:

* Writing specs
* Reviewing proposals
* Explicit approval steps

That friction is intentional.

### You don’t believe in written specifications

Daedalion assumes:

* Specs are valuable
* Writing intent down is worth the time
* Documentation is not optional

If you see specs as:

* Bureaucracy
* Outdated
* A waste of time

Daedalion is the wrong tool.

### You expect AI to be strictly controllable

Daedalion does **not**:

* Sandbox Copilot
* Block outputs at the model level
* Enforce rules against a determined user

If your mental model is:

> “The tool must prevent misuse at all costs”

You will be disappointed.

### Your team is optimizing purely for speed

Daedalion optimizes for:

* Predictability
* Alignment
* Reduced rework

If your primary metric is:

* Lines of code per hour
* Fastest possible prototype
* “We’ll clean it up later”

Daedalion adds overhead you won’t want.

### You already struggle with basic process discipline

Daedalion assumes:

* Code review exists
* CI failures matter
* Specs are taken seriously

If your team routinely ignores:

* Failing tests
* Review comments
* Process agreements

Daedalion will not fix that culture.

### You want minimal repository footprint

Daedalion generates multiple files:

* Skills
* Agents
* Prompts
* Instructions
* Optional workflows

If you want:

* A tiny `.github/` directory
* Zero generated artifacts
* Minimal visible structure

This tool may feel heavy.

## Daedalion *Is* a Good Fit If…

* You already use GitHub Copilot seriously
* You want AI output aligned with human intent
* You care about traceability and drift
* You work in regulated or high-impact domains
* You prefer explicit decisions over implicit behavior

## A Useful Mental Model

If you would adopt:

* Terraform
* CI pipelines
* Code review rules
* Architectural decision records (ADRs)

You may like Daedalion.

If you reject those as unnecessary overhead, you probably won’t.

## Final Word

Daedalion is not a silver bullet.

It is a **discipline amplifier**:

* It helps disciplined teams work better with AI
* It does not make undisciplined teams disciplined

That tradeoff is deliberate.

If you want, next logical steps could be:

* A **“Comparison: Daedalion vs raw Copilot”** page
* A **“Common failure modes and how to spot them”** doc
* A **diagram-heavy explainer for enterprise stakeholders**

But at this point: your messaging is honest, defensible, and mature.
