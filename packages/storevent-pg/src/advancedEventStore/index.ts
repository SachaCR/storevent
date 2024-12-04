import * as format from "pg-format";

import {
  JsonSerializable,
  SnapshotData,
  BasicEvent,
  AdvancedEventStore,
} from "@storevent/storevent";

import { createSnapshotTable } from "../postgres/createSnapshotTable";
import { wrapError } from "../errors/wrapError";
import { getLastSnapshot } from "../postgres/getLastSnapshot";
import { getSnapshot } from "../postgres/getSnapshot";
import { appendEvents, createEventTable } from "../postgres";
import {
  PGAdvancedEventStoreConfiguration,
  SnapshotFromDB,
} from "./interfaces";
import { saveSnapshot } from "../postgres/saveSnapshot";
import { PGEventStore } from "../eventStore";

export class PGAdvancedEventStore<
    Event extends BasicEvent,
    State extends JsonSerializable,
  >
  extends PGEventStore<Event>
  implements AdvancedEventStore<Event, State>
{
  #snapshotTableName: string;
  #writeMode: "APPEND" | "REPLACE";

  constructor(configuration: PGAdvancedEventStoreConfiguration) {
    const { entityName, eventTableName, snapshotTableName, database } =
      configuration;

    super({ entityName, tableName: eventTableName, database });

    this.#snapshotTableName = snapshotTableName ?? `${entityName}_snapshots`;
    this.#writeMode = configuration.writeMode ?? "APPEND";
  }

  get eventTableName(): string {
    return this.tableName;
  }

  get snapshotTableName(): string {
    return this.#snapshotTableName;
  }

  async initTable(): Promise<void> {
    const pool = this.pgPool;

    try {
      await createSnapshotTable(this.#snapshotTableName, pool);
      await createEventTable(this.eventTableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async appendWithSnapshot(params: {
    entityId: string;
    events: Event[];
    appendAfterOffset: number;
    snapshot: { state: State; version: number };
  }): Promise<void> {
    const client = await this.pgPool.connect();
    const { entityId, events, appendAfterOffset, snapshot } = params;

    try {
      await client.query("BEGIN");

      await appendEvents({
        client,
        entityId,
        events,
        tableName: this.eventTableName,
        entityName: this.entityName,
        appendAfterOffset: appendAfterOffset,
      });

      await saveSnapshot({
        entityId,
        snapshot: snapshot.state,
        version: snapshot.version,
        tableName: this.#snapshotTableName,
        writeMode: this.#writeMode,
        client,
      });

      await client.query("COMMIT");

      if (this.eventEmitter.listenerCount("EventAppended") > 0) {
        this.eventEmitter.emit("EventAppended", {
          entityName: this.entityName,
          entityId: params.entityId,
          events: params.events,
        });
      }
    } catch (err) {
      await client.query("ROLLBACK");

      throw wrapError(err);
    } finally {
      client.release();
    }
  }

  async getLastSnapshot(
    entityId: string,
  ): Promise<SnapshotData<State> | undefined> {
    try {
      return await getLastSnapshot({
        client: this.pgPool,
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
        client: this.pgPool,
        writeMode: this.#writeMode,
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
        client: this.pgPool,
        entityId: params.entityId,
        version: params.version,
        tableName: this.#snapshotTableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }

  async listEntities(): Promise<State[]> {
    const sanitizedQuery = format.default(
      `
        SELECT * from %I
        WHERE is_latest = true
      `,
      this.#snapshotTableName,
    );

    const result = await this.pgPool.query<SnapshotFromDB>(sanitizedQuery);

    return result.rows.map((row) => row.state as State);
  }
}
