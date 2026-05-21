# Changelog

All notable user-visible changes to Centfolio are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Centfolio is pre-v1; entries appear under the phase that introduced
them, with `[Unreleased]` rolling at the top until the next phase
ships.

## [Unreleased]

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
