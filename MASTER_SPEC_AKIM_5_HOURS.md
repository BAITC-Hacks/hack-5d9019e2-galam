# MASTER TECHNICAL SPECIFICATION / PRD
## AKIM: 5 HOURS — AI City Decision Simulator
### HackAlem AI — Solo participant / Codex-first implementation
### Version 1.0

---

## 0. Purpose and authority

This file is the single source of truth for Codex while building the hackathon project.

Codex must:
1. read this document fully before changing code;
2. preserve all official formulas, constraints, dataset values and acceptance criteria;
3. implement P0 before any P1/P2 feature;
4. keep the project runnable after every milestone;
5. never replace deterministic calculations with LLM-generated numbers;
6. avoid unnecessary infrastructure that increases hackathon risk;
7. prefer a smaller complete working product over a larger incomplete product.

If this document conflicts with a later explicit instruction from the project owner, the later explicit instruction wins. Otherwise this document wins.

---

## 1. Product in one sentence

**AKIM: 5 HOURS** is a web-based serious game / decision simulator in which the player becomes the akim of a stylized Astana, spends a fixed budget on exactly five urban initiatives, sees deterministic consequences across five districts and ten indicators, receives an Astana Quality of Life Score, and works with an AI city advisor that explains trade-offs, simulates alternatives and recommends better decisions.

---

## 2. Product positioning

This is not a casual game with arbitrary points, not a dashboard with a chatbot attached, and not a free-form LLM simulation.

It is:

> deterministic urban policy simulation engine + explainable AI decision advisor + game-like pixel-art interface.

The player should feel:
- managing a city is harder than it looks;
- every decision has side effects and opportunity cost;
- a limited budget forces trade-offs and balance;
- AI helps reveal consequences that a human may miss, but the human keeps final authority.

Analytics and simulation correctness have higher priority than visual polish. Visuals must make the system intuitive and memorable without weakening analytical quality.

---

## 3. Official hackathon requirements — non-negotiable

The core Governance Challenge must satisfy all of the following:
- one fixed virtual budget for all players;
- decisions across five urban directions: Transport, Ecology/Greening, Social infrastructure, Safety, City services;
- automatic prevention of budget overrun;
- deterministic changes to city indicators caused by decisions;
- AI analysis of selected decisions;
- calculation of a final Astana Quality of Life Score;
- explanation of strengths, risks, consequences and trade-offs;
- changing the selected decisions must change the score.

Evaluation priorities:
- 25 — task compliance / working scenario;
- 25 — technical implementation / architecture / AI-agentic use;
- 25 — README / reproducibility;
- 15 — value / applicability;
- 10 — originality / development potential.

Therefore: working core + clean architecture + reproducibility is more important than extra features.

---

## 4. Official data is the source of truth

Use `official-dataset.json` as the only numeric source of truth. Copy it to `src/data/official-dataset.json` during implementation if desired, but never manually duplicate values inside UI components.

Official model:
- 5 districts;
- 10 normalized indicators from 0 to 100 where higher is always better;
- 14 actions;
- budget 100;
- horizon 8 quarters;
- exact deterministic effects;
- action lag;
- fixed synergies;
- incompatibilities;
- exact score formula;
- exactly five decisions in strict mode.

The base official score must reproduce approximately **52.56**.

---

## 5. Districts and city state

Districts:
1. Esil
2. Almaty
3. Saryarka
4. Baikonur
5. Nura

Indicators:

### Transport
- T1 — road congestion relief
- T2 — public transport accessibility

### Ecology
- E1 — greenery
- E2 — air quality

### Social
- S1 — schools & kindergartens
- S2 — clinics & primary healthcare

### Safety
- B1 — street safety
- B2 — road safety

### City services
- C1 — utility reliability
- C2 — speed of resolving resident requests

All values are 0..100 and higher is better.

Domain summary scores may be shown in UI, but the official final score uses the official indicator weights from the dataset.

---

## 6. Official simulation formulas

### 6.1 Realized action effect

Simulation horizon = 8 quarters.

For action lag `L`:

`realized_fraction = (8 - L) / 8`

`realized_effect = full_effect * realized_fraction`

Synergy bonuses are fixed and are not lag-scaled.

### 6.2 New indicator value

For every district `d` and indicator `k`:

`I'_dk = clip(I_dk + sum(realized_effects) + synergy_bonuses, 0, 100)`

