import config from "config";
import { Client } from "pg";
import { PGEventStoreConfiguration } from "../eventStore/interfaces";
import { PGAdvancedEventStore } from "../advancedEventStore";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

export default async function setupTestDB() {
  const advancedStore = new PGAdvancedEventStore({
    database: DATABASE_CONFIG,
    entityName: "test_entity",
  });

  const client = new Client({
    host: DATABASE_CONFIG.host,
    database: DATABASE_CONFIG.name,
    port: DATABASE_CONFIG.port,
    password: DATABASE_CONFIG.password,
    user: DATABASE_CONFIG.user,
  });

  try {
    await advancedStore.initTable();
    await client.connect();
    await client.query(`TRUNCATE TABLE test_entity_events`);
    await client.query(`TRUNCATE TABLE test_entity_snapshots`);
  } finally {
    await advancedStore.pgPool.end();
    await client.end();
  }
}
