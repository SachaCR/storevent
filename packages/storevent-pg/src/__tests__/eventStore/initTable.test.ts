import config from "config";
import { Client } from "pg";

import { PGEventStore } from "../..";
import { PGEventStoreConfiguration } from "../../eventStore/interfaces";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

describe("Component PGEventStore.initTable()", () => {
  describe("Given A valid configuration", () => {
    describe("When I call initTable", () => {
      test("Then it successfully creates the expected table", async () => {
        const myPGEventStore = new PGEventStore({
          entityName: "test_entity",
          database: DATABASE_CONFIG,
        });

        const client = new Client({
          host: DATABASE_CONFIG.host,
          database: DATABASE_CONFIG.name,
          port: DATABASE_CONFIG.port,
          password: DATABASE_CONFIG.password,
          user: DATABASE_CONFIG.user,
        });

        try {
          await myPGEventStore.initTable();
          await client.connect();

          const result = await client.query(`
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_name = 'test_entity_events'
            ) AS table_existence;
          `);

          expect(result.rows).toHaveLength(1);
          expect(result.rows[0]).toStrictEqual({
            table_existence: true,
          });
        } finally {
          await myPGEventStore.stop();
          await client.end();
        }
      });
    });
  });
});
