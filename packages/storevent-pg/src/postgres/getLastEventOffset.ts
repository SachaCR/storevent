import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

export async function getLastEventOffset(params: {
  entityId: string;
  tableName: string;
  client: PoolClient | Pool | Client;
}): Promise<number> {
  const { entityId, client, tableName } = params;

  const sanitizedCountQuery = format.default(
    `SELECT COUNT(*) as "lastEventOffset" FROM %I WHERE entity_id = %L`,
    tableName,
    entityId,
  );

  const countResult = await client.query<{ lastEventOffset: string }>(
    sanitizedCountQuery,
  );

  const lastEventOffset = parseInt(countResult.rows[0].lastEventOffset) || 0;

  return lastEventOffset;
}
