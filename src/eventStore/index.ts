export interface DomainEvent {
  name: string;
  payload: unknown;
  entityId: string;
}

export interface EventStore<Event extends DomainEvent> {
  append(
    event: Event[],
    options?: {
      appendAfterSequence?: number;
    },
  ): Promise<void>;

  getEventsFromSequence(params: {
    entityId: string;
    sequence?: number;
  }): Promise<{ events: Event[]; lastSequence: number }>;

  // saveSnapshot(
  //   snapshot: unknown,
  //   sequence: number,
  //   options?: {
  //     writeMode?: "APPEND" | "COMPACT" | "OVERWRITE_LAST";
  //   },
  // ): Promise<void>;

  // getLastSnapshot(): Promise<unknown>;
}

export interface EntityReducer<State, Event extends DomainEvent> {
  entityName: string;
  reduce: (state: State, events: Event[]) => State;
}
