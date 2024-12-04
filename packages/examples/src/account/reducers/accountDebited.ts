import { AccountDebited, AccountState } from "../interfaces";

export function applyAccountDebitedEvent(params: {
  state: AccountState;
  event: AccountDebited;
}): AccountState {
  const { state, event } = params;

  return {
    holderName: state.holderName,
    accountId: state.accountId,
    balance: state.balance - event.payload.amount,
    currency: state.currency,
    status: state.status,
  };
}
