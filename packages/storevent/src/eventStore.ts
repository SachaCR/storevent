import { BasicEvent } from "./interfaces";

/**
 * Use this interface to implement an event store.
 */
export interface EventStore<Event extends BasicEvent> {
  /**
   * The name of the entity that this event store is managing.
   */
  entityName: string;

  /**
   * Append events to an entity.
   * @param params - The parameters to append events.
   * @param options - The options to append events.
   */
  append(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;

    /**
     * The events to append. It cannot be empty.
     */
    events: Event[];

    /**
     * This options will make the append to fail if it detect duplicated event offset.
     * This indicates that another process appended another event in parallel.
     */
    appendAfterOffset?: number;
  }): Promise<void>;

  /**
   * Get the events from a specific offset.
   * @param params - The parameters to get events.
   */
  getEventsFromOffset(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;

    /**
     * The offset to start fetching events. Defaults to 0.
     */
    offset?: number;
  }): Promise<{ events: Event[]; lastEventOffset: number }>;

  /**
   * You can use this method to listen to new events appended to the store. This is useful to implement projections or publish your events into a message broker.
   * @param handler - The handler to be called when new events are appended.
   */
  onEventAppended(
    handler: (event: {
      entityName: string;
      entityId: string;
      events: Event[];
    }) => void,
  ): void;
}
