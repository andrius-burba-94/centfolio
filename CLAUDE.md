# Centfolio

Universal agent behavior: @AGENTS.md
Project vision and scope: @PROJECT.md
Domain language and entities: @CONTEXT.md
Architectural decisions: docs/adr/

---

## What this is

Centfolio is a personal finance application combining bank transactions
(via GoCardless), itemized receipts (parsed by Gemini), and investment
holdings (via Twelve Data) into a single calm, considered view of
spending and net worth.

Stack: Next.js 16, TypeScript (strict), PocketBase 0.38, Tailwind CSS 4,
shadcn/ui + Tremor, Zod 3, date-fns 4, Vitest, Playwright, Pino, Sentry.
Deployed on a Hostinger VPS at centfolio.labrium.online via PM2 +
systemd + Nginx + Certbot.

Solo learning project. Quality over speed.

---

## Before you write any code

1. Read `CONTEXT.md`. Every domain term in your code must match its
   definition there. If a concept you need isn't defined, add it to
   `CONTEXT.md` first, get it approved, then write the code.
2. Read the relevant ADRs in `docs/adr/` for the area you're touching.
3. Check for a plan in `docs/plans/`. Non-trivial work has one.
4. Brainstorm before coding, per `AGENTS.md`.

---

## Centfolio vocabulary

The plain-language rule from AGENTS.md applies, with these
project-specific terms locked. Match them exactly.

| Use | Never use |
|---|---|
| Spent | Outflow, debit, expense |
| Earned | Inflow, credit, income |
| Held | AUM, balance, equity |
| Categorize | Classify, tag (tag means something else) |
| Match | Link, attach, associate |
| Sync | Pull, fetch, refresh (when about bank data) |
| Snapshot | Sample, reading (when about prices) |

Spelling: American English. `categorize`, not `categorise`.

---

## Universal Centfolio rules

These apply everywhere in the codebase. Area-specific rules live
in `.claude/rules/`.

- **Money is stored as integer cents.** Never floats. Display
  formatting happens at the UI edge only. See `.claude/rules/money.md`.
- **Every domain query filters by `userId`.** PocketBase rules
  enforce this at the database; code constructing queries must
  include it explicitly too.
- **Never introduce a domain term not in `CONTEXT.md`.** Add it
  there first.
- **Server components are the default.** Add `'use client'` only
  when state, effects, or browser APIs are required.
- **No new dependencies without raising in chat first.**

---

## Naming conventions

Match exactly. Drift is a bug.

### Database (PocketBase)
- Collections: plural, camelCase — `transactions`, `lineItems`
- Fields: camelCase — `merchantName`, `matchedAt`
- Foreign keys: singular + `Id` — `userId`, `receiptId`

### TypeScript
- Types: PascalCase singular — `Transaction`, `LineItem`
- Enum values: lowercase strings matching state names in `CONTEXT.md`
- Booleans: `is`/`has` prefix — `isMatched`, `hasReceipts`
- Functions: verbs — `categorizeTransaction`, `matchReceipt`

### URLs
- Plural for collections — `/transactions`, `/receipts`
- Singular `[id]` for items — `/transactions/[id]`
- Verbs for actions — `/receipts/[id]/match`

### React components
- Domain components named after entity — `<TransactionRow>`,
  `<ReceiptCard>`, `<MatchBadge>`
- UI primitives in `components/ui/` keep generic names — `<Card>`,
  `<Button>`
- Never use generic names for domain components.

### Files
- Components: PascalCase — `TransactionRow.tsx`
- Utilities: camelCase — `formatCurrency.ts`
- Tests: same name + `.test.ts` — `formatCurrency.test.ts`

---

## CHANGELOG

Any user-visible change updates `CHANGELOG.md` in Keep a Changelog
format. Use `/changelog` to draft the entry from recent commits, then
edit before committing.

---

## Updating these files

Per AGENTS.md, when the same correction happens a third time, edit
the relevant file instead of correcting again.

- Universal agent behavior → `AGENTS.md`
- Centfolio-specific rules → this file
- Area-specific quirks → `.claude/rules/{area}.md`
- Domain definitions → `CONTEXT.md`
- Decisions and reasoning → `docs/adr/`

Keep this file under 200 lines. Move anything area-specific into a
path-scoped rule.
