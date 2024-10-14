import config from "config";

import { PGEventStore, PGEventStoreConfiguration } from "..";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGEventStore.append()", () => {
  describe("Given a PGEventStore", () => {
    describe("When I read entityName", () => {
      test("Then it returns the expected entity name", async () => {
        const myPGEventStore = new PGEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        await myPGEventStore.stop();
        expect(myPGEventStore.entityName).toStrictEqual("test_entity");
      });
    });

    describe("When I read tableName", () => {
      test("Then it returns the expected table name", async () => {
        const myPGEventStore = new PGEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        await myPGEventStore.stop();
        expect(myPGEventStore.tableName).toStrictEqual("test_entity_events");
      });
    });
  });
});
