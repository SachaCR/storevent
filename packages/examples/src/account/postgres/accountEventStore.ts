import { PGEventStore } from "@storevent/storevent-pg";

import { AccountEvent } from "../interfaces";

export class AccountPGEventStore extends PGEventStore<AccountEvent> {
  constructor(configuration: {
    database: {
      host: string;
      name: string;
      password: string;
      port: number;
      user: string;
    };
  }) {
    super({
      database: configuration.database,
      entityName: "Account",
      tableName: "account_events",
    });
  }
}
