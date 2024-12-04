import EventEmitter from "events";
import { Pool } from "pg";

import { EventStore, BasicEvent } from "@storevent/storevent";

import { wrapError } from "../errors/wrapError";
import {
  appendEvents,
  createEventTable,
  getEventsFromOffset,
} from "../postgres";

import { PGEventStoreConfiguration } from "./interfaces";
export type { PGEventStoreConfiguration } from "./interfaces";

export class PGEventStore<Event extends BasicEvent>
  implements EventStore<Event>
{
  #entityName: string;
  #tableName: string;
  #eventEmitter: EventEmitter;
  #pgPool: Pool;

  constructor(configuration: PGEventStoreConfiguration) {
    const { entityName, tableName } = configuration;
    this.#entityName = entityName;
    this.#tableName = tableName ?? `${entityName}_events`;
    this.#eventEmitter = new EventEmitter();
    this.#pgPool = new Pool({
      host: configuration.database.host,
      database: configuration.database.name,
      port: configuration.database.port,
      password: configuration.database.password,
      user: configuration.database.user,
      connectionTimeoutMillis: configuration.database.connectionTimeoutMillis,
    });
  }

  get entityName(): string {
    return this.#entityName;
  }

  get tableName(): string {
    return this.#tableName;
  }

  get pgPool(): Pool {
    return this.#pgPool;
  }

  get eventEmitter(): EventEmitter {
    return this.#eventEmitter;
  }

  async initTable(): Promise<void> {
    const pool = this.pgPool;

    try {
      await createEventTable(this.#tableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
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

  async append(params: {
    entityId: string;
    events: Event[];
    appendAfterOffset?: number;
  }): Promise<void> {
    try {
      await appendEvents({
        client: this.pgPool,
        entityId: params.entityId,
        events: params.events,
        tableName: this.#tableName,
        entityName: this.#entityName,
        appendAfterOffset: params.appendAfterOffset,
      });

      if (this.#eventEmitter.listenerCount("EventAppended") > 0) {
        this.#eventEmitter.emit("EventAppended", {
          entityName: this.#entityName,
          entityId: params.entityId,
          events: params.events,
        });
      }
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getEventsFromOffset(params: {
    entityId: string;
    offset?: number;
  }): Promise<{ events: Event[]; lastEventOffset: number }> {
    try {
      return await getEventsFromOffset({
        entityId: params.entityId,
        offset: params.offset,
        client: this.pgPool,
        tableName: this.#tableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }
}
