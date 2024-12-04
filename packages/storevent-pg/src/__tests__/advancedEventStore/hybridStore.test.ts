import config from "config";

import { PGAdvancedEventStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGAdvancedEventStore", () => {
  describe("Given PGAdvancedEventStore ", () => {
    const myPGStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    afterAll(async () => {
      await myPGStore.pgPool.end();
    });

    describe("When I read the event table name", () => {
      test("Then it returns the expected name", () => {
        const tableName = myPGStore.eventTableName;
        expect(tableName).toStrictEqual("test_entity_events");
      });
    });

    describe("When I read the snapshot table name", () => {
      test("Then it returns the expected name", () => {
        const tableName = myPGStore.snapshotTableName;
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
