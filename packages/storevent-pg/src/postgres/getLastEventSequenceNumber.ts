import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

export async function getLastEventSequenceNumber(params: {
  entityId: string;
  tableName: string;
  client: PoolClient | Pool | Client;
}): Promise<number> {
  const { entityId, client, tableName } = params;

  const sanitizedCountQuery = format.default(
    `SELECT COUNT(*) as "lastEventSequence" FROM %I WHERE entity_id = %L`,
    tableName,
    entityId,
  );

  const countResult = await client.query<{ lastEventSequence: string }>(
    sanitizedCountQuery,
  );

  const lastEventSequence =
    parseInt(countResult.rows[0].lastEventSequence) || 0;

  return lastEventSequence;
}
