import { EventStore } from "./eventStore";
import { BasicEvent, JsonSerializable } from "./interfaces";

/**
 * Use this interface to implement an advanced event store that supports saving snapshots.
 */
export interface AdvancedEventStore<
  Event extends BasicEvent,
  State extends JsonSerializable,
> extends EventStore<Event> {
  /**
   * Append events to an entity.
   * @param params - The parameters to append events.
   * @param options - The options to append events.
   */
  appendWithSnapshot(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;

    /**
     * The events to append. It cannot be empty.
     */
    events: Event[];

    /**
     * A snapshot of the entity. The snapshot version must match the last event to append offset.
     * Otherwise it will throw a `WrongOffsetError`.
     */
    snapshot: SnapshotData<State>;

    /**
     * When you save a snapshot you must be sure your state is matching the event history and nothing changed in between.
     * This will prevent concurrent event appends. It will throw a `WrongOffsetError` if it detect duplicated event offset.
     * This indicates that another process appended event in parallel.
     */
    appendAfterOffset: number;
  }): Promise<void>;

  /**
   * Get the last snapshot of an entity. It will return undefined if there are no snapshot for the entity.
   * @param entityId - The ID of the entity.
   */
  getLastSnapshot(entityId: string): Promise<SnapshotData<State> | undefined>;

  /**
   * Get a snapshot of an entity given a specific version number. It will return undefined if the snapshot does not exist.
   * @param params
   */
  getSnapshot(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;
    /**
     * The version of the snapshot.
     */
    version: number;
  }): Promise<SnapshotData<State> | undefined>;
}

/**
 * Represents a snapshot of an entity at a given point in time.
 * It takes a state and it's associated version number.
 * The version must be equal to the corresponding event offset.
 */
export interface SnapshotData<State extends JsonSerializable> {
  state: State;
  version: number;
}
