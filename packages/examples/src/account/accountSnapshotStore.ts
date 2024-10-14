import { InMemorySnapshotStore } from "@storevent/storevent";

import { AccountState } from "./interfaces";

export class AccountSnapshotStore extends InMemorySnapshotStore<AccountState> {}
