import { InMemoryEventStore } from "../../eventStore";
import { AccountEvent } from "./interfaces";

export class AccountEventStore extends InMemoryEventStore<AccountEvent> {
  constructor() {
    super("Account");
  }
}
