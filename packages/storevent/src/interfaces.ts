export interface Storevent {
  name: string;
  payload: JsonSerializable;
}

export type JsonPrimitives =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JsonPrimitives }
  | JsonPrimitives[];

export type JsonSerializable = Record<string, JsonPrimitives>;
