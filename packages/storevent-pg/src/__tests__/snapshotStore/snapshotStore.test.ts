import config from "config";

import { PGSnapshotStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGSnapshotStore", () => {
  describe("Given PGSnapshotStore ", () => {
    const myPGStore = new PGSnapshotStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    afterAll(async () => {
      await myPGStore.stop();
    });

    describe("When I read the table name", () => {
      test("Then it returns the expected name", () => {
        const tableName = myPGStore.tableName;
        expect(tableName).toStrictEqual("test_entity_snapshots");
      });
    });

    describe("When I read the entity name", () => {
      test("Then it returns the expected name", () => {
        const entityName = myPGStore.entityName;
        expect(entityName).toStrictEqual("test_entity");
      });
    });
  });
});
