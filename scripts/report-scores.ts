import { officialDataset as dataset } from "../src/data/dataset";
import { scoreState } from "../src/lib/simulation/score";
import { simulatePlan } from "../src/lib/simulation/simulate";

const plan = dataset.reference_plan_from_source.plan.map((d) => ({ actionId: d.action_id, ...(d.district === null ? {} : { districtId: d.district }) }));
const baseline = scoreState(dataset.districts, dataset);
const example = simulatePlan(plan, dataset);
if (!example.valid) throw new Error(JSON.stringify(example.issues));
console.log(JSON.stringify({ baseline, example, sourceApproximation: dataset.reference_plan_from_source.expected_score_approx, difference: example.score - dataset.reference_plan_from_source.expected_score_approx }, null, 2));
