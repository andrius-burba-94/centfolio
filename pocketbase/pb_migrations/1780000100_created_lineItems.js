/// <reference path="../pb_data/types.d.ts" />

// lineItems collection. Each row is one line on a receipt: a
// product, a discount, a whole-receipt adjustment, or a split-tender
// notation. `lineTotalCents` is signed so discount and split-tender
// lines can be stored faithfully with negative totals (see CONTEXT.md
// and `.claude/rules/receipts.md`; no sum-equals-total invariant).
//
// NOTE: `userId` is denormalized onto lineItems on purpose, not by
// accident. PocketBase rule expressions cannot easily traverse a
// relation to check the parent receipt's owner against the
// authenticated user. Storing userId directly on lineItems lets the
// rule stay flat (`userId = @request.auth.id`), matching every
// other collection in the codebase. The denormalization cost is
// trivial (one extra column on a child collection that already lives
// on each row); the rule-simplicity payoff is real.

migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && @request.body.userId = @request.auth.id",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_lineItems_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_lineItems_user",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "userId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_2026531001",
        "hidden": false,
        "id": "relation_lineItems_receipt",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "receiptId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_lineItems_name",
        "max": 200,
        "min": 1,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_lineItems_quantity",
        "max": null,
        "min": 0,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_lineItems_unit",
        "max": 20,
        "min": 0,
        "name": "unit",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_lineItems_unitPriceCents",
        "max": null,
        "min": null,
        "name": "unitPriceCents",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_lineItems_lineTotalCents",
        "max": null,
        "min": null,
        "name": "lineTotalCents",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_lineItems_position",
        "max": null,
        "min": 0,
        "name": "position",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate_lineItems_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_lineItems_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2026531002",
    "indexes": [
      "CREATE INDEX idx_lineItems_receipt_position ON lineItems (receiptId, position)",
      "CREATE INDEX idx_lineItems_user ON lineItems (userId)"
    ],
    "listRule": "userId = @request.auth.id",
    "name": "lineItems",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id && @request.body.userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2026531002");
  return app.delete(collection);
})
