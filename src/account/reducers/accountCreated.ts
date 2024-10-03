import { AccountCreated, AccountState } from "../types";

export function applyAccountCreatedEvent(event: AccountCreated): AccountState {
  return {
    accountId: event.payload.accountId,
    balance: event.payload.balance,
    currency: event.payload.currency,
    status: event.payload.status,
  };
}
