# Centfolio

> A curated ledger of your financial life.

Centfolio is a personal finance application that combines bank transactions,
itemized receipts parsed by AI, and investment holdings into a single calm,
considered view of where your money actually goes.

---

## Why Centfolio exists

There are three categories of personal finance tools today, and each has a
hole the others don't fill.

**Bank apps** (SEB, Revolut, Wise) tell you a charge happened — "Maxima X
−€34.27" — but never what you bought. The merchant line is the limit of
their detail.

**Budget apps** (YNAB, Lunchmoney, Monarch) ask you to manually classify the
same transactions, then give you charts. They don't read your receipts,
and most of them assume you're American.

**Receipt apps** (Maxima Ačiū, IKI Bonus) keep your itemized data trapped
inside the merchant's own ecosystem. You can see your last Maxima receipt,
but not how it relates to last week's IKI run or this month's spending.

Centfolio's wedge is the **match** — when the bank says €34.27 at Maxima,
the receipt says €8 was wine and €4 was oat milk. Bank apps can't do this.
Receipt apps don't have your bank data. Budget apps don't read receipts.
The combination is the point.

A second wedge: Centfolio is **built in Vilnius for the Baltic banking
landscape first**, with SEB Lithuania as the primary integration. Most
budget apps support Lithuanian banks as an afterthought, if at all.

---

## Who Centfolio is for

**v1 (MVP)**: One user — Andrius — using Centfolio as a daily-driver to
understand and shape personal spending and investment decisions.

**v1.5 (post-MVP)**: Invite-only access for friends and trusted early
users. Multi-tenancy is built in from day one (every domain record is
scoped by user), but registration is closed.

**v2 (someday, not promised)**: Open registration for Baltic users who
want a finance tool that speaks their banking landscape natively.

**Centfolio is explicitly not for**:
- Households (no shared budgets, no joint accounts, no role-based household
  permissions)
- Traders (no live tickers, no order placement, no options/futures)
- Businesses (no invoicing, no VAT, no expense reports)
- Accountants (no double-entry, no tax filings, no audit trails)

---

## What Centfolio does (v1 scope)

The seven phases below are the v1 MVP. Each phase is a GitHub milestone,
roughly one to two weeks of evening work. A phase is "done" when its
success criteria are met and the work is merged to `main` and deployed.

### Phase 1 — Foundation
**Goal**: Log in and see an empty dashboard.

- Auth (email/password login via PocketBase). OAuth and
  register-via-invite deferred to v1.5, where the invite flow is the
  headline feature
- Admin and user roles (schema only; no admin UI in Phase 1)
- App layout (top bar only — sidebar deferred to Phase 2),
  navigation, light/dark mode
- Base component library (Button, Card, Input, Label, Form, Sonner
  toast) per the design system. Table, Skeleton, Avatar, and other
  primitives added in later phases as they become needed
- Deployment pipeline (local → GitHub → VPS) verified end-to-end

**Success criteria**: A user (pre-seeded by admin via PocketBase) can
log in, see the dashboard with empty states, switch themes, and log
out. CI runs on every PR. `main` push deploys to production
automatically. See `docs/plans/phase-1-foundation.md` for the
execution breakdown.

### Phase 2 — Manual transactions
**Goal**: Usable as a basic manual spending tracker.

- Add, edit, delete transactions
- Categories (hierarchical: Food > Groceries) — user-creatable, with sensible defaults
- Tags (multiple per transaction) — user-creatable, autocomplete
- Rule engine for merchant → category mapping (e.g., "Maxima" → Food > Groceries)
- Filtering and search

**Success criteria**: A user can record every cash and card purchase
manually, classify it, and find any past transaction in under three clicks.
Rules apply correctly to manually-entered transactions matching the rule's merchant.

### Phase 3 — Receipts
**Goal**: A photographed receipt becomes structured data.

- Receipt upload (single photo, mobile camera capture works)
- Gemini 2.5 Flash extracts merchant, date, total, and line items
- User reviews extracted data and corrects errors
- Receipt persists with line items linked to it
- Receipts list view, individual receipt detail view

**Success criteria**: A photo of a typical Maxima / IKI / LIDL receipt
produces a correctly-parsed digital record 90% of the time. The other 10%
is correctable in under a minute.

### Phase 4 — Bank sync and AI categorization
**Goal**: SEB transactions flow in automatically, pre-categorized.

- GoCardless OAuth connection flow (SEB Lithuania)
- **No historical import.** Sync starts from the moment of connection;
  only transactions posted after consent flow into Centfolio. The user
  may manually add older transactions if they choose.
- Daily cron sync (deduplicated by external transaction ID)
- Re-consent flow before the 90-day window expires
- Manual sync trigger
- **Rules-first then AI-assisted categorization.** Synced transactions
  are categorized by user-defined rules first; unmatched ones get an AI
  suggestion via Gemini against the user's existing category list.
  High-confidence (≥0.85) AI categorizations apply automatically.
  Lower-confidence suggestions stay uncategorized but surface in
  "Needs review" with the suggestion pre-filled for one-click acceptance.

**Success criteria**: After connecting an SEB account, every transaction
posted to the account appears in Centfolio within 24 hours, with no
duplicates, ever. At least 80% of synced transactions are categorized
automatically (combined rules + high-confidence AI). The remaining ≤20%
appear in "Needs review" with a pre-filled AI suggestion.

