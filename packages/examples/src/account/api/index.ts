// Import the framework and instantiate it
import { randomUUID } from "crypto";

import Fastify from "fastify";
import cors from "@fastify/cors";

import { Account, AccountReducer } from "..";
import { AccountInMemoryHybridStore } from "../in-memory/accountHybridStore";

const eventStore = new AccountInMemoryHybridStore();

const accountList: {
  accountId: string;
  currency: string;
  status: string;
}[] = [];

eventStore.onEventAppended((notif) => {
  console.log("Event appended", notif);
  notif.events.forEach((event) => {
    if (event.name === "AccountCreated") {
      accountList.push({
        accountId: event.payload.accountId,
        currency: event.payload.currency,
        status: event.payload.status,
      });
    }
  });
});

const fastify = Fastify({
  logger: true,
});

fastify.post("/accounts", async function handler() {
  const accountId = randomUUID();
  const account = new Account();
  const accountCreatedEvent = account.open({ accountId });

  await eventStore.append({
    entityId: accountId,
    events: [accountCreatedEvent],
    snapshot: {
      state: account.getState(),
      version: 0,
    },
  });

  return account.getState();
});

fastify.post<{
  Body: { amount: number; currency: string };
  Params: { accountId: string; action: "credit" | "debit" };
}>("/accounts/:accountId/:action", async function handler(request, reply) {
  const { accountId } = request.params;

  const snapshot = await eventStore.getLastSnapshot(accountId);

  if (!snapshot) {
    await reply.code(404).send({ error: "Account not found" });
    return;
  }

  const result = await eventStore.getEventsFromSequenceNumber({
    entityId: accountId,
    sequenceNumber: snapshot.version,
  });

  const currentState = new AccountReducer().reduceEvents({
    state: snapshot.state,
    stateVersion: snapshot.version,
    events: result.events,
  });

  const account = new Account({
    state: currentState.state,
    version: currentState.version,
  });

  const eventsToAppend = [];

  if (request.params.action === "credit") {
    const accountCredited = account.credit({
      amount: request.body.amount,
      currency: request.body.currency,
    });

    eventsToAppend.push(accountCredited);
  }

  if (request.params.action === "debit") {
    const accountDebited = account.debit({
      amount: request.body.amount,
      currency: request.body.currency,
    });

    eventsToAppend.push(accountDebited);
  }

  await eventStore.append({
    entityId: accountId,
    events: eventsToAppend,
    snapshot: {
      state: account.getState(),
      version: account.getVersion(),
    },
  });

  return account.getState();
});

fastify.get<{
  Params: { accountId: string };
}>("/accounts/:accountId", async function handler(request, reply) {
  const { accountId } = request.params;

  const snapshot = await eventStore.getLastSnapshot(accountId);

  if (!snapshot) {
    await reply.code(404).send({ error: "Account not found" });
    return;
  }

  const result = await eventStore.getEventsFromSequenceNumber({
    entityId: accountId,
    sequenceNumber: snapshot.version,
  });

  const currentState = new AccountReducer().reduceEvents({
    state: snapshot.state,
    stateVersion: snapshot.version,
    events: result.events,
  });

  return currentState.state;
});

fastify.get<{
  Params: { accountId: string };
}>("/accounts", function handler() {
  return accountList;
});

fastify.get<{
  Params: { accountId: string };
}>("/accounts/:accountId/history", async function handler(request, reply) {
  const { accountId } = request.params;

  const snapshot = await eventStore.getLastSnapshot(accountId);

  if (!snapshot) {
    await reply.code(404).send({ error: "Account not found" });
    return;
  }

  const result = await eventStore.getEventsFromSequenceNumber({
    entityId: accountId,
    sequenceNumber: 0,
  });

  return result.events;
});

async function runServer() {
  // Run the server!

  await fastify.register(cors, {
    origin: "http://localhost:5173", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
  });

  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

runServer().catch((err) => {
  console.error(err);
});
