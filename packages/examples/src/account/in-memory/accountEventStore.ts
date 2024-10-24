import { InMemoryEventStore } from "@storevent/storevent-memory";
import { AccountEvent } from "../interfaces";

export class AccountInMemoryEventStore extends InMemoryEventStore<AccountEvent> {
  constructor() {
    super("Account");
  }
}
