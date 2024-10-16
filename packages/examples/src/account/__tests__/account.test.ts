import {
  Account,
  AccountEventStore,
  AccountHybridStore,
  AccountSnapshotStore,
} from "..";
import { AccountReducer } from "../accountReducer";
import { AccountCreated, AccountCredited, AccountDebited } from "..";

describe("Component Account", () => {
  test("Open an account ", async () => {
    const accountEventStore = new AccountEventStore();
    const accountId = "123";

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
        accountId: "123",
        status: "OPEN",
        currency: "EUR",
        balance: 0,
      },
    });
    expect(events.lastEventSequenceNumber).toStrictEqual(1);
  });
});

describe("Component Account", () => {
  test("Credit then debit an account ", async () => {
    const accountEventStore = new AccountEventStore();
    const accountId = "123";

    const accountCreatedEvent = new Account().open({ accountId });
    await accountEventStore.append({
      entityId: accountId,
      events: [accountCreatedEvent],
    });

    const accountEvents = await accountEventStore.getEventsFromSequenceNumber({
      entityId: accountId,
      sequenceNumber: 0,
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

    expect(account.getState()).toStrictEqual({
      accountId: "123",
      balance: 123,
      currency: "EUR",
      status: "OPEN",
    });

    const debitEvent = account.debit({
      amount: 13,
      currency: "EUR",
    });

    expect(account.getState()).toStrictEqual({
      accountId: "123",
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
});

describe("Component Account", () => {
  test("Detect concurrency", async () => {
    const accountEventStore = new AccountEventStore();
    const accountId = "123";

    const accountCreatedEvent = new Account().open({ accountId });
    await accountEventStore.append({
      entityId: accountId,
      events: [accountCreatedEvent],
    });

    const accountEvents = await accountEventStore.getEventsFromSequenceNumber({
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
    ).rejects.toThrow("Concurrency error");
  });
});

describe("Component AccountSnapshotStore", () => {
  const accountSnapshotStore = new AccountSnapshotStore();

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
