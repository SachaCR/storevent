import { StoreventError } from "./storeventError";

/**
 * This error is thrown when you try to append events to an entity, but the sequence number of the last event in the entity is different from the sequence number of the last event in the store.
 * Use this error in your custom implementation when you detect an incoherence in your entity's sequence.
 */
export class WrongSequenceError extends StoreventError<
  "WRONG_SEQUENCE_ERROR",
  {
    entityName: string;
    entityId: string;
    invalidSequence: number;
  }
> {
  constructor(details: {
    /**
     * Entity name where the wrong sequence error occurred.
     */
    entityName: string;
    /**
     * Entity ID where the wrong sequence error occurred.
     */
    entityId: string;
    /**
     * Sequence number that is invalid.
     */
    invalidSequence: number;
  }) {
    const message = `Wrong sequence error: event must be appended with a continuous sequence number ${details.invalidSequence}`;

    super({
      message,
      errorCode: "WRONG_SEQUENCE_ERROR",
      details,
    });

    Object.setPrototypeOf(this, WrongSequenceError.prototype);
  }
}
