import { NextResponse } from "next/server";
import { classifyPrompt } from "@rescore/content/prompts";
import { hardStopsIn } from "@rescore/content/items";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_CLASSIFY_MODEL ?? "claude-sonnet-5";
const MAX_REPORT_CHARS = 60000;
const MIN_REPORT_CHARS = 40;

interface ClassifyRequest {
  text?: string;
}

/**
 * Reads an inspection report and returns the items, the scores and any hard stops.
 *
 * Free and unauthenticated, so it is rate limited and size capped. Nothing is stored:
 * the text goes to the model and the result goes back to the browser.
 */
export async function POST(request: Request) {
  // The reader is free and unauthenticated, and every call spends money, so it is
  // counted before anything else happens.
  const rate = await checkRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: rate.reason },
      {
        status: 429,
        headers: rate.retryAfter ? { "retry-after": String(rate.retryAfter) } : undefined,
      },
    );
  }

  let body: ClassifyRequest;
  try {
    body = (await request.json()) as ClassifyRequest;
  } catch {
    return NextResponse.json({ error: "Send the report as JSON with a text field." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < MIN_REPORT_CHARS) {
    return NextResponse.json(
      { error: "Paste a bit more of the report. We need the officer's list of items to read it." },
      { status: 400 },
    );
  }
  if (text.length > MAX_REPORT_CHARS) {
    return NextResponse.json(
      { error: "That is longer than we can read in one go. Paste the report and the letter of required works only." },
      { status: 413 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The report reader is not configured on this deployment. Set ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        temperature: 0,
        system: classifyPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      // The status is worth returning: it is the difference between a key problem and a
      // busy model, and it carries nothing sensitive.
      console.error(`classify: upstream returned ${response.status}`);
      return NextResponse.json(
        { error: "We could not read that report just now. Try again in a moment.", upstream: response.status },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw = payload.content?.find((part) => part.type === "text")?.text ?? "";
    const parsed = parseJson(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "We could not make sense of that report. Try pasting the text of the letter instead." },
        { status: 422 },
      );
    }

    // A second pass on the operator's own wording, so a hard stop is never missed because
    // the model did not flag it. The model's own flags are kept alongside.
    const localStops = hardStopsIn(text).map((signal) => ({ id: signal.id, original_text: signal.reason }));
    const modelStops = Array.isArray(parsed.hard_stops) ? parsed.hard_stops : [];
    const seen = new Set(modelStops.map((stop: { id?: string }) => stop.id));
    parsed.hard_stops = [...modelStops, ...localStops.filter((stop) => !seen.has(stop.id))];

    return NextResponse.json(parsed, {
      headers: { "cache-control": "no-store" },
    });
  } catch (problem) {
    console.error("classify: request failed", problem);
    return NextResponse.json({ error: "The report reader is unavailable. Try again shortly." }, { status: 502 });
  }
}

/** Models sometimes wrap JSON in prose or a fence. Take the object either way. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJson(raw: string): any | null {
  const trimmed = raw.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const candidate = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
