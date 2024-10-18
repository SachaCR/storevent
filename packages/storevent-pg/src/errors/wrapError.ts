import { StoreventError } from "@storevent/storevent";
import { PGError } from "./pgError";
import { UnexpectedError } from "./unexpectedError";

export function wrapError(error: unknown): PGError | UnexpectedError {
  if (error instanceof StoreventError) {
    return error;
  }

  if (error instanceof Error) {
    return new PGError(error);
  }

  return new UnexpectedError(error);
}
