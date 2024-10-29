import config from "config";
import { Client } from "pg";

import { PGError, PGHybridStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGHybridStore.saveSnapshot()", () => {
  describe("Given an entity state", () => {
    const stateToSave = {
      myState: "my current state",
    };

    describe("When I save a snapshot", () => {
      test("Then it successfully save the state", async () => {
        const entityId = crypto.randomUUID();

        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        const client = new Client({
          host: DATABASE_CONFIG.host,
          database: DATABASE_CONFIG.name,
          port: DATABASE_CONFIG.port,
          password: DATABASE_CONFIG.password,
          user: DATABASE_CONFIG.user,
        });

        try {
          await myPGEventStore.saveSnapshot({
            entityId,
            snapshot: stateToSave,
            version: 1,
          });

          await client.connect();

          const result = await client.query(
            `
              SELECT *
              FROM test_entity_snapshots
              WHERE entity_id = $1
            `,
            [entityId],
          );

          expect(result.rows).toHaveLength(1);
          expect(result.rows[0]).toStrictEqual({
            entity_id: entityId,
            version: "1",
            state: {
              myState: "my current state",
            },
            created_at: expect.any(Date) as Date,
            updated_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGEventStore.stop();
          await client.end();
        }
      });
    });

    describe("When preceding snapshot exists", () => {
      const precedingState = {
        myState: "preceding state",
      };

      describe("And write mode is 'APPEND'", () => {
        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
          writeMode: "APPEND",
        });

        test("Then it successfully adds the new snapshot", async () => {
          const entityId = crypto.randomUUID();

          const client = new Client({
            host: DATABASE_CONFIG.host,
            database: DATABASE_CONFIG.name,
            port: DATABASE_CONFIG.port,
            password: DATABASE_CONFIG.password,
            user: DATABASE_CONFIG.user,
          });

          try {
            await myPGEventStore.saveSnapshot({
              entityId,
              snapshot: precedingState,
              version: 1,
            });

            await myPGEventStore.saveSnapshot({
              entityId,
              snapshot: stateToSave,
              version: 2,
            });

            await client.connect();

            const result = await client.query(
              `
              SELECT *
              FROM test_entity_snapshots
              WHERE entity_id = $1
              ORDER BY version ASC
            `,
              [entityId],
            );

            expect(result.rows).toHaveLength(2);
            expect(result.rows[0]).toStrictEqual({
              entity_id: entityId,
              version: "1",
              state: {
                myState: "preceding state",
              },
              created_at: expect.any(Date) as Date,
              updated_at: expect.any(Date) as Date,
            });
            expect(result.rows[1]).toStrictEqual({
              entity_id: entityId,
              version: "2",
              state: {
                myState: "my current state",
              },
              created_at: expect.any(Date) as Date,
              updated_at: expect.any(Date) as Date,
            });
          } finally {
            await myPGEventStore.stop();
            await client.end();
          }
        });
      });

      describe("And write mode is 'REPLACE'", () => {
        const myPGEventStore = new PGHybridStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
          writeMode: "REPLACE",
        });

        test("Then it successfully update the existing snapshot", async () => {
          const entityId = crypto.randomUUID();

          const client = new Client({
            host: DATABASE_CONFIG.host,
            database: DATABASE_CONFIG.name,
            port: DATABASE_CONFIG.port,
            password: DATABASE_CONFIG.password,
            user: DATABASE_CONFIG.user,
          });

          try {
            await myPGEventStore.saveSnapshot({
              entityId,
              snapshot: precedingState,
              version: 1,
            });

            await myPGEventStore.saveSnapshot({
              entityId,
              snapshot: stateToSave,
              version: 2,
            });

            await client.connect();

            const result = await client.query(
              `
              SELECT *
              FROM test_entity_snapshots
              WHERE entity_id = $1
              ORDER BY version ASC
            `,
              [entityId],
            );

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]).toStrictEqual({
              entity_id: entityId,
              version: "2",
              state: {
                myState: "my current state",
              },
              created_at: expect.any(Date) as Date,
              updated_at: expect.any(Date) as Date,
            });
          } finally {
            await myPGEventStore.stop();
            await client.end();
          }
        });
      });
    });

    describe("When preceding snapshot exists with same version", () => {
      const precedingState = {
        myState: "preceding state",
      };

      const myPGEventStore = new PGHybridStore({
        entityName: "test_entity",
        database: DATABASE_CONFIG,
      });

      test("Then it thows a StoreventError with code 'POSTGRES_ERROR'", async () => {
        const entityId = crypto.randomUUID();

        let error;

        try {
          await myPGEventStore.saveSnapshot({
            entityId,
            snapshot: precedingState,
            version: 1,
          });

          await myPGEventStore.saveSnapshot({
            entityId,
            snapshot: stateToSave,
            version: 1,
          });
        } catch (err: unknown) {
          if (err instanceof PGError) {
            error = err;

            expect(err.message).toStrictEqual(
              'duplicate key value violates unique constraint "test_entity_snapshots_pkey"',
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
