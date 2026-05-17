# ADR-0006: Testing strategy

- Status: Accepted
- Date: 2026-05-18
- Deciders: Andrius

## Context

Centfolio mixes work that benefits enormously from tests with work
that doesn't. The matching algorithm, the categorization rule engine,
and currency math are pure functions whose correctness is the whole
point — getting them wrong shows up as silently misclassified
transactions and bad totals. The UI, by contrast, changes shape often
during phase work, and snapshot-style tests against it have a track
record of rotting faster than they catch real bugs.

A one-size-fits-all "high coverage everywhere" rule would either drown
the solo evening cadence in test maintenance or, more likely, get
quietly abandoned the first time a phase is overdue. The strategy has
to be honest about where tests earn their keep.

## Decision

Centfolio uses Vitest for unit and component tests, React Testing
Library for component tests, and Playwright for end-to-end coverage.
Pino (a structured JSON logger for Node) is the application logger;
Sentry catches what tests don't.

TDD discipline is applied only to pure-logic modules — currently
`src/lib/matching/`, `src/lib/categorization/`, and `src/lib/money/`.
The qualifier is pure-logic: deterministic input-to-output
transformations with no I/O, no UI state, no external API calls.
Future modules that meet this bar (e.g. a tax-calculation engine, a
portfolio-rebalance algorithm) inherit the same discipline. In those
modules, no production code is written without a failing test first,
and the branch-coverage target is 85%. Everywhere else, tests are
written where they earn their keep and no coverage target is
enforced.

End-to-end coverage is fixed at roughly ten Playwright paths covering
the critical happy paths through v1 (the full list is maintained in
`.claude/rules/testing.md`). External APIs — GoCardless, Gemini,
Twelve Data — are mocked at the SDK boundary only; the rest of the
codebase, including PocketBase, is exercised against a real instance.

## Alternatives considered

**TDD everywhere.** Industry-defensible, popular as an aspiration.
Rejected because the discipline is expensive and the UI is the part
of the codebase that changes shape most often — front-loading tests
against shapes that haven't stabilized produces tests that get
deleted, not tests that catch bugs. The pure-logic modules are
exactly the inverse case, so they keep the full discipline.

**Snapshot tests for UI components.** Cheap to write, give the
illusion of coverage. Rejected because nobody updates them
thoughtfully — the dominant interaction with a failing snapshot is
"regenerate and move on," which means snapshots catch nothing real
while still appearing in CI as a passing signal. `.claude/rules/testing.md`
makes this an explicit no.

**Mock PocketBase in component and integration tests.** Faster
tests, no setup. Rejected because PocketBase's quirks (filter rules,
no transactions, the `userId`-scoping behavior from
`.claude/rules/pocketbase.md`) are exactly the kind of thing a mock
cannot fake honestly. Tests that pass against a mock and fail
against the real database are worse than no tests.

**Cypress instead of Playwright.** Plausible alternative. Rejected
because Playwright's debugging tools (trace viewer, video on retry,
time-travel inspection) and parallel execution per browser context
are noticeably better for a solo developer who debugs alone. The
migration cost later would be larger than the choice cost now.

## Consequences

- **Good:** The parts of Centfolio that have to be correct — money
  math, the match algorithm, categorization confidence — get the
  full TDD treatment. Bugs in these modules are caught at the unit
  level, where they're cheapest to fix.
- **Good:** The UI is allowed to move fast without dragging a test
  suite behind it. When a screen's shape changes during a phase,
  there are no rotted snapshot tests to update first.
- **Good:** E2E coverage is scoped to a fixed, small set of paths
  rather than an open-ended target. The full list lives in
  `.claude/rules/testing.md` and is the contract for what "the app
  works" means in CI.
- **Bad:** Integration glue (server actions, sync orchestration) sits
  in the gap between unit tests and E2E. It is tested where it earns
  its keep but is the most likely place for bugs to slip through.
  Sentry in production is part of how we catch what we missed.
- **Bad:** Running against a real PocketBase in tests means tests
  are slower and require fixture management. The trade is honest
  signal for speed; worth it, but the speed cost is real.
- **Neutral:** Coverage numbers are only meaningful inside the
  TDD-scoped modules. The repo-wide coverage percentage is not a
  goal and should not be reported as one.

## References

- `.claude/rules/testing.md` — the operational rules this ADR
  formalizes, including the ten E2E paths
- `.claude/rules/pocketbase.md` — why mocking PocketBase is a bad
  idea
- `docs/adr/0001-stack.md` — Vitest, Playwright, and Sentry are
  established as part of the stack there
