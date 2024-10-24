# Storevent

![test](https://github.com/SachaCR/dyal/actions/workflows/test.yml/badge.svg)

Storevent is a framework that simplify event sourcing. It makes it easy to build an entity reducer to aggregate your events into a state. It also provides different interfaces and packages that helps you build your event store.

The base package `@storevent/stovevent` provides interfaces that you can use to build custom implementation for your event store.

You can also decide to use a packages that provides an implementation for Postgres, MongoDB, etc.... See [Available Packages List](https://github.com/SachaCR/storevent/tree/main/packages/storevent#available-implementations)

# Documentation

See [@storevent/storevent](https://github.com/SachaCR/storevent/tree/main/packages/storevent)

# Examples

[Examples Here](https://github.com/SachaCR/storevent/tree/main/packages/examples)

# Roadmap:

Todo list:

IN PROGRESS:
- [ ] Finish postgres implementation testing

DONE:
- [x] Implement a writeMode option (APPEND or COMPACT) on snapshot store
- [x] Publish storevent package
- [x] Publish storevent-pg package
- [x] Publish storevent-memory package

BACKLOG:
- [ ] Remove test files from build with a separate tsconfig.
- [ ] Provide better documentation and tutorials
- [ ] Start implementing for Mongo DB

