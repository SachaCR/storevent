import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

import {
  AppendEventOptions,
  ConcurrencyError,
  Storevent,
  WrongSequenceError,
} from "@storevent/storevent";

import { getLastEventSequenceNumber } from "./getLastEventSequenceNumber";

export async function appendEvents<Event extends Storevent>(
  params: {
    entityId: string;
    events: Event[];
    tableName: string;
    entityName: string;
    client: PoolClient | Pool | Client;
  },
  options?: AppendEventOptions,
): Promise<void> {
  const { entityId, events, tableName, entityName, client } = params;
  const appendAfterSequenceNumber = options?.appendAfterSequenceNumber;

  let lastEventSequence = 0;

  lastEventSequence = await getLastEventSequenceNumber({
    client,
    tableName,
    entityId: params.entityId,
  });

  if (appendAfterSequenceNumber) {
    if (appendAfterSequenceNumber !== lastEventSequence) {
      throw new WrongSequenceError({
        entityId,
        entityName,
        invalidSequence: appendAfterSequenceNumber,
      });
    }
  }

  let sequenceNumber = lastEventSequence + 1;

  const eventsData = events.map((event) => {
    const eventData = [
      entityId,
      sequenceNumber,
      event.name,
      JSON.stringify(event.payload),
    ];

    sequenceNumber += 1;

    return eventData;
  });

  const sanitizedQuery = format.default(
    "INSERT INTO %I (entity_id, sequence, name, payload) VALUES %L",
    tableName,
    eventsData,
  );

  try {
    await client.query(sanitizedQuery);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.message.includes("duplicate key value violates unique constraint")
      ) {
        const concurrencyError = new ConcurrencyError({
          entityId,
          entityName,
          sequenceInConflict:
            options?.appendAfterSequenceNumber ?? lastEventSequence,
        });

        concurrencyError.cause = err;

        throw concurrencyError;
      }
    }

    throw err;
  }
}
