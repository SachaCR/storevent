import { JsonSerializable } from "@storevent/storevent";

export interface SnapshotFromDB {
  entity_id: string;
  version: string;
  state: JsonSerializable;
  created_at: Date;
  updated_at: Date;
}
