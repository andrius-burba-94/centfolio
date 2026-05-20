# Product

## Register

product

## Users

**v1 (now): solo.** One person — Andrius — uses Centfolio nightly,
in evening sessions, as the sole tool for understanding and shaping
personal spending and investment decisions. Software-development
background; comfortable with technical tools but does not want one;
wants a personal artefact, not a productivity dashboard.

**v1.5: invite-only.** A handful of friends and trusted early users
invited individually. The use pattern stays the same — each
invited user is themselves a solo nightly user, not part of a team.
Multi-tenancy exists from day one (every domain record scoped by
`userId`); shared budgets, joint accounts, and household roles
explicitly do not.

**v2 (someday, not promised): Baltic users** who want a finance tool
that speaks their banking landscape natively. Out of scope through
v1.

What this rules out by construction:
- Households, partners, shared budgets, joint accounts
- Traders, day-traders, speculative use
- Businesses, freelancers tracking expenses for tax
- Accountants, advisors, anyone using Centfolio for other people's money

## Product Purpose

Centfolio combines three streams of financial information that no
existing tool combines in the Baltic context:

1. **Bank transactions** via GoCardless (SEB Lithuania first, other
   Baltic banks behind the same provider)
2. **Itemized receipts** — phone photo → Gemini OCR → structured
   line items
3. **Investment holdings** — manual entry + daily Twelve Data
   snapshots

