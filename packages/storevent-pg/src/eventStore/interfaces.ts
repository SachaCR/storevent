import { JsonSerializable } from "@storevent/storevent";

export interface PGEventStoreConfiguration {
  entityName: string;
  tableName?: string;
  database: {
    host: string;
    name: string;
    port: number;
    password: string;
    user: string;
    connectionTimeoutMillis?: number;
  };
}

export interface EventFromDB {
  entity_id: string;
  event_offset: string;
  name: string;
  payload: JsonSerializable;
  appended_at: Date;
}
