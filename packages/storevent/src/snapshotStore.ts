import { JsonSerializable } from "./interfaces";

/**
 * Represents a snapshot. It takes a state and it's associated version number.
 */
export interface SnapshotData<State extends JsonSerializable> {
  state: State;
  version: number;
}

/**
 * Use this interface to implement a snapshot store.
 * A snapshot store is responsible for saving and retrieving snapshots of an entity.
 * @typeParam State - The state of the entity.
 */
export interface SnapshotStore<State extends JsonSerializable> {
  saveSnapshot(params: {
    /**
     * The ID of the entity.
     */
    entityId: string;
    /**
     * The snapshot to save.
     */
    snapshot: State;
    /**
     * The snapshot's version.
     */
    version: number;
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
