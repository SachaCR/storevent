import { Pool } from "pg";

import {
  AppendEventOptions,
  EventStore,
  Storevent,
} from "@storevent/storevent";

import { wrapError } from "../errors/wrapError";
import { appendEvents, createEventTable } from "../postgres/";

import { PGEventStoreConfiguration } from "./interfaces";
import { getEventsFromSequenceNumber } from "../postgres/getEventsFromSequenceNumber";
export type { PGEventStoreConfiguration } from "./interfaces";

export class PGEventStore<Event extends Storevent>
  implements EventStore<Event>
{
  #entityName: string;
  #tableName: string;
  #pgPool: Pool;

  constructor(configuration: PGEventStoreConfiguration) {
    const { entityName, tableName } = configuration;
    this.#entityName = entityName;
    this.#tableName = tableName ?? `${entityName}_events`;
    console.log(">>>>>>>>>>> configuration:", configuration);
    this.#pgPool = new Pool({
      host: configuration.database.host,
      database: configuration.database.name,
      port: configuration.database.port,
      password: configuration.database.password,
      user: configuration.database.user,
    });
  }

  get entityName(): string {
    return this.#entityName;
  }

  get tableName(): string {
    return this.#tableName;
  }

  async stop() {
    await this.#pgPool.end();
  }

  async initTable(): Promise<void> {
    const pool = this.#pgPool;

    try {
      await createEventTable(this.#tableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async append(
    params: { entityId: string; events: Event[] },
    options?: AppendEventOptions,
  ): Promise<void> {
    try {
      await appendEvents(
        {
          client: this.#pgPool,
          entityId: params.entityId,
          events: params.events,
          tableName: this.#tableName,
          entityName: this.#entityName,
        },
        options,
      );
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }> {
    try {
      return await getEventsFromSequenceNumber({
        entityId: params.entityId,
        sequenceNumber: params.sequenceNumber,
        client: this.#pgPool,
        tableName: this.#tableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }
}
