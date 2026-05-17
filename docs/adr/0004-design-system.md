# ADR-0004: Design system

- Status: Accepted
- Date: 2026-05-18
- Deciders: Andrius

## Context

Centfolio's tone is "calm, considered, plain language." The visual
language has to carry that — a screen full of harsh blues and noisy
charts would undermine the operating principles before a single word
is read. At the same time, the developer is solo, not a design
agency: every primitive that has to be drawn from scratch is a
primitive that doesn't get drawn.

The app is also a long-running personal tool, not a marketing site.
Visual choices have to age well over years of nightly use. Trends
that look striking in a portfolio shot but tire after a week are out
of scope.

## Decision

Centfolio's design system is "Modern Lithuanian": a warm,
terracotta-led palette grounded in muted earth tones, paired with a
serif/sans typographic split — Fraunces for display and headings,
Inter for UI and body text. The full token set (colors, type scale,
spacing, radii, motion) lives as Tailwind 4 design tokens; component
primitives come from shadcn/ui scaffolded into the repo, with charts
from Tremor.

Light and dark modes are first-class. Both are tuned by hand against
the same token set; dark mode is not a generated inversion of light.

## Alternatives considered

**Use shadcn/ui's defaults unchanged.** Fast, defensible, looks like
every other modern web app. Rejected because "looks like every other
modern web app" is at odds with the calm-and-considered tone — the
defaults read as neutral-technical, not warm-personal. Keeping
shadcn's component structure while replacing the token layer is
strictly better than adopting the whole look.

**A cooler, blue-led palette.** The default for finance apps; reads
as trustworthy by convention. Rejected because the convention is
exactly what Centfolio is reacting against. Bank apps are blue;
Centfolio is not a bank app.

**A single typeface (Inter throughout, or a single serif).** Simpler,
one fewer font to load. Rejected because the serif/sans split does
real work: Fraunces in display weights gives the app warmth and
specificity, while Inter keeps tables and forms legible at small
sizes. Both are loaded as variable fonts with `font-display: swap`,
and unused weight ranges are dropped via the Next.js font loader —
the actual payload is modest.

**A heavier component library (MUI, Mantine, Chakra).** More
out-of-the-box, less to build. Rejected because none of them give
the design system the visual identity Centfolio wants, and pulling
their default looks back into "Modern Lithuanian" is more work than
starting from shadcn primitives.

## Consequences

- **Good:** A coherent visual identity that matches the product's
  tone. The app feels like it was made for a person, not generated
  from a template.
- **Good:** Tokens-in-Tailwind means the design system is testable
  the same way the rest of the codebase is. Renaming a color or
  changing the type scale is one edit in one place.
- **Good:** Two-font setup is the only typographic complexity; the
  rest of the system stays small enough to hold in one head.
- **Bad:** Custom token sets do not benefit from upstream shadcn
  examples and tutorials as directly. Copying a snippet from the
  shadcn docs usually requires a token-mapping pass before it looks
  right.
- **Bad:** Hand-tuned dark mode is more work than generated dark
  mode, and the cost recurs every time a new color enters the token
  set. Worth it for legibility on long evening sessions, but the
  cost is real.
- **Neutral:** Charts (Tremor) ship with their own color defaults
  that have to be overridden to match the palette. One-time setup,
  but easy to forget on a new chart type.
- **Neutral:** The pbakaus/impeccable skill is installed and will be
  run against reference mockups before Phase 1 UI work to verify
  that "Modern Lithuanian" actually distinguishes Centfolio rather
  than converging on the AI-marketing-page defaults its detector
  flags (italic serif heroes, Fraunces in display roles). If the
  detector pushes back, this ADR gets revisited.

## References

- `PROJECT.md` — operating principles ("calm over loud")
- `docs/adr/0001-stack.md` — Tailwind 4 and shadcn/ui are the
  foundation this builds on
