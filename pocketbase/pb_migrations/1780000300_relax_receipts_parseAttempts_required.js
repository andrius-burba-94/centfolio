/// <reference path="../pb_data/types.d.ts" />

// PocketBase v0.38.1 has a quirk where number fields with required:true
// reject the value 0 with "Cannot be blank" (falsy-coercion on the
// required check). parseAttempts is intentionally 0 on a fresh receipt
// row created from the entry sheet, so the required:true constraint is
// incompatible with the actual write pattern.
//
// Drop the required flag. PB number fields default to 0 when omitted,
// and the app code in src/lib/receipts/actions.ts always sends an
// explicit value, so this relaxation does not allow nulls at runtime
// and keeps the per-row parseAttempts ceiling intact in the parse
// state machine.

migrate((app) => {
  const collection = app.findCollectionByNameOrId("receipts");
  const field = collection.fields.getByName("parseAttempts");
  field.required = false;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("receipts");
  const field = collection.fields.getByName("parseAttempts");
  field.required = true;
  return app.save(collection);
})
