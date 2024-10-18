import config from "config";
import { PGEventStoreConfiguration } from "@storevent/storevent-pg";

import {
  Account,
  AccountEventStore,
  AccountHybridStore,
  AccountPGEventStore,
  AccountSnapshotStore,
} from "..";
import { AccountReducer } from "../accountReducer";
import { AccountCreated, AccountCredited, AccountDebited } from "..";
import { randomUUID } from "crypto";

const DATABASE_CONFIG =
  config.get<PGEventStoreConfiguration["database"]>("database");

const pgEventStore = new AccountPGEventStore({ database: DATABASE_CONFIG });

type EventStoreToTest =
  | {
      type: "in-memory";
      store: AccountEventStore;
    }
  | {
      type: "postgres";
      store: AccountPGEventStore;
    };

const storesToTest: EventStoreToTest[] = [
  { type: "in-memory", store: new AccountEventStore() },
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
        await storeToTest.store.stop();
      }
    });

    test("Open an account ", async () => {
      const accountId = randomUUID();
      const accountEventStore = storeToTest.store;

      const account = new Account();
      const accountCreatedEvent = account.open({ accountId });

      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const events = await accountEventStore.getEventsFromSequenceNumber({
        entityId: accountId,
        sequenceNumber: 0,
      });

      expect(events.events.length).toStrictEqual(1);
      expect(events.events[0]).toStrictEqual({
        name: "AccountCreated",
        payload: {
          accountId,
          status: "OPEN",
          currency: "EUR",
          balance: 0,
        },
      });
      expect(events.lastEventSequenceNumber).toStrictEqual(1);
    });

    test("Credit then debit an account ", async () => {
      const accountId = randomUUID();
      const accountEventStore = storeToTest.store;

      const accountCreatedEvent = new Account().open({ accountId });
      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const accountEvents = await accountEventStore.getEventsFromSequenceNumber(
        {
          entityId: accountId,
          sequenceNumber: 0,
        },
      );

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

      expect(account.getState()).toStrictEqual({
        accountId: accountId,
        balance: 123,
        currency: "EUR",
        status: "OPEN",
      });

      const debitEvent = account.debit({
        amount: 13,
        currency: "EUR",
      });

      expect(account.getState()).toStrictEqual({
        accountId: accountId,
        balance: 110,
        currency: "EUR",
        status: "OPEN",
      });

      await accountEventStore.append({
        entityId: accountId,
        events: [creditEvent, debitEvent],
      });

      const accountEventList =
        await accountEventStore.getEventsFromSequenceNumber({
          entityId: accountId,
          sequenceNumber: 0,
        });

      expect(accountEventList.events.length).toStrictEqual(3);
      expect(accountEventList.events.map((event) => event.name)).toStrictEqual([
        "AccountCreated",
        "AccountCredited",
        "AccountDebited",
      ]);

      expect(accountEventList.lastEventSequenceNumber).toStrictEqual(3);

      const newState = new AccountReducer().reduceEvents({
        events: accountEventList.events,
        state: Account.initialState(),
        stateVersion: 0,
      });

      expect(newState.state).toStrictEqual(account.getState());
    });

    test("Detect concurrency", async () => {
      const accountId = randomUUID();
      const accountEventStore = storeToTest.store;

      const accountCreatedEvent = new Account().open({ accountId });
      await accountEventStore.append({
        entityId: accountId,
        events: [accountCreatedEvent],
      });

      const accountEvents = await accountEventStore.getEventsFromSequenceNumber(
        {
          entityId: accountId,
        },
      );

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

      await accountEventStore.append(
        { entityId: accountId, events: [creditEvent] },
        {
          appendAfterSequenceNumber: 1,
        },
      );

      await expect(
        accountEventStore.append(
          { entityId: accountId, events: [creditEventInParallel] },
          {
            appendAfterSequenceNumber: 1,
          },
        ),
      ).rejects.toThrow(
        "Wrong sequence error: event must be appended with a continuous sequence number 1",
      );
    });
  });
});

describe("Component AccountSnapshotStore", () => {
  const accountSnapshotStore = new AccountSnapshotStore();

  test("Store and retrieve snapshots", async () => {
    const accountId = randomUUID();
    const accountCreatedEvent: AccountCreated = {
      name: "AccountCreated",
      payload: {
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

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: accountState,
      version: accountVersion,
    });

    const snapshot1 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot1.state).toStrictEqual(accountState);
    expect(snapshot1.version).toStrictEqual(accountVersion);

    const accountDebitedEvent: AccountDebited = {
      name: "AccountDebited",
      payload: { amount: 12, currency: "EUR" },
    };

    const newAccountState = new AccountReducer().reduceEvents({
      events: [accountDebitedEvent],
      state: accountState,
      stateVersion: accountVersion,
    });

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: newAccountState.state,
      version: newAccountState.version,
    });

    const snapshot2 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot2.state).toStrictEqual(newAccountState.state);
    expect(snapshot2.version).toStrictEqual(newAccountState.version);

    const snapshotFound = await accountSnapshotStore.getSnapshot({
      entityId: accountId,
      version: accountVersion,
    });

    if (snapshotFound === undefined) {
      throw new Error("Snapshot not found");
    }

    expect(snapshotFound).toBeDefined();
    expect(snapshotFound.state).toStrictEqual(accountState);
    expect(snapshotFound.version).toStrictEqual(accountVersion);
  });
});

describe("Component AccountHybridStore", () => {
  const accountSnapshotStore = new AccountHybridStore();

  test("Store and retrieve snapshots", async () => {
    const accountId = "1234";
    const accountCreatedEvent: AccountCreated = {
      name: "AccountCreated",
      payload: {
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

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: accountState,
      version: accountVersion,
    });

    const snapshot1 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot1.state).toStrictEqual(accountState);
    expect(snapshot1.version).toStrictEqual(accountVersion);

    const undefinedSnapshot = await accountSnapshotStore.getSnapshot({
      entityId: accountId,
      version: 34,
    });

    expect(undefinedSnapshot).toBeUndefined();
  });
});
