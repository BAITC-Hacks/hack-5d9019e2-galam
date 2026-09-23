import rawDataset from "../../official-dataset.json";
import { datasetSchema, type DeepReadonly } from "./schema";

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

/** Parse untrusted data once at its boundary and prevent accidental mutation. */
export function loadOfficialDataset(input: unknown) {
  return deepFreeze(datasetSchema.parse(input));
}

export const officialDataset = loadOfficialDataset(rawDataset);
