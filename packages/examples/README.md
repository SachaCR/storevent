# Storevent Example

![test](https://github.com/SachaCR/dyal/actions/workflows/test.yml/badge.svg)

This package is just a collection of examples to help you understand how you can use and leverage `storevent` packages to build your event sourcing.

The first example simulate a basic bank account entity that emits 3 different events:  `AccountCreated`, `AccountCredited`, `AccountDebited`.

You'll find in this repo an implementation using the `storevent-memory` package and another one using the `storevent-pg` packages.
You'll also discover how you could implement the `Account` entity using a class. Obviously this is not mandatory and you can implement your entities as you like.
