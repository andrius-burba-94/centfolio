---
paths:
  - "src/lib/pocketbase/**"
  - "pocketbase/**"
  - "src/**/*pocketbase*"
---

# PocketBase rules

These are non-obvious behaviors of PocketBase 0.25+ that fresh code
gets wrong by default.

## Quirks

- Admin auth endpoint is `/_superusers`, not `/admins`.
- Collection schemas use `fields`, not `schema`.
- Filter strings require single quotes around values:
  `filter = "userId = 'abc123'"`, not double quotes.
- All client fetches must include `requestKey: null` to prevent
  React StrictMode cancellation.
- Base collections do NOT auto-add `created`/`updated` fields.
  Add them explicitly when needed.
- `username` is a custom field, not built-in.
- Sort by `-id` for collections without created-based sorting.
- Filter rule syntax is `@request.auth.role`, not
  `@request.auth.record.role`.

## No transactions

PocketBase has no DB transactions. For any multi-record write,
use the **validate-then-write** pattern:

1. Validate every input the operation depends on (existence,
   uniqueness, permissions) by reading first.
2. Only after all validations pass, perform the writes.
3. Never assume atomicity. If two writes can fail independently,
   write the recovery path.

## Unique on numeric fields

PocketBase stores unset numbers as `0`, not `null`, which causes
false uniqueness conflicts on numeric indexes. Don't put unique
constraints on numeric fields. Enforce uniqueness in app code
instead.

## Schema as code

Schema is the source of truth at `pocketbase/schema.json`. The
workflow:

1. Change schema in PocketBase admin UI with Merge ON.
2. Export updated schema, replace `pocketbase/schema.json`.
3. Commit the diff in the same PR as the code that depends on it.

Never let production schema drift from the committed file.
