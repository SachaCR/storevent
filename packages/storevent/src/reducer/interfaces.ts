import { JsonSerializable, Storevent } from "../interfaces";

export type EventReducer<
  Event extends Storevent,
  State extends JsonSerializable,
> = (params: { event: Event; state: State }) => State;

export interface EntityReducerInterface<
  State extends JsonSerializable,
  Event extends Storevent,
> {
  entityName: string;

  mountEventReducer<EventName extends string>(
    eventName: EventName,
    eventReducer: EventReducer<Extract<Event, { name: EventName }>, State>,
  ): void;

  reduceEvents: (params: {
    events: Event[];
    state: State;
    stateVersion: number;
  }) => {
    state: State;
    version: number;
  };
}

export class EntityReducer<
  State extends JsonSerializable,
  Event extends Storevent,
> implements EntityReducerInterface<State, Event>
{
  #reducers: Map<Event["name"], EventReducer<Event, State>>;
  #entityName: string;

  constructor(entityName: string) {
    this.#entityName = entityName;
    this.#reducers = new Map<Event["name"], EventReducer<Event, State>>();
  }

  //name: Name, callback: (event: Extract<Events, { name: Name }>) => void

  mountEventReducer<EventName extends Event["name"]>(
    eventName: EventName,
    eventReducer: EventReducer<Extract<Event, { name: EventName }>, State>,
  ): void {
    this.#reducers.set(eventName, eventReducer as EventReducer<Event, State>);
  }

  reduceEvents(params: {
    state: State;
    events: Event[];
    stateVersion: number;
  }): {
    state: State;
    version: number;
  } {
    const { state, events, stateVersion } = params;

    let newState = structuredClone(state);
    let newVersion = stateVersion;

    for (const event of events) {
      const reducer = this.#reducers.get(event.name);

      if (!reducer) {
        throw new Error(
          `${this.#entityName}: No reducer found for event ${event.name}`,
        );
      }

      newState = reducer({
        event: event,
        state: newState,
      });

      newVersion = newVersion++;
    }

    return {
      state: newState,
      version: newVersion,
    };
  }

  get entityName() {
    return this.#entityName;
  }
}
