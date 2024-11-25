import { AppendEventOptions } from "./eventStore";
import { JsonSerializable, Storevent } from "./interfaces";
import { SnapshotData, SnapshotStore } from "./snapshotStore";

export type AppendHybridEventOptions = AppendEventOptions;

/**
 * Parameters to append events and snapshots.
 * @typeParam Event - The events that the store can handle.
 * @typeParam State - The state of the entity.
 */
export interface HybridAppendParams<
  Event extends Storevent,
  State extends JsonSerializable,
> {
  /**
   * The ID of the entity.
   */
  entityId: string;
  /**
   * The events to append
   */
  events: Event[];
  /**
   * The state of the entity.
   */
  snapshot?: SnapshotData<State>;
}

/**
 * This interface represents a hybrid store. It allows to persist events and snapshots in a transactional way.
 * @typeParam Event - The events that the store can handle.
 * @typeParam State - The state of the entity.
 */
export interface HybridStore<
  Event extends Storevent,
  State extends JsonSerializable,
> extends SnapshotStore<State> {
  /**
   * The name of the entity that this event store is managing.
   */
  entityName: string;

  /**
   * Persists events and snapshots to an entity.
   * @param params - The parameters to append events and snapshots.
   * @param options - The options to append events.
   */
  append(
    params: HybridAppendParams<Event, State>,
    options?: AppendHybridEventOptions,
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
     * The sequence number to start fetching events.
     */
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }>;

  /**
   * You can use this method to listen to new events appended to the store. This is useful to implement projections or publish your events into a message broker.
   * @param handler  - The handler to be called when new events are appended.
   */
  onEventAppended(
    handler: (event: {
      entityName: string;
      entityId: string;
      events: Event[];
    }) => void,
  ): void;
}
