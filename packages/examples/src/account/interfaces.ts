import { JsonSerializable, BasicEvent } from "@storevent/storevent";

export type AccountEvent = AccountCreated | AccountCredited | AccountDebited;

export interface AccountCreated extends BasicEvent {
  name: "AccountCreated";
  payload: {
    holderName: string;
    accountId: string;
    status: "OPEN" | "CLOSED";
    balance: number;
    currency: string;
  };
}

export interface AccountCredited extends BasicEvent {
  name: "AccountCredited";
  payload: {
    amount: number;
    currency: string;
  };
}

export interface AccountDebited extends BasicEvent {
  name: "AccountDebited";
  payload: {
    amount: number;
    currency: string;
  };
}

export interface AccountState extends JsonSerializable {
  holderName: string;
  accountId: string;
  status: "OPEN" | "CLOSED";
  balance: number;
  currency: string;
}
