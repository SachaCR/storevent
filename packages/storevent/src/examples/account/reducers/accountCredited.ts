import { AccountCredited, AccountState } from "../interfaces";

export function applyAccountCreditedEvent(params: {
  state: AccountState;
  event: AccountCredited;
}): AccountState {
  const { state, event } = params;

  return {
    accountId: state.accountId,
    balance: state.balance + event.payload.amount,
    currency: state.currency,
    status: state.status,
  };
}
