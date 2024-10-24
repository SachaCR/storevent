# Storevent

Storevent is a framework that simplify event sourcing.

This base package `@storevent/stovevent` provides interfaces that you can use to build custom implementation for your event store. It contains an basic `InMemoryEventStore` implementation that you can use in your unit tests.

# Example

You'll find an [example](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account) entity named `Account` with implementations for:

- [event store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accountEventStore.ts)
- [snapshot store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accountSnapshotStore.ts)
- [hybrid store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accountHybridStore.ts)
- [entity reducer](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accountReducer.ts)
- [entity's events and state](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/interfaces.ts)
- [entity concrete implementation](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/index.ts)

## Declaring your events and state

To create your events you just need to extends the `Storevent` interface.

```typescript
import { JsonSerializable, Storevent } from "@storevent/storevent";

export type AccountEvent = AccountCreated | AccountCredited | AccountDebited;

export interface AccountCreated extends Storevent {
  name: "AccountCreated";
  payload: {
    accountId: string;
    status: "OPEN";
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
```

## Build an event store

All you have to do to create an event store is to extends the store of your choice (in memory, postgres, etc...) with your event type (here `AccountEvent`) and your entity name (`Account`).

```typescript
import { InMemoryEventStore } from "@storevent/storevent";
import { AccountEvent } from "./interfaces";

export class AccountEventStore extends InMemoryEventStore<AccountEvent> {
  constructor() {
    super("Account");
  }
}
```

## Entity Reducer
The event reducer is the component that calculates the state of your entity. For this it takes an `initial state` and a list of event to apply to this state.

To create an entity reducer you just need to extends the `EntityReducer` class. Then mount your event reducers using `mountEventReducer`.

```typescript
import { AccountCredited, AccountState } from "../interfaces";

export class AccountReducer extends EntityReducer<AccountState, AccountEvent> {
  constructor() {
    super("Account");

    this.mountEventReducer("AccountCreated", applyAccountCreatedEvent);
    this.mountEventReducer("AccountCredited", applyAccountCreditedEvent);
    this.mountEventReducer("AccountDebited", applyAccountDebitedEvent);
  }
}

function applyAccountCreditedEvent(params: {
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

function applyAccountDebitedEvent() { ... }

function applyAccountCreatedEvent() { ... }
```

## Snapshot store

Sometime you may want to store `snapshot` of your state to avoid reprocessing the ful list of event everytime. Storevent provides an interface `SnapshotStore` to help you achive this.

This section is not fully documented yet but you can still see an example [here](https://github.com/SachaCR/storevent/tree/main/packages/examples):

## Hybrid store

Sometime you may want to save your events and a snapshot in the same transaction. Storevent provides an interface `HybridStore` to help you achieve this.

This section is not fully documented yet but you can still see an example [here](https://github.com/SachaCR/storevent/tree/main/packages/examples):
