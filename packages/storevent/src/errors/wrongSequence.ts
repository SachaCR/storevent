import { StoreventError } from "./storeventError";

export class WrongSequenceError extends StoreventError<
  "WRONG_SEQUENCE_ERROR",
  {
    entityName: string;
    entityId: string;
    invalidSequence: number;
  }
> {
  constructor(details: {
    entityName: string;
    entityId: string;
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
