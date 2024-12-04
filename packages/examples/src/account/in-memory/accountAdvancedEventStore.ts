import { InMemoryAdvancedEventStore } from "@storevent/storevent-memory";
import { AccountEvent, AccountState } from "../interfaces";

export class AccountInMemoryAdvancedEventStore extends InMemoryAdvancedEventStore<
  AccountEvent,
  AccountState
> {
  constructor() {
    super("Account");
  }
}
