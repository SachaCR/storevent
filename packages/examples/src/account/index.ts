import { AccountReducer } from "./accountReducer";
import {
  AccountCreated,
  AccountCredited,
  AccountDebited,
  AccountEvent,
  AccountState,
} from "./interfaces";

export * from "./interfaces";
export * from "./accountEventStore";
export * from "./accountSnapshotStore";
export * from "./accountHybridStore";
export * from "./accountReducer";

export class Account {
  #state: AccountState;
  #reducer: AccountReducer;
  #version: number;

  constructor(params?: { state: AccountState; version: number }) {
    const { state, version } = params ?? {};

    this.#state = state ?? Account.initialState();
    this.#reducer = new AccountReducer();
    this.#version = version ?? 0;
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
    this.#state = this.#reducer.reduceEvents({
      events: [event],
      state: this.#state,
      stateVersion: this.#version,
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
