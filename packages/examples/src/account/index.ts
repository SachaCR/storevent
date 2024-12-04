import { AccountReducer } from "./accountReducer";
import {
  AccountCreated,
  AccountCredited,
  AccountDebited,
  AccountEvent,
  AccountState,
} from "./interfaces";

export * from "./interfaces";
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
      holderName: "",
      accountId: "",
      status: "OPEN",
      currency: "",
      balance: 0,
    };
  }

  #updateState(event: AccountEvent) {
    const newState = this.#reducer.reduceEvents({
      events: [event],
      state: this.#state,
      stateVersion: this.#version,
    });

    this.#state = newState.state;
    this.#version = newState.version;
  }

  create(params: {
    holderName: string;
    accountId: string;
    currency: "EUR" | "USD";
  }): AccountCreated {
    const { accountId, currency, holderName } = params;

    const event: AccountCreated = {
      name: "AccountCreated",
      payload: {
        accountId,
        holderName,
        status: "OPEN",
        currency,
        balance: 0,
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
    // If the version is 0, it means there was no events on this entity.
    // the state is the initial empty state.
    // We don't want to return it as the entity has not been created yet.
    // We prefer to throw rather than return undefined or empty state that could cause bugs.
    if (this.#version === 0) {
      throw new Error(
        "Entity not initialized, please use the account.create() method to set the state.",
      );
    }

    return structuredClone(this.#state);
  }

  getVersion() {
    return this.#version;
  }
}
