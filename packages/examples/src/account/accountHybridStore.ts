import { InMemoryHybridStore } from "@storevent/storevent";
import { AccountEvent, AccountState } from "./interfaces";
import { PGHybridStore } from "@storevent/storevent-pg";

export class AccountHybridStore extends InMemoryHybridStore<
  AccountEvent,
  AccountState
> {
  constructor() {
    super("Account");
  }
}

export class AccountPGHybridStore extends PGHybridStore<
  AccountEvent,
  AccountState
> {
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
      eventTableName: "account_events",
      snapshotTableName: "account_snapshots",
    });
  }
}
