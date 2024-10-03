import { AccountDebited, AccountState } from "../types";

export function applyAccountDebitedEvent(
  currentState: AccountState,
  event: AccountDebited,
): AccountState {
  return {
    accountId: currentState.accountId,
    balance: currentState.balance - event.payload.amount,
    currency: currentState.currency,
    status: currentState.status,
  };
}
