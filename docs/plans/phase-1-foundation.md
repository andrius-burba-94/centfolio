# Phase 1 — Foundation

- Status: Planning
- Updated: 2026-05-20
- Owner: Andrius
- Prerequisites: ADRs 0001–0006 committed; deploy pipeline operational
  (verified on `chore/deploy-smoke-test`)

## Goal

Ship the smallest authenticated experience that proves the stack works
end-to-end. A pre-seeded user can log in, see an empty dashboard with
the design-system shell, switch between system/light/dark themes, and
log out. CI exercises the same path automatically; merges to `main`
deploy to production without manual steps.

## What's in scope

- Email/password login via PocketBase
- Seed user pre-created via PocketBase admin UI; role `admin`
- App shell: top bar with wordmark + theme toggle + user menu
- Three-state theme (system/light/dark) via `next-themes`, default `system`
- Component primitives: Button, Card, Input, Label, Form, Sonner toast
- Tailwind 4 design tokens implementing "Modern Lithuanian"
- Fraunces (display) + Inter (body and UI) via `next/font/google`
- Observability: Sentry + Pino + helper wrappers
- E2E acceptance test covering the full Phase 1 path

## What's deferred, and where it lands

- **Register-via-invite, OAuth providers, invite-issuance UI → v1.5.**
  The invite flow is the headline feature of v1.5, not infrastructure
  for v1.
- **Sidebar nav → Phase 2** (introduced with the first second route).
- **Settings page →** whenever a non-theme setting exists (likely
  Phase 7).
