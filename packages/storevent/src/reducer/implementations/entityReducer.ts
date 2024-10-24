import {
  UnknownReducer,
  JsonSerializable,
  Storevent,
  EntityReducerInterface,
  EventReducer,
} from "../../";

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
        throw new UnknownReducer({
          entityName: this.#entityName,
          eventName: event.name,
        });
      }

      newState = reducer({
        event: event,
        state: newState,
      });

      newVersion = newVersion + 1;
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
