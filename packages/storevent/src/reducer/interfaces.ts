import { JsonSerializable, Storevent } from "../interfaces";

export type EventReducer<
  State extends JsonSerializable,
  Event extends Storevent,
> = (params: { event: Event; state?: State }) => {
  state: State;
  sequence: number;
};

export interface EntityReducerInterface<
  State extends JsonSerializable,
  Event extends Storevent,
> {
  entityName: string;

  mountEventReducer: (params: {
    eventName: string;
    eventReducer: EventReducer<State, Event>;
  }) => void;

  reduceEvents: (params: { events: Event[]; state: State }) => {
    state: State;
    sequence: number;
  };
}

export class EntityReducer<
  State extends JsonSerializable,
  Event extends Storevent,
> implements EntityReducerInterface<State, Event>
{
  #reducers: Map<string, EventReducer<State, Event>>;
  #entityName: string;

  constructor(entityName: string) {
    this.#entityName = entityName;
    this.#reducers = new Map<string, EventReducer<State, Event>>();
  }

  mountEventReducer(params: {
    eventName: string;
    eventReducer: EventReducer<State, keyof Event>;
  }): void {
    const { eventName, eventReducer } = params;
    this.#reducers.set(eventName, eventReducer);
  }

  reduceEvents(params: { state: State; events: Event[] }): {
    state: State;
    sequence: number;
  } {
    const { state, events } = params;

    let newState = structuredClone(state);
    let newSequence = 0;

    for (const event of events) {
      const reducer = this.#reducers.get(event.name);

      if (!reducer) {
        throw new Error(
          `${this.#entityName}: No reducer found for event ${event.name}`,
        );
      }

      const result = reducer({
        event: event,
        state: newState,
      });

      newState = result.state;
      newSequence = result.sequence;
    }

    return {
      state: newState,
      sequence: newSequence,
    };
  }

  get entityName() {
    return this.#entityName;
  }
}
