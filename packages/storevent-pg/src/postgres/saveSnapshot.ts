import { JsonSerializable } from "@storevent/storevent";
import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";
import { SnapshotFromDB } from "../snapshotStore/interfaces";

export async function saveSnapshot<State extends JsonSerializable>(params: {
  entityId: string;
  snapshot: State;
  version: number;
  tableName: string;
  client: PoolClient | Pool | Client;
}): Promise<void> {
  const { entityId, client, tableName, version } = params;

  const sanitizedQuery = format.default(
    "INSERT INTO %I (entity_id, version, state) VALUES %L",
    tableName,
    [entityId, version, JSON.stringify(params.snapshot)],
  );

  await client.query<SnapshotFromDB>(sanitizedQuery);
}
