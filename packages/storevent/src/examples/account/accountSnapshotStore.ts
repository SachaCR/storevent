import { InMemorySnapshotStore } from "../../snapshotStore";
import { AccountState } from "./interfaces";

export class AccountSnapshotStore extends InMemorySnapshotStore<AccountState> {}
