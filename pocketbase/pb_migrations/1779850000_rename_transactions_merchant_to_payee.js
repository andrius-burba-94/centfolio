/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2026523003");
    const field = collection.fields.find(
      (f) => f.name === "merchantName",
    );
    if (field) {
      field.name = "payee";
    }
    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_2026523003");
    const field = collection.fields.find((f) => f.name === "payee");
    if (field) {
      field.name = "merchantName";
    }
    return app.save(collection);
  },
);
