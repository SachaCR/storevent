import { StoreventError } from "./storeventError";

/**
 * This error is thrown when you try to apply an event to an entity, but there is no reducer for that event.
 */
export class UnknownReducer extends StoreventError<
  "UNKNOWN_REDUCER",
  {
    eventName: string;
  }
> {
  constructor(details: {
    /**
     * Entity name where the unknown reducer error occurred.
     */
    entityName: string;
    /**
     * Event name that has no reducer.
     */
    eventName: string;
  }) {
    const message = `${details.entityName}: No reducer found for event: ${details.eventName}`;

    super({
      message,
      errorCode: "UNKNOWN_REDUCER",
      details,
    });

    Object.setPrototypeOf(this, UnknownReducer.prototype);
  }
}
