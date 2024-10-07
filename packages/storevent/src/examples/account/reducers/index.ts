import { applyAccountCreditedEvent } from "./accountCredited";
import { applyAccountDebitedEvent } from "./accountDebited";
import { applyAccountCreatedEvent } from "./accountCreated";

import { AccountEvent, AccountState } from "../interfaces";
import { Account } from "..";
import { switchCaseGuard } from "../../../switchCaseGuard";
import { EntityReducer } from "../../../interfaces";

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

  reduce(params: {
    events: AccountEvent[];
    state?: AccountState;
    stateSequence?: number;
  }): {
    state: AccountState;
    sequence: number;
  } {
    const { events, state, stateSequence } = params;
    const startSequence = stateSequence ?? 0;

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

    return { state: newState, sequence: startSequence + events.length };
  }
}
