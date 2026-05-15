---
paths:
  - "src/components/feature/**"
---

# Feature components

Domain components — `<TransactionRow>`, `<ReceiptCard>`,
`<MatchBadge>` — live here. UI primitives live in `components/ui/`.

## Boundaries

- Feature components receive **already-fetched data as props**.
  They do not fetch their own data. Fetching happens in server
  components or pages.
- Feature components may have local UI state (open/closed,
  hover, etc.) but never own domain state. Domain state lives
  in server state (PocketBase) and is passed down.
- Feature components compose UI primitives from `components/ui/`.
  They never inline raw HTML where a primitive exists.

## Naming

- Files: PascalCase matching the component — `TransactionRow.tsx`.
- One component per file. Helper subcomponents in the same file
  are fine if used only by the main component.
- Props type: `<ComponentName>Props`, e.g., `TransactionRowProps`.

## Display values

- Money: always receive cents via props, format at render using
  `src/lib/money/format.ts`.
- Dates: receive ISO strings or Date objects, format with date-fns
  using user locale.
- Domain status: receive the raw enum value, map to display label
  in the component (or via a small helper in
  `src/lib/display/`).

## Server vs client

- Default to server component (no `'use client'`).
- Add `'use client'` only when one of: state, effects, refs,
  browser APIs, event handlers needing JS.
- A server component can render a client component; the reverse
  needs `children` prop pattern.
