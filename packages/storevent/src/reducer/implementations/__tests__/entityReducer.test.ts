import {
  applyTestEventA,
  applyTestEventB,
  applyTestEventC,
  buildTestEvent,
  TestEvent,
  TestState,
} from "../../../__tests__/testEvents";
import { EntityReducer } from "../entityReducer";

describe("Component EntityReducer", () => {
  describe("Given an entityReducer", () => {
    const testEntityReducer = new EntityReducer<TestState, TestEvent>(
      "TestEntity",
    );

    testEntityReducer.mountEventReducer("EventA", applyTestEventA);
    testEntityReducer.mountEventReducer("EventB", applyTestEventB);
    testEntityReducer.mountEventReducer("EventC", applyTestEventC);

    const eventList = [
      buildTestEvent("EventA"),
      buildTestEvent("EventB"),
      buildTestEvent("EventC"),
    ];

    describe("When I reduce them", () => {
      const result = testEntityReducer.reduceEvents({
        events: eventList,
        state: { result: [] },
        stateVersion: 0,
      });

      test("Then it return expected state", () => {
        expect(result.state).toStrictEqual({
          result: [
            "Reducer A: I'm a test EventA",
            "Reducer B: I'm a test EventB",
            "Reducer C: I'm a test EventC",
          ],
        });

        expect(result.version).toStrictEqual(3);
      });
    });
  });
});
