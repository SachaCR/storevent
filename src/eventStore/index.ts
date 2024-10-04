export interface DomainEvent {
  name: string;
  payload: unknown;
}

export interface AppendEventOptions {
  /**
   * This options will make the append to fail if the sequence is not the expected one.
   * This indicates that another process added another event in parallel.
   */
  checkConcurencyOnSequence?: number;
}

export interface EventStore<Event extends DomainEvent> {
  append(
    entityId: string,
    event: Event[],
    options?: AppendEventOptions,
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
  reduce: (
    events: Event[],
    state?: State,
  ) => { state: State; sequence: number };
}
