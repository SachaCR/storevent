import { Storevent } from "./interfaces";

/**
 * Options to append events.
 */
export interface AppendEventOptions {
  /**
   * This options will make the append to fail if it detect duplicated event sequence number.
   * This indicates that another process appended another event in parallel.
   */
  appendAfterSequenceNumber?: number;
}

/**
 * Use this interface to implement an event store.
 */
export interface EventStore<Event extends Storevent> {
  /**
   * The name of the entity that this event store is managing.
   */
  entityName: string;

  /**
   * Append events to an entity.
   * @param params - The parameters to append events.
   * @param options - The options to append events.
   */
  append(
    params: {
      /**
       * The ID of the entity.
       */
      entityId: string;
      /**
       * The events to append
       */
      events: Event[];
    },
    options?: AppendEventOptions,
  ): Promise<void>;

  /**
   * Get the events from a specific sequence number.
   * @param params - The parameters to get events.
   */
  getEventsFromSequenceNumber(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;
    /**
     * The sequence number to start fetching events. Default to 0.
     */
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }>;
}
