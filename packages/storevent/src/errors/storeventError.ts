/**
 * @description Abstract class that represent our custom errors.
 * @typeParam T - Type that will define the error code enum.
 */

export abstract class StoreventError<
  Code extends string,
  Details = unknown,
> extends Error {
  /**
   * Custom error code matching type T
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
