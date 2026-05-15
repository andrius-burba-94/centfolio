# Agent Behavior Guidelines

Universal rules for AI coding agents (Claude Code, Gemini CLI, others)
working in any of Andrius's repositories. Project-specific rules layer
on top of this file in each project's CLAUDE.md.

These guidelines bias toward caution over speed. For trivial fixes
(typos, obvious one-liners), use judgment. Everything else gets the
full rigor.

---

## Four principles

### 1. Think before coding

Don't guess. Don't hide confusion. Surface tradeoffs.

- State your assumptions explicitly. If anything is uncertain, ask
  before writing code, not after.
- When a request admits multiple reasonable interpretations, name them
  and let the user pick. Don't pick silently.
- Push back when a simpler approach exists. The user wants the right
  answer, not the agreeable one.
- When confused, stop and say what's unclear. Guessing wrong on a
  domain concept produces bugs that look like correct behavior.

### 2. Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, write 50.

The test: would a senior engineer call this overcomplicated? If yes,
simplify before submitting.

### 3. Surgical changes

Touch only what you must. Clean up only your own mess.

- Don't improve adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match the existing style, even when you'd write it differently.
- If you notice unrelated dead code or a bug, mention it in chat —
  don't fix it in the same PR.
- Remove imports, variables, or functions that *your* changes made
  unused. Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's
request.

### 4. Goal-driven execution

Define success criteria. Loop until verified.

Transform imperative tasks into verifiable goals:

| Instead of | Use |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Tests pass before and after, no behavioral change" |

For multi-step tasks, state the plan first:

[Step] → verify: [check]
[Step] → verify: [check]
[Step] → verify: [check]


Strong success criteria let you loop independently. Weak criteria
("make it work") require constant clarification.

---

## Non-negotiable rules

These are bright lines. Violating any of them is a bug, regardless
of intent.

1. **Never edit on a production server directly.** All changes go
   local → PR → main → automated deploy. No exceptions.
2. **Never commit secrets.** No API keys, tokens, passwords, or
   credentials in code or commits. `.env.local` is gitignored;
   `.env.example` has placeholders only.
3. **Never push directly to `main`.** Feature branches and PRs only.
   Branch protection enforces this; don't work around it.
4. **Never silently swallow errors.** Caught errors must be rethrown,
   logged with context, or surfaced to the user. Empty `catch {}` is
   a bug.
5. **Never use `any` in TypeScript.** Use `unknown` and narrow, or
   define the type. `// @ts-ignore` and `// @ts-expect-error` require
   an inline comment explaining why.

---

## Plain language

Code, copy, comments, and chat use everyday words, not jargon. This
is a universal preference; each project may extend it with a
project-specific vocabulary table.

Examples that apply everywhere:
- "When the user clicks save" not "On the save event handler invocation"
- "This function returns the user" not "This function yields a User instance"

---

## Workflow

The expected loop for any non-trivial work:

1. **Brainstorm in chat** with the user. Surface assumptions. Pick
   an approach.
2. **Write a plan** to `docs/plans/{feature-name}.md`. Get user
   approval before coding.
3. **Implement in granular commits** following conventional commits
   format (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
   One logical change per commit.
4. **Open a PR** with the project's template filled out: what, why,
   screenshots if UI, test plan, linked ADR if architectural.
5. **User reviews the PR** on GitHub and squash-merges.
6. **Deploy runs automatically** on merge to `main`.

For trivial fixes, skip the plan but keep the PR.

---

## When you're stuck

If you hit something genuinely ambiguous and can't resolve it from
the project files (CLAUDE.md, CONTEXT.md, ADRs, current plan, or
existing code):

1. **Stop.** Don't guess.
2. **State the ambiguity** clearly: what you were trying to do,
   what you don't know, what options you see.
3. **Wait for direction.**

Asking is seconds; guessing wrong is hours. This is not weakness;
it's professionalism.
