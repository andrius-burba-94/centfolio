---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "tests/**"
  - "src/lib/matching/**"
  - "src/lib/categorization/**"
  - "src/lib/money/**"
---

# Testing

## Where TDD applies

Full red-green-refactor TDD is reserved for pure-logic modules:

- `src/lib/matching/` — receipt-to-transaction algorithm
- `src/lib/categorization/` — rule engine, AI confidence scoring
- `src/lib/money/` — currency math

In these modules, no production code is written without a failing
test first. Target 85%+ branch coverage.

## Where TDD doesn't apply

UI components, server actions, integration glue: write tests where
they earn their keep, but don't enforce TDD discipline. No coverage
target for UI.

## E2E (Playwright)

Roughly 10 paths total across v1 and v1.5, covering the critical
happy paths:

1. Log in as a seeded user, switch theme, log out (Phase 1)
2. Add a manual transaction with a category (Phase 2)
3. Upload a receipt, confirm extraction (Phase 3)
4. Connect a bank (mocked GoCardless), trigger sync (Phase 4)
5. Match a receipt to a transaction (Phase 5)
6. Add a holding, see it on the dashboard (Phase 6)
7. Set a budget, see progress against it (Phase 7)
8. Filter transactions by tag (Phase 7)
9. View "Needs review" list and accept an AI suggestion (Phase 4 or
   Phase 7, depending on when the list lands)
10. Sign up via invite, log in (v1.5 — the invite flow's headline
    test)

E2E tests run against a seeded test database, not production. The
seed strategy is find-or-create idempotent: a `pnpm seed` (or
equivalent) script creates the canonical test user via PocketBase's
admin API, reading credentials from `POCKETBASE_ADMIN_EMAIL` /
`POCKETBASE_ADMIN_PASSWORD`. In CI, PocketBase is spawned as a
background process with a wait-for-port helper before Playwright
starts.

## Assertion style

The choice of selector depends on the test type:

- **Component tests (Vitest + RTL).** Query by accessible name and
  role first (`getByRole`, `getByLabelText`). Fall back to
  `data-testid` only when no accessible query expresses the intent
  (e.g. asserting an empty-state container that has no role of
  its own).
- **E2E tests (Playwright).** Assert by `data-testid`, not by
  user-facing copy. Copy gets edited often; `data-testids` survive
  copy changes and read as "this test cares about the *thing*, not
  the wording on it." Reserve copy assertions for tests where the
  copy itself is the behavior under test (e.g. an error message's
  exact wording).

## Test shapes

- Vitest for unit and component tests.
- React Testing Library for component tests (query by accessible
  name and role, not by class or test-id when avoidable).
- Playwright for E2E.
- Each test must have a name that describes the behavior, not the
  implementation: `it('matches a receipt within 1 day of the transaction')`
  not `it('returns matched: true')`.

## Mocking

- Mock external APIs (GoCardless, Gemini, Twelve Data) at the SDK
  boundary, not deeper.
- Don't mock your own code unless isolating a pure function for
  unit testing — prefer integration tests with real
  in-memory PocketBase where feasible.
- No snapshot tests for UI. They rot and nobody updates them
  thoughtfully.
