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

export class PGSnapshotStore<State extends JsonSerializable>
  implements SnapshotStore<State>
{
  #entityName: string;
  #tableName: string;
  #pgPool: Pool;

  constructor(configuration: PGEventStoreConfiguration) {
    const { entityName, tableName } = configuration;
    this.#entityName = entityName;
    this.#tableName = tableName ?? `${entityName}_snapshots`;
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
      await createSnapshotTable(this.#tableName, pool);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async getLastSnapshot(entityId: string): Promise<SnapshotData<State>> {
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
