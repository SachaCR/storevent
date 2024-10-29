/**
 * This interface represents an event that can be stored with storevent event store implementations.
 */
export interface Storevent {
  /**
   * The name of the event.
   */
  name: string;
  /**
   * The payload of the event.
   */
  payload: JsonSerializable;
}

export type JsonSerializable = Record<string, JsonPrimitives>;

export type JsonPrimitives =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JsonPrimitives }
  | JsonPrimitives[];
