/// <reference path="../pb_data/types.d.ts" />

// Sibling to 1780000300: PocketBase v0.38.1 rejects required:true on
// number fields when the submitted value is 0 ("Cannot be blank"
// falsy-coercion in the required check). lineItems has three number
// fields that legitimately accept 0 at runtime:
//
//   - position: always 0 for the first row of every receipt.
//   - lineTotalCents: 0 for free items, samples, comp lines.
//   - quantity: defaults to 1 but defensive against future receipts
//     that report quantity 0 for, e.g., bag-fee waived lines.
//
// Drop required:true on all three. App code in src/lib/receipts/
// parse.ts and src/lib/receipts/actions.ts always sends explicit
// values, so this relaxation does not allow nulls at runtime.

migrate((app) => {
  const collection = app.findCollectionByNameOrId("lineItems");
  for (const name of ["position", "lineTotalCents", "quantity"]) {
    const field = collection.fields.getByName(name);
    field.required = false;
  }
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("lineItems");
  for (const name of ["position", "lineTotalCents", "quantity"]) {
    const field = collection.fields.getByName(name);
    field.required = true;
  }
  return app.save(collection);
})
