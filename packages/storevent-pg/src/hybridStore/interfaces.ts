/**
 * Configuration object for the PGHybridStore
 */
export interface PGHybridStoreConfiguration {
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
