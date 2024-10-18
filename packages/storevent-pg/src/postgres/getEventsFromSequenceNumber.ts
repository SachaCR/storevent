import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";
import { getLastEventSequenceNumber } from "./getLastEventSequenceNumber";
import { Storevent } from "@storevent/storevent";
import { EventFromDB } from "../eventStore/interfaces";

export async function getEventsFromSequenceNumber<
  Event extends Storevent,
>(params: {
  entityId: string;
  client: PoolClient | Pool | Client;
  tableName: string;
  sequenceNumber?: number;
}): Promise<{ events: Event[]; lastEventSequenceNumber: number }> {
  const { entityId, sequenceNumber, client, tableName } = params;

  const sequenceToSearch = sequenceNumber ?? 0;

  const sanitizedQuery = format.default(
    "SELECT * FROM %I WHERE entity_id = %L AND sequence > %L ORDER BY sequence ASC",
    tableName,
    entityId,
    sequenceToSearch,
  );

  const res = await client.query<EventFromDB>(sanitizedQuery);

  if (res.rows.length === 0) {
    const lastEventSequence = await getLastEventSequenceNumber({
      client,
      tableName,
      entityId,
    });

    return {
      events: [],
      lastEventSequenceNumber: lastEventSequence,
    };
  }

  const events: Event[] = res.rows.map((row) => {
    const event: Event = {
      name: row.name,
      payload: row.payload,
    } as Event;

    return event;
  });

  return {
    events: events,
    lastEventSequenceNumber: sequenceToSearch + events.length,
  };
}
