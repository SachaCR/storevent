import { AppendEventOptions, DomainEvent, EventStore } from ".";

export class InMemoryEventStore<Event extends DomainEvent>
  implements EventStore<Event>
{
  #eventMap: Map<string, Event[]>;

  constructor() {
    this.#eventMap = new Map<string, Event[]>();
  }

  append(
    entityId: string,
    events: Event[],
    options?: AppendEventOptions,
  ): Promise<void> {
    const entityEvents = this.#eventMap.get(entityId) || [];

    if (options?.checkConcurencyOnSequence !== undefined) {
      const lastEntitySequence = entityEvents.length - 1;

      if (options.checkConcurencyOnSequence !== lastEntitySequence) {
        return Promise.reject(new Error("Concurrency error"));
      }
    }

    entityEvents.push(...events);

    this.#eventMap.set(entityId, entityEvents);

    return Promise.resolve();
  }

  getEventsFromSequence(params: {
    entityId: string;
    sequence?: number;
  }): Promise<{ events: Event[]; lastSequence: number }> {
    const { entityId, sequence } = params;

    const entityEvents = this.#eventMap.get(entityId) || [];

    const eventsFromSequence = entityEvents.slice(sequence ?? 0);

    return Promise.resolve({
      events: eventsFromSequence,
      lastSequence: eventsFromSequence.length - 1,
    });
  }
}
