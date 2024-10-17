import { Pool } from "pg";
import * as format from "pg-format";

import {
  AppendEventOptions,
  ConcurrencyError,
  EventStore,
  Storevent,
  WrongSequenceError,
} from "@storevent/storevent";

import { wrapError } from "../errors/wrapError";

import { EventFromDB, PGEventStoreConfiguration } from "./interfaces";

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

    const rawRequest = `
    CREATE TABLE IF NOT EXISTS %I (
      entity_id UUID NOT NULL,
      sequence BIGINT NOT NULL,
      name TEXT NOT NULL,
      payload JSON NOT NULL,
      appended_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY(entity_id, sequence)
    )
    `;

    const sanitizedQuery = format.default(rawRequest, this.#tableName);

    try {
      await pool.query(sanitizedQuery);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async append(
    params: { entityId: string; events: Event[] },
    options?: AppendEventOptions,
  ): Promise<void> {
    const { entityId, events } = params;
    const appendAfterSequenceNumber = options?.appendAfterSequenceNumber;
    const pool = this.#pgPool;

    let sequenceNumber: number;
    const lastEventSequence = await this.#getLastEventSequenceNumber({
      entityId,
    });

    if (appendAfterSequenceNumber) {
      if (appendAfterSequenceNumber !== lastEventSequence) {
        throw new WrongSequenceError({
          entityId,
          entityName: this.#entityName,
          invalidSequence: appendAfterSequenceNumber,
        });
      }
    }

    sequenceNumber = lastEventSequence + 1;
    const eventsData = events.map((event) => {
      const eventData = [
        entityId,
        sequenceNumber,
        event.name,
        JSON.stringify(event.payload),
      ];

      sequenceNumber += 1;

      return eventData;
    });

    const sanitizedQuery = format.default(
      "INSERT INTO %I (entity_id, sequence, name, payload) VALUES %L",
      this.#tableName,
      eventsData,
    );

    try {
      await pool.query(sanitizedQuery);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes("duplicate key value violates unique constraint")
        ) {
          const concurrencyError = new ConcurrencyError({
            entityId,
            entityName: this.#entityName,
            sequenceInConflict:
              options?.appendAfterSequenceNumber ?? lastEventSequence,
          });

          concurrencyError.cause = err;

          throw concurrencyError;
        }
      }

      throw wrapError(err);
    }
  }

  async #getLastEventSequenceNumber(params: {
    entityId: string;
  }): Promise<number> {
    const pool = this.#pgPool;

    const { entityId } = params;

    const sanitizedCountQuery = format.default(
      `SELECT COUNT(*) as "lastEventSequence" FROM %I WHERE entity_id = %L`,
      this.#tableName,
      entityId,
    );
    try {
      const countResult = await pool.query<{ lastEventSequence: string }>(
        sanitizedCountQuery,
      );

      const lastEventSequence =
        parseInt(countResult.rows[0].lastEventSequence) || 0;

      return lastEventSequence;
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getEventsFromSequenceNumber(params: {
    entityId: string;
    sequenceNumber?: number;
  }): Promise<{ events: Event[]; lastEventSequenceNumber: number }> {
    const { entityId, sequenceNumber } = params;
    const pool = this.#pgPool;

    const sequenceToSearch = sequenceNumber ?? 0;

    const sanitizedQuery = format.default(
      "SELECT * FROM %I WHERE entity_id = %L AND sequence > %L ORDER BY sequence ASC",
      this.#tableName,
      entityId,
      sequenceToSearch,
    );

    try {
      const res = await pool.query<EventFromDB>(sanitizedQuery);

      if (res.rows.length === 0) {
        const lastEventSequence = await this.#getLastEventSequenceNumber({
          entityId,
        });

        return {
          events: [],
          lastEventSequenceNumber: lastEventSequence,
        };
      }

      const events: Event[] = res.rows.map((row) => {
        const event: Event = {
          name: row.name,
          payload: row.payload,
        } as Event;

        return event;
      });

      return {
        events: events,
        lastEventSequenceNumber: sequenceToSearch + events.length,
      };
    } catch (err) {
      throw wrapError(err);
    }
  }
}
