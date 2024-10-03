import { AccountEvent } from "../account/types";
import { InMemoryEventStore } from "./inMemory";

export class AccountEventStore extends InMemoryEventStore<AccountEvent> {}
