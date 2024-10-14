import { InMemoryHybridStore } from "@storevent/storevent";
import { AccountEvent, AccountState } from "./interfaces";

export class AccountHybridStore extends InMemoryHybridStore<
  AccountEvent,
  AccountState
> {
  constructor() {
    super("Account");
  }
}
