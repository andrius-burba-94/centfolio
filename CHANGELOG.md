# Changelog

All notable user-visible changes to Centfolio are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Centfolio is pre-v1; entries appear under the phase that introduced
them, with `[Unreleased]` rolling at the top until the next phase
ships.

## [Unreleased]

## [Phase 2, Manual transactions] 2026-05-31

### Added

- Manual transactions: add, edit, delete from `/transactions`. Hard
  delete with a 5-second Sonner undo toast; after the window closes
  the row is finalised gone.
- Transactions table with Date, Payee, Description, Category, Tags,
  and Amount columns. Amount is right-aligned, tabular figures, with
  mode-appropriate Spent/Earned tint and a sign prefix.
- Slide-in `Sheet` for the new and edit form, opened via
  `?new=true` and `?edit=tx_id` URL state. Click a row to edit.
- Categories: hierarchical with a two-level cap, user-creatable from
  the transaction form (inline create as top-level) and from a
  minimal `/transactions/categories` management page. Ten starter
  categories seed idempotently: Food (Groceries, Restaurant),
  Transport (Gas, Public), Shopping, Bills (Utilities,
  Subscriptions), Income (Salary), Other.
- Tags: flat, multiple per transaction, inline-creatable from the
  transaction form. Chips display selected tags inline.
- Filter bar above the transactions list: free-text search across
  payee, description, and notes; date-range chips (This month
  default, Last month, This year, All time); category and tag
  combobox filters. All filter state is mirrored to the URL via
  `?q=`, `?range=`, `?category=`, `?tags=` so the back button and
  shared links work.
- Dashboard "This month" card: when the user has at least one
  transaction in the current month, the dashboard shows a card with
  the count and a "View all" link to `/transactions`. The Phase 1
  hero stays when the month is empty.
- Money library (`src/lib/money/`): integer-cents storage, locale-
  aware parsing (accepts `.` or `,`), display formatting with
  Lithuanian `,` decimal separator. TDD per ADR-0006.
- Top-bar "Transactions" inline navigation link sitting next to the
  wordmark, alongside the existing Dashboard link.
- New shadcn primitives, token-aligned: `Sheet`, `Table`,
  `Skeleton`, plus a `Combobox` assembled from `Command` and
  `Popover` for category and tag selection.
- Playwright end-to-end coverage of the full Phase 2 happy path:
  log in, add a transaction with category and tag, edit it, see
  it on the dashboard card, filter by search, delete it and let
  the undo window elapse, log out.

### Deferred

- Rule engine for payee → category mapping. Moves to Phase 4
  where synced transactions are auto-classified.
- Sidebar navigation. Top bar gets an inline "Transactions" link
  for now; sidebar lands when a third route earns its keep.
- Settings page, tag management UI, payee autocomplete from past
  payees, amount-range filter, saved filter views, custom sort
  columns, bulk operations, mobile card-list responsive layout.

## [Phase 1, Foundation] 2026-05-22

### Added

- Email/password login backed by PocketBase. A pre-seeded user (via
  the PocketBase admin UI for now) can log in, see the dashboard,
  switch themes, and log out.
- Top-bar shell: Centfolio wordmark in Fraunces, theme toggle
  (system/light/dark via `next-themes`), and a user menu showing
  the signed-in email plus a Log out action.
- Empty dashboard with the hero "Your money, considered." and a
  one-line note that account connection arrives in a later phase.
- Light and dark modes both first-class, hand-tuned in OKLCH per
  the "Modern Lithuanian" design system. Dark mode is warm-ink, not
  a terminal aesthetic.
- Observability: Sentry for error and trace capture, Pino for
  structured server logs. PII capture off by default; tracing
  sampled at 100% under Phase 1 single-user load.
- Deployment pipeline (local → GitHub → VPS) verified end-to-end on
  every push to `main`.
- Idempotent seed script and Playwright end-to-end test exercising
  the full auth happy path in CI against a real PocketBase
  instance.

### Deferred to v1.5

- Register-via-invite, OAuth providers, invite-issuance UI. The
  invite flow is the headline feature of v1.5, not infrastructure
  for v1.

### Deferred to Phase 2 and later

- Sidebar navigation, Table primitive, Skeleton primitive,
  Settings page. Each appears when there's a real route or loading
  state to populate it.
