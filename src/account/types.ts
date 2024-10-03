import { DomainEvent } from "../eventStore";

export interface AccountCreated extends DomainEvent {
  name: "AccountCreated";
  payload: {
    accountId: string;
    status: "VOID" | "OPEN";
    balance: number;
    currency: string;
  };
}

export interface AccountCredited extends DomainEvent {
  name: "AccountCredited";
  payload: {
    amount: number;
    currency: string;
  };
}

export interface AccountDebited extends DomainEvent {
  name: "AccountDebited";
  payload: {
    amount: number;
    currency: string;
  };
}

export type AccountEvent = AccountCreated | AccountCredited | AccountDebited;

export interface AccountState {
  accountId: string;
  status: "VOID" | "OPEN";
  balance: number;
  currency: string;
}
