import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

export async function createEventTable(
  tableName: string,
  client: PoolClient | Pool | Client,
): Promise<void> {
  const rawRequest = `
  CREATE TABLE IF NOT EXISTS %I (
    entity_id UUID NOT NULL,
    event_offset BIGINT NOT NULL,
    name TEXT NOT NULL,
    payload JSON NOT NULL,
    appended_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(entity_id, event_offset)
  )
  `;

  const sanitizedQuery = format.default(rawRequest, tableName);
  await client.query(sanitizedQuery);
}
