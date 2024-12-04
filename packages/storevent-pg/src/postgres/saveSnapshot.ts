import { JsonSerializable } from "@storevent/storevent";
import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";
import { SnapshotFromDB } from "../advancedEventStore/interfaces";

export async function saveSnapshot<State extends JsonSerializable>(params: {
  entityId: string;
  snapshot: State;
  version: number;
  tableName: string;
  client: PoolClient | Pool | Client;
  writeMode: "APPEND" | "REPLACE";
}): Promise<void> {
  const { entityId, client, tableName, version } = params;

  if (params.writeMode === "REPLACE") {
    const sanitizedUpdateQuery = format.default(
      `
        UPDATE %I
        SET
          version = %L,
          state = %L
        WHERE entity_id = %L
      `,
      tableName,
      version,
      JSON.stringify(params.snapshot),
      entityId,
    );

    const res = await client.query<SnapshotFromDB>(sanitizedUpdateQuery);

    if (res.rowCount !== null && res.rowCount > 0) {
      return;
    }
  }

  const sanitizedUpdateLatestQuery = format.default(
    `
      UPDATE %I
        SET is_latest = false
        WHERE entity_id = %L
    `,
    tableName,
    entityId,
  );

  await client.query<SnapshotFromDB>(sanitizedUpdateLatestQuery);

  const sanitizedInsertQuery = format.default(
    `
      INSERT INTO %I (entity_id, version, state, is_latest)
      VALUES %L
    `,
    tableName,
    [[entityId, version, JSON.stringify(params.snapshot), true]],
  );

  await client.query<SnapshotFromDB>(sanitizedInsertQuery);
}
