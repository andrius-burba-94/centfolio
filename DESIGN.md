---
name: Centfolio — The Vilnius Ledger
description: A personal finance application that combines bank transactions, itemized receipts, and investment holdings into a single calm, considered view.
colors:
  # Light mode neutrals
  bg-page: "oklch(0.99 0.005 38)"
  bg-surface: "oklch(0.96 0.010 38)"
  bg-surface-deep: "oklch(0.94 0.012 38)"
  border-subtle: "oklch(0.90 0.015 38)"
  border-strong: "oklch(0.80 0.020 38)"
  text-primary: "oklch(0.22 0.020 38)"
  text-secondary: "oklch(0.50 0.020 38)"
  text-tertiary: "oklch(0.65 0.020 38)"
  text-spent: "oklch(0.30 0.05 25)"
  text-earned: "oklch(0.30 0.05 130)"
  # Brand and button tokens, light
  terracotta: "oklch(0.55 0.12 38)"
  button-bg-primary: "oklch(0.45 0.13 38)"
  button-bg-primary-hover: "oklch(0.40 0.13 38)"
  button-bg-primary-active: "oklch(0.35 0.13 38)"
  # Dark mode neutrals
  bg-page-dark: "oklch(0.14 0.012 38)"
  bg-surface-dark: "oklch(0.19 0.014 38)"
  bg-surface-deep-dark: "oklch(0.23 0.014 38)"
  border-subtle-dark: "oklch(0.28 0.015 38)"
  border-strong-dark: "oklch(0.38 0.020 38)"
  text-primary-dark: "oklch(0.95 0.010 38)"
  text-secondary-dark: "oklch(0.75 0.015 38)"
  text-tertiary-dark: "oklch(0.60 0.020 38)"
  text-spent-dark: "oklch(0.92 0.05 25)"
  text-earned-dark: "oklch(0.92 0.05 130)"
  # Brand and button tokens, dark
  terracotta-dark: "oklch(0.65 0.13 38)"
  button-bg-primary-hover-dark: "oklch(0.70 0.13 38)"
  button-bg-primary-active-dark: "oklch(0.75 0.13 38)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1.10
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.20
    letterSpacing: "normal"
    fontFeature: "tnum"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.60
    letterSpacing: "normal"
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  wordmark:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.20
    letterSpacing: "-0.005em"
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.button-bg-primary}"
    textColor: "{colors.bg-page}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.button-bg-primary-hover}"
    textColor: "{colors.bg-page}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-active:
    backgroundColor: "{colors.button-bg-primary-active}"
    textColor: "{colors.bg-page}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  input-focus:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  wordmark:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.wordmark}"
    padding: "0"
  initials-circle:
    backgroundColor: "{colors.bg-surface-deep}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "9999px"
    size: "32px"
---

# Design System: Centfolio — The Vilnius Ledger

## 1. Overview

**Creative North Star: "The Vilnius Ledger"**

*The Vilnius Ledger* frames the whole system. The "Vilnius" is not
decoration. Centfolio is built in a specific city, for the Baltic
banking landscape, by one person who lives there. The "Ledger" is
the literal function: a curated record of where money went, what it
bought, what is held. The two words together set the working stance:
quiet specificity over generic confidence, considered restraint over
busy completeness.

The visual register sits in a print-adjacent neighbourhood. Headlines
are set in Fraunces with the weight of a publication's masthead, never
the italic flourish of an AI-marketing page. Body text and tabular
numerics are set in Inter with generous whitespace and ample leading.
The palette is terracotta-led — warm earth tones — never the cool-blue
convention of banking apps or the cool-gray neutrality of tech-SaaS.
Light mode reads as warm paper; dark mode reads as warm ink. Both are
hand-tuned to clear the WCAG AAA contrast floor PRODUCT.md commits to
for body text and numerals.

*The Vilnius Ledger* rejects the families PRODUCT.md names. It is not
a budget-app dashboard (no charts wallpapering the screen, no streaks,
no traffic-light alerts). It is not cool tech-SaaS (no electric
accents, no default-shadcn neutrality, no operational voice). It is
not bank-app corporate (no navy-and-gold, no push-notification
gravity). It is not crypto-or-trading (no neon, no candlesticks, no
urgency as identity). Centfolio shares aesthetic territory with calm
reader apps (Readwise, Substack, Matter) but rejects their
content-stream pattern: it is an object the user spends evenings with,
not a queue to clear.

**Key Characteristics:**

