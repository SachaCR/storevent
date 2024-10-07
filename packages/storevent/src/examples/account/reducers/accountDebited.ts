import { AccountDebited, AccountState } from "../interfaces";

export function applyAccountDebitedEvent(params: {
  currentState: AccountState;
  event: AccountDebited;
}): AccountState {
  const { currentState, event } = params;

  return {
    accountId: currentState.accountId,
    balance: currentState.balance - event.payload.amount,
    currency: currentState.currency,
    status: currentState.status,
  };
}
