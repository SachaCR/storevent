import { PGSnapshotStore } from "@storevent/storevent-pg";
import { AccountState } from "../interfaces";

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
