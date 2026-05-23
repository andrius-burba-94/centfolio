# Phase 2, Manual transactions

- Status: Planning
- Updated: 2026-05-23
- Owner: Andrius
- Prerequisites: Phase 1 shipped (CHANGELOG.md records 2026-05-22),
  retrospective lessons applied (docs/retrospectives/phase-1.md),
  Phase 2 prep merged (pre-commit em-dash hook, `npm run ci:e2e`,
  `users.authRule` migration).

## Goal

Centfolio becomes usable as a basic manual spending tracker. A user
records cash and card purchases manually, classifies them with
categories and tags, and finds any past transaction in under three
clicks. Phase 2 introduces the first real domain data and the first
real interactive surfaces.

## What's in scope

- Transactions: add, edit, delete (hard delete + undo toast)
- Categories: hierarchical, two-level cap, user-creatable, minimal
  seed (10 starter categories)
- Tags: flat, multiple per transaction, user-creatable, autocomplete
- Filtering and search: free-text, date range, category, tag, all
  inline, URL-state synchronised
- Notes field on transactions (searchable)
- Money lib (TDD per ADR-0006)
- New shadcn primitives: Sheet, Table, Skeleton, Combobox

## What's deferred

- **Rule engine for merchant to category mapping**, moved to Phase 4
  where it auto-categorises synced transactions and the typing
  problem actually exists. The grilling argument: rules earn their
  keep when there are 50+ transactions a week to auto-classify
  (Phase 4 sync); for 5-10 manual transactions a day in Phase 2,
  manual categorisation works fine and the rule-engine complexity is
  not yet load-bearing.
- Sidebar nav: deferred again, top-bar gets an inline "Transactions"
  text link. The sidebar lands when 3+ routes justify it (Phase 3
  Receipts is the next likely moment).
- Settings page: deferred until a non-categories setting needs a
  home. Category management lives at `/transactions/categories` in
  Phase 2.
- Tag management UI: defer until "I have 50 tags and want to prune"
  is a real complaint.
- Amount-range filter, saved filter views, custom sort columns: Phase
  7 dashboards.
- Bulk operations on transactions.
- Mobile-specific table to card-list responsive redesign: the table
  is horizontally scrollable on phone for v1; full responsive pass
  later.
- Multi-currency (ADR-0001 commits to EUR; reaffirm).

## Acceptance test, what "Phase 2 done" means

`tests/e2e/transactions.spec.ts`, single spec, asserted via
`data-testid`:

1. Log in as seed user with 10 starter categories already seeded.
2. GET `/` -> 307 to `/dashboard`. Top bar shows wordmark and a
   "Transactions" inline link.
3. Click the link -> `/transactions`. Empty state visible.
4. Click "Add transaction". Sheet opens, URL becomes
   `/transactions?new=true`.
5. Fill: merchant "Maxima", sign-toggle Spent, amount "34,27", date
   today, category "Food > Groceries", tags "grocery", description
   "weekly run", notes "wine for friends".
6. Save. Sheet closes, row in list, URL returns to `/transactions`.
7. Click the row. Sheet opens at `?edit=tx_id` with the values
   pre-filled.
8. Edit description to "weekly run, extras", save. List reflects the
   new description.
9. Type "Maxima" in the search input. List filters to one row, URL
   becomes `/transactions?q=Maxima`.
10. Clear search. Click Delete on the row. Row vanishes from list,
    Sonner toast appears with "Undo".
11. Wait 5 seconds. Toast disappears, transaction is finalised gone.
12. Navigate to `/dashboard`. Card shows "1 transaction this month"
    with a link back to `/transactions`. (Card only renders when at
    least one transaction exists this month; otherwise the Phase 1
    hero stays.)
13. Log out, return to `/login`.

The test exercises the full vertical slice plus the dashboard bridge.
Filter combinatorics (date + category + tag together) are unit-tested
in PR 4, not E2E.

## Pre-work before PR 1

