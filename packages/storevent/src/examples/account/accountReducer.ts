import { EntityReducer } from "../../reducer/interfaces";
import { AccountEvent, AccountState } from "./interfaces";

export class AccountReducer extends EntityReducer<AccountState, AccountEvent> {}
