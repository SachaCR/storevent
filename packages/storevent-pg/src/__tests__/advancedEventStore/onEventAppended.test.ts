import config from "config";

import { PGAdvancedEventStore } from "../..";
import { PGAdvancedEventStoreConfiguration } from "../../advancedEventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGAdvancedEventStoreConfiguration["database"]>("database");

describe("Component PGAdvancedEventStore.onEventAppended()", () => {
  describe("Given I registered a handler with onEventAppended", () => {
    let entityName = "";
    let receivedEntityId = "";
    let eventNames: string[] = [];

    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    myPGAdvancedEventStore.onEventAppended((event) => {
      entityName = event.entityName;
      receivedEntityId = event.entityId;
      eventNames = event.events.map((e) => e.name);
    });

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

      test("Then it successfully triggers the listener", async () => {
        try {
          await myPGAdvancedEventStore.append({
            entityId,
            events: eventsToAppend,
          });

          expect(entityName).toStrictEqual("test_entity");
          expect(receivedEntityId).toStrictEqual(entityId);
          expect(eventNames).toStrictEqual(["event_1", "event_2", "event_3"]);
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }
      });
    });
  });

  describe("Given I registered a handler with onEventAppended", () => {
    let entityName = "";
    let receivedEntityId = "";
    let eventNames: string[] = [];

    const myPGAdvancedEventStore = new PGAdvancedEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    myPGAdvancedEventStore.onEventAppended((event) => {
      entityName = event.entityName;
      receivedEntityId = event.entityId;
      eventNames = event.events.map((e) => e.name);
    });

    const entityId = crypto.randomUUID();

    describe("When I append new events with snapshot", () => {
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

      test("Then it successfully triggers the listener", async () => {
        try {
          await myPGAdvancedEventStore.appendWithSnapshot({
            entityId,
            events: eventsToAppend,
            appendAfterOffset: 0,
            snapshot: { state: { value: 0 }, version: 0 },
          });

          expect(entityName).toStrictEqual("test_entity");
          expect(receivedEntityId).toStrictEqual(entityId);
          expect(eventNames).toStrictEqual(["event_1", "event_2", "event_3"]);
        } finally {
          await myPGAdvancedEventStore.pgPool.end();
        }
      });
    });
  });
});
