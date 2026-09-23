import { afterEach, describe, expect, it, vi } from "vitest";
import { advise } from "../src/lib/advisor/service";
import { fallbackAnalysis } from "../src/lib/advisor/fallback";
import {
  advisorRequestSchema,
  containsNumericClaim,
} from "../src/lib/advisor/contracts";
import { POST } from "../src/app/api/advisor/route";
import { examplePlan } from "./fixtures";

const request = {
  plan: [],
  locale: "en",
  topic: "priority",
  question: "",
} as const;
const modelAnswer = {
  summary: "Focus on Nura's social infrastructure.",
  answer: "Address the weakest district while considering opportunity cost.",
  strengths: ["The city gains from targeted investment."],
  risks: ["Critical social gaps remain."],
  tradeoffs: ["Budget spent here cannot fund transport."],
  recommendedNextActions: [
    { actionId: "M7", districtId: "nura", reason: "Improve school access." },
  ],
};
function responseFor(payload: unknown, status = "completed") {
  return new Response(
    JSON.stringify({
      status,
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(payload) }],
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
afterEach(() => vi.unstubAllEnvs());

describe("deterministic fallback", () => {
  it("works without keys and never calls an external provider", async () => {
    const fetcher = vi.fn();
    const result = await advise(advisorRequestSchema.parse(request), {
      fetcher,
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.mode).toBe("fallback");
    expect(result.summary).toContain("Nura");
    expect(result.risks).toHaveLength(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
  it("explains improvements, eliminated gaps, synergy, budget and reference", () => {
    const result = fallbackAnalysis(examplePlan, "en", "reference");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.risks).toEqual([]);
    expect(result.synergies).toHaveLength(1);
    expect(result.budgetNote).toContain("95");
    expect(result.comparison).toContain("57.24");
    expect(result.recommendations).toEqual([]);
  });
  it.each(["ru", "kk"] as const)("generates local advice in %s", (locale) => {
    const result = fallbackAnalysis([], locale);
    expect(result.summary).not.toBe(fallbackAnalysis([], "en").summary);
    expect(result.summary).toMatch(/[а-яәіңғүұқөһ]/i);
  });
});

describe("OpenAI explanation boundary", () => {
  it("uses structured Responses output and only sends server-calculated context", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(responseFor(modelAnswer));
    const result = await advise(advisorRequestSchema.parse(request), {
      apiKey: "test-key",
      model: "test-model",
      fetcher,
    });
    expect(result.mode).toBe("openai");
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init!.body));
    expect(body.text.format.type).toBe("json_schema");
    expect(body.store).toBe(false);
    expect(JSON.parse(body.input).projection.score).toBeCloseTo(52.55768, 8);
    expect(String(init!.body)).not.toContain("test-key");
  });
  it("discards fabricated or unsupported recommendations", async () => {
    const answer = {
      ...modelAnswer,
      recommendedNextActions: [
        modelAnswer.recommendedNextActions[0],
        { actionId: "M999", districtId: null, reason: "Invented policy." },
        { actionId: "M2", districtId: "nura", reason: "Wrong scope." },
      ],
    };
    const result = await advise(advisorRequestSchema.parse(request), {
      apiKey: "test",
      model: "test",
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(responseFor(answer)),
    });
    expect(result.mode).toBe("openai");
    if ("recommendedNextActions" in result)
      expect(result.recommendedNextActions).toEqual([
        modelAnswer.recommendedNextActions[0],
      ]);
    else throw new Error("Expected a validated explanation");
  });
  it.each([
    { ...modelAnswer, answer: "Your score will be 99.9." },
    { summary: "Missing structured fields" },
    { ...modelAnswer, answer: "Budget is １００." },
    { ...modelAnswer, answer: "Choose M999 to improve the city." },
  ])(
    "falls back on invented numeric prose or malformed output",
    async (answer) => {
      expect(
        (
          await advise(advisorRequestSchema.parse(request), {
            apiKey: "test",
            model: "test",
            fetcher: vi
              .fn<typeof fetch>()
              .mockResolvedValue(responseFor(answer)),
          })
        ).mode,
      ).toBe("fallback");
    },
  );
  it("allows action IDs but not unsupported numbers", () => {
    expect(containsNumericClaim("M7 improves S1.")).toBe(false);
    expect(containsNumericClaim("M7 adds 10 points.")).toBe(true);
  });
  it.each(["refusal", "incomplete", "http", "network", "invalid-json"])(
    "retains simulation and local advice after %s",
    async (failure) => {
      const fetcher = vi.fn<typeof fetch>();
      if (failure === "network")
        fetcher.mockRejectedValue(new Error("offline"));
      else if (failure === "http")
        fetcher.mockResolvedValue(new Response("unavailable", { status: 503 }));
      else if (failure === "invalid-json")
        fetcher.mockResolvedValue(new Response("not json"));
      else if (failure === "incomplete")
        fetcher.mockResolvedValue(responseFor(modelAnswer, "incomplete"));
      else
        fetcher.mockResolvedValue(
          new Response(
            JSON.stringify({
              status: "completed",
              output: [
                {
                  type: "message",
                  content: [{ type: "refusal", refusal: "No" }],
                },
              ],
            }),
          ),
        );
      expect(
        (
          await advise(advisorRequestSchema.parse(request), {
            apiKey: "test",
            model: "test",
            fetcher,
          })
        ).mode,
      ).toBe("fallback");
    },
  );
});

describe("advisor HTTP input validation", () => {
  it("returns useful no-key fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");
    const response = await POST(
      new Request("http://localhost/api/advisor", {
        method: "POST",
        body: JSON.stringify(request),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).mode).toBe("fallback");
  });
  it("accepts the matching browser-facing Host when Next normalizes its internal URL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");
    const response = await POST(
      new Request("http://localhost:3000/api/advisor", {
        method: "POST",
        body: JSON.stringify(request),
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      }),
    );
    expect(response.status).toBe(200);
  });
  it.each([
    "broken json",
    JSON.stringify({ ...request, plan: [{ actionId: "M99" }] }),
    JSON.stringify({ ...request, score: 100 }),
    JSON.stringify({
      ...request,
      plan: [
        { actionId: "M1", districtId: "nura" },
        { actionId: "M3", districtId: "esil" },
      ],
    }),
  ])("rejects malformed, invented, or conflicting input", async (body) => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/advisor", { method: "POST", body }),
        )
      ).status,
    ).toBe(400);
  });
  it("rejects oversized requests and cross-origin requests", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/advisor", {
            method: "POST",
            body: "x".repeat(12001),
          }),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await POST(
          new Request("http://localhost/api/advisor", {
            method: "POST",
            body: JSON.stringify(request),
            headers: { origin: "https://unrelated.example" },
          }),
        )
      ).status,
    ).toBe(403);
  });
});
