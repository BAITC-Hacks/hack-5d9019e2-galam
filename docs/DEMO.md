# AKIM: 5 HOURS — 3-minute judge demo

Run the production build: `pnpm build`, then `pnpm start`. Open `http://localhost:3000`.

## 0:00 — State the product

“AKIM: 5 HOURS is an AI-assisted deterministic city-management simulator. The human chooses; the official engine calculates.”

Point to the visible challenge guide: a budget of **100**, exactly **5** decisions, and the live projected score.

## 0:15 — Show the city problem

Point to Nura as the weakest district and its two critical indicators: schools **38** and primary healthcare **35**. Select Nura on the map and show its district score and needs.

## 0:40 — Show a real constraint

Open **Initiatives**, choose Esil, add **M1**, and show that **M3** is unavailable because it conflicts globally. Remove M1.

“The validator prevents invalid plans before they reach the engine.”

## 1:00 — Build a valid strategy

Use **Load official example** for a reliable, fast demo. It loads:

- M7 → Nura
- M8 → Nura
- M10 → Nura
- M12 → City
- M5 → Saryarka

Point to projected **56.54**, cost **95**, remaining budget **5**, and the safety synergy. Open **Analytics** to show deterministic before/after effects.

## 1:35 — Show final outcome and reference

Press **Confirm city strategy**. Show **52.56 → 56.54**, the delta, critical gaps **2 → 0**, and the weakest-district result.

Press **Compare with AI Reference Strategy**.

“We exhaustively evaluated **694,395** valid plans. The best reference score is **57.236735**. This is deterministic search, not an LLM calculation.”

## 2:15 — Show AI assistance and languages

Open **AI Advisor** and ask: “Why is the reference strategy stronger?”

Point out that the advisor explains strengths, risks, and trade-offs while the score cards stay engine-generated. If live OpenAI is unavailable, the deterministic local advisor remains visible.

Switch **RU**, then **KZ** briefly.

## 2:50 — Close

“The AI explains and recommends. The deterministic engine calculates the official numbers.”

## Recovery

- **Start over** resets the challenge.
- **Load official example** restores a valid reproducible plan through the real engine.
- Do not rely on a live API key: local deterministic advisor fallback is always available.
