import { AccountReducer } from "./accountReducer";
import {
  AccountCreated,
  AccountCredited,
  AccountDebited,
  AccountEvent,
  AccountState,
} from "./interfaces";
import { applyAccountCreatedEvent } from "./reducers/accountCreated";
import { applyAccountCreditedEvent } from "./reducers/accountCredited";
import { applyAccountDebitedEvent } from "./reducers/accountDebited";

export * from "./reducers";
export * from "./interfaces";
export * from "./accountEventStore";
export * from "./accountSnapshotStore";
export * from "./accountHybridStore";

export class Account {
  #state: AccountState;
  #reducer: AccountReducer;

  constructor(state?: AccountState) {
    this.#state = state ?? Account.initialState();
    this.#reducer = new AccountReducer("Account");

    this.#reducer.mountEventReducer({
      eventName: "AccountCreated",
      eventReducer: applyAccountCreatedEvent,
    });

    this.#reducer.mountEventReducer({
      eventName: "AccountCredited",
      eventReducer: applyAccountCreditedEvent,
    });

    this.#reducer.mountEventReducer({
      eventName: "AccountDebited",
      eventReducer: applyAccountDebitedEvent,
    });
  }

  static initialState(): AccountState {
    return {
      accountId: "VOID",
      status: "VOID",
      currency: "VOID",
      balance: 0,
    };
  }

  #updateState(event: AccountEvent) {
    this.#state = this.#reducer.reduce({
      state: this.#state,
      events: [event],
    }).state;
  }

  open(params: { accountId: string }): AccountCreated {
    const accountId = params.accountId;

    const event: AccountCreated = {
      name: "AccountCreated",
      payload: {
        accountId,
        status: "OPEN",
        balance: 0,
        currency: "EUR",
      },
    };

    this.#updateState(event);

    return event;
  }

  credit(params: { amount: number; currency: string }): AccountCredited {
    if (this.#state.currency !== params.currency) {
      throw new Error("Wrong Currency");
    }

    const event: AccountCredited = {
      name: "AccountCredited",
      payload: {
        amount: params.amount,
        currency: params.currency,
      },
    };

    this.#updateState(event);

    return event;
  }

  debit(params: { amount: number; currency: string }): AccountDebited {
    if (this.#state.currency !== params.currency) {
      throw new Error("Wrong Currency");
    }

    if (this.#state.balance - params.amount < 0) {
      throw new Error("Not Enough Funds");
    }

    const event: AccountDebited = {
      name: "AccountDebited",
      payload: {
        amount: params.amount,
        currency: params.currency,
      },
    };

    this.#updateState(event);

    return event;
  }

  getState() {
    return this.#state;
  }
}
