import EventEmitter from "events";

import {
  AppendEventOptions,
  EventStore,
  Storevent,
  WrongSequenceError,
} from "@storevent/storevent";

export class InMemoryEventStore<Event extends Storevent>
  implements EventStore<Event>
{
  #entityName: string;
  #eventMap: Map<string, Event[]>;
  #eventEmitter: EventEmitter;

  constructor(entityName: string) {
    this.#entityName = entityName;
    this.#eventMap = new Map<string, Event[]>();
    this.#eventEmitter = new EventEmitter();
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
          new WrongSequenceError({
            entityId,
            entityName: this.#entityName,
            invalidSequence: options.appendAfterSequenceNumber,
          }),
        );
      }
    }

    entityEvents.push(...events);

    this.#eventMap.set(entityId, entityEvents);

    this.#eventEmitter.emit("EventAppended", {
      entityName: this.#entityName,
      entityId,
      events,
    });

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

  onEventAppended(
    handler: (event: {
      entityName: string;
      entityId: string;
      events: Event[];
    }) => void,
  ): void {
    this.#eventEmitter.on("EventAppended", handler);
  }
}
