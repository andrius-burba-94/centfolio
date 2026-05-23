/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && @request.body.userId = @request.auth.id",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_categories_id",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_categories_name",
        "max": 100,
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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_categories_user",
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
        "id": "autodate_categories_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_categories_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2026523001",
    "indexes": [
      "CREATE INDEX idx_categories_user ON categories (userId)"
    ],
    "listRule": "userId = @request.auth.id",
    "name": "categories",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id && @request.body.userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id"
  });

  // Save the collection first so the self-relation can resolve.
  app.save(collection);

  // Add the parentId self-relation now that the collection exists.
  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2026523001",
    "hidden": false,
    "id": "relation_categories_parent",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "parentId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2026523001");
  return app.delete(collection);
})
