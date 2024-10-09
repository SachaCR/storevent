import { InMemoryHybridStore } from "../../hybridStore";
import { AccountEvent, AccountState } from "./interfaces";

export class AccountHybridStore extends InMemoryHybridStore<
  AccountEvent,
  AccountState
> {
  constructor() {
    super("Account");
  }
}
