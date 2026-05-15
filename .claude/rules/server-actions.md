---
paths:
  - "src/lib/*/actions.ts"
  - "src/lib/*/actions/**"
  - "src/app/**/actions.ts"
---

# Server actions

## Validation

Every server action validates input with Zod at the top of the
function, before any other logic. No exceptions.

```typescript
const schema = z.object({
  amountCents: z.number().int(),
  merchantName: z.string().min(1),
  categoryId: z.string(),
});

export async function createTransaction(input: unknown) {
  const data = schema.parse(input);
  // ... rest of action
}
```

Validation errors throw and surface to the user as form errors.
Don't catch and rewrap unless adding genuine context.

## User scope

Every server action that touches user data:

1. Resolves the authenticated user from the session at the top.
2. Filters every query by `userId`.
3. Refuses any input that includes a `userId` field — derive it,
   never accept it.

```typescript
const user = await getCurrentUser();
if (!user) throw new Error('Unauthorized');

const transactions = await pb.collection('transactions').getList(1, 50, {
  filter: `userId = '${user.id}'`,
  requestKey: null,
});
```

## Error surfacing

Errors must reach the user with a meaningful message. The pattern:

- Validation errors: surface as form-level errors.
- Domain errors (e.g., "category not found"): throw a typed error
  the client component renders.
- Infrastructure errors (e.g., PB unreachable): catch, log to Pino
  with context, rethrow a generic "Something went wrong" to the
  user. Don't leak stack traces.

## No client-side mutation of server-only data

Server actions are the *only* path for writes from the client.
Don't bypass them with direct PocketBase calls from client
components.
