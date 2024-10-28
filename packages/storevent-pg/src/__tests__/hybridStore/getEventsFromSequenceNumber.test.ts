import config from "config";
import { PGHybridStore } from "../..";
import { clearDatabase } from "../clearDatabase";
import { PGHybridStoreConfiguration } from "../../hybridStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGHybridStoreConfiguration["database"]>("database");

describe("Component PGHybridStore.getEventsFromSequenceNumber()", () => {
  beforeAll(async () => {
    await clearDatabase();
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

    afterAll(async () => {
      await myPGHybridStore.stop();
    });

    describe("When I get events from sequence 0", () => {
      test("Then it returns the expected events", async () => {
        const result = await myPGHybridStore.getEventsFromSequenceNumber({
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
        const result = await myPGHybridStore.getEventsFromSequenceNumber({
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
        const result = await myPGHybridStore.getEventsFromSequenceNumber({
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
