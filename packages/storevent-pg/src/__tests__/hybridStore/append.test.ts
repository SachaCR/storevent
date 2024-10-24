import config from "config";
import { Client } from "pg";

import { WrongSequenceError } from "@storevent/storevent";

import { PGHybridStore } from "../..";
import { clearDatabase } from "../clearDatabase";
import { PGHybridStoreConfiguration } from "../../hybridStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGHybridStoreConfiguration["database"]>("database");

describe("Component PGHybridStore.append()", () => {
  beforeAll(async () => {
    const myPGHybridStore = new PGHybridStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });
    await myPGHybridStore.initTable();
    await myPGHybridStore.stop();
    await clearDatabase();
  });

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
        const myPGHybridStore = new PGHybridStore({
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
          await myPGHybridStore.initTable();

          await myPGHybridStore.append({
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
            sequence: "1",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[1]).toStrictEqual({
            name: "event_2",
            payload: { value: 2 },
            sequence: "2",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[2]).toStrictEqual({
            name: "event_3",
            payload: { value: 3 },
            sequence: "3",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGHybridStore.stop();
          await client.end();
        }
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGHybridStore = new PGHybridStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGHybridStore.initTable();
      await myPGHybridStore.append({
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
          await myPGHybridStore.append(
            {
              entityId,
              events: newEventsToAppend,
            },
            {
              appendAfterSequenceNumber: 3,
            },
          );

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
            sequence: "1",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[1]).toStrictEqual({
            name: "event_2",
            payload: { value: 2 },
            sequence: "2",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[2]).toStrictEqual({
            name: "event_3",
            payload: { value: 3 },
            sequence: "3",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[3]).toStrictEqual({
            name: "event_4",
            payload: { value: 4 },
            sequence: "4",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
          expect(result.rows[4]).toStrictEqual({
            name: "event_5",
            payload: { value: 5 },
            sequence: "5",
            entity_id: entityId,
            appended_at: expect.any(Date) as Date,
          });
        } finally {
          await myPGHybridStore.stop();
          await client.end();
        }
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGHybridStore = new PGHybridStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGHybridStore.initTable();
      await myPGHybridStore.append({
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
          await myPGHybridStore.append(
            {
              entityId,
              events: newEventsToAppend,
            },
            {
              appendAfterSequenceNumber: 56,
            },
          );
        } catch (err: unknown) {
          if (err instanceof WrongSequenceError) {
            error = err;

            expect(err.message).toStrictEqual(
              "Wrong sequence error: event must be appended with a continuous sequence number 56",
            );
            expect(err.code).toStrictEqual("WRONG_SEQUENCE_ERROR");
            expect(err.name).toStrictEqual("StoreventError");
            expect(err.details?.entityId).toStrictEqual(entityId);
            expect(err.details?.entityName).toStrictEqual("test_entity");
            expect(err.details?.invalidSequence).toStrictEqual(56);
          }
        } finally {
          await myPGHybridStore.stop();
        }

        expect(error).toBeDefined();
      });
    });
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGHybridStore = new PGHybridStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGHybridStore.initTable();
      await myPGHybridStore.append({
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
          await myPGHybridStore.append(
            {
              entityId,
              events: newEventsToAppend,
            },
            {
              appendAfterSequenceNumber: conflictingSequence,
            },
          );
        } catch (err: unknown) {
          if (err instanceof WrongSequenceError) {
            error = err;
            expect(err.message).toStrictEqual(
              "Wrong sequence error: event must be appended with a continuous sequence number 2",
            );
            expect(err.code).toStrictEqual("WRONG_SEQUENCE_ERROR");
            expect(err.name).toStrictEqual("StoreventError");
            expect(err.details?.entityId).toStrictEqual(entityId);
            expect(err.details?.entityName).toStrictEqual("test_entity");
            expect(err.details?.invalidSequence).toStrictEqual(2);
          }
        } finally {
          await myPGHybridStore.stop();
        }

        expect(error).toBeDefined();
      });
    });
  });
});
