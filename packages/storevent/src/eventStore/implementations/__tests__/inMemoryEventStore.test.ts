import { Storevent } from "../../../interfaces";
import { InMemoryEventStore } from "../inMemory";

describe("Component InMemoryEventStore", () => {
  interface TestEventA extends Storevent {
    name: "EventA";
    payload: {
      message: string;
    };
  }

  interface TestEventB extends Storevent {
    name: "EventB";
    payload: {
      message: string;
    };
  }

  interface TestEventC extends Storevent {
    name: "EventC";
    payload: {
      message: string;
    };
  }

  type TestEvent = TestEventA | TestEventB | TestEventC;

  function buildTestEvent<EventName extends TestEvent["name"]>(
    name: EventName,
  ): TestEvent {
    const event: TestEvent = {
      name,
      payload: {
        message: `I'm a test ${name}`,
      },
    };

    return event;
  }

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

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId,
        });

        expect(result.lastEventSequenceNumber).toStrictEqual(3);
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

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId,
          sequenceNumber: 2,
        });

        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventC",
          "EventB",
        ]);
        expect(result.lastEventSequenceNumber).toStrictEqual(3);

        const resultEntity2 = await eventStore.getEventsFromSequenceNumber({
          entityId: entityId2,
          sequenceNumber: 2,
        });

        expect(resultEntity2.events.map((event) => event.name)).toStrictEqual([
          "EventA",
          "EventB",
          "EventC",
        ]);
        expect(resultEntity2.lastEventSequenceNumber).toStrictEqual(4);
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

          await eventStore.append(
            {
              entityId,
              events: [buildTestEvent("EventA")],
            },
            {
              appendAfterSequenceNumber: 3,
            },
          );
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
            eventStore.append(
              {
                entityId,
                events: [buildTestEvent("EventA")],
              },
              {
                appendAfterSequenceNumber: 2,
              },
            ),
          ).rejects.toThrow("Concurrency error");
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

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId: unknownEntityId,
        });

        expect(result.lastEventSequenceNumber).toStrictEqual(-1);
        expect(result.events.map((event) => event.name)).toStrictEqual([]);
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve from a sequence that does not exists", () => {
      test("Then it returns an empty array with sequence equals to the last entity sequence", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const lastSequenceExpected = 1;

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventA"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId: entityId,
          sequenceNumber: 100,
        });

        expect(result.lastEventSequenceNumber).toStrictEqual(
          lastSequenceExpected,
        );
        expect(result.events.map((event) => event.name)).toStrictEqual([]);
      });
    });
  });

  describe("Given some events exists in the eventstore", () => {
    describe("When I try to retrieve from a negative sequence", () => {
      test("Then it returns event from sequence 0", async () => {
        const eventStore = new InMemoryEventStore<TestEvent>("TestEntity");
        const entityId = "1";
        const lastSequenceExpected = 1;

        await eventStore.append({
          entityId: "1",
          events: [buildTestEvent("EventA"), buildTestEvent("EventB")],
        });

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId: entityId,
          sequenceNumber: -32,
        });

        expect(result.lastEventSequenceNumber).toStrictEqual(
          lastSequenceExpected,
        );
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
        const lastSequenceExpected = 3;

        await eventStore.append({
          entityId: "1",
          events: [
            buildTestEvent("EventA"),
            buildTestEvent("EventB"),
            buildTestEvent("EventC"),
            buildTestEvent("EventA"),
          ],
        });

        const result = await eventStore.getEventsFromSequenceNumber({
          entityId: entityId,
          sequenceNumber: 1.3,
        });

        expect(result.lastEventSequenceNumber).toStrictEqual(
          lastSequenceExpected,
        );
        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventB",
          "EventC",
          "EventA",
        ]);
      });
    });
  });
});
