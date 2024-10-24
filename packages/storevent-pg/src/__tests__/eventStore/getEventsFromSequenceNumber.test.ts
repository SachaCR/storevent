import config from "config";
import { PGEventStore } from "../..";
import { clearDatabase } from "../clearDatabase";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGEventStore.getEventsFromSequenceNumber()", () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGEventStore = new PGEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGEventStore.initTable();
      await myPGEventStore.append({
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

    afterAll(async () => {
      await myPGEventStore.stop();
    });

    describe("When I get events from sequence 0", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGEventStore.getEventsFromSequenceNumber({
          entityId,
          sequenceNumber: 0,
        });

        expect(result.events).toHaveLength(3);
        expect(result.events).toStrictEqual([
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
        ]);

        expect(result.lastEventSequenceNumber).toStrictEqual(3);
      });
    });

    describe("When I get events from sequence 2", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGEventStore.getEventsFromSequenceNumber({
          entityId,
          sequenceNumber: 2,
        });

        expect(result.events).toHaveLength(1);
        expect(result.events).toStrictEqual([
          {
            name: "event_3",
            payload: { value: 3 },
          },
        ]);

        expect(result.lastEventSequenceNumber).toStrictEqual(3);
      });
    });

    describe("When I get events from sequence 56", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGEventStore.getEventsFromSequenceNumber({
          entityId,
          sequenceNumber: 56,
        });

        expect(result.events).toHaveLength(0);
        expect(result.events).toStrictEqual([]);
        expect(result.lastEventSequenceNumber).toStrictEqual(3);
      });
    });
  });
});
