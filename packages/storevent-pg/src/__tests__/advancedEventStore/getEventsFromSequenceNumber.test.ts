import config from "config";
import { PGAdvancedEventStore } from "../..";
import { PGAdvancedEventStoreConfiguration } from "../../advancedEventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGAdvancedEventStoreConfiguration["database"]>("database");

describe("Component PGAdvancedEventStore.getEventsFromOffset()", () => {
  describe("Given an entity id with some event stored", () => {
    const entityId = crypto.randomUUID();
    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    beforeAll(async () => {
      await myPGAdvancedEventStore.initTable();
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

    afterAll(async () => {
      await myPGAdvancedEventStore.pgPool.end();
    });

    describe("When I get events from sequence 0", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGAdvancedEventStore.getEventsFromOffset({
          entityId,
          offset: 0,
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

        expect(result.lastEventOffset).toStrictEqual(3);
      });
    });

    describe("When I get events from sequence 2", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGAdvancedEventStore.getEventsFromOffset({
          entityId,
          offset: 2,
        });

        expect(result.events).toHaveLength(1);
        expect(result.events).toStrictEqual([
          {
            name: "event_3",
            payload: { value: 3 },
          },
        ]);

        expect(result.lastEventOffset).toStrictEqual(3);
      });
    });

    describe("When I get events from sequence 56", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGAdvancedEventStore.getEventsFromOffset({
          entityId,
          offset: 56,
        });

        expect(result.events).toHaveLength(0);
        expect(result.events).toStrictEqual([]);
        expect(result.lastEventOffset).toStrictEqual(3);
      });
    });
  });
});
