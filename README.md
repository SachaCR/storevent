# Storevent

Storevent is a framework that simplify event sourcing. It provides different packages that helps you build your event store.

[@storevent/storevent](https://github.com/SachaCR/storevent/tree/main/packages/storevent): This packages provides interfaces that you can use to build custom implementations for your event store.
It contains also a basic `in memory` implementation that you can use in your unit tests.

# Storevent Postgres (Work In Progress)

[@storevent/storevent-pg](https://github.com/SachaCR/storevent/tree/main/packages/storevent-pg): Provides a basic Postgres implementation.

# Storevent Mongo DB (To Do)
`@storevent/storevent-mongo`: Provide a basic Mongo DB implementation (Not started yet)


# Roadmap:

Todo list:

- Remove test files from build with a separate tsconfig.
- Finish postgres implementation testing
- Publish storevent-pg package
- Provide better documentation and tutorials
- Implement a writeMode option (APPEND or COMPACT) on snapshot store
- Start implementing for Mongo DB
