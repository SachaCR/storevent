import config from "config";

import { PGError, PGHybridStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGHybridStore.getLastSnapshot()", () => {
  describe("Given an entity with some snapshots in database", () => {
    const entityId = crypto.randomUUID();
    const stateToSave1 = {
      myState: "my current state 1",
    };

    const stateToSave2 = {
      myState: "my current state 2",
    };

    beforeAll(async () => {
      const myPGEventStore = new PGHybridStore({
        entityName: "test_entity",
        database: DATABASE_CONFIG,
      });

      try {
        await myPGEventStore.initTable();

        await myPGEventStore.saveSnapshot({
          entityId,
          snapshot: stateToSave1,
          version: 1,
        });

        await myPGEventStore.saveSnapshot({
          entityId,
          snapshot: stateToSave2,
          version: 2,
        });
      } finally {
        await myPGEventStore.stop();
      }
    });

    describe("When I get the last snapshot", () => {
      test("Then it returns the expected snapshot", async () => {
        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        try {
          const result = await myPGEventStore.getLastSnapshot(entityId);

          expect(result).toStrictEqual({
            state: {
              myState: "my current state 2",
            },
            version: 2,
          });
        } finally {
          await myPGEventStore.stop();
        }
      });
    });

    describe("When I get last snapshot for an unknown entityId", () => {
      const unknownEntityId = crypto.randomUUID();

      test("Then it returns undefined", async () => {
        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        try {
          const result = await myPGEventStore.getLastSnapshot(unknownEntityId);

          expect(result).toBeUndefined();
        } finally {
          await myPGEventStore.stop();
        }
      });
    });

    describe("When I get last snapshot with an invalid entityId", () => {
      const invalidEntityId = "just a string";

      test("Then it throws a PGError instance with code POSTGRES_ERROR", async () => {
        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });
        let error;

        try {
          await myPGEventStore.getLastSnapshot(invalidEntityId);
        } catch (err: unknown) {
          if (err instanceof PGError) {
            error = err;

            expect(err.message).toStrictEqual(
              'invalid input syntax for type uuid: "just a string"',
            );
            expect(err.code).toStrictEqual("POSTGRES_ERROR");
            expect(err.name).toStrictEqual("StoreventError");
            expect(err.cause).toBeDefined();
            expect(err.cause).toBeInstanceOf(Error);
          }
        } finally {
          await myPGEventStore.stop();
        }

        expect(error).toBeDefined();
      });
    });
  });
});
