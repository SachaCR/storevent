import {
  UnknownReducer,
  JsonSerializable,
  Storevent,
  EntityReducerInterface,
  EventReducer,
} from "..";

/**
 * This class is used to reduce events for a specific entity.
 * Extends this class to create reducers for your entities.
 * @typeParam State - The state of the entity.
 * @typeParam Event - The events that the entity can handle.
 */

export class EntityReducer<
  State extends JsonSerializable,
  Event extends Storevent,
> implements EntityReducerInterface<State, Event>
{
  #reducers: Map<Event["name"], EventReducer<Event, State>>;
  #entityName: string;

  constructor(
    /**
     * The name of the entity.
     */
    entityName: string,
  ) {
    this.#entityName = entityName;
    this.#reducers = new Map<Event["name"], EventReducer<Event, State>>();
  }

  /**
   * Mounts a reducer for a specific event name. If you mount two reducers for the same event name. The first one will be replaced.
   * @param eventName - The name of the event.
   * @param eventReducer - The reducer for the event.
   */
  mountEventReducer<EventName extends Event["name"]>(
    eventName: EventName,
    eventReducer: EventReducer<Extract<Event, { name: EventName }>, State>,
  ): void {
    this.#reducers.set(eventName, eventReducer as EventReducer<Event, State>);
  }

  /**
   * Reduces a list of events for a specific entity.
   * @returns The new state and the new version of the entity.
   */
  reduceEvents(params: {
    /**
     * The state of the entity.
     */
    state: State;
    /**
     * The events to reduce.
     */
    events: Event[];
    /**
     * The current version of the state.
     */
    stateVersion: number;
  }): {
    /**
     * The new state of the entity.
     */
    state: State;
    /**
     * The new version of the entity.
     */
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

  /**
   * The name of the entity.
   */
  get entityName() {
    return this.#entityName;
  }
}
