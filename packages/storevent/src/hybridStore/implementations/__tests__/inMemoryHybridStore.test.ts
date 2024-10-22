import {
  buildTestEntityReducer,
  buildTestEvent,
  TestEvent,
  TestState,
} from "../../../__tests__/testEvents";
import { InMemoryHybridStore } from "../../";

describe("Component InMemoryHybridStore", () => {
  describe("Given a hybrid store", () => {
    const testEntityHybridStore = new InMemoryHybridStore<TestEvent, TestState>(
      "TestEntity",
    );

    describe("When I read store entity name", () => {
      test("Then it returns expected entity name", () => {
        const entityName = testEntityHybridStore.entityName;
        expect(entityName).toStrictEqual("TestEntity");
      });
    });

    describe("When I search snapshot for an unknown entity id", () => {
      test("Then it returns undefined", async () => {
        const snapshot = await testEntityHybridStore.getLastSnapshot("unknown");
        expect(snapshot).toStrictEqual(undefined);
      });
    });

    describe("When I search events for an unknown entity id", () => {
      test("Then it returns undefined", async () => {
        const events = await testEntityHybridStore.getEventsFromSequenceNumber({
          entityId: "unknown",
        });
        expect(events).toStrictEqual({
          events: [],
          lastEventSequenceNumber: 0,
        });
      });
    });

    describe("When I search snapshot for an unknown entity id", () => {
      test("Then it returns undefined", async () => {
        const snapshot = await testEntityHybridStore.getSnapshot({
          entityId: "unknown",
          version: 0,
        });

        expect(snapshot).toStrictEqual(undefined);
      });
    });
  });

  describe("Given some events and a state to save", () => {
    const testEntityHybridStore = new InMemoryHybridStore<TestEvent, TestState>(
      "TestEntity",
    );

    const entityId = "123";
    const eventA = buildTestEvent("EventA");
    const eventB = buildTestEvent("EventB");
    const testEntityReducer = buildTestEntityReducer();

    describe("When I save them", () => {
      test("Then it succeed", async () => {
        const stateToSave = testEntityReducer.reduceEvents({
          events: [eventA, eventB],
          state: { result: [] },
          stateVersion: 0,
        });

        await testEntityHybridStore.append({
          entityId,
          events: [eventA, eventB],
          snapshot: stateToSave,
        });
      });

      test("Then I can retrieve events from the store", async () => {
        const result = await testEntityHybridStore.getEventsFromSequenceNumber({
          entityId,
          sequenceNumber: 0,
        });

        expect(result.events.map((event) => event.name)).toStrictEqual([
          "EventA",
          "EventB",
        ]);

        expect(result.lastEventSequenceNumber).toStrictEqual(2);
      });

      test("Then I can retrieve last snapshot from the store", async () => {
        const snapshot = await testEntityHybridStore.getLastSnapshot(entityId);
        expect(snapshot).toStrictEqual({
          state: {
            result: [
              "Reducer A: I'm a test EventA",
              "Reducer B: I'm a test EventB",
            ],
          },
          version: 2,
        });
      });

      test("Then I can retrieve a snapshot by version number", async () => {
        const snapshot = await testEntityHybridStore.getSnapshot({
          entityId,
          version: 2,
        });
        expect(snapshot).toStrictEqual({
          state: {
            result: [
              "Reducer A: I'm a test EventA",
              "Reducer B: I'm a test EventB",
            ],
          },
          version: 2,
        });
      });

      describe("When I try to search for an unknown version", () => {
        test("Then it returns undefined", async () => {
          const snapshot = await testEntityHybridStore.getSnapshot({
            entityId,
            version: 4,
          });

          expect(snapshot).toStrictEqual(undefined);
        });
      });
    });
  });

  describe("Given a state to save", () => {
    const entityId = "123";
    const eventA = buildTestEvent("EventA");
    const eventB = buildTestEvent("EventB");
    const testEntityReducer = buildTestEntityReducer();
    const testEntityHybridStore = new InMemoryHybridStore<TestEvent, TestState>(
      "TestEntity",
    );

    describe("When I save them it succeed", () => {
      test("Then I can retrieve it from the store", async () => {
        const stateToSave = testEntityReducer.reduceEvents({
          events: [eventA, eventB],
          state: { result: ["test"] },
          stateVersion: 5,
        });

        await testEntityHybridStore.saveSnapshot({
          entityId,
          snapshot: stateToSave.state,
          version: stateToSave.version,
        });

        const result = await testEntityHybridStore.getLastSnapshot(entityId);
        expect(result).toStrictEqual({
          state: {
            result: [
              "test",
              "Reducer A: I'm a test EventA",
              "Reducer B: I'm a test EventB",
            ],
          },
          version: 7,
        });
      });
    });
  });

  describe("Given a store with an existing snapshot", () => {
    const entityId = "123";
    const testEntityHybridStore = new InMemoryHybridStore<TestEvent, TestState>(
      "TestEntity",
    );

    describe("When I save a new snapshot", () => {
      test("Then previous snapshots still exists", async () => {
        await testEntityHybridStore.saveSnapshot({
          entityId,
          snapshot: { result: ["first snapshot"] },
          version: 5,
        });

        await testEntityHybridStore.saveSnapshot({
          entityId,
          snapshot: { result: ["Second snapshot with append mode"] },
          version: 6,
        });

        const snapshotVersion5 = await testEntityHybridStore.getSnapshot({
          entityId,
          version: 5,
        });

        expect(snapshotVersion5).toStrictEqual({
          state: { result: ["first snapshot"] },
          version: 5,
        });

        const snapshotVersion6 = await testEntityHybridStore.getSnapshot({
          entityId,
          version: 6,
        });

        expect(snapshotVersion6).toStrictEqual({
          state: {
            result: ["Second snapshot with append mode"],
          },
          version: 6,
        });
      });
    });
  });
});
