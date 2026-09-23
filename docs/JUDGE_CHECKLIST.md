# Judge checklist

Use the production build (`pnpm build`, then `pnpm start`) and open `http://localhost:3000`.

## Task compliance and functionality

**Demonstrates:** a fixed budget, five urban directions, five districts, exactly five valid decisions, blocked invalid plans, deterministic effects, and the final Astana Quality of Life Score.

**Visible in app:** the top score/budget/decision bar, district map, Initiatives, agenda, and Results.

**Documented in:** [README](../README.md#hackathon-requirements-coverage) and [demo script](DEMO.md).

**Reproduce:** choose Nura, add initiatives, then show the live projection. Add M1 in Esil and show that M3 is unavailable; use **Load official example** to reach a valid final result quickly.

**Remaining weakness:** the illustrative map is intentionally not GIS data.

## Technical implementation

**Demonstrates:** runtime dataset validation, a pure TypeScript simulation engine, strict Governance Challenge validation, deterministic exhaustive reference search, and server-side structured OpenAI output validation with a deterministic fallback.

**Visible in app:** official rule explanations, unavailable-action reasons, before/after analytics, the AI Reference comparison, and AI Advisor status after a request.

**Documented in:** [README architecture](../README.md#architecture), [deterministic model](../README.md#deterministic-model), and [advisor architecture](../README.md#advisor-architecture).

**Reproduce:** run `pnpm test`, open **AI Advisor**, and compare the result with the reference strategy. Disable credentials to confirm the local advisor remains useful.

**Remaining weakness:** the local demo safeguards are not a replacement for hosted-service rate limiting.

## README and reproducibility

**Demonstrates:** setup, architecture, formula, dataset authority, score reproduction, reference search, environment configuration, tests, security, limitations, and upload guidance.

**Visible in app:** the same score, budget, rules, results, and reference scenario described in the README.

**Documented in:** [README](../README.md) and [demo script](DEMO.md).

**Reproduce:** `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, and `pnpm start`.

**Remaining weakness:** external OpenAI calls require the judge's own configured key; the deterministic fallback works without one.

## Value and applicability

**Demonstrates:** how trade-offs between city averages, weak districts, critical gaps, budget, and implementation lags affect public-policy choices.

**Visible in app:** district indicators, projected score changes, critical gaps, trade-offs, and results comparison.

**Documented in:** [problem and solution](../README.md#problem-and-solution) and [main user flow](../README.md#main-user-flow).

**Reproduce:** load the official example, inspect **Analytics**, then compare it with the reference strategy.

**Remaining weakness:** effects are the supplied hackathon model, not a real municipal forecasting claim.

## Development potential and originality

**Demonstrates:** a transparent separation between deterministic official calculations and optional qualitative AI assistance, plus a reproducible exhaustive reference baseline.

**Visible in app:** the AI Advisor safety statement, local fallback, and AI Reference comparison.

**Documented in:** [AI Reference Strategy](../README.md#ai-reference-strategy), [Advisor architecture](../README.md#advisor-architecture), and [known limitations](../README.md#known-limitations-and-deliberate-omissions).

**Reproduce:** request an advisor explanation, switch EN/RU/KZ, and show that all numeric cards remain engine-generated.

**Remaining weakness:** no persistence, authentication, or real GIS layer is included for this hackathon scope.

## Fast evidence path

1. Point out baseline **52.56**, budget **100**, Nura, and two critical gaps.
2. Show the three-step guide and add an initiative to update the live projection.
3. Show an unavailable conflict, then load the official example.
4. Confirm the plan, compare with the **57.236735** exhaustive reference, and open AI Advisor.
5. Switch RU, then KZ.