- Warm terracotta-and-paper palette; never blue, never cool gray
- Fraunces wordmark and headlines, Inter body — publication, not marketing
- AAA contrast on body text and numerals in both modes; dark mode hand-tuned, not generated
- Generous whitespace; sparse density; one thing at a time
- Editorial typography hierarchy, not dashboard density
- Geographic specificity (Baltic identity) over generic confidence
- Calm over loud, considered over fast, honest over impressive

## 2. Colors

A restrained palette: warm-paper neutrals carrying the page, with one
terracotta accent allowed to be load-bearing precisely because it is
rare.

### Primary

- **Vilnius Brick** (`oklch(0.55 0.12 38)` ~ `#B85C3A`):
  the brand identity color in light mode. Used on the wordmark only
  by exception (the wordmark itself is `text-primary` per the
  Publication-Mast Rule), on focus rings, on selected states, and on
  semantic emphasis surfaces.
- **Vilnius Brick (Dark)** (`oklch(0.65 0.13 38)` ~ `#D67A52`):
  hand-tuned dark-mode counterpart. Same hue and chroma family,
  lightness lifted 0.10 so the accent reads present, not dim, against
  the warm-ink page.

### Primary Button (separate token family)

- **Button Brick** (`oklch(0.45 0.13 38)` ~ `#9E4928`): the
  Primary button's resting background in light mode. Decoupled from
  Vilnius Brick — a deeper terracotta chosen for AAA-adjacent contrast
  against on-button cream text. See the Brand-vs-Button Decoupling
  Rule below.
- **Button Brick (Dark)** uses `terracotta-dark` as the resting
  background; on-button text is `bg-page-dark` (warm ink). Same
  conceptual frame: the button carves a deeper terracotta region from
  the page and the on-button text reads as the page color showing
  through.
- Hover and active steps move deeper in light (L=0.40, L=0.35) and
  lighter in dark (L=0.70, L=0.75). The semantic — feedback through
  contrast shift — holds; the direction adapts to mode.

### Neutral (light mode)

- **Warm Paper** (`bg-page` `oklch(0.99 0.005 38)` ~ `#FCF9F6`):
  the broadest reading surface. Brightest token in the system. The
  page IS the paper.
- **Tinted Block** (`bg-surface` `oklch(0.96 0.010 38)` ~ `#F2EAE2`):
  cards, content containers. Slightly more chromatic than the page so
  the block reads as set into it.
- **Tinted Block Deep** (`bg-surface-deep` `oklch(0.94 0.012 38)`
  ~ `#EBE0D5`): nested or hovered surface. The third step in the
  layering ramp.
- **Subtle Border** (`border-subtle` `oklch(0.90 0.015 38)`
  ~ `#DDD0C2`): barely-there dividers, table rows.
- **Strong Border** (`border-strong` `oklch(0.80 0.020 38)`
  ~ `#C2B0A0`): inputs at rest, visible dividers.
- **Ink** (`text-primary` `oklch(0.22 0.020 38)` ~ `#2A1F18`):
  warm near-black. The reading text. AAA-clears against `bg-page`
  at roughly 12:1.
- **Ink Secondary** (`text-secondary` `oklch(0.50 0.020 38)`
  ~ `#6E5848`): chrome-adjacent copy. AA against `bg-page`.
- **Ink Tertiary** (`text-tertiary` `oklch(0.65 0.020 38)`
  ~ `#95826F`): placeholders, disabled. AA against `bg-page`.

### Neutral (dark mode)

The dark-mode layering inverts direction but preserves the metaphor:
the page is the calmest baseline (now warm ink); surfaces stand out
by being lifted, lighter.

- **Warm Ink Page** (`bg-page-dark` `oklch(0.14 0.012 38)`
  ~ `#221710`): the warm-ink page.
- **Lifted Block** (`bg-surface-dark` `oklch(0.19 0.014 38)`
  ~ `#2F2218`): cards. Slightly lifted from the page.
- **Lifted Block Deep** (`bg-surface-deep-dark`
  `oklch(0.23 0.014 38)` ~ `#3A2C22`): hovered or nested surfaces.
- **Subtle Border (Dark)** (`border-subtle-dark`
  `oklch(0.28 0.015 38)` ~ `#463629`): barely-there dividers.
- **Strong Border (Dark)** (`border-strong-dark`
  `oklch(0.38 0.020 38)` ~ `#5C4836`): inputs at rest, visible borders.
