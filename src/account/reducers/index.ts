import { applyAccountCreditedEvent } from "./accountCredited";
import { applyAccountDebitedEvent } from "./accountDebited";
import { applyAccountCreatedEvent } from "./accountCreated";

import { EntityReducer } from "../../eventStore";
import { AccountEvent, AccountState } from "../types";
import { switchCaseGuard } from "../../switchCaseGuard";
import { Account } from "..";

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

  reduce(
    events: AccountEvent[],
    state?: AccountState,
  ): { state: AccountState; sequence: number } {
    const newState = events.reduce(
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
      state ?? Account.initialState(),
    );

    if (newState.accountId === "VOID") {
      throw new Error("Account state corrupted");
    }

    return { state: newState, sequence: events.length - 1 };
  }
}
