import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";

import {
  ConcurrencyError,
  BasicEvent,
  WrongOffsetError,
} from "@storevent/storevent";

import { getLastEventOffset } from "./getLastEventOffset";

export async function appendEvents<Event extends BasicEvent>(params: {
  entityId: string;
  events: Event[];
  tableName: string;
  entityName: string;
  client: PoolClient | Pool | Client;
  appendAfterOffset?: number;
}): Promise<void> {
  const { entityId, events, tableName, entityName, client, appendAfterOffset } =
    params;

  let lastEventSequence = 0;

  lastEventSequence = await getLastEventOffset({
    client,
    tableName,
    entityId: params.entityId,
  });

  if (appendAfterOffset) {
    if (appendAfterOffset !== lastEventSequence) {
      throw new WrongOffsetError({
        entityId,
        entityName,
        invalidOffset: appendAfterOffset,
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
    "INSERT INTO %I (entity_id, event_offset, name, payload) VALUES %L",
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
          offsetInConflict: appendAfterOffset ?? lastEventSequence,
        });

        concurrencyError.cause = err;

        throw concurrencyError;
      }
    }

    throw err;
  }
}
