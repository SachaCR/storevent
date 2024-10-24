import { PGHybridStore } from "@storevent/storevent-pg";
import { AccountEvent, AccountState } from "../interfaces";

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
