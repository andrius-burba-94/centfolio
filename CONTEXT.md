# Context

This document defines the ubiquitous language of Centfolio. Every concept
the app works with has exactly one canonical name and one canonical
definition. Code, copy, URLs, database fields, and conversations all use
the terms defined here.

If you find yourself writing code that needs a term not in this document,
stop and add it here first. If you find yourself using a synonym for a
term already here, replace it.

Spelling: American English throughout. `categorize`, not `categorise`.
`color`, not `colour`.

---

## Core entities

### User
A person with login credentials. Has either the `user` or `admin` role.
Owns transactions, receipts, holdings, categories, tags, and rules. Every
domain record in Centfolio belongs to exactly one user.

### Transaction
A single financial event — money moving in or out of an account.
Transactions come from two sources: **synced** (from the bank via
GoCardless) or **manual** (entered by the user). Every transaction has an
amount (positive or negative), a date, a **payee**, and a description.

The **payee** is the other party in the transaction: the store on a
spend, the employer on a salary, the friend on a refund. One field
covers both directions; calling it "merchant" forced commercial
framing onto salary and personal income, which is why this field was
renamed early in Phase 2.

A transaction is never edited destructively. Bank-synced fields are
read-only; user annotations (category, tags, notes) layer on top.

### Receipt
A digital record of a purchase, derived from a **photo** (taken by the
user) or from **machine-readable text** (an emailed receipt summary
from a Lithuanian chain, pasted in by the user). A receipt has a
source type (`photo` or `text`), a merchant, a date, a total, and one
or more line items. A receipt may or may not be matched to a
transaction. Receipts keep the field name "merchant" because receipts
are always commercial: you do not get a receipt for salary or a refund
from a friend.

### Line item
A single product or service on a receipt, or for some receipt
formats a discount line, a whole-receipt adjustment, or a split-
tender notation (loyalty-currency payment, etc.) that the source
receipt presents as its own line. Has a name, a quantity (default 1,
decimals allowed for weighed goods such as `0.342 kg bananas`), an
optional unit (`kg`, `g`, `L`, etc., or null when the receipt doesn't
specify one), a unit price, and a line total. Line totals may be
negative for discount or split-tender lines. Line items are extracted
from the receipt photo or source text by Gemini; the user can edit,
add, or delete them after extraction.

The receipt's `totalCents` is the authoritative bill total parsed
from the receipt; the sum of line totals is **not** guaranteed to
equal it. Discounts, split tenders, and per-item rounding all break
that invariant legitimately. Do not assert `sum(lineItems) ==
totalCents` anywhere in code.

### Holding
A position in a security. Has a symbol, an exchange, a quantity, a cost
basis, and a currency. Holdings are entered manually. Price snapshots
attach to holdings over time, not to the holding itself.

### Price snapshot
A point-in-time price for a security on a specific date, fetched from
Twelve Data. Snapshots accumulate daily and form the source of truth for
portfolio history.

### Category
A user-defined classification for a transaction. Categories are
hierarchical: a category may have a parent (e.g. `Food > Groceries`,
`Food > Restaurant`). Every transaction has exactly **one** category.

### Tag
A user-defined label attached to a transaction. A transaction may have
zero or more tags. Tags are flat — there is no tag hierarchy. Tags persist
across bank re-syncs.

The distinction: categories answer "what kind of spending is this?" Tags
answer "what other dimensions does this spending share with other
spending?" Example: a €40 transaction at a restaurant has category
`Food > Restaurant` and tags `with_friends`, `birthday`.

### Rule
A user-defined mapping from a payee pattern to a category. Applied
automatically during transaction sync and on manual transaction entry.
Example: payee matches "Maxima" → category `Food > Groceries`.

### Budget
A spending limit set by the user for a category over a calendar month.
Budgets have a category, a month, and a limit amount. Progress against
the budget is computed live from transactions in that category and month.

### AI suggestion
A category suggestion produced by Gemini for a transaction the rule
engine couldn't classify. Has a suggested category, a confidence score
(0–1), and a timestamp. Stored on the transaction itself, not as a
separate entity. Cleared when the transaction is categorized (regardless
of source).

