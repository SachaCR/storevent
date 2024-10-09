import { StoreventError } from "./storeventError";

export class UnknownReducer extends StoreventError<
  "UNKNOWN_REDUCER",
  {
    eventName: string;
  }
> {
  constructor(details: { entityName: string; eventName: string }) {
    const message = `${details.entityName}: No reducer found for event: ${details.eventName}`;

    super({
      message,
      errorCode: "UNKNOWN_REDUCER",
      details,
    });

    Object.setPrototypeOf(this, UnknownReducer.prototype);
  }
}
