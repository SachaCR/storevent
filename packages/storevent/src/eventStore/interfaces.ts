import { Storevent } from "../interfaces";

export interface AppendEventOptions {
  /**
   * This options will make the append to fail if it detect duplicated event sequence number.
   * This indicates that another process appended another event in parallel.
   */
  appendAfterSequenceNumber?: number;
}

export interface EventStore<Event extends Storevent> {
  entityName: string;
  append(
    params: {
      entityId: string;
      events: Event[];
    },
    options?: AppendEventOptions,
  ): Promise<void>;

  getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }>;
}
