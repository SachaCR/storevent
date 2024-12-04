import { JsonSerializable } from "@storevent/storevent";

/**
 * Configuration object for the PGHybridStore
 */
export interface PGAdvancedEventStoreConfiguration {
  entityName: string;
  eventTableName?: string;
  snapshotTableName?: string;
  writeMode?: "APPEND" | "REPLACE";
  database: {
    host: string;
    name: string;
    port: number;
    password: string;
    user: string;
    connectionTimeoutMillis?: number;
  };
}

export interface SnapshotFromDB {
  entity_id: string;
  version: string;
  state: JsonSerializable;
  is_latest: boolean;
  created_at: Date;
  updated_at: Date;
}
