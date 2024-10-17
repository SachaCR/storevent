import { AppendEventOptions } from "../eventStore";
import { JsonSerializable, Storevent } from "../interfaces";
import {
  SaveSnapshotOptions,
  SnapshotData,
  SnapshotStore,
} from "../snapshotStore";

export type AppendHybridEventOptions = AppendEventOptions & SaveSnapshotOptions;

export interface HybridAppendParams<
  Event extends Storevent,
  State extends JsonSerializable,
> {
  entityId: string;
  events: Event[];
  snapshot?: SnapshotData<State>;
}

export interface HybridStore<
  Event extends Storevent,
  State extends JsonSerializable,
> extends SnapshotStore<State> {
  entityName: string;

  append(
    params: HybridAppendParams<Event, State>,
    options?: AppendHybridEventOptions,
  ): Promise<void>;

  getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }>;
}
