import { InMemoryEventStore } from "../";
import { buildTestEvent, TestEvent } from "./testEvents";

describe("Component InMemoryEventStore", () => {
  describe("Given some events", () => {
    describe("When I append them", () => {
      test("Then I can retrieve them from the event store", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";

        await eventStore.append({
          entityId,
          events: [buildTestEvent("EventA")],
        });

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventB")],
        });

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventC"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId,
        });

        expect(eventStore.entityName).toStrictEqual("TestEntity");
        expect(result.lastEventOffset).toStrictEqual(4);
        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventA",
          "EventB",
          "EventC",
          "EventB",
        ]);
      });
    });
  });

  describe("Given I have some events for different entities in the event store", () => {
    describe("When I retrieve them from a given sequence", () => {
      test("Then it return only expected events", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const entityId2 = "2";

        await eventStore.append({
          entityId,
          events: [
            buildTestEvent("EventA"),
            buildTestEvent("EventB"),
            buildTestEvent("EventC"),
            buildTestEvent("EventB"),
          ],
        });

        await eventStore.append({
          entityId: entityId2,
          events: [
            buildTestEvent("EventC"),
            buildTestEvent("EventB"),
            buildTestEvent("EventA"),
            buildTestEvent("EventB"),
            buildTestEvent("EventC"),
          ],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId,
          offset: 2,
        });

        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventC",
          "EventB",
        ]);
        expect(result.lastEventOffset).toStrictEqual(4);

        const resultEntity2 = await eventStore.getEventsFromOffset({
          entityId: entityId2,
          offset: 2,
        });

        expect(resultEntity2.events.map((event) => event.name)).toStrictEqual([
          "EventA",
          "EventB",
          "EventC",
        ]);
        expect(resultEntity2.lastEventOffset).toStrictEqual(5);
      });
    });
  });

  describe("Given I have some events in the event store", () => {
    describe("When I try to append at a given sequence", () => {
      describe("And this sequence does not yet exists", () => {
        test("Then succeed", async () => {
          const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
          const entityId = "1";

          await eventStore.append({
            entityId,
            events: [
              buildTestEvent("EventA"),
              buildTestEvent("EventB"),
              buildTestEvent("EventC"),
              buildTestEvent("EventB"),
            ],
          });

          await eventStore.append({
            entityId,
            events: [buildTestEvent("EventA")],
            appendAfterOffset: 4,
          });
        });
      });

      describe("And this sequence already exists", () => {
        test("Then it throws a Concurrency error", async () => {
          const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
          const entityId = "1";

          await eventStore.append({
            entityId,
            events: [
              buildTestEvent("EventA"),
              buildTestEvent("EventB"),
              buildTestEvent("EventC"),
              buildTestEvent("EventB"),
            ],
          });

          await expect(
            eventStore.append({
              entityId,
              events: [buildTestEvent("EventA")],
              appendAfterOffset: 2,
            }),
          ).rejects.toThrow(
            "Wrong offset error: event must be appended with a continuous offset number 2",
          );
        });
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve event with an unknown entity id", () => {
      test("Then it returns an empty array with sequence equals to -1", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const unknownEntityId = "unknown entity id";

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventA"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId: unknownEntityId,
        });

        expect(result.lastEventOffset).toStrictEqual(0);
        expect(result.events.map((event) => event.name)).toStrictEqual([]);
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve from a sequence that does not exists", () => {
      test("Then it returns an empty array with sequence equals to the last entity sequence", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const lastSequenceExpected = 2;

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventA"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId: entityId,
          offset: 100,
        });

        expect(result.lastEventOffset).toStrictEqual(lastSequenceExpected);
        expect(result.events.map((event) => event.name)).toStrictEqual([]);
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve from a negative sequence", () => {
      test("Then it returns event from sequence 0", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const lastSequenceExpected = 2;

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventA"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId: entityId,
          offset: -32,
        });

        expect(result.lastEventOffset).toStrictEqual(lastSequenceExpected);
        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventA",
          "EventB",
        ]);
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve from a floating sequence", () => {
      test("Then it returns event from the floored sequence ", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const lastSequenceExpected = 4;

        await eventStore.append({
          entityId: "1",
          events: [
            buildTestEvent("EventA"),
            buildTestEvent("EventB"),
            buildTestEvent("EventC"),
            buildTestEvent("EventA"),
          ],
        });

        const result = await eventStore.getEventsFromOffset({
          entityId: entityId,
          offset: 1.3,
        });

        expect(result.lastEventOffset).toStrictEqual(lastSequenceExpected);
        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventB",
          "EventC",
          "EventA",
        ]);
      });
    });
  });

  describe("Given I registered a handler with onEventAppended", () => {
    describe("When I append events", () => {
      test("Then I my handler is called", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";

        let expectedEntityName = "";
        let expectedEntityId = "";
        const expectedEventNames: string[] = [];

        eventStore.onEventAppended((notification) => {
          expectedEntityName = notification.entityName;
          expectedEntityId = notification.entityId;

          notification.events.forEach((event) =>
            expectedEventNames.push(event.name),
          );
        });

        await eventStore.append({
          entityId,
          events: [buildTestEvent("EventA")],
        });

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventB")],
        });

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventC"), buildTestEvent("EventB")],
        });

        expect(expectedEntityName).toStrictEqual("TestEntity");
        expect(expectedEntityId).toStrictEqual(entityId);
        expect(expectedEventNames).toStrictEqual([
          "EventA",
          "EventB",
          "EventC",
          "EventB",
        ]);
      });
    });
  });
});
