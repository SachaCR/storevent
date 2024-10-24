import {
  AppendHybridEventOptions,
  HybridAppendParams,
  HybridStore,
  JsonSerializable,
  SnapshotData,
  Storevent,
} from "@storevent/storevent";

import { InMemoryEventStore, InMemorySnapshotStore } from "./";

export class InMemoryHybridStore<
  Event extends Storevent,
  State extends JsonSerializable,
> implements HybridStore<Event, State>
{
  #entityName: string;
  #eventStore: InMemoryEventStore<Event>;
  #snapshotStore: InMemorySnapshotStore<State>;

  constructor(entityName: string) {
    this.#entityName = entityName;
    this.#eventStore = new InMemoryEventStore<Event>(entityName);
    this.#snapshotStore = new InMemorySnapshotStore<State>();
    this;
  }

  get entityName(): string {
    return this.#entityName;
  }

  async append(
    params: HybridAppendParams<Event, State>,
    options?: AppendHybridEventOptions,
  ): Promise<void> {
    const { entityId, events, snapshot } = params;
    await this.#eventStore.append(
      { entityId, events },
      { appendAfterSequenceNumber: options?.appendAfterSequenceNumber },
    );

    if (snapshot) {
      await this.#snapshotStore.saveSnapshot({
        entityId,
        snapshot: snapshot.state,
        version: snapshot.version,
      });
    }

    return Promise.resolve();
  }

  async getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }> {
    return this.#eventStore.getEventsFromSequenceNumber(params);
  }

  getLastSnapshot(entityId: string): Promise<SnapshotData<State>> {
    return this.#snapshotStore.getLastSnapshot(entityId);
  }

  getSnapshot(params: {
    entityId: string;
    version: number;
  }): Promise<SnapshotData<State> | undefined> {
    return this.#snapshotStore.getSnapshot(params);
  }

  saveSnapshot(params: {
    entityId: string;
    snapshot: State;
    version: number;
  }): Promise<void> {
    return this.#snapshotStore.saveSnapshot(params);
  }
}