### Invite
A one-use registration token issued by an admin. Required for sign-up
during the invite-only period. Has an expiry and a single-use flag.

---

## Plain language: the canonical verbs

Centfolio uses everyday words, never finance jargon. The following are
the canonical labels for transaction direction and lifecycle. These
appear in UI copy, code comments, type names, and conversation.

| Centfolio uses | We never use |
|---|---|
| Spent (negative transaction) | Outflow, debit, expense |
| Earned (positive transaction) | Inflow, credit, income |
| Held (current portfolio value) | AUM, balance, equity |
| Owed (a negative net position, future) | Liability, debt |
| Payee (the other party on a transaction) | Merchant, vendor, party, counterparty |

These are exact terms. `Spent`, capitalized, is the column header. The
variable is `spent` in camelCase, `SPENT` in SQL enums.

---

## Key processes

### Sync
The act of pulling new transactions from a bank via GoCardless. A sync
runs daily on a cron schedule, and can be manually triggered from the
account screen. A sync is **idempotent** — running it twice produces the
same result, never duplicates.

A transaction is identified by GoCardless's `transactionId` field; if
it's already in our database, we update it. If not, we insert it. Never
both.

**Sync does not perform historical backfill.** The first sync after
connection imports only transactions posted after the consent timestamp.
Older transactions are out of scope for sync and may only be added
manually.

### Match
The act of linking a receipt to a transaction. A match is created either
**automatically** by Centfolio's matching algorithm, or **manually** by
the user. Once matched, the receipt's line items become the itemized
detail of the transaction.

