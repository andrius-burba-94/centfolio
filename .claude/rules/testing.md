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

Roughly 10 paths total in v1, covering the critical happy paths:

1. Sign up via invite, log in, log out
2. Add a manual transaction with a category
3. Upload a receipt, confirm extraction
4. Connect a bank (mocked GoCardless), trigger sync
5. Match a receipt to a transaction
6. Add a holding, see it on the dashboard
7. Set a budget, see progress against it
8. Switch theme (light/dark)
9. Filter transactions by tag
10. View "Needs review" list and accept an AI suggestion

E2E tests run against a seeded test database, not production.

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
