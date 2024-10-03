import { AccountCredited, AccountState } from "../types";

export function applyAccountCreditedEvent(
  currentState: AccountState,
  event: AccountCredited,
): AccountState {
  return {
    accountId: currentState.accountId,
    balance: currentState.balance + event.payload.amount,
    currency: currentState.currency,
    status: currentState.status,
  };
}
