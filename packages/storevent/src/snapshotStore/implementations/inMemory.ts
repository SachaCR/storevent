import { JsonSerializable } from "../../interfaces";
import { switchCaseGuard } from "../../switchCaseGuard";
import { SnapshotData, SnapshotStore } from "../interfaces";

export class InMemorySnapshotStore<State extends JsonSerializable>
  implements SnapshotStore<State>
{
  #snapshotMap: Map<string, SnapshotData<State>[]>;

  constructor() {
    this.#snapshotMap = new Map<string, SnapshotData<State>[]>();
  }

  getLastSnapshot(entityId: string): Promise<SnapshotData<State>> {
    const snapshots = this.#snapshotMap.get(entityId) ?? [];
    return Promise.resolve(snapshots[snapshots.length - 1]);
  }

  getSnapshot(params: {
    entityId: string;
    version: number;
  }): Promise<SnapshotData<State> | undefined> {
    const { entityId, version } = params;
    const snapshots = this.#snapshotMap.get(entityId) ?? [];

    return Promise.resolve(
      snapshots.find((snapshot) => snapshot.version === version),
    );
  }

  saveSnapshot(
    params: { entityId: string; snapshot: State; version: number },
    options?: { writeMode?: "APPEND" | "COMPACT" | "OVERWRITE_LAST" },
  ): Promise<void> {
    const { entityId, snapshot, version } = params;
    const writeMode = options?.writeMode ?? "APPEND";

    const snapshots = this.#snapshotMap.get(entityId) ?? [];

    switch (writeMode) {
      case "APPEND":
        snapshots.push({ state: snapshot, version });
        break;

      case "COMPACT":
        this.#snapshotMap.set(entityId, [{ state: snapshot, version }]);
        return Promise.resolve();

      case "OVERWRITE_LAST":
        snapshots[snapshots.length - 1] = { state: snapshot, version };
        break;

      default:
        switchCaseGuard(writeMode);
    }

    this.#snapshotMap.set(entityId, snapshots);

    return Promise.resolve();
  }
}
