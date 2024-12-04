import config from "config";

import { PGError, PGAdvancedEventStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGAdvancedEventStore.getLastSnapshot()", () => {
  describe("Given an entity with some snapshots in database", () => {
    const entityId = crypto.randomUUID();
    const stateToSave1 = {
      myState: "my current state 1",
    };

    const stateToSave2 = {
      myState: "my current state 2",
    };

    beforeAll(async () => {
      const myPGAdvancedEventStore = new PGAdvancedEventStore({
        entityName: "test_entity",
        database: DATABASE_CONFIG,
      });

      try {
        await myPGAdvancedEventStore.saveSnapshot({
          entityId,
          snapshot: stateToSave1,
          version: 1,
        });

        await myPGAdvancedEventStore.saveSnapshot({
          entityId,
          snapshot: stateToSave2,
          version: 2,
        });
      } finally {
        await myPGAdvancedEventStore.pgPool.end();
      }
    });

    describe("When I get the last snapshot", () => {
      test("Then it returns the expected snapshot", async () => {
        const myPGAdvancedEventStore = new PGAdvancedEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        try {
          const result = await myPGAdvancedEventStore.getLastSnapshot(entityId);

          expect(result).toStrictEqual({
            state: {
              myState: "my current state 2",
            },
            version: 2,
          });
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }
      });
    });

    describe("When I get last snapshot for an unknown entityId", () => {
      const unknownEntityId = crypto.randomUUID();

      test("Then it returns undefined", async () => {
        const myPGAdvancedEventStore = new PGAdvancedEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        try {
          const result =
            await myPGAdvancedEventStore.getLastSnapshot(unknownEntityId);

          expect(result).toBeUndefined();
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }
      });
    });

    describe("When I get last snapshot with an invalid entityId", () => {
      const invalidEntityId = "just a string";

      test("Then it throws a PGError instance with code POSTGRES_ERROR", async () => {
        const myPGAdvancedEventStore = new PGAdvancedEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });
        let error;

        try {
          await myPGAdvancedEventStore.getLastSnapshot(invalidEntityId);
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
          await myPGAdvancedEventStore.pgPool.end();
        }

        expect(error).toBeDefined();
      });
    });
  });
});
