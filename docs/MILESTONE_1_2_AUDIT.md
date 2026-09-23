# Milestones 1–2 delivery audit

## Project path and initial state

`C:\Users\Lab-105-Adil\Desktop\Akim`

Initially the folder contained only `MASTER_SPEC_AKIM_5_HOURS.md` (31,414 bytes) and `official-dataset.json` (7,203 bytes). Both were read completely before implementation. There was no existing application, dependency configuration, test suite, or Git directory.

## Implemented work

Next.js + TypeScript application foundation, Zod dataset validation, typed immutable domain data, strict Governance Challenge validation, lagged effects, city/district scopes, all official synergies and incompatibilities, clipping after all effects, weighted district and city scoring, critical-gap reporting, final official score, and regression tests. A minimal foundation status page confirms the application builds with the real dataset; no game interface was implemented.

Architecture: root JSON → runtime schema and immutable typed dataset → plan validator → canonical action ordering → direct effects → fixed synergies → clipping → official scoring. Invalid plans return structured errors and no score. Pure simulation code is independent of React, Next.js, AI, network calls, time, and randomness.

## Created files

All authored files below are new relative to the initial folder:

```text
.env.example
.gitignore
.npmrc
README.md
eslint.config.mjs
next-env.d.ts
next.config.ts
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
vitest.config.ts
src/app/layout.tsx
src/app/page.tsx
src/data/dataset.ts
src/data/schema.ts
src/lib/simulation/effects.ts
src/lib/simulation/index.ts
src/lib/simulation/score.ts
src/lib/simulation/simulate.ts
src/lib/simulation/types.ts
src/lib/simulation/validate.ts
tests/dataset.test.ts
tests/fixtures.ts
tests/simulation.test.ts
tests/validation.test.ts
scripts/report-scores.ts
docs/COMMANDS.md
docs/MILESTONE_1_2_AUDIT.md
```

Generated artifacts: `node_modules/`, `.pnpm-store/`, `.cache/` when used by tooling, `.next/`, and TypeScript incremental cache. These are ignored.

## Modified original files

None. SHA-256 hashes before and after match:

| Source | SHA-256 |
| --- | --- |
| MASTER_SPEC_AKIM_5_HOURS.md | A4D7C19DE1029B95B6701A522219F6FEDB3A7143BD088E43C035F7F399AD08CD |
| official-dataset.json | 915A589951BB4D3F247469F120B483149735CAA860A636AB39D7E7009B97949E |

## Commands and verification

[Exact terminal command history](COMMANDS.md) includes every submitted terminal command, including audit reads, unsuccessful attempts, fixes, and final checks. See README for portable launch commands.

| Gate | Final result |
| --- | --- |
| Dependency installation | Passed; pinned versions and pnpm lockfile |
| Frozen-lockfile offline install | Passed |
| Tests | 3 files passed; 73 tests passed; 0 failed |
| Typecheck | Passed with strict settings |
| Lint | Passed with zero warnings |
| Peer dependencies | No issues |
| Production build | Passed, Next.js 16.3.5 / Turbopack; / and /_not-found statically rendered |
| Score report | Passed after Windows sandbox launcher restriction was bypassed through an approved tool override |
| Source preservation | Both SHA-256 hashes unchanged |
| Git state | No .git directory; no initialization, clone, remote, or GitHub operation |

Initial tooling failures were resolved: npm was absent, network access required an override, the initial pnpm store needed relocation, and the newest TypeScript/ESLint majors were incompatible with the installed lint plugins. No tests were disabled or hidden, and no TypeScript strictness was weakened.

## Calculated scores

| District | Baseline | Official example |
| --- | ---: | ---: |
| Esil | 62.99 | 63.4275 |
| Almaty | 57.06 | 57.4975 |
| Saryarka | 54.65 | 56.3 |
| Baikonur | 56.63 | 57.0675 |
| Nura | 49.18 | 52.9625 |

| Metric | Baseline | Official example |
| --- | ---: | ---: |
| Population-weighted city average | 56.8624 | 58.0776 |
| Weakest district | Nura | Nura |
| Critical gaps | 2 | 0 |
| Final score | 52.55768 | 56.54307 |

The example costs **95** and leaves **5**. It triggers M10 + M12 in Nura. The difference from the source approximation 56.5 is **+0.04307**, consistent with rounding to one decimal place. No formula or value was changed to force agreement. JavaScript output retains the usual floating-point representation (for example, 56.54306999999999).

## Assumptions, risks and ambiguities

- Source-document approximate values are display targets; full precision is retained internally.
- The final formula's coefficients occur only in a dataset string. A restricted parser reads them safely and rejects unsupported formula structures.
- City actions omit districtId entirely; source null targets are normalized on import.
- Malformed input adds four structured boundary error codes to the Master Spec's list.
- An invalid simulation omits score details instead of fabricating a projected state; consumers must narrow the discriminated union on valid.
- Equal minimum scores select the first district in dataset order.
- ESLint 9 is deprecated upstream but required by the currently installed Next.js plugin peer ranges; all peers and checks pass. This is a development-tool maintenance item.
- The initial pnpm install used the shared user store despite .npmrc; it was corrected with project-local pnpm-workspace.yaml settings and reinstalled locally. No global config was changed. The shared package cache was not destructively cleaned.
- The tsx report launcher calls a Windows user-account API unavailable inside the restricted tool sandbox. The unchanged command succeeds outside that restriction; tests, typecheck, lint, and build pass within the sandbox.
- No live browser/game interaction was tested because only a minimal foundation page exists.

## Scope confirmation

Milestones 1 and 2 are complete. No Milestone 3+ implementation was started: no reference optimizer, frontend game UI, pixel city, OpenAI/NVIDIA integration, AI Advisor, Sandbox, Crisis events, localization, or visual polish. No database or Docker was added. Work stops here pending further user approval.