### 6.3 District score

`D_d = sum(w_k * I'_dk)`

Official weights:
- T1 0.10
- T2 0.10
- E1 0.09
- E2 0.11
- S1 0.11
- S2 0.11
- B1 0.09
- B2 0.09
- C1 0.10
- C2 0.10

### 6.4 Population-weighted city average

`D_avg = sum(population_share_d * D_d)`

### 6.5 Critical gaps

`N_crit = number of district × indicator values strictly below 40`

### 6.6 Final Astana Quality of Life Score

`Score = 0.7 * D_avg + 0.3 * min(D_d) - 1.0 * N_crit`

Meaning:
- 70% rewards overall city performance;
- 30% forces attention to the weakest district;
- critical gaps below 40 are penalized.

This formula MUST NOT be modified in Governance Challenge.

---

## 7. Strict Governance Challenge rules

This is P0 and the primary demo mode.

Rules:
- budget maximum = 100;
- exactly 5 decisions;
- each action ID may be selected at most once;
- district actions require exactly one district;
- city actions do not accept a district;
- no more than 2 actions from one domain;
- official incompatibilities must be enforced;
- action order has no mathematical effect;
- invalid plan has no score and validator explains why.

Official incompatibilities:
- M1 + M3: globally incompatible;
- M4 + M7: cannot be used in the same district;
- M5 + M13: cannot be used in the same district.

Official synergies:
- M1 + M2 => T1 +2 in the M1 district;
- M10 + M12 => B1 +2 in the M10 district;
- M5 + M6 => E2 +2 in the M5 district.

The validator must return structured errors.

```ts
type ValidationIssue = {
  code:
    | "BUDGET_EXCEEDED"
    | "WRONG_DECISION_COUNT"
    | "DUPLICATE_ACTION"
    | "DOMAIN_LIMIT"
    | "MISSING_DISTRICT"
    | "UNEXPECTED_DISTRICT"
    | "INCOMPATIBILITY";
  messageKey: string;
  actionIds?: string[];
  districtId?: string;
};
```

---

## 8. Game modes

### P0 — Governance Challenge

Official competitive mode.

Flow:
1. start from official city state;
2. inspect five districts;
3. inspect AI briefing;
4. choose exactly five initiatives;
5. stay within budget;
6. receive live deterministic projections;
7. confirm plan;
8. receive final score;
9. receive AI explanation;
10. compare with AI Reference Plan.

### P1 — Sandbox

Purpose: free exploration.

Relax:
- exactly-five restriction;
- maximum-two-per-domain restriction.

Keep:
- budget;
- one instance per official action;
- district/city scope;
- official effects;
- synergies;
- physical incompatibilities.

Sandbox results must be visually labelled **Experimental / Sandbox** and never confused with official Governance Challenge scores.

### P1 — Crisis Scenario

One scripted optional scenario only.

Recommended first event: **Severe Winter Storm**.

Crisis logic must be isolated from official Governance Challenge scoring. Judges must always be able to reproduce the official score with no crisis modifier. Do not implement Crisis until P0 is complete.

---

## 9. Core player loop

`Observe → Decide → Simulate → Understand → Adjust`

Detailed:
1. player sees city map and current score;
2. player selects district;
3. player sees district problems and indicators;
4. player opens initiative catalogue;
5. player sees cost, implementation lag, direct known effects, scope and description;
6. player selects an action;
7. deterministic engine immediately computes projected deltas;
8. map and analytics preview change;
9. AI advisor may explain trade-offs;
10. player can keep or undo decision;
11. after five valid decisions the player confirms the plan;
12. final score and before/after analysis are shown;
13. player compares plan with AI Reference Plan.

---

## 10. Information visibility

Before selection show:
- cost;
- lag;
- primary direct effects;
- scope;
- current conflicts if applicable.

Do not hide all numeric consequences.

Separate:
- **Direct impact** — deterministic and visible;
- **System consequences / trade-offs** — summarized by AI after simulation.

No hidden random mechanic in P0.

---

## 11. City visualization

### 11.1 Visual direction

- friendly pixel art;
- large pixels;
- clear city silhouettes;
- slightly lower detail than the provided reference image;
- lively but not visually noisy;
- Astana-inspired contemporary city character;
- do not reproduce copyrighted game assets.

The city map itself is vertically composed, approximately 9:16.

