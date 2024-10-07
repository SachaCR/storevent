import { Storevent } from "../../interfaces";
import { AppendEventOptions, EventStore } from "../interfaces";

export class InMemoryEventStore<Event extends Storevent>
  implements EventStore<Event>
{
  #eventMap: Map<string, Event[]>;

  constructor() {
    this.#eventMap = new Map<string, Event[]>();
  }

  append(
    params: {
      entityId: string;
      events: Event[];
    },
    options?: AppendEventOptions,
  ): Promise<void> {
    const { entityId, events } = params;
    const entityEvents = this.#eventMap.get(entityId) ?? [];

    if (options?.appendAfterSequenceNumber !== undefined) {
      const lastEntitySequence = entityEvents.length - 1;

      if (options.appendAfterSequenceNumber !== lastEntitySequence) {
        return Promise.reject(new Error("Concurrency error"));
      }
    }

    entityEvents.push(...events);

    this.#eventMap.set(entityId, entityEvents);

    return Promise.resolve();
  }

  getEventsFromSequenceNumber(params: {
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
}
