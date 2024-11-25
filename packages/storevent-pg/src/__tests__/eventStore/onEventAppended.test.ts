import config from "config";

import { PGEventStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGEventStore.onEventAppended()", () => {
  describe("Given I registered a handler with onEventAppended", () => {
    const entityId = crypto.randomUUID();

    const myPGEventStore = new PGEventStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    let entityName = "";
    let receivedEntityId = "";
    let eventNames: string[] = [];

    myPGEventStore.onEventAppended((event) => {
      entityName = event.entityName;
      receivedEntityId = event.entityId;
      eventNames = event.events.map((e) => e.name);
    });

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

      test("Then it call my handler", async () => {
        try {
          await myPGEventStore.initTable();
          await myPGEventStore.append({
            entityId,
            events: eventsToAppend,
          });

          expect(entityName).toStrictEqual("test_entity");
          expect(receivedEntityId).toStrictEqual(entityId);
          expect(eventNames).toStrictEqual(["event_1", "event_2", "event_3"]);
        } finally {
          await myPGEventStore.stop();
        }
      });
    });
  });
});
