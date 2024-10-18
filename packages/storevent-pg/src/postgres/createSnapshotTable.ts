import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

export async function createSnapshotTable(
  tableName: string,
  client: PoolClient | Pool | Client,
): Promise<void> {
  const rawRequest = `
  CREATE TABLE IF NOT EXISTS %I (
    entity_id UUID NOT NULL,
    version BIGINT NOT NULL,
    state JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(entity_id, sequence)
  )
  `;

  const sanitizedQuery = format.default(rawRequest, tableName);
  await client.query(sanitizedQuery);
}
