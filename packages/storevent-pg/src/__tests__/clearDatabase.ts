import config from "config";
import { Client } from "pg";
import { PGEventStoreConfiguration } from "../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

export async function clearDatabase() {
  const client = new Client({
    host: DATABASE_CONFIG.host,
    database: DATABASE_CONFIG.name,
    port: DATABASE_CONFIG.port,
    password: DATABASE_CONFIG.password,
    user: DATABASE_CONFIG.user,
  });

  await client.connect();
  await client.query(`TRUNCATE TABLE test_entity_events`);
  await client.end();
}
