import { Client, Pool, PoolClient } from "pg";
import * as format from "pg-format";
import { getLastEventOffset } from "./getLastEventOffset";
import { BasicEvent } from "@storevent/storevent";
import { EventFromDB } from "../eventStore/interfaces";

export async function getEventsFromOffset<Event extends BasicEvent>(params: {
  entityId: string;
  client: PoolClient | Pool | Client;
  tableName: string;
  offset?: number;
}): Promise<{ events: Event[]; lastEventOffset: number }> {
  const { entityId, offset, client, tableName } = params;

  const offsetToSearchFrom = offset ?? 0;

  const sanitizedQuery = format.default(
    "SELECT * FROM %I WHERE entity_id = %L AND event_offset > %L ORDER BY event_offset ASC",
    tableName,
    entityId,
    offsetToSearchFrom,
  );

  const res = await client.query<EventFromDB>(sanitizedQuery);

  if (res.rows.length === 0) {
    const lastEventSequence = await getLastEventOffset({
      client,
      tableName,
      entityId,
    });

    return {
      events: [],
      lastEventOffset: lastEventSequence,
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
    lastEventOffset: offsetToSearchFrom + events.length,
  };
}
