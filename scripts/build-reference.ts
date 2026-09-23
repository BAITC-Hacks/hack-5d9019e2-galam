import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { officialDataset } from "../src/data/dataset";
import { searchReference } from "../src/lib/reference/search";

const benchmark = process.argv.includes("--benchmark");
const started = performance.now();
const result = searchReference(
  officialDataset,
  benchmark ? { candidateLimit: 10000 } : {},
);
const elapsedMs = performance.now() - started;
const datasetSha256 = createHash("sha256")
  .update(readFileSync("official-dataset.json"))
  .digest("hex");
const report = { ...result, elapsedMs, datasetSha256 };
console.log(JSON.stringify(report, null, 2));
if (!benchmark) {
  if (!result.complete)
    throw new Error("Do not publish an incomplete exhaustive cache");
  writeFileSync(
    "src/data/reference-cache.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
