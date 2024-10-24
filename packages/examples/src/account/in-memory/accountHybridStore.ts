import { InMemoryHybridStore } from "@storevent/storevent-memory";
import { AccountEvent, AccountState } from "../interfaces";

export class AccountInMemoryHybridStore extends InMemoryHybridStore<
  AccountEvent,
  AccountState
> {
  constructor() {
    super("Account");
  }
}
