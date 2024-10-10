import { JsonSerializable, Storevent } from "../interfaces";
import { EntityReducer } from "../reducer";

export interface TestEventA extends Storevent {
  name: "EventA";
  payload: {
    message: string;
  };
}

export interface TestEventB extends Storevent {
  name: "EventB";
  payload: {
    message: string;
  };
}

export interface TestEventC extends Storevent {
  name: "EventC";
  payload: {
    message: string;
  };
}

export type TestEvent = TestEventA | TestEventB | TestEventC;

export interface TestState extends JsonSerializable {
  result: string[];
}

export function applyTestEventA(params: {
  state: TestState;
  event: TestEventA;
}): TestState {
  const { state, event } = params;
  return {
    result: state.result.concat("Reducer A: " + event.payload.message),
  };
}

export function applyTestEventB(params: {
  state: TestState;
  event: TestEventB;
}): TestState {
  const { state, event } = params;
  return {
    result: state.result.concat("Reducer B: " + event.payload.message),
  };
}

export function applyTestEventC(params: {
  state: TestState;
  event: TestEventC;
}): TestState {
  const { state, event } = params;
  return {
    result: state.result.concat("Reducer C: " + event.payload.message),
  };
}

export function buildTestEntityReducer(): EntityReducer<TestState, TestEvent> {
  const testEntityReducer = new EntityReducer<TestState, TestEvent>(
    "TestEntity",
  );

  testEntityReducer.mountEventReducer("EventA", applyTestEventA);
  testEntityReducer.mountEventReducer("EventB", applyTestEventB);
  testEntityReducer.mountEventReducer("EventC", applyTestEventC);

  return testEntityReducer;
}
export function buildTestEvent<EventName extends TestEvent["name"]>(
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