- **Cream Ink** (`text-primary-dark` `oklch(0.95 0.010 38)`
  ~ `#F3EBE3`): the reading text in dark mode. AAA-clears against
  `bg-page-dark` at roughly 14:1.
- **Cream Ink Secondary** (`text-secondary-dark`
  `oklch(0.75 0.015 38)` ~ `#BFA993`): chrome-adjacent. AAA-adjacent
  against `bg-page-dark`.
- **Cream Ink Tertiary** (`text-tertiary-dark`
  `oklch(0.60 0.020 38)` ~ `#957C66`): placeholders, disabled.

### Semantic (Spent / Earned)

These tokens do not render in Phase 1 (no transactions yet) but are
defined now so the palette is structurally complete. Phase 2 may
fine-tune values at first real render.

- **Spent Ink** (`text-spent` `oklch(0.30 0.05 25)` ~ `#5C2E27`):
  the slight red-tinted warm-near-black for amounts that move out.
  Reads as colored without springing forward as a separate signal.
- **Earned Ink** (`text-earned` `oklch(0.30 0.05 130)` ~ `#324832`):
  the slight green-tinted warm-near-black for amounts that come in.
- **Spent Ink (Dark)** (`text-spent-dark` `oklch(0.92 0.05 25)`
  ~ `#EFCBC0`) and **Earned Ink (Dark)** (`text-earned-dark`
  `oklch(0.92 0.05 130)` ~ `#CCE2C7`): dark-mode counterparts.

### Named Rules

**The Reading-Load Rule.** Text tokens carry the contrast obligation,
not the chrome.

- `text-primary` — body copy, numerals, field labels, anything
  load-bearing for comprehension. AAA contrast required against any
  background.
- `text-secondary` — captions, tooltips, helper text, metadata
  *adjacent to* a primary value. AA floor; AAA where the palette
  allows. Never used for numerals or amounts.
- `text-tertiary` — placeholders, disabled states, decorative
  timestamps. AA target; sub-AA acceptable for placeholders only.
  Never used for content the user must read.

The drift this rule prevents: reaching for `text-secondary` on "less
important but still meaningful" labels. A caption like *"vs. last
month"* tucked under a numeral is load-bearing for comprehension even
when it is visually subordinate. That label uses `text-primary` at a
smaller size, not `text-secondary` at full size.

**The Sign-First Rule.** Direction-of-money is carried by **sign,
label, or position**; color reinforces. `text-spent` and `text-earned`
are never the sole indicator. A spent value may read as `−€34.27`
with `text-spent` tint (sign), or as a row labeled "Spent: €34.27"
(label), or as a value in a "Spent" column on a multi-column table
(label + position). Strip the colors and the meaning still parses.
Color alone is never sufficient.

## 3. Typography

**Display Font:** Fraunces (variable; Georgia and the system serif
stack as fallback)
**Body Font:** Inter (variable; the system sans-serif stack as
fallback)
**Label/Mono Font:** none distinct; Inter at the label step.

**Character:** Fraunces in the upright register reads as a
publication's masthead — Pentagram, the New Yorker, MIT Tech Review.
Inter at 17px with 1.60 leading reads as iA Writer or Bear — calm,
generously laid out, an evening's reading object.

### Hierarchy

The scale is essentially a perfect fourth (ratio 1.333) through the
title-to-headline steps, with display deliberately stepped out at 48px
— larger than `1.333³ × 17 = 40` would yield — for hero impact. The
40px alternative loses the publication-mast feel on purpose; do not
"correct" it.

- **Display** (Fraunces 400, 48px, line-height 1.10, tracking -0.01em):
  hero text. The "Held" total. Empty-state titles. Editorial display
  presence.
- **Headline** (Fraunces 400, 30px, line-height 1.20, tracking
  normal): page-level section heads.
- **Title** (Inter 600, 22px, line-height 1.35, tracking normal):
  card titles, smaller in-content headings.
- **Body** (Inter 400, 17px, line-height 1.60, tracking normal):
  paragraphs, descriptive copy. Maximum line length 65ch.
- **Label** (Inter 500, 14px, line-height 1.40, tracking +0.01em):
  form labels, button labels, captions, table headers.
- **Wordmark** (Fraunces 400, 22px, line-height 1.20, tracking
  -0.005em): one specific use of Fraunces with its own size and
  tracking. Kept out of the body scale so the scale stays clean.

### Tabular figures

