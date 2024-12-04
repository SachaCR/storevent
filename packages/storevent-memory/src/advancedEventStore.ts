import { InMemoryEventStore } from ".";
import {
  JsonSerializable,
  BasicEvent,
  AdvancedEventStore,
  SnapshotData,
} from "@storevent/storevent";

export class InMemoryAdvancedEventStore<
    Event extends BasicEvent,
    State extends JsonSerializable,
  >
  extends InMemoryEventStore<Event>
  implements AdvancedEventStore<Event, State>
{
  #snapshotMap: Map<string, SnapshotData<State>[]>;

  constructor(entityName: string) {
    super(entityName);
    this.#snapshotMap = new Map<string, SnapshotData<State>[]>();
  }

  async appendWithSnapshot(params: {
    entityId: string;
    events: Event[];
    appendAfterOffset: number;
    snapshot: { state: State; version: number };
  }): Promise<void> {
    const { entityId, events, snapshot, appendAfterOffset } = params;
    await super.append({ entityId, events, appendAfterOffset });

    await this.saveSnapshot({
      entityId,
      snapshot: snapshot.state,
      version: snapshot.version,
    });

    return Promise.resolve();
  }

  getLastSnapshot(entityId: string): Promise<SnapshotData<State> | undefined> {
    const snapshots = this.#snapshotMap.get(entityId) ?? [];

    if (snapshots.length === 0) {
      return Promise.resolve(undefined);
    }

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

  saveSnapshot(params: {
    entityId: string;
    snapshot: State;
    version: number;
  }): Promise<void> {
    const { entityId, snapshot, version } = params;

    const snapshots = this.#snapshotMap.get(entityId) ?? [];

    snapshots.push({ state: snapshot, version });

    this.#snapshotMap.set(entityId, snapshots);

    return Promise.resolve();
  }
}
