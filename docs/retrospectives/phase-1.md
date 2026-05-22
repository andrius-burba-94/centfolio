# Phase 1 Retrospective

- Phase: 1, Foundation
- Shipped: 2026-05-22
- PRs: 11 (plan + 5 phase PRs + 2 docs + 1 fix + 2 follow-ups)
- Author: Andrius, with Claude
- Purpose: capture lessons before Phase 2 inherits the same patterns

## What Phase 1 was

Login, top-bar shell (theme toggle + user menu), empty dashboard,
deployment pipeline, Sentry + Pino observability, and one
Playwright E2E test gating the auth happy path on every PR. Seven
strategic deferrals to v1.5 and later phases (register-via-invite,
OAuth, sidebar nav, Settings, Table/Skeleton/Avatar primitives).

## What worked, worth doing again in Phase 2

### Grilling the plan before coding

Twelve rounds of `/grill-with-docs` on Phase 1 scope. Surfaced
real decisions (OAuth defer, invite-flow defer, primitive trim,
sidebar defer, theme toggle UX, observability scope) and produced
a five-PR breakdown that didn't need re-cutting mid-execution.
Worth the time; saved more time downstream.

### Twelve-round DESIGN.md walkthrough

Hand-writing DESIGN.md one section at a time, with options and
recommendations per round, caught real bugs before they shipped:
the Brand-vs-Button Decoupling Rule (contrast bug on the primary
CTA), the Sign-First Rule's "label" carrier (Round 12 fix), the
em-dash drift (separate scrub commit). Post-Phase-1
`/impeccable document` confirmed near-perfect alignment between
spec and shipped code; the walkthrough investment paid off.

### `/impeccable critique` on static mockups before primitives

Critique surfaced four real issues (focus rings absent, initials
circle as `<div>` not `<button>`, theme icon mode-reflection,
`prefers-reduced-motion` not honored) that would have shipped to
PR 4 unfixed. Static-HTML mockups (not React) avoided a
half-finished surface in production for the review window.

### Five-PR breakdown

Observability → Design system foundation → Primitives + mockup
→ Vertical slice → Seed + E2E + sign-off. Each PR was
independently shippable. Each commit traced to a single concern.
PR 4 (the vertical slice) was the heaviest at 17 files but
splitting it would have created broken intermediate states.

### Defensive patterns that paid off

- `logError(err, ctx)` helper (PR 1): every server error path
  used it without ceremony
- `find-or-create` idempotent seed (PR 5): handled re-runs
  locally without resetting state
- Seed self-verify after create: distinguished seed bugs from
  Next.js bugs when CI failed; saved an iteration
- Idempotent install script with SHA verification: re-runs are
  no-ops, fresh downloads verify integrity

### Conversation pattern

Bidirectional grilling worked. The corrections that mattered
most were specific and load-bearing: the Initials-Not-Avatar
call, the Brand-vs-Button contrast bug, the Sign-First "label"
carrier, the schema-binary-not-committed verification, the
em-dash separate-sentence rewrite. Without those, weaker code
would have shipped.

## What didn't work, worth pre-empting in Phase 2

### Em-dash drift

The project rule (no em dashes in copy) was violated four times:
DESIGN.md prose (27 instances, scrubbed in a separate commit),
PRODUCT.md prose (caught earlier), multiple commit messages.
Self-vigilance wasn't enough. Mechanical enforcement needed.

**Action:** add a pre-commit hook that fails the commit if any
staged file contains an em-dash character or a literal double-hyphen.
One line, saves an audit pass forever.

### Plan-doc drift in-flight

Phase 1 plan was written before Sentry's SDK was installed and
named files. The plan said `sentry.client.config.ts`; Sentry SDK
≥8.28 uses `instrumentation-client.ts`. The plan said the PB
binary was committed; it wasn't (`.gitignored`). Both caught
in-flight and fixed without ceremony.

**Action:** treat the Phase 2 plan as a living document.
Update it in the same commit as the discovery, not in a
separate "plan drift" PR. Reference the corrected plan from
the PR description.

### CI iteration cost

PR 19 took five CI rounds to go green: Vitest glob over E2E
specs, PocketBase checksum filename, PB users `authRule = ""`
blocking auth, debug-log to find the password-length mismatch,
React 19's form-reset-on-action-completion. Each round was
~1 minute CI plus context-switch overhead.

**Action:** add a `npm run ci:e2e` script that mirrors the
`.github/workflows/e2e.yml` steps so failures show up locally
instead of after a push. Specifically:
- install PB via the script
- run migrate up + superuser upsert + serve
- wait-for-port
- run seed
- npm run build && npm run start in background
- wait-for-port
- npx playwright test

### Schema vs migrations drift

`pocketbase/schema.json` showed `authRule: ""` but production
worked because PB had been manually configured. CI surfaced
the drift painfully. The `authRule` patch in `scripts/seed.ts`
is a hack covering up a real schema-management issue.

**Action:** before Phase 2 lands its first new collection
(transactions), commit a migration that explicitly sets
`authRule` to the permissive expression for the users
collection. Then drop the `seed.ts` patch. Validate
`schema.json` matches what migrations produce; add a CI step
that re-exports schema after `migrate up` and diffs against
the committed file.

### Defensive parsing missed in the cookie path

