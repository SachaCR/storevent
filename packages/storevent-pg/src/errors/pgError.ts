import { StoreventError } from "@storevent/storevent";

export class PGError extends StoreventError<"POSTGRES_ERROR"> {
  constructor(error: Error) {
    super({
      message: error.message,
      errorCode: "POSTGRES_ERROR",
    });

    this.cause = error;
    Object.setPrototypeOf(this, PGError.prototype);
  }
}