- **Table primitive → Phase 2** (first list).
- **Skeleton primitive → Phase 2 or Phase 4** (first real loading
  state; Phase 1's dashboard is empty by design, not loading).
- **Avatar primitive →** not planned. Phase 1 user-menu uses an
  initials-in-circle inline span (`Avatar` as a shadcn primitive
  earns its keep on variants we don't need yet).
- **Logomark / icon →** not planned. The Fraunces wordmark is the
  brand identity. Logomark stays out of scope through v1.

### Schema artefacts already in repo

The `invites` collection was committed in PR #2 alongside `users`.
Leave it in `pocketbase/schema.json` even though no Phase 1 code
references it. Removing it now means a schema migration on the live
PocketBase, and v1.5 would re-add it via another migration. Cheaper
to let it sit unused until v1.5 wires the flow.

## Acceptance test — what "Phase 1 done" means in CI

`tests/e2e/auth.spec.ts`:

1. Anonymous `GET /` → redirect to `/login`
2. Submit invalid credentials → form error visible; still at `/login`
3. Submit valid credentials (seed user) → land on `/dashboard`
4. Dashboard renders the empty-state container — asserted via
   `data-testid`, not by user-facing copy
5. Open theme toggle, pick "dark" → assert `<html class="dark">`
6. Open user menu, click Logout → back at `/login`

Test runs locally and in CI against a real PocketBase instance
(per ADR-0006: PocketBase is not mocked).

## Pre-work before PR 1

### Sentry account
1. Sign up at sentry.io
2. Create Centfolio org + Next.js project
3. Capture DSN
4. Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to GitHub Actions
   Secrets
5. Add the same two variables to `/var/www/centfolio/.env.local` on
   the VPS (`600` permissions, owned by the deploy user, per
   `.claude/rules/deployment.md`)

### Design language artefacts
1. Run `/impeccable teach` to produce `PRODUCT.md` (audience, voice,
   tone) at whatever path /impeccable conventions specify
2. Hand-write `DESIGN.md` — the concrete token values for colors,
   type scale, spacing, radii, motion. Tokens flow **from** this
   document **into** PR 2; do not let PR 2 invent tokens that
   `DESIGN.md` does not name

### Why this order
`PRODUCT.md` informs `DESIGN.md`; `DESIGN.md` informs PR 2's
Tailwind tokens. The `/impeccable critique` step after PR 3 closes
the loop between intent and observed reality. A later
`/impeccable document` pass (post-Phase-1) regenerates
`DESIGN.md` from what actually shipped, keeping it honest as a
living artefact rather than a write-once spec.

## PR breakdown

Five PRs after pre-work. Each is independently shippable; no
intermediate broken states.

### PR 1 — Observability + plan doc

Sentry + Pino + helper wrappers. No application code consumes them
yet — the auth PR is the first consumer. Plan doc and accumulated
spec edits ride along (per grilling decision: planning is not its
own gated PR).

- Install `@sentry/nextjs` and `pino`
- `sentry.client.config.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts`
- `src/lib/log/pino.ts` — configured Pino instance
- `src/lib/log/logError.ts` — helper wrapping Sentry capture +
  Pino write (this is the `log to Pino with context, rethrow a
  generic "Something went wrong"` pattern from
  `.claude/rules/server-actions.md`)
- `.env.example` updated with Sentry vars
- Sentry source-map upload wired into CI
- `docs/plans/phase-1-foundation.md` (this document)
- PROJECT.md Phase 1 edits (scope deferrals, primitive list,
  success criteria)
- `.claude/rules/testing.md` edits (data-testid convention,
  Phase 1 E2E path)

Risk-front-loaded: Sentry source-map upload is the change most
likely to break CI/deploy. Better to discover that on an invisible
PR than on one that's also shipping visible work.

Verify: deploy succeeds; a test Sentry event reaches the dashboard.

### PR 2 — Design system foundation

Tokens, fonts, theme provider. Zero rendered components, zero new
routes. Pure infrastructure.

- Fraunces + Inter via `next/font/google` (variable fonts,
  `font-display: swap`, unused weight ranges dropped)
- Tailwind 4 tokens implementing `DESIGN.md`
- `@custom-variant dark (&:where(.dark, .dark *))` in
  `globals.css`
- Install `next-themes`; mount `<ThemeProvider>` in
  `app/layout.tsx` with `attribute="class"`, `defaultTheme="system"`
- Strip default Next.js scaffold remnants from `page.tsx`,
  `layout.tsx`, `public/*.svg`

Verify: app boots; `html` element gets the theme class; Tailwind
tokens resolve in devtools; dark variant works on a hand-styled
test element.

### PR 3 — Component primitives + reference mockup

Scaffold and token-align the Phase 1 primitives. Build the static
mockup `/impeccable critique` will chew on.

- shadcn scaffold + token-align: Button, Card, Input, Label, Form,
  Sonner
- `docs/design/mockups/dashboard-light.html`
- `docs/design/mockups/dashboard-dark.html`
- Mockups are static HTML (no production route — avoids exposing a
  half-finished surface for the duration of the PR's review cycle)
- Screenshot both variants
- Run `/impeccable critique` against the screenshots — both light
  and dark, per ADR-0004's first-class-dark commitment
- Critique pass → merge. Critique pushes back → follow-up commits
  on this branch revise tokens (PR 2) or primitive variants
  before merge

Verify: critique passes; both screenshots read as "Modern
Lithuanian," not as generic SaaS or as the AI-marketing-page
defaults `/impeccable` flags.

### PR 4 — PocketBase wiring + auth + app shell + dashboard

The user-facing vertical slice. PB-wiring / auth / shell are not
split because intermediate states would be broken: PB-wiring alone
renders nothing; auth alone has nowhere to redirect; shell alone
has no auth gate.

- `src/lib/pocketbase/server.ts` — server-side PB client (cookie
  auth)
- `src/lib/pocketbase/client.ts` — browser PB client
- `src/lib/auth/session.ts` — `getCurrentUser()`, cookie read/write
  helpers
- `src/middleware.ts` — gate `/dashboard`, redirect to `/login`
- `src/app/login/page.tsx` — uses Form, Input, Label, Button
- `src/app/login/actions.ts` — Zod-validated login server action;
  Pino on PB-unreachable; generic message surfaced to user (per
  `.claude/rules/server-actions.md`)
- `src/app/(app)/layout.tsx` — top-bar shell
  (wordmark | spacer | theme-toggle | user-menu)
- `src/app/(app)/dashboard/page.tsx` — empty-state cards with
  `data-testid` markers
- Theme toggle UI — final shape determined by `/impeccable
  critique` outcome from PR 3
- User menu — initials-in-circle, dropdown with Logout

Verify: log in as seed user → dashboard; theme choice persists
across reload; logout returns to `/login`.

### PR 5 — Seed + E2E + sign-off

Closes the phase.

- `scripts/seed.ts` — find-or-create idempotent seed user; reads
  `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD` from env;
  fails loudly if either is missing
- `tests/e2e/auth.spec.ts` — the acceptance path from above;
  assertions via `data-testid`
- CI workflow updates:
  - Spawn `pocketbase/pocketbase` as a background process
  - Wait-for-port helper (PB takes 1–2s; naive Playwright spawn
    sometimes hits ECONNREFUSED):
    `for i in {1..30}; do nc -z 127.0.0.1 8090 && break; sleep 1; done`
    then fail loudly if the port never comes up
  - Run `npm run seed`
  - Run `npx playwright test`
- `CHANGELOG.md` Phase 1 entry (Keep a Changelog format,
  per CLAUDE.md)
- PROJECT.md: mark Phase 1 ✓ done

Verify: E2E passes locally and in CI; merge to `main` triggers
deploy; production URL reachable; login round-trip works in prod.

## Post-Phase-1

Run `/impeccable document` against the shipped Phase 1 to
regenerate `DESIGN.md` from observed reality. Catches drift between
what `DESIGN.md` said and what shipped, and keeps `DESIGN.md` a
living artefact rather than a write-once spec.

## Open questions deferred to execution time

These do not block planning. Resolve in the PR they touch.

- **Sentry sample-rate** — likely `1.0` in Phase 1 (one user, no
  traffic). Revisit when traffic exists.
- **Pino log target in production** — stdout (PM2 captures) by
  default. File-based logging only if a downstream consumer needs
  it.
- **`next-themes` attribute strategy** — `class` (default), matching
  the Tailwind 4 `@custom-variant dark` wiring above. Avoid
  `data-theme` unless a clear reason emerges.
- **Wordmark weight** — Fraunces Regular vs. Italic, and what
  optical size. `/impeccable critique` will weigh in.
- **CI runner / PB binary compatibility** — existing CI uses
  `ubuntu-latest`; PB Linux binary is committed at
  `pocketbase/pocketbase`. Confirm architecture and execute
  permission at PR 5 time.

## References

- `PROJECT.md` — Phase 1 goal and success criteria
- `CONTEXT.md` — `User`, role enum, `Invite` definitions (the latter
  is referenced but not exercised in Phase 1)
- `AGENTS.md` — workflow: plan → granular commits → PR → review →
  merge → deploy
- `CLAUDE.md` — universal Centfolio rules (money cents,
  `userId` scoping, server components default, naming)
- `docs/adr/0001-stack.md` — Next.js + PocketBase + Tailwind +
  shadcn/Tremor
- `docs/adr/0004-design-system.md` — Modern Lithuanian, Fraunces +
  Inter, the `/impeccable` commitment Phase 1 honors
- `docs/adr/0006-testing-strategy.md` — TDD scope, Playwright as the
  E2E tool, real PocketBase in tests
- `.claude/rules/server-actions.md` — Zod validation, user scope,
  the error-surfacing pattern PR 4 must follow
- `.claude/rules/testing.md` — the ten v1 paths and the new
  `data-testid` E2E convention
- `.claude/rules/pocketbase.md` — PB 0.38 quirks (filter syntax,
  `requestKey: null`, no transactions, schema-as-code)
- `.claude/rules/deployment.md` — VPS layout, OAuth redirect URIs,
  rollback procedure
