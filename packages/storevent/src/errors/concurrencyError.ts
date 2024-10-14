import { StoreventError } from "./storeventError";

export class ConcurrencyError extends StoreventError<
  "CONCURRENCY_ERROR",
  {
    entityName: string;
    entityId: string;
    sequenceInConflict: number;
  }
> {
  constructor(details: {
    entityName: string;
    entityId: string;
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
