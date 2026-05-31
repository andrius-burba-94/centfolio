/// <reference path="../pb_data/types.d.ts" />

// Receipts collection. A receipt is born in `parsing` status with only
// `userId`, `sourceType`, and the corresponding source (sourceText or
// photo) populated. Gemini fills in `merchant`, `date`, `totalCents`
// and the lineItems rows on transition to `parsed`. The user confirms
// to advance to `confirmed`. Phase 5 will add a `transactionId`
// relation and populate it on transition to `matched`; for Phase 3
// the column does not exist.
//
// merchant, date, totalCents are nullable at the DB level because
// they don't exist yet during `parsing`. Required-ness is enforced
// in app code (Zod, server actions) at the state transitions that
// need them (parsed -> confirmed).

migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && @request.body.userId = @request.auth.id",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_receipts_id",
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
        "id": "relation_receipts_user",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "userId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select_receipts_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "parsing",
          "parsed",
          "confirmed",
          "matched",
          "failed"
        ]
      },
      {
        "hidden": false,
        "id": "select_receipts_sourceType",
        "maxSelect": 1,
        "name": "sourceType",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "photo",
          "text"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_receipts_sourceText",
        "max": 50000,
        "min": 0,
        "name": "sourceText",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "file_receipts_photo",
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/webp"
        ],
        "name": "photo",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_receipts_merchant",
        "max": 200,
        "min": 0,
        "name": "merchant",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date_receipts_date",
        "max": "",
        "min": "",
        "name": "date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number_receipts_totalCents",
        "max": null,
        "min": null,
        "name": "totalCents",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_receipts_parseAttempts",
        "max": null,
        "min": 0,
        "name": "parseAttempts",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_receipts_failureReason",
        "max": 500,
        "min": 0,
        "name": "failureReason",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate_receipts_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_receipts_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2026531001",
    "indexes": [
      "CREATE INDEX idx_receipts_user_created ON receipts (userId, created DESC)",
      "CREATE INDEX idx_receipts_user_status ON receipts (userId, status)"
    ],
    "listRule": "userId = @request.auth.id",
    "name": "receipts",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id && @request.body.userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2026531001");
  return app.delete(collection);
})
