import { ConcurrencyError } from "../../errors/concurrencyError";
import { Storevent } from "../../interfaces";
import { AppendEventOptions, EventStore } from "../interfaces";

export class InMemoryEventStore<Event extends Storevent>
  implements EventStore<Event>
{
  #entityName: string;
  #eventMap: Map<string, Event[]>;

  constructor(entityName: string) {
    this.#entityName = entityName;
    this.#eventMap = new Map<string, Event[]>();
  }

  get entityName(): string {
    return this.#entityName;
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
      const lastEntitySequence = entityEvents.length;

      if (options.appendAfterSequenceNumber !== lastEntitySequence) {
        return Promise.reject(
          new ConcurrencyError({
            entityId,
            entityName: this.#entityName,
            sequenceInConflict: options.appendAfterSequenceNumber,
          }),
        );
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

    let sanitizedSequenceNumber = sequenceNumber ?? 0;
    if (sanitizedSequenceNumber < 0) {
      sanitizedSequenceNumber = 0;
    }

    const startingSequence = Math.floor(sanitizedSequenceNumber);

    const entityEvents = this.#eventMap.get(entityId) ?? [];

    const lastEntitySequence = entityEvents.length;

    const eventsFromSequence = entityEvents.slice(startingSequence);

    const lastEventSequenceNumber = Math.min(
      startingSequence + eventsFromSequence.length,
      lastEntitySequence,
    );

    return Promise.resolve({
      events: eventsFromSequence,
      lastEventSequenceNumber,
    });
  }
}
