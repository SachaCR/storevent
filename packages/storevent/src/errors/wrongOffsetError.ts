import { StoreventError } from "./storeventError";

/**
 * This error is thrown when you try to append events to an entity, but the sequence number of the last event in the entity is different from the sequence number of the last event in the store.
 * Use this error in your custom implementation when you detect an incoherence in your entity's sequence.
 */
export class WrongOffsetError extends StoreventError<
  "WRONG_OFFSET_ERROR",
  {
    entityName: string;
    entityId: string;
    invalidOffset: number;
  }
> {
  constructor(details: {
    /**
     * Entity name where the wrong offset error occurred.
     */
    entityName: string;

    /**
     * Entity ID where the wrong offset error occurred.
     */
    entityId: string;

    /**
     * Offset number that is invalid.
     */
    invalidOffset: number;
  }) {
    const message = `Wrong offset error: event must be appended with a continuous offset number ${details.invalidOffset}`;

    super({
      message,
      errorCode: "WRONG_OFFSET_ERROR",
      details,
    });

    Object.setPrototypeOf(this, WrongOffsetError.prototype);
  }
}
