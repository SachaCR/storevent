import { JsonSerializable, SnapshotData } from "@storevent/storevent";
import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";
import { SnapshotFromDB } from "../snapshotStore/interfaces";

export async function getLastSnapshot<State extends JsonSerializable>(params: {
  entityId: string;
  tableName: string;
  client: PoolClient | Pool | Client;
}): Promise<SnapshotData<State> | undefined> {
  const { entityId, client, tableName } = params;

  const sanitizedCountQuery = format.default(
    `SELECT * FROM %I WHERE entity_id = %L ORDER BY version DESC LIMIT 1`,
    tableName,
    entityId,
  );

  const result = await client.query<SnapshotFromDB>(sanitizedCountQuery);

  if (result.rows.length === 0) {
    return;
  }

  const snapshotData: SnapshotData<State> = {
    state: result.rows[0].state as State,
    version: parseInt(result.rows[0].version),
  };

  return snapshotData;
}