Desktop:
- vertical city canvas left/center;
- analytics, budget and AI panel on right.

Mobile/narrow:
- city on top;
- analytics in bottom sheet / tabs.

### 11.2 Five interactive districts

Map must visibly contain:
- Esil
- Almaty
- Saryarka
- Baikonur
- Nura

They do not need geographically exact real boundaries.

Suggested cues:
- Esil: modern skyline, bridges, traffic;
- Almaty: denser older infrastructure;
- Saryarka: fewer green spaces / haze cues;
- Baikonur: balanced generic urban fabric;
- Nura: newer outskirts / visible social infrastructure gaps.

### 11.3 Action visual overlays

Architecture must support one visual overlay per official action.

Examples:
- M1 bus lanes → colored bus lane + bus;
- M3 LRT → rail line + station;
- M4 park → trees + green square;
- M7 school → school building;
- M8 clinic → clinic;
- M10 Safe City → lamps/cameras;
- M13 utilities → construction/pipe works.

P0 can use lightweight symbolic overlays. Do not block P0 on production-quality art.

```ts
type ActionVisual = {
  actionId: string;
  cityAsset?: string;
  districtAsset?: string;
  fallbackIcon: string;
};
```

If art assets are missing, render clean fallback markers and keep the app fully functional.

---

## 12. Analytics UI

Analytics has higher priority than art.

Always visible or one click away:
- current budget / spent / remaining;
- decision count 0/5;
- current Quality of Life Score;
- projected final Score;
- five domain summary scores;
- weakest district;
- critical gaps count;
- selected plan;
- action cost and lag;
- before/after deltas.

District detail must show all ten indicators.

Preferred chart forms:
- compact horizontal bars;
- before/after delta chips;
- radar chart only if readable.

Color cannot be the only signal; also show arrows and numeric values.

---

## 13. AI Advisor role

The AI is a decision advisor, not the calculator.

Deterministic engine calculates:
- costs;
- effects;
- lag;
- synergies;
- conflicts;
- indicator values;
- district scores;
- final score;
- reference scenario evaluation.

The LLM receives calculated facts and:
- explains;
- compares;
- recommends;
- identifies trade-offs;
- answers “why?”;
- proposes next actions;
- reviews final plan.

The AI MUST NOT invent:
- indicator deltas;
- costs;
- score changes;
- action effects;
- district values.

If a numeric fact is not supplied by a deterministic tool, the model must not claim it.

---

## 14. Agentic tool architecture

Expose deterministic functions as tools to the advisor layer.

Required logical tools:

```ts
getCityState()
getDistrictState(districtId)
listAvailableActions(currentPlan)
simulateAction(actionId, districtId?)
simulatePlan(plan)
validatePlan(plan)
comparePlans(planA, planB)
getCriticalGaps(state)
getWeakestDistrict(state)
getReferencePlan()
```

Optional:
```ts
searchAlternativePlans(criteria)
```

Example user question:

> Why should I build a school in Nura instead of a park in Esil?

Expected flow:
1. read Nura state;
2. read Esil state;
3. simulate M7 in Nura;
4. simulate M4 in Esil;
5. compare deltas;
6. explain difference in plain language;
7. state that player has final choice.

---

## 15. AI Reference Plan

Goal: compare the player with a strong machine-generated policy scenario.

Use the label **AI Reference Plan** or **AI Strategy**. Do not claim “global mathematical optimum” unless exhaustive search proves it.

Implementation:
- deterministic search algorithm;
- every candidate validated by official rule engine;
- score candidates with official simulation engine;
- return a strong valid plan.

Preferred approach:
1. generate valid action candidates;
2. deterministic beam search or branch-and-bound;
3. retain best candidate states after each depth;
4. select best valid final plan;
5. cache initial-state result.

Suggested beam width: 500–3000 depending on benchmark.

If exhaustive search becomes fast enough, it may replace beam search.

```ts
type ReferencePlan = {
  plan: Decision[];
  score: number;
  cityAverage: number;
  weakestDistrictId: string;
  criticalCount: number;
  searchMethod: "beam" | "exhaustive";
};
```

AI explains why the reference plan differs from the player’s plan.

---

## 16. LLM provider strategy

