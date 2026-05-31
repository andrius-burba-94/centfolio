# Changelog

All notable user-visible changes to Centfolio are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Centfolio is pre-v1; entries appear under the phase that introduced
them, with `[Unreleased]` rolling at the top until the next phase
ships.

## [Unreleased]

## [Phase 3, Receipts] 2026-05-31

### Added

- Receipts at `/receipts`: list, detail, entry. Two input modes
  sharing one parse/confirm/store pipeline:
  - **Text**: paste the body of an emailed receipt (Maxima Ačiū,
    IKI Bonus, etc.). The Save action creates a `parsing` row and
    navigates to the detail page.
  - **Photo**: phone-camera capture or desktop file picker. JPEG,
    PNG, WebP, and HEIC inputs accepted; server-side `sharp` pipeline
    normalizes to JPEG quality 85 at max 1600px long-edge, auto-
    rotates from EXIF, and strips EXIF before storage and the
    Gemini call. Raw upload cap 15 MB; stored cap 5 MB.
- Detail page (`/receipts/[id]`) uses a sync-behind-navigation
  pipeline: the shell (header, source-evidence pane, status badge)
  renders synchronously while the Gemini parse streams in behind a
  `<Suspense>` boundary with a skeleton fallback. The detail RSC
  catches Gemini failures, writes them as `failed` state to the row,
  and renders the failed-state UI with a Try again affordance.
- Review form with inline editing of merchant, date, and line item
  names. Cut-Into-the-Page rule on focus (transparent at rest, ring
  on focus). Discount and split-tender lines surfaced as a
  subordinate-row treatment with negative `lineTotalCents` per
  CONTEXT.md.
- Gemini 3.5 Flash via the official `@google/genai` SDK with
  `responseMimeType: 'application/json'` and `responseJsonSchema`
  derived from the Zod source-of-truth schema. System instructions
  Lithuanian-receipt-aware: preserves discount and split-tender
  lines as separate negative line items rather than folding them.
- `/about/privacy` page: honest disclosure covering what data
  leaves Centfolio (photo or pasted text -> Google's Gemini), the
  pinned model identifier, retention, and a link to ADR-0003.
- `Receipts` inline link in the top nav alongside Dashboard and
  Transactions.
- `parseAttempts` cap per receipt (default 3, server-side reset
  only) plus account-level billing budget and API quota cap on the
  GCP project: per-row defense against orphaned re-parses, account-
  level defense against a leaked key or runaway loop.
- Playwright E2E coverage of both modes, intercepting Gemini at the
  SDK boundary via a server-side fixture-file bypass.

### Deferred

- Real receipt fixture recording with PII-scrubbed Maxima / IKI
  bodies. The helper format and the SDK-boundary bypass are in
  place; recording from real receipts will land alongside Phase 5
  match work as prompt iteration ramps.
- Phase 5 match logic: receipts and transactions stay unconnected.
  CONTEXT.md keeps `matched` as a documented future state until
  Phase 5 adds the `transactionId` relation.
- Sidebar navigation: top-bar inline link pattern continues. The
  honest trigger is 5+ primary destinations, likely Phase 4 or 6.
- Fiscal / receipt number extraction (the `Fiskalinis numeris`
  line on Lithuanian receipts). Out of Phase 3 scope; documented
  in `.claude/rules/receipts.md` as the natural `(userId,
  fiscalNumber)` dedup key when dedup earns its keep.
- Editing the receipt total in the review UI. In practice Gemini
  extracts the bill total correctly; editing would land as polish
  if real use surfaces a need.

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
