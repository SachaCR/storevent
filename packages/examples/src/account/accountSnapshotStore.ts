import { InMemorySnapshotStore } from "@storevent/storevent";

import { AccountState } from "./interfaces";
import { PGSnapshotStore } from "@storevent/storevent-pg";

export class AccountSnapshotStore extends InMemorySnapshotStore<AccountState> {}

export class AccountPGSnapshotStore extends PGSnapshotStore<AccountState> {
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
      tableName: "account_snapshots",
    });
  }
}