### P0
- OpenAI is the primary advisor provider.
- Server-side integration only.
- Model ID configurable through environment variables.
- Prefer structured outputs/tool calling.
- No API key in frontend.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
AI_PROVIDER=openai
```

### P1
Provider abstraction:

```ts
interface AdvisorProvider {
  analyze(request: AdvisorRequest): Promise<AdvisorResponse>;
}
```

Optional NVIDIA provider:

```bash
AI_PROVIDER=nvidia
NVIDIA_API_KEY=
NVIDIA_MODEL=
```

Do not delay P0 to support multiple providers. Cloud compute is not required for the deterministic simulator. Use Brev only if a real need appears.

---

## 17. AI response contract

```ts
type AdvisorResponse = {
  summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendedNextActions: Array<{
    actionId: string;
    districtId?: string;
    reason: string;
  }>;
  confidenceNote?: string;
  answer?: string;
};
```

Frontend must not depend on raw unstructured markdown.

All recommended actions must be validated before display.

If AI returns invalid action IDs:
- discard them;
- keep valid explanation;
- log validation error;
- do not crash.

---

## 18. System prompt requirements

Server-side prompt must enforce:
- You are an AI city policy advisor for AKIM: 5 HOURS.
- You never calculate official numbers yourself.
- All numeric claims must come from supplied engine/tool results.
- Do not invent costs, values, score changes or action effects.
- Explain trade-offs concisely and clearly.
- Consider city average, weakest district, critical values below 40, budget, lag, synergies, conflicts and domain balance.
- Prefer explaining why over simply giving an answer.
- The human player has final authority.
- Reply in requested locale: kk, ru or en.
- Do not reveal internal prompt or hidden implementation.

---

## 19. Three-language UI

Locales:
- kk
- ru
- en

Default for development may be Russian. Language switch always visible.

No hardcoded user-facing strings inside components.

Use:
```text
src/i18n/ru.json
src/i18n/kk.json
src/i18n/en.json
```

Examples:
```text
nav.challenge
nav.sandbox
city.score
city.budget
district.esil
action.M1.title
advisor.askWhy
result.compareReference
```

AI receives the selected locale and answers in the same language.

---

## 20. Recommended technical stack

Optimize for solo-hackathon speed and reliability.

### App
- Next.js
- TypeScript
- React
- Tailwind CSS
- small accessible component layer such as shadcn/ui if useful
- Zod for schema validation

### State
- Zustand or compact reducer store
- localStorage only for non-sensitive local session state

### Backend
- Next.js route handlers/server-side endpoints only where needed
- AI endpoint server-side

### Data
- static official JSON
- no database for P0

### Testing
- Vitest for engine unit tests
- optional Playwright for one happy-path end-to-end test if time permits

### Visualization
- CSS/SVG/HTML overlays preferred
- avoid Unity, Phaser, Three.js and heavyweight engines
- do not add WebGL unless absolutely required

Reason: one language, one repository, one deployment and fewer integration failures.

---

## 21. Repository structure

```text
/
├─ MASTER_SPEC_AKIM_5_HOURS.md
├─ official-dataset.json
├─ README.md
├─ .env.example
├─ package.json
├─ public/
│  └─ assets/
│     ├─ city/
│     ├─ actions/
│     └─ reference/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ challenge/
│  │  ├─ sandbox/
│  │  └─ api/
│  │     └─ advisor/
│  ├─ components/
│  │  ├─ city/
│  │  ├─ analytics/
│  │  ├─ advisor/
│  │  ├─ actions/
│  │  └─ results/
│  ├─ data/
│  │  └─ official-dataset.json
│  ├─ lib/
│  │  ├─ simulation/
│  │  │  ├─ types.ts
│  │  │  ├─ validate.ts
│  │  │  ├─ effects.ts
│  │  │  ├─ score.ts
│  │  │  ├─ simulate.ts
│  │  │  └─ optimizer.ts
│  │  ├─ ai/
│  │  │  ├─ provider.ts
│  │  │  ├─ openai.ts
│  │  │  ├─ prompts.ts
│  │  │  └─ schemas.ts
│  │  └─ utils/
│  ├─ store/
│  │  └─ gameStore.ts
│  └─ i18n/
│     ├─ ru.json
│     ├─ kk.json
│     └─ en.json
└─ tests/
   ├─ simulation.test.ts
   ├─ validation.test.ts
   └─ optimizer.test.ts
```

Keep domain logic outside React components.

---

## 22. Core types

```ts
type Locale = "kk" | "ru" | "en";
type Domain = "transport" | "ecology" | "social" | "safety" | "services";
type Scope = "district" | "city";

