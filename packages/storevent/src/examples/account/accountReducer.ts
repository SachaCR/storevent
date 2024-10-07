import { EntityReducer } from "../../reducer/interfaces";
import { AccountEvent, AccountState } from "./interfaces";
import { applyAccountCreatedEvent } from "./reducers/accountCreated";
import { applyAccountCreditedEvent } from "./reducers/accountCredited";
import { applyAccountDebitedEvent } from "./reducers/accountDebited";

export class AccountReducer extends EntityReducer<AccountState, AccountEvent> {
  constructor() {
    super("Account");

    this.mountEventReducer("AccountCreated", applyAccountCreatedEvent);
    this.mountEventReducer("AccountCredited", applyAccountCreditedEvent);
    this.mountEventReducer("AccountDebited", applyAccountDebitedEvent);
  }
}
