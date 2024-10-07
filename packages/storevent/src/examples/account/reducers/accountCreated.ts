import { AccountCreated, AccountState } from "../interfaces";

export function applyAccountCreatedEvent(params: {
  event: AccountCreated;
  state: AccountState;
}): AccountState {
  const event = params.event;

  return {
    accountId: event.payload.accountId,
    balance: event.payload.balance,
    currency: event.payload.currency,
    status: event.payload.status,
  };
}
