---
paths:
  - "src/lib/money/**"
  - "src/**/money*"
  - "src/**/currency*"
  - "src/**/amount*"
---

# Money math

Currency is integer cents, always. `€34.27` is stored as `3427`.

## Storage

- TypeScript: `number` (integer cents).
- PocketBase: `int`.
- Variable names: `amountCents`, `totalCents`. The `Cents` suffix
  on internal types is encouraged; it's a tripwire for "did I
  format yet?"

## Arithmetic

- All math operates on cents.
- Never `0.1 + 0.2`. Floats are unsafe for money.
- Multiplication by ratios (e.g., percentage): round explicitly.
  Decide rounding direction (half-up vs banker's) per case;
  document the choice in code comments.

## Display

- Conversion to display happens at the UI edge only.
- All display formatting goes through `src/lib/money/format.ts`.
- Component props receive cents; the component formats on render.
- Never store a formatted string anywhere. Strings are output-only.

## Testing

This module is pure logic. Per `.claude/rules/testing.md`, use TDD:
write the failing test first, then the function. Target 95%+
coverage. Edge cases that must be tested:

- Zero
- Negative amounts
- Very large amounts (multi-billion cents)
- Rounding at the half-cent boundary
- Locale formatting (EUR symbol placement, thousand separators)