`font-feature-settings: "tnum" 1` applies to **both fonts at every
step that ever renders a numeral** — Inter at title / body / label
and Fraunces at display / headline. The future "Held" total at
display 48px is Fraunces, and must inherit tnum, or a single
non-tabular Fraunces numeral reads as a typo against the rest of the
page.

### Named Rules

**The Publication-Mast Rule.** Fraunces is set upright only, in a
publication-mast register. Italic Fraunces — particularly
italic-serif hero text — is the AI-marketing-page reflex ADR-0004
explicitly rejects. *The Vilnius Ledger* is set in the calm of a
printed page; emphasis comes from weight contrast and scale, not
from cursive flourish. If italic is needed at all, it lives in Inter
Italic in body text.

## 4. Elevation

Centfolio is flat at rest. Depth comes from tonal layering through
the `bg-page → bg-surface → bg-surface-deep` ramp, not from
`box-shadow`. This honors the editorial / publication positive
reference: magazines convey depth through type, color, and layout,
not through default-state shadows.

Shadows are reserved for elements that float over the page without a
flat alternative — dropdowns, toasts, and (later) modals. There is
exactly one shadow vocabulary entry, used by all such elements.

### Shadow Vocabulary

- **lifted-floating**
  (`box-shadow: 0 8px 24px -8px oklch(0.55 0.12 38 / 0.18)`):
  soft, terracotta-tinted (uses the brand hue rather than neutral
  black), low opacity. Identical token in light and dark modes.
  Phase 1 consumers: Sonner toast, theme-toggle dropdown, user-menu
  dropdown.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth comes
from tonal layering and from typography hierarchy, never from
default-state `box-shadow`. The `lifted-floating` token is the only
sanctioned exception and is reserved for elements that genuinely
float (dropdowns, toasts, modals).