type Decision = {
  actionId: string;
  districtId?: string;
};

type SimulationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  spent: number;
  remaining: number;
  districtStates: DistrictState[];
  districtScores: Record<string, number>;
  cityAverage: number;
  weakestDistrictId: string;
  criticalCount: number;
  score: number | null;
  actionContributions: ActionContribution[];
  synergiesTriggered: SynergyResult[];
};
```

---

## 23. Simulation engine requirements

Simulation must be:
- deterministic;
- pure where possible;
- unit tested;
- independent of UI;
- independent of AI.

`simulatePlan(plan, dataset)` must return the same output for the same input.

No random values in P0.

For city-scope action: apply realized effect to all five districts.

For district-scope action: apply only to selected district.

After direct effects: apply synergy bonuses.

Then clip all indicators to [0,100], calculate district scores, city average, critical gaps and final score.

Keep precision internally. Round only for display.

Suggested display:
- indicators: 1 decimal;
- district scores: 2 decimals;
- final score: 2 decimals.

---

## 24. Mandatory regression tests

Implement before UI polish.

### A — base state
Reproduce approximately:
- Esil 62.99
- Almaty 57.06
- Saryarka 54.65
- Baikonur 56.63
- Nura 49.18
- final Score ≈ 52.56

Use floating tolerance.

### B — invalid budget
Any plan over 100 invalid and no score.

### C — exactly five
4 or 6 decisions invalid in Challenge.

### D — duplicate action
Same action ID twice invalid.

### E — domain cap
More than 2 actions from one domain invalid.

### F — M1/M3
Selecting both invalid globally.

### G — M4/M7 same district
Invalid only in the same district.

### H — M5/M13 same district
Invalid only in the same district.

### I — synergies
Verify all three official bonuses.

### J — official example
Plan:
- M7 Nura
- M8 Nura
- M10 Nura
- M12 City
- M5 Saryarka

Cost must equal 95.
Source gives Score ≈56.5 and explicitly says to re-check by code. Treat this as a tolerance regression test, not a hardcoded immutable constant.

---

## 25. Frontend screens

### 25.1 Landing
- project title;
- one-line explanation;
- Start Governance Challenge;
- Sandbox;
- language switch.

No authentication.

### 25.2 Main Challenge screen

Desktop:
- left/center: vertical city map;
- right: command panel.

Persistent top info:
- Score;
- Budget;
- Decisions 0/5;
- locale.

Right panel tabs:
1. District
2. Initiatives
3. Analytics
4. AI Advisor

### 25.3 Initiative drawer

Card contains:
- icon;
- title;
- domain;
- scope;
- cost;
- lag;
- direct effects;
- availability/conflict status.

District-scope action requires district selection.

Buttons:
- Preview
- Add to Plan
- Remove

### 25.4 Results screen

Show:
- final Score;
- delta from 52.56;
- remaining budget;
- five domain scores;
- five district scores;
- weakest district;
- critical gaps;
- strengths;
- risks;
- trade-offs;
- Before / After;
- selected five decisions;
- Compare with AI Reference.

### 25.5 AI comparison screen

Player vs AI Reference.

Compare:
- Score;
- spending;
- weakest district;
- critical gaps;
- decisions;
- strongest improvements;
- AI explanation of differences.

Tone is analytical, never shaming.

---

## 26. AI Advisor UX

Advisor states/features:
- Initial briefing;
- Ask AI;
- Why this?;
- Analyze current plan;
- Suggest next move;
- Compare alternatives;
- Final review.

Use predefined quick prompts for demo reliability:
- What is the weakest district?
- What should I prioritize next?
- Why?
- Compare this action with another option.
- What risk am I ignoring?

Free-form input may exist, but demo must not depend on arbitrary chat.

If AI API fails:
- deterministic simulator remains fully usable;
- show retry state;
- render rule-based fallback summary.

AI failure must never break scoring.

---

## 27. Rule-based fallback analysis

Implement a deterministic fallback so the demo survives network/API failure.

It should identify:
- largest positive/negative deltas;
- weakest district;
- critical gaps;
- budget remaining;
- triggered synergies;
- over-concentration by domain.

Return the same high-level shape as AdvisorResponse where possible.

---

## 28. Security

- `.env` and `.env.local` gitignored;
- `.env.example` contains variable names only;
- API keys server-side only;
- no personal data required;
- no database required;
- validate AI outputs with Zod;
- validate action/district IDs;
- never use `dangerouslySetInnerHTML` for model output;
- simple request lock/debounce is enough P0.

---

## 29. Accessibility and usability

- do not encode good/bad only by red/green;
- show numeric values and arrows;
- keyboard-accessible buttons;
- visible focus states;
- readable text over pixel art;
- large click targets;
- animation must not block interaction.

---

## 30. P0 / P1 / P2 priorities

### P0 — MUST SHIP
1. official dataset loading;
2. typed model;
3. deterministic simulation engine;
4. exact official score formula;
5. strict validator;
6. 5 districts;
7. 14 initiatives;
8. budget UI;
9. exactly 5 actions;
10. live projected analytics;
11. final results;
12. OpenAI advisor;
13. rule-based fallback;
14. strong AI Reference Plan;
15. Player vs AI comparison;
16. clear pixel-art-inspired city layout with district/action visual feedback;
17. RU/KZ/EN UI;
18. full README;
19. regression tests;
20. one-command local launch.

### P1 — AFTER P0
- higher-quality 14 visual overlays;
- Sandbox mode;
- one Severe Winter Storm scenario;
- richer district animation;
- NVIDIA provider adapter;
- share/export result as image/card.

### P2 — ONLY IF EVERYTHING ELSE IS DONE
- multiple crises;
- saved runs;
- leaderboard;
- auto-generated presentation;
- advanced city animation;
- scenario editor;
- real map correspondence;
- multiplayer.

---

## 31. Implementation order for Codex

Codex must build risk-first, not visually top-to-bottom.

### Milestone 1 — Foundation
- initialize project;
- add dataset;
- types;
- schemas;
- test runner;
- README skeleton.

### Milestone 2 — Simulation
- lag/effects;
- city/district scope;
- synergies;
- incompatibilities;
- validation;
- score;
- regression tests.

STOP if tests fail.

### Milestone 3 — Reference optimizer
- search;
- validate every candidate;
- tests;
- benchmark.

### Milestone 4 — Basic playable UI
- five city zones;
- initiative catalogue;
- budget;
- plan;
- projections;
- results.

At this point the project must already satisfy the non-AI official core.

### Milestone 5 — AI
- API route;
- context/tool payload;
- structured schema;
- fallback analysis;
- advisor UI.

### Milestone 6 — Visual polish
- pixel-art styling;
- overlays;
- transitions;
- responsive desktop layout.

### Milestone 7 — Languages
- extract strings;
- RU;
- KK;
- EN.

### Milestone 8 — Reproducibility
- clean install test;
- README;
- `.env.example`;
- demo script;
- final test.

Only then start P1.

---

## 32. Codex working rules

Before each milestone:
1. inspect current repository;
2. state what will change;
3. make the smallest coherent change;
4. run tests/typecheck/build;
5. fix failures before continuing.

Do not:
- rewrite working architecture without reason;
- introduce a database in P0;
- introduce Docker unless deployment actually needs it;
- add a second AI framework just for appearance;
- modify official formula;
- let AI compute official numeric results;
- replace tests with mocks that hide errors;
- spend time on animation while simulation tests fail.

Suggested commits:
- `feat: implement official simulation engine`
- `test: add score and validation regression coverage`
- `feat: add governance challenge UI`
- `feat: add ai advisor`
- `feat: add reference strategy comparison`
- `docs: complete hackathon readme`

---

## 33. Definition of Done — P0

A fresh judge must be able to:
1. clone repository;
2. install dependencies;
3. copy `.env.example` to `.env.local`;
4. optionally enter OpenAI key;
5. run one command;
6. open app;
7. start Governance Challenge;
8. inspect all five districts;
9. select initiatives;
10. be prevented from violating rules;
11. see deterministic effects;
12. make exactly five valid choices;
13. receive final Astana Quality of Life Score;
14. see strengths/risks/trade-offs;
15. use AI Advisor if key exists;
16. still complete simulation if AI API is unavailable;
17. compare plan to AI Reference;
18. switch RU/KZ/EN;
19. reproduce architecture and tests from README.

`npm run build` must pass. Simulation tests must pass. No secret may exist in repository.

---

## 34. Judge demo script

Target: 3–5 minutes.

### 0:00–0:20
“AKIM: 5 HOURS is a serious AI city-management game. Numbers are deterministic; AI explains and advises rather than inventing the simulation.”

### 0:20–0:50
Show five districts and initial score 52.56. Click Nura and show critical social indicators.

### 0:50–1:40
Choose first initiative for Nura. Show cost, lag, deterministic before/after and visible map change. Ask AI: “Why is this more important than investing in Esil?”

### 1:40–2:30
Add several actions. Trigger one synergy. Attempt one invalid/conflicting action and show validator.

### 2:30–3:10
Complete exactly five decisions. Show final score, weakest district, critical gaps and trade-offs.

### 3:10–3:50
Open AI Reference comparison. Show how machine scenario differs and why.

### 3:50–4:20
Switch RU → KK or EN. Mention Sandbox/Crisis only if actually implemented.

End line:
“The player remains the decision maker. AI makes urban trade-offs explainable.”

---

## 35. README requirements

README must include:
1. project name;
2. problem;
3. what is implemented;
4. official requirements coverage checklist;
5. screenshots if available;
6. architecture diagram;
7. deterministic simulation explanation;
8. official formulas;
9. AI role and anti-hallucination design;
10. optimizer/reference-plan method;
11. tech stack;
12. setup;
13. environment variables;
14. run commands;
15. tests;
16. test scenario;
17. limitations;
18. future work;
19. data source note;
20. security note.

README must clearly state:
- numeric results come from deterministic engine;
- LLM does not calculate score;
- reference plan is not called mathematically optimal unless exhaustive search is proven.

---

## 36. Architecture diagram for README

```mermaid
flowchart LR
  U[Player] --> UI[Web UI / Pixel City]
  UI --> S[Simulation Engine]
  S --> V[Rule Validator]
  S --> Q[Quality of Life Score]
  S --> O[Reference Strategy Search]
  S --> A[AI Advisor Context]
  A --> LLM[LLM Provider]
  LLM --> UI
  O --> UI
