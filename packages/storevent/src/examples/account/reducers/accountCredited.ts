import { AccountCredited, AccountState } from "../interfaces";

export function applyAccountCreditedEvent(params: {
  currentState: AccountState;
  event: AccountCredited;
}): AccountState {
  const { currentState, event } = params;

  return {
    accountId: currentState.accountId,
    balance: currentState.balance + event.payload.amount,
    currency: currentState.currency,
    status: currentState.status,
  };
}