The product's wedge is **the match**: when the bank says "Maxima
€34.27" and the receipt says "€8 wine, €4 oat milk, €22 groceries,"
Centfolio links them and the spend becomes legible at the line-item
level. Bank apps cannot do this (they don't see receipts). Receipt
apps cannot do this (they don't see bank data). Budget apps cannot
do this (they don't read receipts). The intersection is the product.

Success looks like: the v1 user runs Centfolio as their sole budget
tool for a full month, 90%+ receipt match rate on real receipts, no
duplicate or missed transactions for 30 days, and at least one
invited friend using it for a week without intervention.

The product is read-only against the bank and never initiates
payments. It is not a broker, not an accountant, not a habit tracker,
and not a chatbot.

## Brand Personality

**Quiet, intimate, plainspoken.**

- **Quiet** — interfaces do not shout. No streaks, no urgency, no
  flashing red. Information sits and waits to be looked at. Calm over
  loud, every time the question comes up.
- **Intimate** — built for one person at a time. A personal artefact,
  not a corporate dashboard. The voice is the voice of a
  knowledgeable friend, not a financial institution.
- **Plainspoken** — "Spent" not "Outflow." "Earned" not "Inflow."
  The vocabulary defined in `CONTEXT.md` is enforced everywhere. Any
  temptation to use finance jargon is itself the bug.

Visual register sits in a print-adjacent neighbourhood: warm,
terracotta-led, almost-publication-feel. The screen is treated as
an object the user spends evenings with, not a tool used to complete
tasks under time pressure.

## Anti-references

Centfolio explicitly does not visually resemble any of the following.
These are the families to recognize-and-refuse.

- **Budget-app convention** (Mint, YNAB, Monarch, Lunchmoney) —
  dense charts, traffic-light spending alerts, gamified streaks,
  busy dashboards optimized for daily check-ins. Centfolio's
  presentation is sparse and considered, not exhaustive.
- **Cool tech-SaaS** (Linear, Notion, Vercel, default-shadcn) —
  cool grays + electric accents, default-Inter, neutral-technical
  voice. Centfolio is warm and personal where these are cool and
  operational.
- **Bank-app corporate** (Revolut, SEB, Wise) — corporate-trustworthy
  blue, generic finance iconography, push-notification-driven flow.
  Centfolio is not a bank.
- **Crypto / trading platforms** (Robinhood, TradingView, eToro) —
  neon-on-black, candlestick charts everywhere, urgency-driven
  flashing data, profit/loss as identity. Centfolio is not a trading
  floor.

Cross-cutting reflexes to recognize and reject:

- **First-order finance reflex** ("navy and gold," "blue and
  trustworthy") — Modern Lithuanian's terracotta-led palette is the
  anti-blue stake, by construction.
- **Second-order finance reflex** ("fintech that isn't navy-and-gold
  → terminal-native dark mode, green-on-black numerals") — Centfolio
  rejects this too. Its dark mode is hand-tuned warm earth, not a
  trader's terminal.
- **AI-marketing-page defaults** (italic serif heroes, Fraunces in
  display roles as decorative flourish) — ADR-0004 flags this
  explicitly. Fraunces here serves a publication-logotype role, not
  a marketing-page flourish role.

Positive visual references (what Centfolio should evoke):

- **Editorial / magazine** (The New Yorker, MIT Tech Review,
  Pentagram print work) — serif headlines, generous whitespace,
  considered typography. The screen as a printed page.
- **Calm digital products** (Things 3, Bear, iA Writer, Day One) —
  warm document-feel, minimal chrome, the app as a private object.
- **Baltic / Lithuanian craft** (Vilnius coffee-roaster brands,
  Lithuanian artisan identities) — terracotta + muted earth +
  craft-honoring restraint. Geographic specificity is the
  differentiator from every "this could be any country" finance app.

Not a positive reference: reading-experience tools (Readwise,
Substack reader, Matter). Centfolio is an *object*, not a *content
stream*. The distinction matters: a reader is optimized for fast
consumption of new content; Centfolio is optimized for slow
consideration of personal history.

## Design Principles

1. **Calm before completeness.** A screen that shows less, well,
   beats a screen that shows everything, busily. When in doubt,
   remove. Empty states are honest first-class surfaces, not
   problems to disguise with skeleton shimmer or sample data.

2. **Plain language is load-bearing.** The vocabulary in
   `CONTEXT.md` ("Spent" not "Outflow," "Earned" not "Inflow," "Held"
   not "AUM") is the product's voice, not a stylistic preference.
   Anywhere the interface is tempted to use finance jargon, the
   temptation is itself the bug.

3. **Honest data, or no data.** If Centfolio cannot categorize a
   transaction confidently, it stays uncategorized. If a price
   snapshot is stale, the interface says so. Subtle wrong is worse
   than visibly empty. Loading shimmer that resolves to a wrong
   number is exactly what to avoid.

4. **Built for one, then for friends.** Every design decision
   optimizes for one person's nightly use first. Multi-user features
   (sharing, leaderboards, comparison) are anti-features by
   construction. Scaling up to friends in v1.5 does not change this
   — invited friends are individual nightly users, not a team.

5. **Geography is identity.** Modern Lithuanian is not a flourish;
   it is the differentiator from every "this could be any country"
   finance app. Color, typography, copy, and default categories
   reflect Baltic context. Quiet about it, but specific.

## Accessibility & Inclusion

- **WCAG AAA on text contrast; AA elsewhere.** Strictest on the
  highest-impact axis (numerical data and body text — the things
  people read), AA on chrome, focus, and interactive affordances.
  This actively constrains the Modern Lithuanian palette: low-chroma
  terracotta tints belong on chrome, never on text. The dark mode
  is hand-tuned to the same AAA-on-text standard.
- **Reduced motion respected.** Every animation honors
  `prefers-reduced-motion`. Default motion is ease-out only, short,
  and signals state change rather than spectacle.
- **Color is never the sole carrier of meaning.** "Spent in red,
  earned in green" must also carry a sign, a label, or a position
  cue. Color blindness considered baseline.
- **Keyboard-first.** Every interactive element reachable and
  operable via keyboard. Focus rings are part of the design system,
  not an afterthought.
- **Known user needs.** v1's user has no declared accessibility
  requirements; the defaults above accommodate without per-user
  customization. Phase 1.5 invited users may have needs that surface
  during their first sessions; the AAA-on-text baseline is intended
  to make per-user adjustment rarely necessary.
