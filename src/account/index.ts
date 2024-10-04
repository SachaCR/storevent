import { AccountReducer } from "./reducers";
import {
  AccountCreated,
  AccountCredited,
  AccountDebited,
  AccountState,
} from "./types";

export * from "./reducers";
export * from "./accountEventStore";

export class Account {
  #state: AccountState;
  #reducer: AccountReducer;

  constructor(state?: AccountState) {
    this.#state = state ?? Account.initialState();
    this.#reducer = new AccountReducer();
  }

  static initialState(): AccountState {
    return {
      accountId: "VOID",
      status: "VOID",
      currency: "VOID",
      balance: 0,
    };
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

    this.#state = this.#reducer.reduce([event], this.#state).state;

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

    this.#state = this.#reducer.reduce([event], this.#state).state;
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

    this.#state = this.#reducer.reduce([event], this.#state).state;

    return event;
  }

  getState() {
    return this.#state;
  }
}
