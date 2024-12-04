import config from "config";
import { randomUUID } from "crypto";

import { PGEventStoreConfiguration } from "@storevent/storevent-pg";

import { Account } from "..";
import { AccountReducer } from "../accountReducer";
import { AccountCreated, AccountCredited } from "..";

import { AccountInMemoryEventStore } from "../in-memory/accountEventStore";
import { AccountInMemoryAdvancedEventStore } from "../in-memory/accountAdvancedEventStore";

import { AccountPGEventStore } from "../postgres/accountEventStore";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

const pgEventStore = new AccountPGEventStore({ database: DATABASE_CONFIG });

type EventStoreToTest =
  | {
      type: "in-memory";
      store: AccountInMemoryEventStore;
    }
  | {
      type: "postgres";
      store: AccountPGEventStore;
    };

const storesToTest: EventStoreToTest[] = [
  { type: "in-memory", store: new AccountInMemoryEventStore() },
  { type: "postgres", store: pgEventStore },
];

describe.each(storesToTest)(`Component AccountEventStore`, (storeToTest) => {
  describe(`With a ${storeToTest.type} AccountEventStore`, () => {
    beforeAll(async () => {
      if (storeToTest.type === "postgres") {
        await storeToTest.store.initTable();
      }
    });

    afterAll(async () => {
      if (storeToTest.type === "postgres") {
        await storeToTest.store.pgPool.end();
      }
    });

    test("Open an account ", async () => {
      const accountId = randomUUID();
      const currency = "EUR";
      const holderName = "John Doe";

      const accountEventStore = storeToTest.store;

      const account = new Account();
      const accountCreatedEvent = account.create({
        accountId,
        currency,
        holderName,
      });

      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const events = await accountEventStore.getEventsFromOffset({
        entityId: accountId,
        offset: 0,
      });

      expect(events.events.length).toStrictEqual(1);
      expect(events.events[0]).toStrictEqual({
        name: "AccountCreated",
        payload: {
          accountId,
          status: "OPEN",
          holderName: "John Doe",
          currency: "EUR",
          balance: 0,
        },
      });
      expect(events.lastEventOffset).toStrictEqual(1);
    });

    test("Credit then debit an account ", async () => {
      const accountId = randomUUID();
      const currency = "EUR";
      const holderName = "John Doe";
      const accountEventStore = storeToTest.store;

      const accountCreatedEvent = new Account().create({
        accountId,
        currency,
        holderName,
      });
      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const accountEvents = await accountEventStore.getEventsFromOffset({
        entityId: accountId,
        offset: 0,
      });

      expect(accountEvents.events.length).toStrictEqual(1);
      expect(accountEvents.events[0].name).toStrictEqual("AccountCreated");

      const accountState = new AccountReducer().reduceEvents({
        state: Account.initialState(),
        stateVersion: 0,
        events: accountEvents.events,
      });

      const account = new Account({
        state: accountState.state,
        version: accountState.version,
      });

      const creditEvent = account.credit({
        amount: 123,
        currency: "EUR",
      });

      expect(account.getState()).toEqual({
        accountId,
        balance: 123,
        holderName: "John Doe",
        currency: "EUR",
        status: "OPEN",
      });

      const debitEvent = account.debit({
        amount: 13,
        currency: "EUR",
      });

      expect(account.getState()).toEqual({
        accountId,
        balance: 110,
        holderName: "John Doe",
        currency: "EUR",
        status: "OPEN",
      });

      await accountEventStore.append({
        entityId: accountId,
        events: [creditEvent, debitEvent],
      });

      const accountEventList = await accountEventStore.getEventsFromOffset({
        entityId: accountId,
        offset: 0,
      });

      expect(accountEventList.events.length).toStrictEqual(3);
      expect(accountEventList.events.map((event) => event.name)).toStrictEqual([
        "AccountCreated",
        "AccountCredited",
        "AccountDebited",
      ]);

      expect(accountEventList.lastEventOffset).toStrictEqual(3);

      const newState = new AccountReducer().reduceEvents({
        events: accountEventList.events,
        state: Account.initialState(),
        stateVersion: 0,
      });

      expect(newState.state).toEqual(account.getState());
    });

    test("Detect concurrency", async () => {
      const accountId = randomUUID();
      const currency = "EUR";
      const holderName = "John Doe";
      const accountEventStore = storeToTest.store;

      const accountCreatedEvent = new Account().create({
        accountId,
        currency,
        holderName,
      });
      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const accountEvents = await accountEventStore.getEventsFromOffset({
        entityId: accountId,
      });

      expect(accountEvents.events.length).toStrictEqual(1);
      expect(accountEvents.events[0].name).toStrictEqual("AccountCreated");

      const accountState = new AccountReducer().reduceEvents({
        events: accountEvents.events,
        state: Account.initialState(),
        stateVersion: 0,
      });

      const account = new Account(accountState);
      const accountInParalllel = new Account(accountState);

      const creditEvent = account.credit({
        amount: 123,
        currency: "EUR",
      });

      const creditEventInParallel = accountInParalllel.credit({
        amount: 12,
        currency: "EUR",
      });

      await accountEventStore.append({
        entityId: accountId,
        events: [creditEvent],
        appendAfterOffset: 1,
      });

      await expect(
        accountEventStore.append({
          entityId: accountId,
          events: [creditEventInParallel],
          appendAfterOffset: 1,
        }),
      ).rejects.toThrow(
        "Wrong offset error: event must be appended with a continuous offset number 1",
      );
    });
  });
});

describe("Component AccountInMemoryAdvancedEventStore", () => {
  const accountAdvancedEventStore = new AccountInMemoryAdvancedEventStore();

  test("Store and retrieve snapshots", async () => {
    const accountId = "1234";
    const accountCreatedEvent: AccountCreated = {
      name: "AccountCreated",
      payload: {
        holderName: "John Doe",
        accountId,
        status: "OPEN",
        currency: "EUR",
        balance: 0,
      },
    };

    const accountCreditedEvent: AccountCredited = {
      name: "AccountCredited",
      payload: { amount: 123, currency: "EUR" },
    };

    const result = new AccountReducer().reduceEvents({
      events: [accountCreatedEvent, accountCreditedEvent],
      state: Account.initialState(),
      stateVersion: 0,
    });

    const accountState = result.state;
    const accountVersion = result.version;

    await accountAdvancedEventStore.saveSnapshot({
      entityId: accountId,
      snapshot: accountState,
      version: accountVersion,
    });

    const snapshot1 =
      await accountAdvancedEventStore.getLastSnapshot(accountId);

    if (snapshot1 === undefined) {
      throw new Error("Snapshot1 not found");
    }

    expect(snapshot1.state).toStrictEqual(accountState);
    expect(snapshot1.version).toStrictEqual(accountVersion);

    const undefinedSnapshot = await accountAdvancedEventStore.getSnapshot({
      entityId: accountId,
      version: 34,
    });

    expect(undefinedSnapshot).toBeUndefined();
  });
});