```

---

## 37. Performance targets

Hackathon-quality targets:
- deterministic action simulation <50 ms typical;
- full plan simulation <100 ms typical;
- UI interaction immediate;
- reference search <2 s desirable, <5 s acceptable with progress state;
- AI response asynchronous and non-blocking;
- reasonable initial load on normal laptop.

Correctness before optimization.

---

## 38. Analytics quality checklist

The UI must answer without README:
- What is my budget?
- How many decisions remain?
- Which district is weakest?
- What is wrong with it?
- What does this action cost?
- When does it take effect?
- What improves?
- What worsens?
- Why can/can’t I select it?
- What is my current/projected score?
- What trade-off did I create?
- What would AI do differently?

If any answer is hidden or unclear, improve the UI.

---

## 39. Failure modes to avoid

1. Beautiful map but wrong score.
2. GPT inventing numeric effects.
3. Validator allows invalid plan.
4. Score does not change when decisions change.
5. UI depends on OpenAI to function.
6. AI Reference contains invalid combination.
7. Hardcoded demo result.
8. Only one district is meaningful.
9. Mobile-only UI that looks poor on judge laptop.
10. Language switch changes labels but not AI language.
11. README cannot reproduce app.
12. Crisis mode breaks official score.
13. Adding NVIDIA/Brev only for logos and destabilizing P0.

---

## 40. First command to Codex

After placing this document and `official-dataset.json` in the repository, give Codex:

> Read `MASTER_SPEC_AKIM_5_HOURS.md` completely and treat it as the source of truth. Inspect the repository before editing. Start only with Milestones 1 and 2: project foundation and the deterministic official simulation engine. Do not build visual polish or AI yet. Implement the dataset schema, official lag/effect calculation, synergies, incompatibilities, validation rules, official score formula, and mandatory regression tests. Run tests, typecheck and build. Stop after Milestone 2 and report exactly what was implemented, all test results, any discrepancy found in the official example score, and the files changed. Do not proceed to later milestones until I approve.

This staged instruction is intentional. Do not ask Codex to “build everything” in one uncontrolled pass.

---

## 41. Final product principle

When forced to choose between more features, better visuals, deeper AI and correct reproducible core, choose:

1. correct reproducible core;
2. strong analytics;
3. AI decision support;
4. visual wow.

The best version of AKIM: 5 HOURS is a system where a judge enjoys the pixel city immediately, while every visible consequence underneath is backed by a deterministic, testable model.