The cookie `split("=", 2)` bug shipped to local dev and CI
before catching. JavaScript's split-with-limit silently drops
content; the fix was to serialize JSON directly and parse
verbatim on read.

**Action:** for Phase 2 server-action work (transaction
create/update/delete, category tree, rule matching), default
to defensive: validate at boundaries with Zod, log with
context, idempotent where re-runnable. Specifically for any
shape-round-trip (cookie, JSON, query-param parsing), assume
the round-trip can break; verify with at least one boundary
test.

### Branch hygiene at turn boundaries

Two committed-on-wrong-branch incidents: once on local `main`
after `chore/phase-1-plan` was merged and remotely deleted,
once on `chore/phase-1-observability` (stale base) after PR 15
merged. Both recoverable via cherry-pick + branch ref reset,
but added churn.

**Action:** before any commit, run `git status -b`. After any
merge ack from the user, run `git fetch origin --prune` and
verify the working branch before staging.

## Decisions Phase 1 made that Phase 2 should respect

These were earned through grilling or implementation pain;
don't unearn them by accident.

- **Token vocabulary is shadcn-named.** `background` / `foreground`
  / `card` / `muted` / `primary` / `destructive`. Custom additions
  (`placeholder`, `positive`, `primary-hover`, `primary-active`).
  Phase 2 shouldn't introduce new role-token names without
  /impeccable-grade justification.
- **No em dashes in copy** (mechanical enforcement coming).
- **`logError` is the only path from server to Sentry.** Don't
  call `Sentry.captureException` directly from feature code.
- **Plain `<form action={serverAction}>` for forms** until RHF
  earns its keep. Phase 2 transaction forms have multiple fields;
  evaluate RHF on that surface specifically rather than reflexively.
- **`data-testid` on every interactive element** that an E2E
  test will touch. Per `.claude/rules/testing.md`.
- **`requireUser()` at the top of every protected server
  component or server action.** Don't make middleware the only
  auth gate.
- **Cookie session payload is JSON of `{ token, record }`.**
  Don't switch to `exportToCookie` / `loadFromCookie`. They
  drift across PB SDK versions.
- **Dropdown destructive actions use `onSelect` +
  `useTransition`**, not form-action inside `DropdownMenuItem`.
  Locked into DESIGN.md (User menu spec) and codified.

## Decisions Phase 1 made that Phase 2 might revisit

- **Theme toggle UX shape** (three-radio dropdown). Works.
  Phase 4+ might want a cycle button on mobile if the dropdown
  feels heavy on small screens. Worth revisiting once mobile
  layout work begins.
- **Static HTML mockups for `/impeccable critique`.** Worked
  for the empty dashboard. Phase 2's transaction list mockup
  might benefit from rendering against real `Card` and `Input`
  React primitives in an isolated route (rather than a static
  HTML file). Either approach is defensible.

## Carry-forward follow-ups (not blocking)

Captured from Phase 1 PR known-issues sections so they don't
get lost.

- **Local lint flags `.claude/worktrees/...`.** One-line
  `eslint.config.mjs` ignore would fix. Not affecting CI.
- **Sentry source-map upload runs on every E2E build.**
  Conditional upload (only on main push) would keep Sentry
  releases clean. Affects observability hygiene, not
  correctness.
- **Conditional focus-restoration for keyboard users in
  dropdowns.** PR 21 documented the workaround. If keyboard
  accessibility becomes a v1.5 requirement, implement the
  `lastInteractionType` ref pattern.
- **Skeleton primitive** (deferred to Phase 2 or Phase 4 per
  Phase 1 plan). Phase 2 transactions might justify it for the
  loading state.

## Concrete action items for Phase 2 kickoff

Before the first Phase 2 PR opens:

1. **Pre-commit em-dash hook.** `.git/hooks/pre-commit` or
   Husky equivalent. Fails commit if `git diff --cached` matches
   an em-dash character or a literal double-hyphen sequence.
   One-line.
2. **Local CI emulation script.** `npm run ci:e2e` that
   mirrors `.github/workflows/e2e.yml`.
3. **Commit a migration that sets `users.authRule` to the
   permissive expression.** Drop the patch in `scripts/seed.ts`.
4. **Schema-drift CI check.** After `migrate up`, export current
   schema and diff against `pocketbase/schema.json`. Fail if
   drift exceeds N lines or contains structural changes.
5. **Phase 2 plan doc** at `docs/plans/phase-2-transactions.md`,
   informed by this retrospective.

## What I'd tell future-Andrius about Phase 1

The grilling-then-build pattern is a real investment but pays back
many times over. Spend the time. Bidirectional grilling, where
both sides correct each other's drift, is what makes it work;
neither side alone catches enough.

The work that mattered most happened before any code:
- Lock the vocabulary in `CONTEXT.md`
- Lock the audience and voice in `PRODUCT.md`
- Lock the visual system in `DESIGN.md`
- Lock the scope in `docs/plans/`
- THEN write code

Code that referenced these locked anchors was easier to write and
easier to defend. Code that drifted from them surfaced as bugs at
exactly the rate the anchors were violated.

The hardest hour was debugging the Playwright password-length=27
mystery in CI. The hour I'd most want back was the cookie
`split("=", 2)` bug, which should have been caught with one
boundary test before merging PR 18.

Phase 2 starts with that lesson: write the boundary test before
the boundary code.
