import { JsonSerializable, Storevent } from "@storevent/storevent";

export type AccountEvent = AccountCreated | AccountCredited | AccountDebited;

export interface AccountCreated extends Storevent {
  name: "AccountCreated";
  payload: {
    accountId: string;
    status: "VOID" | "OPEN";
    balance: number;
    currency: string;
  };
}

export interface AccountCredited extends Storevent {
  name: "AccountCredited";
  payload: {
    amount: number;
    currency: string;
  };
}

export interface AccountDebited extends Storevent {
  name: "AccountDebited";
  payload: {
    amount: number;
    currency: string;
  };
}

export interface AccountState extends JsonSerializable {
  accountId: string;
  status: "VOID" | "OPEN";
  balance: number;
  currency: string;
}
