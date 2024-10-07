import { JsonSerializable } from "../interfaces";

export interface SnapshotData<State extends JsonSerializable> {
  state: State;
  sequence: number;
}

export interface SaveSnapshotOptions {
  writeMode?: "APPEND" | "COMPACT" | "OVERWRITE_LAST";
}

export interface SnapshotStore<State extends JsonSerializable> {
  saveSnapshot(
    params: {
      entityId: string;
      snapshot: State;
      sequence: number;
    },
    options?: SaveSnapshotOptions,
  ): Promise<void>;

  getLastSnapshot(entityId: string): Promise<SnapshotData<State>>;

  getSnapshot(params: {
    entityId: string;
    sequence: number;
  }): Promise<SnapshotData<State> | undefined>;
}
