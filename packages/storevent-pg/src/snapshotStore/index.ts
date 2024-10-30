import {
  JsonSerializable,
  SnapshotData,
  SnapshotStore,
} from "@storevent/storevent";
import { Pool } from "pg";
import { PGEventStoreConfiguration } from "../eventStore";
import { createSnapshotTable } from "../postgres/createSnapshotTable";
import { wrapError } from "../errors/wrapError";
import { getLastSnapshot } from "../postgres/getLastSnapshot";
import { getSnapshot } from "../postgres/getSnapshot";
import { saveSnapshot } from "../postgres/saveSnapshot";

export interface PGSnapshotStoreConfiguration
  extends PGEventStoreConfiguration {
  /**
   * This options allows to specify the write mode for the snapshot store.
   * Append mode will append the snapshot to the table, while replace mode will replace the snapshot if it already exists.
   */
  writeMode?: "APPEND" | "REPLACE";
}

export class PGSnapshotStore<State extends JsonSerializable>
  implements SnapshotStore<State>
{
  #entityName: string;
  #tableName: string;
  #pgPool: Pool;
  #writeMode: "APPEND" | "REPLACE";

  constructor(configuration: PGSnapshotStoreConfiguration) {
    const { entityName, tableName } = configuration;
    this.#entityName = entityName;
    this.#tableName = tableName ?? `${entityName}_snapshots`;
    this.#pgPool = new Pool({
      host: configuration.database.host,
      database: configuration.database.name,
      port: configuration.database.port,
      password: configuration.database.password,
      user: configuration.database.user,
      connectionTimeoutMillis: configuration.database.connectionTimeoutMillis,
    });
    this.#writeMode = configuration.writeMode ?? "APPEND";
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
      await createSnapshotTable(this.#tableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getLastSnapshot(
    entityId: string,
  ): Promise<SnapshotData<State> | undefined> {
    try {
      return await getLastSnapshot({
        client: this.#pgPool,
        entityId,
        tableName: this.#tableName,
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
        tableName: this.#tableName,
        client: this.#pgPool,
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
        client: this.#pgPool,
        entityId: params.entityId,
        version: params.version,
        tableName: this.#tableName,
      });
    } catch (err) {
      throw wrapError(err);
    }
  }
}