**The Brief Motion Rule.** Motion responds to state change; it does
not narrate. Defaults: 180ms duration,
`cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart) easing. No bounce,
no elastic, no choreography. `prefers-reduced-motion` is respected
on every animation — when set, durations collapse to 0ms and changes
apply instantly rather than animating.

## 5. Components

### Buttons

Two variants for Phase 1: **primary** and **ghost**. No "secondary."

**Primary**
- **Shape:** `rounded-sm` (4px). Barely-rounded, not pill.
- **Resting:** `button-bg-primary` background (light) /
  `terracotta-dark` background (dark); on-button text is the
  page color of its native mode (cream in light, warm ink in dark).
- **Padding:** 12px 20px.
- **Hover:** background steps to `button-bg-primary-hover` in light
  (deeper) or `button-bg-primary-hover-dark` in dark (lighter).
- **Active:** background steps further to
  `button-bg-primary-active` / `-dark`.
- **Focus:** see Mode-Appropriate Focus Ring Rule.
- **Disabled:** background `border-strong`; text `text-tertiary`;
  cursor `not-allowed`.

**Ghost**
- **Shape:** `rounded-sm`.
- **Resting:** transparent background; `text-secondary` for label.
- **Padding:** 8px 12px (text + icon) or 8px (icon only).
- **Hover:** background `bg-surface`.
- **Active:** background `bg-surface-deep`.

### Inputs

- **Background:** `bg-page` — even when the input lives inside a
  card. The Cut-Into-the-Page Rule is load-bearing.
- **Border:** 1px solid `border-strong`.
- **Shape:** `rounded-sm`.
- **Padding:** 10px 14px.
- **Typography:** body (Inter 400, 17px). `text-primary` for value;
  `text-tertiary` for placeholder.
- **Focus:** border swaps to `terracotta` (mode-appropriate) plus a
  2px mode-appropriate terracotta ring. No background shift.
- **Error:** border swaps to `text-spent` (mode-appropriate). Helper
  text below the input renders at label size in `text-spent`.
- **Disabled:** background `bg-surface`; text `text-tertiary`;
  cursor `not-allowed`.

### Labels

- **Typography:** label (Inter 500, 14px, +0.01em tracking).
- **Color:** `text-secondary`.
- **Spacing:** 6px gap below the label, before the input.

### Forms

The shadcn Form primitive composes Label + Input + error message. No
distinctive visual character beyond its parts. Error message slot
uses label typography in `text-spent`, positioned 6px below the
input.

### Cards

- **Shape:** `rounded-md` (8px).
- **Background:** `bg-surface`.
- **Border:** none at rest. 1px `border-subtle` on hover/focus
  *only if the card is interactive*. Phase 1 dashboard cards are
  not interactive.
- **Shadow:** none (Flat-By-Default Rule).
- **Padding:** 24px.

### Toasts (Sonner)

- **Shape:** `rounded-md`.
- **Background:** `bg-surface`.
- **Border:** none (shadow provides separation).
- **Shadow:** `lifted-floating`.
- **Padding:** 14px 16px.
- **Position:** bottom-right (Sonner default).
- **Typography:** body for content; label for action text if present.

Variants:

- **default** — no icon; `text-primary` content.
- **success** — 16px checkmark in mode-appropriate `text-earned` +
  `text-primary` content.
- **error** — 16px exclamation in mode-appropriate `text-spent` +
  `text-primary` content. Duration extended to 6000ms (more reading
  time).

The variant accent is icon-only. Full background tints and
side-stripe accent borders are banned by the absolute bans below.

### Wordmark

- **Text:** "Centfolio".
- **Font:** Fraunces (variable), `opsz` ~36.
- **Weight:** 400 (Regular).
- **Size:** 22px.
- **Color:** `text-primary` — **not** terracotta.
- **Tracking:** -0.005em.
- **Italic:** never (Publication-Mast Rule).
- **Element:** `<span>` in Phase 1; `<Link href="/dashboard">` from
  Phase 2.

### Theme toggle

A Ghost button with a Lucide icon, opening a dropdown.

- **Trigger:** Ghost button, 32×32px, square padding. Icon 18px
  Lucide — `monitor` for system, `sun` for light, `moon` for dark —
  in `text-secondary`.
- **Dropdown:** 8px gap below the trigger, right-aligned.
  `bg-surface`, `rounded-md`, `lifted-floating` shadow, 8px padding.
- **Dropdown item:** 8px 12px padding, body typography,
  `text-primary`. Hover background `bg-surface-deep`. Current
  selection marked with a mode-appropriate terracotta checkmark on
  the right.

The dropdown UX shape was deferred to `/impeccable critique`; it can
reshape to a cycling button or a radio group if the critique
determines another form serves the design better.

### User menu (initials circle + dropdown)

- **Trigger (initials circle):**
  - 32×32px circle (`rounded: 9999px`).
  - Background `bg-surface-deep`; text `text-primary`.
  - Typography: label (Inter 500, 14px).
  - Content: computed initials from user name (e.g., "AB" from
    "Andrius Burba"), maximum 2 characters.
  - Focus: 2px mode-appropriate terracotta ring, 2px offset.
- **Dropdown:** identical structural treatment to the theme-toggle
  dropdown (right-aligned, `bg-surface`, `lifted-floating` shadow,
  `rounded-md`, 8px padding, min-width 160px).
- **Dropdown item (Logout):** 8px 12px padding, body typography,
  `text-primary`. Hover background `bg-surface-deep`.

### Named Rules

**The No-Ghost-Submission Rule.** The primary call-to-action on any
form is always the Primary button. Ghost is for secondary or
destructive actions, never for "save / submit / log in." A user must
always have exactly one terracotta-stamped path through a form.

**The Cut-Into-the-Page Rule.** Inputs sit on `bg-page`, never on
`bg-surface` — even when the form lives inside a card. This inverts
the SaaS convention (bright input on dim background) and ties to the
editorial framing: the page is the writing surface; an input is a
space the user writes back into it. If a form lives in a card, the
card uses `bg-surface` but the input's background remains `bg-page`.
The input visually breaks through the card to the page beneath.

**The Brand-vs-Button Decoupling Rule.** The brand `terracotta`
(L=0.55, the system's identity color) carries focus rings, selected
states, and semantic emphasis — surfaces where it has no on-color
text contrast obligation. The Primary button background is a
*separate* token (`button-bg-primary`, L=0.45 in light mode) chosen
for AAA-adjacent contrast against on-button text. Same hue family,
different lightness. Do not conflate the two: setting
`button-bg = terracotta` directly fails AA on cream text and violates
the Reading-Load Rule on the system's most action-critical UI
surface.

**The Mode-Appropriate Focus Ring Rule.** Focus rings:

- appear only on `:focus-visible` (keyboard focus); never on
  `:focus` for click-focused elements
- 2px stroke, 2px offset from element edge, solid style
- color: `terracotta` in light mode, `terracotta-dark` in dark mode,
  declared as a CSS custom property so Tailwind's
  `@custom-variant dark` swap applies automatically
- never overridden per-component

Click-focus deliberately doesn't render the ring. Clicking is its
own visual feedback; the ring would be redundant noise. Keyboard
focus always does — the ring is the only feedback the keyboard user
has.

**The Initials-Not-Avatar Rule.** Phase 1 user menu shows initials
in a `bg-surface-deep` circle. No Avatar primitive, no image upload,
no placeholder photo. Initials in a tinted circle is three Tailwind
classes; the Avatar primitive's variants (image, fallback, sizes,
groups) earn their keep only when at least one of those variants is
needed. They are not, yet.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH for all color tokens. Tint every neutral toward
  hue 38° at chroma 0.005–0.020.
- **Do** set Fraunces upright at every use. Italic Fraunces is
  forbidden anywhere in the system.
- **Do** apply `font-feature-settings: "tnum" 1` to every numeral,
  in both Inter and Fraunces.
- **Do** use `bg-page` as the input background, even when the input
  lives inside a card (Cut-Into-the-Page Rule).
- **Do** carry direction-of-money via sign, label, or position
  first; color reinforces (Sign-First Rule).
- **Do** reserve `terracotta` (L=0.55) for focus rings, selected
  states, and semantic emphasis. The wordmark uses `text-primary`,
  not terracotta (per the Publication-Mast Rule). Primary button
  background is the separate `button-bg-primary` (L=0.45) (per the
  Brand-vs-Button Decoupling Rule).
- **Do** cap terracotta presence at ≤10% of any screen. Restrained
  strategy is load-bearing; exceed it and the system stops reading
  as quiet.
- **Do** respect `prefers-reduced-motion` on every animation. When
  set, durations collapse to 0ms; opacity and transform changes
  apply instantly rather than animating.
- **Do** show focus rings only on `:focus-visible`. Click-focused
  elements get none.

### Don't:

- **Don't** look like Mint, YNAB, Monarch, or Lunchmoney. No dense
  charts wallpapering the screen, no traffic-light spending alerts,
  no streaks, no gamified progress.
- **Don't** look like Linear, Notion, Vercel, or default-shadcn. No
  cool grays, no electric accents, no neutral-technical voice.
- **Don't** look like Revolut, SEB, or Wise. No navy-and-gold, no
  corporate-trustworthy blue, no push-notification gravity.
  Centfolio is not a bank.
- **Don't** look like Robinhood, TradingView, or eToro. No
  neon-on-black, no candlestick imagery, no urgency-driven flashing
  data.
- **Don't** fall into the first-order finance reflex (navy and
  gold). Modern Lithuanian's terracotta is the anti-blue stake.
- **Don't** fall into the second-order finance reflex
  (terminal-native dark mode, green-on-black numerals). Dark mode is
  hand-tuned warm earth, not a trader's terminal.
- **Don't** use italic Fraunces in display, headline, or anywhere
  else (Publication-Mast Rule).
- **Don't** use `#fff` or `#000` in any color value. Every neutral
  tints toward hue 38°.
