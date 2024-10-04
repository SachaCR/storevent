import { AccountEvent } from "./types";
import { InMemoryEventStore } from "../eventStore/inMemory";

export class AccountEventStore extends InMemoryEventStore<AccountEvent> {}
