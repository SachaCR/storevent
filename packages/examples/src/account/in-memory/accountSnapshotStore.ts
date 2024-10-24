import { InMemorySnapshotStore } from "@storevent/storevent-memory";
import { AccountState } from "../interfaces";

export class AccountInMemorySnapshotStore extends InMemorySnapshotStore<AccountState> {}
