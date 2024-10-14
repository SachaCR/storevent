import { InMemoryEventStore } from "@storevent/storevent";
import { PGEventStore } from "@storevent/storevent-pg";

import { AccountEvent } from "./interfaces";

export class AccountEventStore extends InMemoryEventStore<AccountEvent> {
  constructor() {
    super("Account");
  }
}

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

/*
{
  host: "localhost",
  name: "storevent-pg",
  password: "admin",
  port: 5432,
  user: "postgres",
}
//*/
