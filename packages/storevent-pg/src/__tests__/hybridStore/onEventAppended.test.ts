import config from "config";

import { PGHybridStore } from "../..";
import { PGHybridStoreConfiguration } from "../../hybridStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGHybridStoreConfiguration["database"]>("database");

describe("Component PGHybridStore.onEventAppended()", () => {
  describe("Given I registered a handler with onEventAppended", () => {
    let entityName = "";
    let receivedEntityId = "";
    let eventNames: string[] = [];

    const myPGHybridStore = new PGHybridStore({
      entityName: "test_entity",
      database: DATABASE_CONFIG,
    });

    myPGHybridStore.onEventAppended((event) => {
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

      test("Then it successfully insert the events", async () => {
        await myPGHybridStore.initTable();

        try {
          await myPGHybridStore.append({
            entityId,
            events: eventsToAppend,
          });

          expect(entityName).toStrictEqual("test_entity");
          expect(receivedEntityId).toStrictEqual(entityId);
          expect(eventNames).toStrictEqual(["event_1", "event_2", "event_3"]);
        } finally {
          await myPGHybridStore.stop();
        }
      });
    });
  });
});
