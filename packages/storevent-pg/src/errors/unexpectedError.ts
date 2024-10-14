import { StoreventError } from "@storevent/storevent";

export class UnexpectedError extends StoreventError<"UNEXPECTED_ERROR"> {
  constructor(error: unknown) {
    super({
      message:
        "An unexpected error occurred, see cause property to retrieve original error",
      errorCode: "UNEXPECTED_ERROR",
    });

    this.cause = error;
    Object.setPrototypeOf(this, UnexpectedError.prototype);
  }
}
