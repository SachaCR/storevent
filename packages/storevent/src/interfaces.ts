export interface Storevent {
  name: string;
  payload: JsonSerializable;
}

// export interface EntityReducer<State, Event extends Storevent<string>> {
//   entityName: string;
//   reduce: (params: { events: Event[]; state?: State }) => {
//     state: State;
//     sequence: number;
//   };
// }

export type JsonPrimitives =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JsonPrimitives }
  | JsonPrimitives[];

export type JsonSerializable = Record<string, JsonPrimitives>;
