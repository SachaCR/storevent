import { JsonSerializable, BasicEvent } from "../../";
import { EntityReducer } from "../";

export interface TestEventA extends BasicEvent {
  name: "EventA";
  payload: {
    message: string;
  };
}

export interface TestEventB extends BasicEvent {
  name: "EventB";
  payload: {
    message: string;
  };
}

export interface TestEventC extends BasicEvent {
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
