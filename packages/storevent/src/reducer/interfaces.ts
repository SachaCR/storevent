import { JsonSerializable, BasicEvent } from "../interfaces";

export type EventReducer<
  Event extends BasicEvent,
  State extends JsonSerializable,
> = (params: { event: Event; state: State }) => State;

export interface EntityReducerInterface<
  State extends JsonSerializable,
  Event extends BasicEvent,
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
