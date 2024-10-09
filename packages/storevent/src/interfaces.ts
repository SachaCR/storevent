export interface Storevent {
  name: string;
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