No external account signups (unlike Phase 1's Sentry). The /impeccable
teach output (PRODUCT.md, DESIGN.md) from Phase 1 still applies; no
re-teach.

Single pre-work item: the money lib's locale handling deserves an
ADR if it would surprise a future reader. Decision: accept both `.`
and `,` on input, display with `,` (Lithuanian convention). If we
later go multi-locale, the parser needs work but the storage layer
(integer cents) is locale-free. Worth an ADR-0007 if the user wants
the decision recorded; defer otherwise.

## PR breakdown

Five PRs. Same cadence as Phase 1 (retrospective said it worked).

### PR 1, Foundations

No rendered UI changes. Risk-front-loads the money lib and the new
primitives so they land before any feature work depends on them.

- `src/lib/money/`: TDD per ADR-0006
  - `format.ts`: integer cents to display string ("34,27" or "1.250,00")
  - `parse.ts`: user input string to integer cents (accepts both `.`
    and `,`, normalises)
  - `sum.ts`: sum an array of cents
  - Full Vitest unit coverage, 85%+ branch
- Scaffold new shadcn primitives via `npx shadcn@latest add`:
  - `sheet` (slide-in panel for add/edit form)
  - `table` (default list rendering)
  - `skeleton` (loading state)
  - Combobox: assembled in feature code from `command` + `popover`
    primitives; shadcn does not ship a combobox primitive directly.
    `CategoryCombobox` is single-select with inline-create-as-top-level;
    `TagCombobox` is multi-select with chips.
- Token-align each new primitive per the PR 17 pattern. Strip
  unused variants, replace stale token names if shadcn defaults
  use shadcn-ecosystem aliases not in our system.

### PR 2, Schema, seed, reference mockup, /impeccable critique gate

- PB migrations:
  - `categories`: name, parentId (nullable, self-relation), userId,
    timestamps. Two-level cap enforced in app code, not in PB rule.
  - `tags`: name, userId, timestamps. Unique on (userId, name) so
    Andrius cannot create duplicate tags.
  - `transactions`: amount (integer cents, signed), date, merchantName,
    description, notes, categoryId (nullable), tagIds (multi-relation),
    userId, timestamps.
  - Composite index `(userId, date)` on transactions for default list
    query.
- PB rules per collection, userId-scoped:
  - listRule, viewRule: `userId = @request.auth.id`
  - createRule: `@request.auth.id != "" && @request.body.userId = @request.auth.id`
  - updateRule: `userId = @request.auth.id && @request.body.userId = @request.auth.id`
  - deleteRule: `userId = @request.auth.id`
- `pocketbase/schema.json` updated to match migrations.
- `scripts/seed.ts` extended to seed 10 starter categories for the
  test/Andrius user idempotently:
  - Food (with Groceries, Restaurant children)
  - Transport (with Gas, Public children)
  - Shopping
  - Bills (with Utilities, Subscriptions children)
  - Income (with Salary child)
  - Other
- `docs/design/mockups/transactions-light.html` and
  `transactions-dark.html`: list with filter bar, table with sample
  rows, sheet-open variant showing the add form. Self-contained
  static HTML using the token system.
- `/impeccable critique` runs on both mockups, both modes. Findings
  fold in before merge.

### PR 3, Categories and tags layer

The data layer transactions depend on. CRUD only, no transaction
references yet.

- Server actions, all Zod-validated, userId derived from session
  never accepted from client:
  - `createCategory(name, parentId?)`
  - `updateCategory(id, name)`
  - `deleteCategory(id)`. If a category has children, refuses. If a
    transaction uses the category, refuses with a message naming the
    transaction count.
  - `listCategories()`: returns hierarchical structure.
  - Same shape for tags (`createTag`, `updateTag`, `deleteTag`,
    `listTags`), no parent.
- `<CategoryCombobox>`: single-select, inline-create-as-top-level,
  displays leaves as "Parent > Child", top-levels as "Parent".
  Type-to-filter.
- `<TagCombobox>`: multi-select with chips, inline-create.
- `/transactions/categories/page.tsx`: minimal management page. Lists
  categories grouped by parent. Per-row: rename (inline), delete
  (with confirmation toast if it would orphan transactions or
  children). No reorder, no parent-change.

### PR 4, Transactions vertical slice

The heavy PR. Splits within the branch into intermediate commits per
working layer so mid-review course corrections are cheap (per Phase 1
retrospective lesson on PR 19's iteration cost).

- Server actions, all Zod-validated, userId derived from session:
  - `createTransaction(...)`. Optimistic on the client side via React
    transitions; server returns the created row.
  - `updateTransaction(id, ...)`.
  - `deleteTransaction(id)`. Returns immediately; client shows undo
    toast.
  - `undoDeleteTransaction(id)`: re-creates from the cached row the
    client held during the toast window. Server treats it as a new
    create with the original id preserved (transaction collection
    allows client-supplied id on create for this case, or
    alternatively the delete is soft-pending in memory and only
    fires after the 5s window without an undo).
  - `listTransactions(filters)`: filter shape is `{ q, from, to,
    categoryId, tagIds }`. Returns paginated rows (50/page, sorted
    by date descending).
- Mount `<Toaster />` in `src/app/providers.tsx`. First consumer is
  the undo-delete pattern in this PR.
- `/transactions/page.tsx`:
  - Filter bar above the table: search input, date-range chips
    (This month default, Last month, This year, All time, Custom),
    `<CategoryCombobox>`, `<TagCombobox>`, "Clear filters" link.
    URL state via `?q=`, `?from=`, `?to=`, `?category=`, `?tags=`.
  - Table columns: Date, Merchant, Amount (right-aligned, tabular
    figures, mode-appropriate `text-spent` or `text-positive` tint,
    sign prefix), Category, Tags.
  - Pagination: page-N links at the bottom. 50/page default.
  - Skeleton loading state on first load.
  - Empty states: "No transactions yet. Add your first." (with
    Primary button). When filters yield no results: "No
    transactions match. Clear filters."
- `<TransactionSheet>` component, rendered by `/transactions` when
  `?new=true` or `?edit=tx_id`. Form fields:
  - Merchant (text, required, autocomplete from past merchants the
    user has typed)
  - Sign toggle (Spent default, Earned alternative)
  - Amount (text input with `€` prefix, accepts `34,27` or `34.27`,
    parses to cents at submit)
  - Date (date picker, defaults today, accepts past and future)
  - Category (`<CategoryCombobox>`, optional, empty leaves the
    transaction uncategorised)
  - Tags (`<TagCombobox>`, optional, multi)
  - Description (text, optional)
  - Notes (textarea, optional)
  - Primary button: "Save". Ghost button: "Cancel" (closes sheet).
- Delete UX:
  - Click trash icon on row.
  - Row removed from list immediately (optimistic).
  - Sonner toast "Transaction deleted." with "Undo" action button.
  - 5 second timeout. Until timeout: clicking Undo restores the row.
    After timeout: server finalises the delete.
- Intermediate commits inside the PR 4 branch, one per working state:
  1. List page renders with PB data via mock or seeded transactions.
     Table primitive working. No add/edit yet.
  2. Sheet opens via `?new=true`, form fields render, save creates a
     transaction.
  3. Sheet opens via `?edit=tx_id`, form is pre-filled, save
     updates.
  4. Delete row, undo toast, finalise after window.
  5. Filter bar with URL state, all four dimensions.

### PR 5, E2E and dashboard evolution, sign-off

- `tests/e2e/transactions.spec.ts`: the acceptance test above.
- `src/app/(app)/dashboard/page.tsx` evolution:
  - If the user has zero transactions this month, render the Phase 1
    hero unchanged.
  - If the user has at least one, render a minimal card:
    `Card` with `text-title font-semibold` heading "This month",
    `text-display` numeric showing transaction count, body text
    "transactions recorded" plus a "View all" link to
    `/transactions`. Tabular figures.
- `CHANGELOG.md`: Phase 2 entry, what shipped, what deferred.
- `PROJECT.md`: Phase 2 marked ✓ shipped with date.

## Open questions deferred to execution time

- **Date input policy**: today default, allow past, allow future. The
  alternative (block future dates to prevent typos) is conservative
  but blocks legitimate forward planning. Default to permissive.
- **Tag display in list**: chips truncated to fit, hover-card on
  overflow. Decide in PR 4 component design.
- **Undo-delete server contract**: in-memory pending vs immediate
  delete with re-create on undo. PR 4 implements; lean toward
  in-memory pending (a server-side timeout that finalises the delete
  after the toast window) to avoid the complications of preserving
  ids across delete+create.
- **Merchant autocomplete source**: distinct merchant strings the
  user has typed, sorted by most-recent-use. Stored as a derived
  query, no extra collection.
- **CategoryCombobox display when category is uncategorised**:
  placeholder "Uncategorised". The transaction lifecycle states from
  CONTEXT.md call this "uncategorized"; UI string is the same.

## References

- PROJECT.md Phase 2 goal and success criteria
- CONTEXT.md (Transaction, Category, Tag, AI suggestion definitions)
- docs/retrospectives/phase-1.md (lessons applied)
- DESIGN.md token vocabulary, especially `text-spent`/`text-positive`
- ADR-0001 stack choices (EUR only, integer cents storage)
- ADR-0006 testing strategy (TDD for money lib)
- .claude/rules/money.md (integer cents discipline)
- .claude/rules/server-actions.md (Zod, userId scoping, error
  surfacing)
- .claude/rules/pocketbase.md (filter syntax, requestKey, no
  transactions)
- .claude/rules/testing.md (data-testid for E2E)