A match has a **confidence**: high (auto-matched on the receipt's
merchant against the transaction's payee, plus date and exact total),
medium (same parties and date, total within tolerance), low (user
override of a non-obvious link). Auto-matches at low confidence are
flagged for user review rather than silently applied.

A match can be **broken** (the user removes the link). A receipt can be
**re-matched** (linked to a different transaction).

### Snapshot
The act of recording the current price of a holding. Happens daily via
cron at 22:00 Vilnius time (after European market close), and on-demand
when the user clicks the refresh button.

The cron also records the **portfolio total** — the sum of all holdings
at their snapshot prices — as a separate `portfolioSnapshot` row. This
is what powers the portfolio history chart.

### Categorize
The act of assigning a category to a transaction. Happens in four ways,
in order of priority:

1. **Rule-based**: if the payee matches a user-defined rule (e.g.
   "Maxima" → `Food > Groceries`), the category is applied automatically
   on sync or on manual entry. Source recorded as `rule`.
2. **AI high-confidence** — for transactions unmatched by rules, Gemini
   suggests a category from the user's existing category list. If
   confidence is ≥0.85, applied automatically. Source recorded as `ai`.
3. **AI low-confidence with review** — for AI suggestions below 0.85,
   the transaction remains `uncategorized` but stores the suggestion.
   Shown in "Needs review" with the AI's suggestion pre-filled for
   one-click acceptance. Source on acceptance recorded as `ai-reviewed`.
4. **Manual** — the user picks a category from the transaction's edit
   screen. Source recorded as `manual`. Always overrides any prior
   source.

The `source` field is preserved for every categorization, enabling
future analysis ("what percentage of my categorizations are AI vs
manual?") and correctness audits.

A transaction without a category is **uncategorized** and shows in the
dashboard's "Needs review" list.

---

## States

Every entity that has a lifecycle has explicit states. Code uses these
exact strings as enum values.

### Receipt states
- `parsing`: uploaded, Gemini extraction in flight
- `parsed` — OCR complete, ready for user review
- `confirmed` — user has reviewed and approved the extracted data
- `matched` — confirmed and linked to a transaction
- `failed`: parsing failed; user may retry (resets attempts and
  re-invokes Gemini) or delete the receipt. Hand-typed receipt entry
  is out of scope for v1; if a manual path is ever needed, the
  intended shape is a bridge to a Phase 2 transaction (recorded
  without line-item detail), not a duplicate receipt form.

### Transaction states
- `unmatched` — no receipt linked (default)
- `matched` — has at least one linked receipt
- `manual` — entered by the user, not from bank sync (orthogonal to match state)

A transaction can be `matched AND manual`. The states are independent.

### Bank connection states
- `disconnected` — no GoCardless connection
- `connected` — active consent, syncing works
- `expiring` — consent expires within 7 days; reconnect prompt shown
- `expired` — consent expired; sync paused until reconnect
- `error` — last sync failed for a non-consent reason

### Holding states
- `active` — currently held, included in portfolio total
- `closed` — sold, no longer held, retained for history

### Categorization sources (enum)
- `rule`: applied by a user-defined payee rule
- `ai` — applied automatically by AI at high confidence
- `ai-reviewed` — applied after user accepted an AI suggestion
- `manual` — applied by the user directly

---

## Centfolio-specific terms

### Dashboard
The landing page after login. Shows net worth, this-month spending and
earning, portfolio value, recent activity. Never shows raw lists or
detailed breakdowns — those live on their own pages.

### Net worth
The sum of all bank account balances plus the current value of all
active holdings. Computed live, never stored.

### This month
The calendar month in the user's timezone (Europe/Vilnius for now).
Centfolio's reporting is calendar-month-based, not rolling-30-day.

### Needs review
The list of transactions that require user attention before they are
fully classified. Includes:
- Transactions with no category and no AI suggestion (truly uncategorized)
- Transactions with a low-confidence AI suggestion awaiting acceptance

Surfaces on the dashboard as a count, expands to a full list on click.

### Receipt photo
The original uploaded image when `sourceType` is `photo`. Stored in
PocketBase file storage and never discarded, since even after parsing
the photo remains available for audit. Storage budget: 5 MB per photo,
auto-compressed on upload (server-side normalization to JPEG at
≤1600px long-edge).

### Receipt source text
The raw pasted text when `sourceType` is `text`: the body of an
emailed receipt summary from a Lithuanian chain (Maxima Ačiū, IKI
Bonus). Stored on the receipt row as a text field, never discarded
for the same audit reason as the photo: if Gemini's parsing was
wrong, the original is available for review or re-parsing.

### High-confidence threshold
The minimum AI confidence score for automatic categorization. Set to
`0.85` in v1. Configurable per-user in the future; not in v1.

---

## Naming conventions

These follow from the language above and are enforced in CLAUDE.md.

### Database (PocketBase)
- Collection names: plural, camelCase — `transactions`, `lineItems`, `priceSnapshots`
- Field names use camelCase: `payee`, `matchedAt`, `confidenceScore`
- Foreign keys: singular entity + `Id` — `userId`, `receiptId`, `transactionId`

### TypeScript
- Types: PascalCase singular — `Transaction`, `LineItem`, `PriceSnapshot`
- Enum values: lowercase strings matching the state names above
- Booleans: prefixed with `is` or `has` — `isMatched`, `hasReceipts`

### URLs
- Plural for collections, singular for actions — `/transactions`, `/transactions/[id]`, `/receipts/[id]/match`
- Verbs only where the URL is an action, not a resource

### React components
- Domain components named after the entity they render — `<TransactionRow>`, `<ReceiptCard>`, `<MatchBadge>`
- Never `<Item>`, `<Card>`, `<Badge>` without a domain prefix (those are UI primitives)

---

## How this document is maintained

CONTEXT.md is a living document. The rules:

1. **Add before code.** When a new concept appears in a feature plan,
   define it here first, then write the code. Never introduce a domain
   term in code that isn't here.
2. **One canonical name.** If two terms appear for the same concept,
   delete one. The codebase follows. (This sometimes means a refactor PR
   whose only purpose is renaming.)
3. **Plain language wins.** If a term in this document starts feeling
   like jargon, propose a plainer alternative in a PR. CONTEXT.md is for
   the user's mental model, not the engineer's.
4. **No definitions in CLAUDE.md.** CLAUDE.md references terms; it never
   defines them. If something needs defining, it goes here.
