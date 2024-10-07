import {
  Account,
  AccountEventStore,
  AccountReducer,
  AccountSnapshotStore,
} from "..";
import { AccountCreated, AccountCredited, AccountDebited } from "../interfaces";

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
    expect(events.lastEventSequenceNumber).toStrictEqual(0);
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

    const accountState = new AccountReducer().reduce({
      events: accountEvents.events,
    });
    const account = new Account(accountState.state);

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

    expect(accountEventList.lastEventSequenceNumber).toStrictEqual(2);

    const newState = new AccountReducer().reduce({
      events: accountEventList.events,
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

    const accountState = new AccountReducer().reduce({
      events: accountEvents.events,
    });

    const account = new Account(accountState.state);
    const accountInParalllel = new Account(accountState.state);

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
        appendAfterSequenceNumber: 0,
      },
    );

    await expect(
      accountEventStore.append(
        { entityId: accountId, events: [creditEventInParallel] },
        {
          appendAfterSequenceNumber: 0,
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

    const result = new AccountReducer().reduce({
      events: [accountCreatedEvent, accountCreditedEvent],
    });

    const accountState = result.state;
    const accountSequence = result.sequence;

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: accountState,
      sequence: accountSequence,
    });

    const snapshot1 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot1.state).toStrictEqual(accountState);
    expect(snapshot1.sequence).toStrictEqual(accountSequence);

    const accountDebitedEvent: AccountDebited = {
      name: "AccountDebited",
      payload: { amount: 12, currency: "EUR" },
    };

    const newAccountState = new AccountReducer().reduce({
      events: [accountDebitedEvent],
      state: accountState,
      stateSequence: accountSequence,
    });

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: newAccountState.state,
      sequence: newAccountState.sequence,
    });

    const snapshot2 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot2.state).toStrictEqual(newAccountState.state);
    expect(snapshot2.sequence).toStrictEqual(newAccountState.sequence);

    const snapshotFound = await accountSnapshotStore.getSnapshot({
      entityId: accountId,
      sequence: accountSequence,
    });

    if (snapshotFound === undefined) {
      throw new Error("Snapshot not found");
    }

    expect(snapshotFound).toBeDefined();
    expect(snapshotFound.state).toStrictEqual(accountState);
    expect(snapshotFound.sequence).toStrictEqual(accountSequence);
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

    const result = new AccountReducer().reduce({
      events: [accountCreatedEvent, accountCreditedEvent],
    });

    const accountState = result.state;
    const accountSequence = result.sequence;

    await accountSnapshotStore.saveSnapshot({
      entityId: accountId,
      snapshot: accountState,
      sequence: accountSequence,
    });

    const snapshot1 = await accountSnapshotStore.getLastSnapshot(accountId);

    expect(snapshot1.state).toStrictEqual(accountState);
    expect(snapshot1.sequence).toStrictEqual(accountSequence);

    const undefinedSnapshot = await accountSnapshotStore.getSnapshot({
      entityId: accountId,
      sequence: 34,
    });

    expect(undefinedSnapshot).toBeUndefined();
  });
});
