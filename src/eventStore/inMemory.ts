import { DomainEvent, EventStore } from ".";

export class InMemoryEventStore<Event extends DomainEvent>
  implements EventStore<Event>
{
  #eventList: Event[];

  constructor() {
    this.#eventList = [];
  }

  append(events: Event[]): Promise<void> {
    this.#eventList.push(...events);
    return Promise.resolve();
  }

  getEventsFromSequence(params: {
    entityId: string;
    sequence?: number;
  }): Promise<{ events: Event[]; lastSequence: number }> {
    const { entityId, sequence } = params;
    const allAccountEvents = this.#eventList.filter((event: Event) => {
      return event.entityId === entityId;
    });

    const eventsFromSequence = allAccountEvents.slice(sequence);

    return Promise.resolve({
      events: eventsFromSequence,
      lastSequence: eventsFromSequence.length - 1,
    });
  }
}
