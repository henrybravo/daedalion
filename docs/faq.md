# FAQ — Prompt Disobedience, Enforcement, and Limits

## “Won’t the AI just ignore the workflow prompt if I ask it to?”

Yes.

Modern Copilot models can and will generate code if a user explicitly asks them to, even if a prompt says “do not implement yet”.

This is not a bug in Daedalion. It is a property of how current AI systems work.

Daedalion does **not** promise hard enforcement of AI behavior.

## “Then what’s the point of the coordinator prompt?”

The coordinator prompt is **not a lock**.
It is a **workflow contract**.

Its purpose is to:

* Establish a shared, explicit process
* Make approval a named, visible step
* Preserve intent alongside implementation
* Reduce accidental or premature coding

It changes default behavior and expectations — not absolute capability.

Think of it like:

* A code review policy
* A CI gate
* A Terraform plan

All can be bypassed. All still matter.

## “Isn’t this just security theater?”

No — but it *would be* if Daedalion claimed enforcement.

Daedalion is honest about its limits:

* You can bypass the workflow
* You cannot bypass the **record of bypassing**

Daedalion provides:

* Spec → task → artifact traceability
* Drift detection via validation
* A clear paper trail of intended behavior

Security theater hides reality.
Daedalion makes deviations explicit.

## “What stops a developer from just ignoring the specs?”

Nothing — intentionally.

Daedalion assumes:

* Humans remain responsible
* AI is a tool, not an authority
* Process only works if the team wants it

What Daedalion does is:

* Make ignoring specs visible
* Fail validation when artifacts drift
* Require conscious decision-making instead of accidental drift

## “Can validation catch bad or contradictory specs?”

No.

`daedalion validate` checks **structure and consistency**, not meaning.

It will not detect:

* Logical contradictions
* Missing non-functional requirements
* Security model flaws
* Incomplete task coverage

Those are explicitly human responsibilities.

Daedalion is a compiler and alignment tool — not a requirements oracle.

## “Why not enforce this at the Copilot / IDE level?”

Because today, that is not reliably possible.

Daedalion works with:

* GitHub Copilot’s current file-based instruction model
* Existing IDE behavior
* Standard CI systems

When stronger enforcement primitives exist, Daedalion can evolve to use them — but it does not pretend they exist today.

## “Is this useful if people sometimes bypass it anyway?”

Yes — for the same reason code review is useful even when people sometimes bypass it.

Daedalion:

* Reduces accidental violations
* Raises the cost of ignoring process
* Creates shared expectations
* Makes deviations explicit and reviewable

It is designed for teams that value alignment, not blind obedience.

## “Should I trust AI less or more when using Daedalion?”

Neither.

You should trust AI **more narrowly**.

Daedalion narrows the AI’s role to:

* Working within approved scope
* Following explicit specs
* Executing reviewed tasks

That is safer than letting the AI infer intent from scattered context.

## “Bottom line?”

Daedalion does not try to control AI.

It tries to control **the interface between human intent and AI output**.

If you expect absolute enforcement, Daedalion will disappoint you.
If you want alignment, visibility, and repeatability, it will help.
