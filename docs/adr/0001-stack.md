# ADR-0001: Stack choice

- Status: Accepted
- Date: 2026-05-18
- Deciders: Andrius

## Context

Centfolio is a solo evening project meant to last for years, not a
startup racing to a launch date. The stack has to be enjoyable to come
back to after a week away, cheap to host on a single Hostinger VPS,
and biased toward writing application code over wiring infrastructure.

Two constraints shape the choice. First, the data model is small and
relational but evolves frequently in the early phases — receipts,
transactions, line items, matches, holdings — and the developer is the
only one touching the schema. Second, the app is multi-tenant from day
one (every row scoped by user) even though v1 has a single real user;
whatever stores the data has to make `userId`-scoped access rules
trivial to enforce, not something the application layer has to
remember on every query.

## Decision

Centfolio uses Next.js 16 with TypeScript (strict mode), PocketBase
0.38 as the database and auth provider, and Tailwind CSS 4 for styling.

Next.js owns rendering, routing, and server actions. PocketBase runs
as a separate process on the same VPS and exposes both the auth API
and the typed collections. Tailwind handles all styling; component
primitives come from shadcn/ui — which scaffolds component source
files directly into the repo rather than installing as a dependency,
so every primitive is ours to edit — and Tremor (a Vercel-owned chart
component library) for charts.

## Alternatives considered

**Remix or SvelteKit instead of Next.js.** Remix's nested routing
model maps cleanly onto a dashboard with stable shell and changing
detail panes; SvelteKit ships a markedly smaller client runtime, which
matters for a PWA on a mobile connection. Rejected because Next.js
has the deepest pool of documentation, the most familiar mental model
for the developer, and the React Server Components model fits a
data-heavy dashboard well. Learning a second framework while also
learning a banking API and an OCR pipeline is too many unknowns at
once.

**Postgres + Prisma + a hand-rolled auth layer instead of PocketBase.**
More flexible, more conventional, infinitely scalable. Rejected
because the flexibility is not needed at this size, and PocketBase's
filter-rule system enforces the `userId` scope at the database in a
way that a Prisma codebase has to re-implement on every query. The
"one binary, one SQLite file" operational model is a feature for a
solo project, not a limitation.

**Supabase or Firebase instead of PocketBase.** Both solve the
auth-plus-database problem out of the box. Rejected because both lock
the deployment story to their cloud, and Centfolio is deliberately
self-hosted on a VPS the developer already pays for. PocketBase runs
locally in development with no emulator and no API key dance.

**CSS Modules or vanilla CSS instead of Tailwind.** Saner cascade
story. Rejected because Tailwind 4's design-token integration is the
fastest path to the design system in ADR-0004, and the shadcn/Tremor
ecosystem assumes Tailwind.

## Consequences

- **Good:** One language (TypeScript) and one mental model from form
  submit to database row. Hot reload covers the whole stack in
  development. The deployment is `pm2 restart` of a Next.js process
  plus a PocketBase binary; no orchestration.
- **Good:** PocketBase's filter rules make the `userId` scoping rule
  enforceable at the database, not just in application code. This is
  load-bearing for multi-tenancy.
- **Bad:** PocketBase is small and young. If it stops being
  maintained, migrating off it (likely to Postgres) is a real project,
  not a config change. The schema-as-code rule in
  `.claude/rules/pocketbase.md` does not prevent that work — it just
  means a future port starts from a committed `pocketbase/schema.json`
  and the migration files in the repo, rather than from a
  reverse-engineered live database.
- **Bad:** PocketBase has no transactions. Any multi-record write has
  to use the validate-then-write pattern; the receipt-match flow and
  the bank-sync flow are both written with this in mind.
- **Neutral:** Tailwind 4 is recent enough that some tooling (Tremor,
  shadcn) is still catching up to its config format. Expect to pin
  versions carefully until that settles.

## References

- `PROJECT.md` — the "calm, considered, solo project" framing
- `.claude/rules/pocketbase.md` — the quirks this stack inherits
- `docs/adr/0004-design-system.md` — what Tailwind is in service of
