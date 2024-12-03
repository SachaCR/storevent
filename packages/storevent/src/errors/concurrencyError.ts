import { StoreventError } from "./storeventError";

/**
 * This error is thrown when you try to append events to an entity, but the offset of the last event in the entity is different from the offset of the last event in the store.
 * Use this error in your custom implementation when you detect a concurrent modification of an entity.
 */
export class ConcurrencyError extends StoreventError<
  "CONCURRENCY_ERROR",
  {
    entityName: string;
    entityId: string;
    offsetInConflict: number;
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
    offsetInConflict: number;
  }) {
    const message = `Concurrency error: Someone else added new events after this offset number ${details.offsetInConflict}`;

    super({
      message,
      errorCode: "CONCURRENCY_ERROR",
      details,
    });

    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}
