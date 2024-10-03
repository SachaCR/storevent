import { AccountEventStore } from "../eventStore/accountEventStore";
import { AccountReducer } from "../account/reducers";
import { Account } from "../account";

describe("Component Account", () => {
  test("Open an account ", async () => {
    const accountEventStore = new AccountEventStore();
    const accountId = "123";

    const account = new Account();
    const accountCreatedEvent = account.open({ accountId });

    await accountEventStore.append([accountCreatedEvent]);

    const events = await accountEventStore.getEventsFromSequence({
      entityId: accountId,
      sequence: 0,
    });

    expect(events.events.length).toStrictEqual(1);
    expect(events.events[0]).toStrictEqual({
      entityId: "123",
      name: "AccountCreated",
      payload: {
        accountId: "123",
        status: "OPEN",
        currency: "EUR",
        balance: 0,
      },
    });
    expect(events.lastSequence).toStrictEqual(0);
  });
});

describe("Component Account", () => {
  test("Credit then debit an account ", async () => {
    const accountEventStore = new AccountEventStore();
    const accountId = "123";

    const accountCreatedEvent = new Account().open({ accountId });
    await accountEventStore.append([accountCreatedEvent]);

    const accountEvents = await accountEventStore.getEventsFromSequence({
      entityId: accountId,
      sequence: 0,
    });

    expect(accountEvents.events.length).toStrictEqual(1);
    expect(accountEvents.events[0].name).toStrictEqual("AccountCreated");

    const accountState = new AccountReducer().reduce(
      Account.initialState(),
      accountEvents.events,
    );
    const account = new Account(accountState);

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

    await accountEventStore.append([creditEvent, debitEvent]);

    const accountEventList = await accountEventStore.getEventsFromSequence({
      entityId: accountId,
      sequence: 0,
    });

    expect(accountEventList.events.length).toStrictEqual(3);
    expect(accountEventList.events.map((event) => event.name)).toStrictEqual([
      "AccountCreated",
      "AccountCredited",
      "AccountDebited",
    ]);

    expect(accountEventList.lastSequence).toStrictEqual(2);

    const newState = new AccountReducer().reduce(
      Account.initialState(),
      accountEventList.events,
    );

    expect(newState).toStrictEqual(account.getState());
  });
});
