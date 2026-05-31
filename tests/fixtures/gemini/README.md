# Gemini fixtures

Recorded Gemini `generateContent` responses, replayed by the
`tests/helpers/gemini-mock.ts` Playwright route interceptor.

Discipline (see `.claude/rules/receipts.md` for the full set):

- One fixture per real-world parse case.
- Captured from real receipts with **PII scrubbed before commit**:
  loyalty IDs, email recipients, phone numbers, cashier IDs.
- Re-record on prompt or `responseJsonSchema` change:
  `UPDATE_FIXTURES=true npm run test:e2e` lets the calls through and
  rewrites the fixtures. The PR that changes the prompt also
  contains the fixture diff.

Fixture set lands in PR 4 (text-mode E2E) and PR 5 (photo-mode E2E).
Expected names:

- `iki-email-typical.json`
- `maxima-receipt-typical.json` (PR 5)
- `iki-malformed.json` (failed-state path)
- `iki-zod-reject.json` (validation-rejection path)
- One adversarial Maxima fixture with discount, split-tender, and
  multi-quantity lines.
