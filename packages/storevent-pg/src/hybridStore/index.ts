import {
  AppendHybridEventOptions,
  HybridAppendParams,
  HybridStore,
  JsonSerializable,
  SnapshotData,
  Storevent,
} from "@storevent/storevent";
import { Pool } from "pg";

import { createSnapshotTable } from "../postgres/createSnapshotTable";
import { wrapError } from "../errors/wrapError";
import { getLastSnapshot } from "../postgres/getLastSnapshot";
import { getSnapshot } from "../postgres/getSnapshot";
import { saveSnapshot } from "../postgres/saveSnapshot";
import { getEventsFromSequenceNumber } from "../postgres/getEventsFromSequenceNumber";
import { appendEvents } from "../postgres";
import { PGHybridStoreConfiguration } from "./interfaces";

export class PGHybridStore<
  Event extends Storevent,
  State extends JsonSerializable,
> implements HybridStore<Event, State>
{
  #entityName: string;
  #eventTableName: string;
  #snapshotTableName: string;

  #pgPool: Pool;

  constructor(configuration: PGHybridStoreConfiguration) {
    const { entityName, eventTableName, snapshotTableName } = configuration;
    this.#entityName = entityName;
    this.#snapshotTableName = snapshotTableName ?? `${entityName}_snapshots`;
    this.#eventTableName = eventTableName ?? `${entityName}_events`;

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

  get eventTableName(): string {
    return this.#eventTableName;
  }

  get snapshotTableName(): string {
    return this.#snapshotTableName;
  }

  async stop() {
    await this.#pgPool.end();
  }

  async initTable(): Promise<void> {
    const pool = this.#pgPool;

    try {
      await createSnapshotTable(this.#snapshotTableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async append(
    params: HybridAppendParams<Event, State>,
    options?: AppendHybridEventOptions,
  ): Promise<void> {
    const client = await this.#pgPool.connect();

    try {
      await client.query("BEGIN");

      await appendEvents(
        {
          client,
          entityId: params.entityId,
          events: params.events,
          tableName: this.#eventTableName,
          entityName: this.#entityName,
        },
        options,
      );

      if (params.snapshot) {
        await saveSnapshot({
          entityId: params.entityId,
          snapshot: params.snapshot.state,
          version: params.snapshot.version,
          tableName: this.#snapshotTableName,
          client,
        });
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");

      throw wrapError(err);
    } finally {
      client.release();
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
        tableName: this.#eventTableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getLastSnapshot(entityId: string): Promise<SnapshotData<State>> {
    try {
      return await getLastSnapshot({
        client: this.#pgPool,
        entityId,
        tableName: this.#snapshotTableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }

  async saveSnapshot(params: {
    entityId: string;
    snapshot: State;
    version: number;
  }): Promise<void> {
    try {
      await saveSnapshot({
        entityId: params.entityId,
        snapshot: params.snapshot,
        version: params.version,
        tableName: this.#snapshotTableName,
        client: this.#pgPool,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getSnapshot(params: {
    entityId: string;
    version: number;
  }): Promise<SnapshotData<State> | undefined> {
    try {
      return await getSnapshot({
        client: this.#pgPool,
        entityId: params.entityId,
        version: params.version,
        tableName: this.#snapshotTableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }
}
