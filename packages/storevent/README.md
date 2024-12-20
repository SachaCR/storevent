# Storevent

Storevent is a framework that simplify event sourcing. It makes it easy to build an entity reducer to aggregate your events into a state.

This package `@storevent/stovevent` provides interfaces that you can use to build custom implementation for your event store.

You can also decide to use a packages that provides an implementation for Postgres, MongoDB, etc.... See [Available Packages List](#available-implementations)

# Documentation
📕 [Types Documentation Here](https://sachacr.github.io/storevent/storevent/index.html) 📕

# Examples

Storevent provides examples that takes the case of an entity `Account` that represents a simple bank account. It can be created, credited with some money or debited. Each of these action produce an event: `AccountCreated`, `AccountCredited`, `AccountDebited`.

See [Account Example Here](https://github.com/SachaCR/storevent/tree/main/packages/examples)

Example shows:
- How to create your:
  - Entity Events
  - Entity State
  - Entity Reducer that will calculate your entity state from your events.

- How to use the In Memory implementation:
  - event store
  - snaphshot store
  - hybrid store

- How to use the Postgres implementation:
  - event store
  - snaphshot store
  - hybrid store

# Event

To create your events you just need to extends the `BasicEvent` interface.

```typescript
import { BasicEvent } from "@storevent/storevent";

type AccountEvent = AccountCreated | AccountCredited | AccountDebited;

interface AccountCreated extends BasicEvent {
  name: "AccountCreated";
  payload: {
    accountId: string;
    holderName: string;
    status: "OPEN";
    balance: number;
    currency: string;
  };
}

interface AccountCredited extends BasicEvent { ... }
interface AccountDebited extends BasicEvent { ... }
```

# Entity State

Your entity state just need to extends `JsonSerializable` type.

```typescript
import { JsonSerializable } from "@storevent/storevent";

interface AccountState extends JsonSerializable {
  accountId: string;
  holderName: string;
  status: "CLOSED" | "OPEN";
  balance: number;
  currency: string;
}
```

# Entity Reducer
The entity reducer is the component that calculates the state of your entity. For this it takes an `initial state` and a list of `event` to apply on top of this state.

To create an entity reducer you just need to extends the `EntityReducer` class. Then mount your event reducers using the `mountEventReducer` method.


## Reducer Declaration
```typescript
import { AccountEvent, AccountState } from "../AccountEntity";

class AccountReducer extends EntityReducer<AccountState, AccountEvent> {
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
    holderName: state.holderName,
    accountId: state.accountId,
    balance: state.balance + event.payload.amount,
    currency: state.currency,
    status: state.status,
  };
}

function applyAccountDebitedEvent() { ... }

function applyAccountCreatedEvent() { ... }
```

## Reducer Usage

```typescript
const initialState = { ... }

const events: AccountEvent[] = [ accountCreated, accountCredited, accountDebited, ...]

const newState = new AccountReducer().reduceEvents({
  state: initialState,
  stateVersion: 0,
  events,
});
```

# Event Store Interface

The event store interface provides an interface to append new events in your event store and a method to retrieve your events. You can also subscribe to notifications to trigger a callback when new events are appended to the store.

```typescript
const accountEventStore = new AccountInMemoryEventStore()

// Appending events
await accountEventStore.append({
  entityId: accountId,
  events: [accountCreatedEvent],
});

// Retrieve all events
const events = await accountEventStore.getEventsFromOffset({
  entityId: accountId,
});

// Retrieve event from a given offset
const events = await accountEventStore.getEventsFromOffset({
  entityId: accountId,
  offset: 45, // optional default to 0
});

// Register a listener to be notified when new events are appended.
accountEventStore.onEventAppended((notification) => {
  notification.entityName;
  notification.entityId;
  notification.events;
});
```

# Advanced Event Store Interface

The `AdvanceEventStore` interface is here to allow saving your entity events and also persist a snapshot in a transactionnal way. It provide the same methods as `EventStore`. The only difference is the `appendWithSnapshot` method that take a snaphost and an array of events.

```typescript
const snapshotToSave = {
  state: { content: 'My entity state' },
  version: 349
}

await myAdvanceEventStore.appendWithSnapshot({
  entityId,
  events: [eventA, eventB],
  snapshot: snapshotToSave,
  appendAfterOffset: 347
});

// Register a listener to be notified when new events are appended.
myAdvanceEventStore.onEventAppended((notification) => {
  notification.entityName;
  notification.entityId;
  notification.events;
});
```

You can check this for more details [Account Example Here](https://github.com/SachaCR/storevent/tree/main/packages/examples)

# Implement a custom store

You can implement your own event, snapshot and hybrid store. For this just implement `@storevent/storevent` interfaces. You are of course free to enrich those interfaces with some specific methods related to your project.

See [examples](#examples) section to see how in memory, postgres and mongodb implementation are made.

# Available implementations

- [@storevent/storevent-memory](https://www.npmjs.com/package/@storevent/storevent-memory): Provides a basic in memory implementation. Helpful  for your unit tests.

- [@storevent/storevent-pg](https://www.npmjs.com/package/@storevent/storevent-pg): Provides a basic Postgres implementation. (work in progress)

- [@storevent/storevent-mongo](): Provide a basic Mongo DB implementation. (Not started yet)

# Storevent Error

Storevent implementations will always try to throw a `StoreventError`.

## Properties
A `StoreventError` has the following properties:

- `name`: equals to `StoreventError`.

- `code`: Unique storevent error code.

- `details`: Generic type that contains the error context. You can discriminate the type with the `error.code`.

- `cause`: Original error object if the error is wrapped. Mostly used when the error comes from the underlying layer (postgres, mongo, etc...)

## Specific errors
- `ConcurrencyError`: Use this error in your implementation to prevent events from being appended concurrently for the same entity.
- `WrongOffsetError`: Use this error in your implementation when you detect inconsistency in your event offset.
- `UnknownReducerError`: This error is thrown when an `EntityReducer` cannot find a reducer for a given event name.