### Phase 5 — The match
**Goal**: The bank's "Maxima €34.27" becomes itemized.

- Algorithm that links receipts to bank transactions (merchant + date ± 1 day + total tolerance)
- Match confidence score
- Manual override (mark as matched, unmatch, link to a different transaction)
- UI surfaces matched / unmatched / pending states clearly

**Success criteria**: For receipts taken within 48 hours of the matching
card transaction, 95%+ auto-match correctly. Manual matching for the edge
cases takes under 15 seconds.

### Phase 6 — Investments
**Goal**: See portfolio value alongside spending.

- Manual holdings entry (symbol, exchange, quantity, cost basis, currency)
- Daily price snapshot via Twelve Data cron
- Manual refresh button
- Portfolio history table (daily snapshots build up over time)
- Total portfolio value on the dashboard, daily P&L
- Simple holdings list with current value, cost basis, P&L per position

**Success criteria**: All four of Andrius's existing holdings (VWCE, NVDA,
RKLB, GOOGL) tracked accurately with daily refresh. Portfolio value chart
shows at least 30 days of history within a month of running.

### Phase 7 — Insights and polish
**Goal**: Centfolio becomes useful for behavior change, not just record-keeping.

- Monthly budget per category, with progress bars
- Spending dashboard charts (by category, by merchant, by week)
- Recurring transaction detection
- Search across transactions, receipts, line items
- Mobile-friendly responsive layout, PWA install on phone
- Performance pass (Lighthouse, RSC discipline, chart aggregation server-side)

**Success criteria**: The dashboard answers "where did my money go this
month" in under three seconds of looking. Lighthouse performance score
≥ 90 on a 4G connection.

---

## What Centfolio explicitly does not do (anti-features)

These are not "missing features." They are intentional non-goals. Adding
them would compromise the focus and the calm:

- **No multi-currency**. Andrius is paid in EUR, spends in EUR. Adding
  conversion logic complicates every screen for a feature nobody asked for.
- **No tax features**. No VAT tracking, no tax-loss harvesting, no Form X
  generation. Tax is a different application.
- **No bill payment or money movement**. Centfolio is read-only against
  the bank. We never initiate payments. (Avoids the PSD2 PIS complexity entirely.)
- **No investment trading**. Read-only price data, manual holdings entry.
  We are not a broker.
- **No social features**. No sharing budgets, no leaderboards, no comments.
- **No AI chat interface**. Gemini is used for receipt OCR and category
  suggestions only. Centfolio is a tool, not a chatbot.
- **No "premium" tier**. Personal project, not a business. No paywalls,
  no upsells, no analytics tracking sold to advertisers.
- **No mobile-native apps**. PWA is the mobile story. Building and
  maintaining iOS/Android would be a different project.
- **No historical bank-transaction backfill**. Centfolio starts tracking
  from the moment of bank connection. Older transactions can be added
  manually if needed, but are not imported in bulk.

---

## Definition of done for v1

Centfolio v1 ships when:

1. All seven phases meet their success criteria
2. Andrius has used it as his sole budget tool for at least one full month
3. The receipt match rate is consistently 90%+ on real receipts
4. Bank sync has not produced a duplicate or missed transaction for 30 days
5. The deployed app passes Lighthouse on mobile and desktop
6. All ADRs are written and current
7. `CHANGELOG.md` is current and follows Keep a Changelog format
8. At least one external user (a friend, invited) has signed up and used
   it for a week without hitting a bug that required intervention

---

## Operating principles

These guide every decision from architecture to copy:

1. **Calm over loud.** No notifications, no streaks, no gamification. The
   app is a quiet companion, not a habit-tracker.
2. **Considered over fast.** This is a learning project. Every architectural
   choice is documented in an ADR. Every PR has a plan in `docs/plans/`.
3. **Quality over completeness.** Better to ship six excellent phases than
   seven mediocre ones. Phase 7 can become v1.1 if Phase 6 deserves more time.
4. **Plain language over jargon.** "Spent" not "Outflow." "Earned" not
   "Inflow." The ubiquitous language is defined in `CONTEXT.md`.
5. **Trust the user.** Centfolio shows information and gets out of the way.
   No nudging, no "you spent X% more on coffee this month!" alerts.
6. **Honest data, or no data.** If Centfolio cannot categorize a transaction
   confidently, it stays uncategorized. If it cannot import history with
   meaningful detail, it doesn't import history. Subtle wrong is worse
   than visibly empty.

---

## What's next

Living documents to be authored alongside this one:

- **`CONTEXT.md`** — the ubiquitous language for this project
- **`CLAUDE.md`** — conventions and rules for Claude Code working in this repo
- **`docs/adr/0001-stack.md`** — Next.js 16 + TypeScript + PocketBase + Tailwind
- **`docs/adr/0002-bank-aggregator.md`** — GoCardless Bank Account Data over direct PSD2
- **`docs/adr/0003-receipt-ocr.md`** — Gemini 2.5 Flash with structured outputs
- **`docs/adr/0004-design-system.md`** — Modern Lithuanian, Fraunces + Inter, terracotta palette
- **`docs/adr/0005-no-historical-backfill.md`** — Why bank sync starts at connection time
- **`docs/adr/0006-testing-strategy.md`** — Vitest + RTL + Playwright, TDD only for pure-logic modules
