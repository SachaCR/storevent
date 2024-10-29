import { StoreventError } from "./storeventError";

/**
 * This error is thrown when you try to append events to an entity, but the sequence number of the last event in the entity is different from the sequence number of the last event in the store.
 * Use this error in your custom implementation when you detect a concurrent modification of an entity.
 */
export class ConcurrencyError extends StoreventError<
  "CONCURRENCY_ERROR",
  {
    entityName: string;
    entityId: string;
    sequenceInConflict: number;
  }
> {
  constructor(details: {
    /**
     * Entity name where the concurrency error occurred.
     */
    entityName: string;
    /**
     * Entity ID where the concurrency error occurred.
     */
    entityId: string;
    /**
     * Sequence number of the last event in the entity.
     */
    sequenceInConflict: number;
  }) {
    const message = `Concurrency error: Someone else added new events after this sequence number ${details.sequenceInConflict}`;

    super({
      message,
      errorCode: "CONCURRENCY_ERROR",
      details,
    });

    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}
