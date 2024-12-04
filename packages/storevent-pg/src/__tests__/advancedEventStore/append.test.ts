import config from "config";
import { Client } from "pg";

import { WrongOffsetError } from "@storevent/storevent";

import { PGAdvancedEventStore } from "../..";
import { PGAdvancedEventStoreConfiguration } from "../../advancedEventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGAdvancedEventStoreConfiguration["database"]>("database");

describe("Component PGAdvancedEventStore.append()", () => {
  describe("Given an entity id without any event stored", () => {
    const entityId = crypto.randomUUID();

    describe("When I append new events", () => {
      const eventsToAppend = [
        {
          name: "event_1",
          payload: { value: 1 },
        },
        {
          name: "event_2",
          payload: { value: 2 },
        },
        {
          name: "event_3",
          payload: { value: 3 },
        },
      ];

      test("Then it successfully insert the events", async () => {
        const myPGAdvancedEventStore = new PGAdvancedEventStore({
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
          await myPGAdvancedEventStore.append({
            entityId,
            events: eventsToAppend,
          });

          await client.connect();

          const result = await client.query(
            `
            SELECT * FROM test_entity_events WHERE entity_id = $1
          `,
            [entityId],
          );

          expect(result.rows).toHaveLength(3);
          expect(result.rows[0]).toStrictEqual({
            name: "event_1",
            payload: { value: 1 },
            event_offset: "1",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[1]).toStrictEqual({
            name: "event_2",
            payload: { value: 2 },
            event_offset: "2",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[2]).toStrictEqual({
            name: "event_3",
            payload: { value: 3 },
            event_offset: "3",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
          await client.end();
        }
      });
    });
  });

  describe("Given an entity id without any event stored", () => {
    const entityId = crypto.randomUUID();

    describe("When I append new events and a snapshot", () => {
      const eventsToAppend = [
        {
          name: "event_1",
          payload: { value: 1 },
        },
        {
          name: "event_2",
          payload: { value: 2 },
        },
        {
          name: "event_3",
          payload: { value: 3 },
        },
      ];

      const snapshot = {
        state: { status: "active" },
        version: 3,
      };

      test("Then it successfully insert the events and the snapshot", async () => {
        const myPGAdvancedEventStore = new PGAdvancedEventStore({
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
          await myPGAdvancedEventStore.appendWithSnapshot({
            entityId,
            events: eventsToAppend,
            snapshot,
            appendAfterOffset: 0,
          });

          await client.connect();

          const result = await client.query(
            `
            SELECT * FROM test_entity_events WHERE entity_id = $1
          `,
            [entityId],
          );

          expect(result.rows).toHaveLength(3);
          expect(result.rows[0]).toStrictEqual({
            name: "event_1",
            payload: { value: 1 },
            event_offset: "1",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[1]).toStrictEqual({
            name: "event_2",
            payload: { value: 2 },
            event_offset: "2",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[2]).toStrictEqual({
            name: "event_3",
            payload: { value: 3 },
            event_offset: "3",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });

          const resultSnapshot = await client.query(
            `
            SELECT * FROM test_entity_snapshots WHERE entity_id = $1
          `,
            [entityId],
          );

          expect(resultSnapshot.rows).toHaveLength(1);
          expect(resultSnapshot.rows[0]).toStrictEqual({
            entity_id: entityId,
            is_latest: true,
            state: {
              status: "active",
            },
            version: "3",
            created_at: expect.any(Date) as Date,
            updated_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
          await client.end();
        }
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGAdvancedEventStore.append({
        entityId,
        events: [
          {
            name: "event_1",
            payload: { value: 1 },
          },
          {
            name: "event_2",
            payload: { value: 2 },
          },
          {
            name: "event_3",
            payload: { value: 3 },
          },
        ],
      });
    });

    describe("When I append new events specifying last known sequence", () => {
      const newEventsToAppend = [
        {
          name: "event_4",
          payload: { value: 4 },
        },
        {
          name: "event_5",
          payload: { value: 5 },
        },
      ];

      test("Then it successfully insert the events", async () => {
        const client = new Client({
          host: DATABASE_CONFIG.host,
          database: DATABASE_CONFIG.name,
          port: DATABASE_CONFIG.port,
          password: DATABASE_CONFIG.password,
          user: DATABASE_CONFIG.user,
        });

        try {
          await myPGAdvancedEventStore.append({
            entityId,
            events: newEventsToAppend,
            appendAfterOffset: 3,
          });

          await client.connect();

          const result = await client.query(
            `
            SELECT * FROM test_entity_events WHERE entity_id = $1
          `,
            [entityId],
          );

          expect(result.rows).toHaveLength(5);
          expect(result.rows[0]).toStrictEqual({
            name: "event_1",
            payload: { value: 1 },
            event_offset: "1",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[1]).toStrictEqual({
            name: "event_2",
            payload: { value: 2 },
            event_offset: "2",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[2]).toStrictEqual({
            name: "event_3",
            payload: { value: 3 },
            event_offset: "3",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[3]).toStrictEqual({
            name: "event_4",
            payload: { value: 4 },
            event_offset: "4",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[4]).toStrictEqual({
            name: "event_5",
            payload: { value: 5 },
            event_offset: "5",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
          await client.end();
        }
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGAdvancedEventStore.append({
        entityId,
        events: [
          {
            name: "event_1",
            payload: { value: 1 },
          },
          {
            name: "event_2",
            payload: { value: 2 },
          },
          {
            name: "event_3",
            payload: { value: 3 },
          },
        ],
      });
    });

    describe("When I append new events specifying a last known sequence that is above the current last sequence", () => {
      const newEventsToAppend = [
        {
          name: "event_4",
          payload: { value: 4 },
        },
        {
          name: "event_5",
          payload: { value: 5 },
        },
      ];

      test("Then it should throw an error", async () => {
        let error;

        try {
          await myPGAdvancedEventStore.append({
            entityId,
            events: newEventsToAppend,
            appendAfterOffset: 56,
          });
        } catch (err: unknown) {
          if (err instanceof WrongOffsetError) {
            error = err;

            expect(err.message).toStrictEqual(
              "Wrong offset error: event must be appended with a continuous offset number 56",
            );
            expect(err.code).toStrictEqual("WRONG_OFFSET_ERROR");
            expect(err.name).toStrictEqual("StoreventError");
            expect(err.details?.entityId).toStrictEqual(entityId);
            expect(err.details?.entityName).toStrictEqual("test_entity");
            expect(err.details?.invalidOffset).toStrictEqual(56);
          }
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }

        expect(error).toBeDefined();
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGAdvancedEventStore.append({
        entityId,
        events: [
          {
            name: "event_1",
            payload: { value: 1 },
          },
          {
            name: "event_2",
            payload: { value: 2 },
          },
          {
            name: "event_3",
            payload: { value: 3 },
          },
        ],
      });
    });

    describe("When I append new events specifying a conflicting sequence", () => {
      const conflictingSequence = 2; // This simulate events 3 has been inserted between my last read and this write attempt
      const newEventsToAppend = [
        {
          name: "event_3",
          payload: { value: 3 },
        },
        {
          name: "event_4",
          payload: { value: 4 },
        },
      ];

      test("Then it throw a wrong sequence error", async () => {
        let error;

        try {
          await myPGAdvancedEventStore.append({
            entityId,
            events: newEventsToAppend,
            appendAfterOffset: conflictingSequence,
          });
        } catch (err: unknown) {
          if (err instanceof WrongOffsetError) {
            error = err;
            expect(err.message).toStrictEqual(
              "Wrong offset error: event must be appended with a continuous offset number 2",
            );
            expect(err.code).toStrictEqual("WRONG_OFFSET_ERROR");
            expect(err.name).toStrictEqual("StoreventError");
            expect(err.details?.entityId).toStrictEqual(entityId);
            expect(err.details?.entityName).toStrictEqual("test_entity");
            expect(err.details?.invalidOffset).toStrictEqual(2);
          }
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }

        expect(error).toBeDefined();
      });
    });
  });
});
