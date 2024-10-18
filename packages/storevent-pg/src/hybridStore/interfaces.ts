export interface PGHybridStoreConfiguration {
  entityName: string;
  eventTableName?: string;
  snapshotTableName?: string;
  database: {
    host: string;
    name: string;
    port: number;
    password: string;
    user: string;
  };
}
