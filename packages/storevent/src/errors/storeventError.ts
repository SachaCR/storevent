/**
 * Abstract class that represent storevent custom errors. Ecxtends this class to create custom errors in your implementations.
 * @typeParam Code - Type that will define the error code enum.
 * @typeParam Details - Type that will define the error details.
 */
export abstract class StoreventError<
  Code extends string,
  Details = unknown,
> extends Error {
  /**
   * Custom error code matching type Code
   */
  public code: Code;
  public details?: Details;

  constructor(params: { message: string; errorCode: Code; details?: Details }) {
    const { errorCode, message, details } = params;

    super(message);

    this.name = "StoreventError";
    this.code = errorCode;
    this.details = details;

    Object.setPrototypeOf(this, StoreventError.prototype);
  }
}
