import { JsonSerializable, Storevent } from "../../interfaces";
import { SnapshotData } from "../../snapshotStore";
import { switchCaseGuard } from "../../switchCaseGuard";
import {
  HybridAppendParams,
  AppendHybridEventOptions,
  HybridStore,
} from "../interfaces";

export class InMemoryHybridStore<
  Event extends Storevent,
  State extends JsonSerializable,
> implements HybridStore<Event, State>
{
  #eventMap: Map<string, Event[]>;
  #snapshotMap: Map<string, SnapshotData<State>[]>;

  constructor() {
    this.#eventMap = new Map<string, Event[]>();
    this.#snapshotMap = new Map<string, SnapshotData<State>[]>();
  }

  async append(
    params: HybridAppendParams<Event, State>,
    options?: AppendHybridEventOptions,
  ): Promise<void> {
    const { entityId, events, snapshot } = params;
    const entityEvents = this.#eventMap.get(entityId) ?? [];

    if (options?.appendAfterSequenceNumber !== undefined) {
      const lastEntitySequence = Math.max(entityEvents.length - 1, 0);

      if (options.appendAfterSequenceNumber !== lastEntitySequence) {
        return Promise.reject(new Error("Concurrency error"));
      }
    }

    entityEvents.push(...events);

    this.#eventMap.set(entityId, entityEvents);
    await this.saveSnapshot({
      entityId,
      snapshot: snapshot.state,
      version: snapshot.version,
    });

    return Promise.resolve();
  }

  async getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }> {
    const { entityId, sequenceNumber } = params;

    const entityEvents = this.#eventMap.get(entityId) ?? [];

    const eventsFromSequence = entityEvents.slice(sequenceNumber ?? 0);

    return Promise.resolve({
      events: eventsFromSequence,
      lastEventSequenceNumber: eventsFromSequence.length - 1,
    });
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
