import { advisorRequestSchema } from "../../../lib/advisor/contracts";
import { advise } from "../../../lib/advisor/service";
import { previewPlan } from "../../../lib/planning/preview";
import { officialDataset } from "../../../data/dataset";

export const runtime = "nodejs";
let pending = 0;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    // Next.js can normalize request.url to localhost internally. The Host header
    // retains the browser-facing origin, including its port.
    const host = request.headers.get("host") ?? new URL(request.url).host;
    if (origin && new URL(origin).host !== host)
      return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403 });
    const body = await request.text();
    if (body.length > 12000)
      return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
    const parsed = advisorRequestSchema.safeParse(JSON.parse(body));
    if (!parsed.success)
      return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const plan = parsed.data.plan.map((d) => ({
      actionId: d.actionId,
      ...(d.districtId ? { districtId: d.districtId } : {}),
    }));
    if (!previewPlan(plan, officialDataset).available)
      return Response.json({ error: "INVALID_PLAN" }, { status: 400 });
    const config =
      pending >= 2
        ? {}
        : {
            ...(process.env.OPENAI_API_KEY
              ? { apiKey: process.env.OPENAI_API_KEY }
              : {}),
            ...(process.env.OPENAI_MODEL
              ? { model: process.env.OPENAI_MODEL }
              : {}),
          };
    pending++;
    try {
      return Response.json(await advise(parsed.data, config), {
        headers: { "Cache-Control": "no-store" },
      });
    } finally {
      pending--;
    }
  } catch {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
}