- **Don't** use `border-left` or `border-right` greater than 1px as
  a colored accent on cards, list items, or alerts.
- **Don't** use gradient text (`background-clip: text` + gradient).
- **Don't** use glassmorphism (blur + transparency on default
  surfaces). *The Vilnius Ledger* is paper and ink, not glass.
- **Don't** use the hero-metric template (big number + small label
  + supporting stats + gradient accent). SaaS cliché.
- **Don't** use identical card grids (same-sized cards with icon +
  heading + text, repeated).
- **Don't** reach for a modal as a first thought. Exhaust inline and
  progressive alternatives first.
- **Don't** use em dashes or `--` in copy. Use commas, colons,
  semicolons, periods, or parentheses.
- **Don't** use `text-secondary` on numerals or amounts
  (Reading-Load Rule).
- **Don't** set `button-bg = terracotta` directly (Brand-vs-Button
  Decoupling Rule).
- **Don't** put a photo, image, or upload-able avatar in the user
  menu (Initials-Not-Avatar Rule).
- **Don't** use `box-shadow` on default-state surfaces
  (Flat-By-Default Rule).

### Audit tests

- **Don't** ship a screen that could be mistaken at a glance for
  Linear, Mint, Wise, or Robinhood. If it could, the design failed
  the category-reflex check.
- **Don't** ship a numeric value that does not render in tabular
  figures. A single non-tnum numeral reads as a typo against a
  tnum-aligned column.
- **Don't** ship terracotta as more than 10% of pixels on any screen.
  Count if uncertain.
