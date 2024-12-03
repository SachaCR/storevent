import EventEmitter from "events";

import { EventStore, BasicEvent, WrongOffsetError } from "@storevent/storevent";

export class InMemoryEventStore<Event extends BasicEvent>
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

  append(params: {
    entityId: string;
    events: Event[];
    appendAfterOffset?: number;
  }): Promise<void> {
    const { entityId, events } = params;
    const entityEvents = this.#eventMap.get(entityId) ?? [];

    if (params.appendAfterOffset !== undefined) {
      const lastEntityOffset = entityEvents.length;

      if (params.appendAfterOffset !== lastEntityOffset) {
        return Promise.reject(
          new WrongOffsetError({
            entityId,
            entityName: this.#entityName,
            invalidOffset: params.appendAfterOffset,
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

  getEventsFromOffset(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventOffset: number }> {
    const { entityId, sequenceNumber } = params;

    let sanitizedOffset = sequenceNumber ?? 0;
    if (sanitizedOffset < 0) {
      sanitizedOffset = 0;
    }

    const startingOffset = Math.floor(sanitizedOffset);

    const entityEvents = this.#eventMap.get(entityId) ?? [];

    const lastEntityOffset = entityEvents.length;

    const eventsFromOffset = entityEvents.slice(startingOffset);

    const lastEventOffset = Math.min(
      startingOffset + eventsFromOffset.length,
      lastEntityOffset,
    );

    return Promise.resolve({
      events: eventsFromOffset,
      lastEventOffset,
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
