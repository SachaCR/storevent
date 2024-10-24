# Storevent

Storevent is a framework that simplify event sourcing. It provides different packages that helps you build your event store.

[@storevent/storevent](https://github.com/SachaCR/storevent/tree/main/packages/storevent): This packages provides interfaces that you can use to build custom implementations for your event store.
It contains also a basic `in memory` implementation that you can use in your unit tests.

# Example

You'll find an [example](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account) entity named `Account` with implementations for:

- [event store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accoutEventStore.ts)
- [snapshot store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accoutSnapshotStore.ts)
- [hybrid store](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accoutHybridStore.ts)
- [entity reducer](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/accoutReducer.ts)
- [entity'events and state](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/interfaces.ts)
- [entity concrete implementation](https://github.com/SachaCR/storevent/tree/main/packages/examples/src/account/index.ts)

# Storevent Postgres (Work In Progress)

[@storevent/storevent-pg](https://github.com/SachaCR/storevent/tree/main/packages/storevent-pg): Provides a basic Postgres implementation.

# Storevent Mongo DB (To Do)
`@storevent/storevent-mongo`: Provide a basic Mongo DB implementation (Not started yet)


