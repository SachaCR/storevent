import { applyAccountCreditedEvent } from "./accountCredited";
import { applyAccountDebitedEvent } from "./accountDebited";
import { applyAccountCreatedEvent } from "./accountCreated";

import { EntityReducer } from "../../eventStore";
import { AccountEvent, AccountState } from "../types";
import { switchCaseGuard } from "../../switchCaseGuard";

export class AccountReducer
  implements EntityReducer<AccountState, AccountEvent>
{
  #entityName: "Account";

  get entityName() {
    return this.#entityName;
  }

  constructor() {
    this.#entityName = "Account";
  }

  reduce(initialState: AccountState, events: AccountEvent[]): AccountState {
    const currentState = events.reduce(
      (state: AccountState, event: AccountEvent) => {
        const eventName = event.name;

        switch (eventName) {
          case "AccountCreated":
            return applyAccountCreatedEvent(event);

          case "AccountCredited":
            return applyAccountCreditedEvent(state, event);

          case "AccountDebited":
            return applyAccountDebitedEvent(state, event);

          default:
            switchCaseGuard(eventName);
        }
      },
      initialState,
    );

    if (currentState.accountId === "VOID") {
      throw new Error("Account state corrupted");
    }

    return currentState;
  }
}
