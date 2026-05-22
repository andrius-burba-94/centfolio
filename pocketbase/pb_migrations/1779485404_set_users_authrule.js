/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Open password auth for any user. The schema previously shipped
  // with authRule="" (PB convention: empty string means admin-only),
  // which blocked all non-superuser login. Phase 1's seed script
  // patched this at runtime; this migration locks the open rule into
  // the schema so a fresh PocketBase (CI, new dev machine) has it
  // applied automatically.
  //
  // Permissive expression rather than null: SDK round-trip for null
  // is inconsistent across PocketBase JS SDK versions; the literal
  // expression always sticks.
  unmarshal({
    "authRule": "id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Revert to the original (closed) rule. Note: down-migration leaves
  // PB in the admin-only auth state that the seed script had to patch
  // around in Phase 1; only roll back if you intend to re-block
  // non-superuser auth.
  unmarshal({
    "authRule": ""
  }, collection)

  return app.save(collection)
})
