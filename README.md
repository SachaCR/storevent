# Storevent

Storevent is a framework that simplify event sourcing.

This base package `@storevent/stovevent` provides interfaces that you can use to build custom implementation for your event store. It contains an basic `in memory` implementation that you can use in your unit tests.

Secondary packages provides concrete implementations for different database engines:

- `@storevent/storevent-pg`: Provide a very basic Postgres implementation (Work In Progress)

- `@storevent/storevent-pg`: Provide a basic Mongo DB implementation (Not started yet)

# See an example here:

https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account

## Event store
```typescript
import { InMemoryEventStore } from "@storevent/storevent";
import { PGEventStore } from "@storevent/storevent-pg";

import { AccountEvent } from "./interfaces";

// In Memory store
export class AccountEventStore extends InMemoryEventStore<AccountEvent> {
  constructor() {
    super("Account");
  }
}

// Postgres store
export class AccountPGEventStore extends PGEventStore<AccountEvent> {
  constructor(configuration: {
    database: {
      host: string;
      name: string;
      password: string;
      port: number;
      user: string;
    };
  }) {
    super({
      database: configuration.database,
      entityName: "Account",
      tableName: "account_events",
    });
  }
}
```

## Event Reducer
```typescript
export class AccountReducer extends EntityReducer<AccountState, AccountEvent> {
  constructor() {
    super("Account");

    this.mountEventReducer("AccountCreated", applyAccountCreatedEvent);
    this.mountEventReducer("AccountCredited", applyAccountCreditedEvent);
    this.mountEventReducer("AccountDebited", applyAccountDebitedEvent);
  }
}
```
