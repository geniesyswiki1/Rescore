"use client";

import { useState } from "react";
import type { AreaScores } from "@rescore/content/scoring";
import { AreaSentences, ScorePanel } from "./ScorePanel";

interface ClassifiedItem {
  original_text: string;
  area: "hygiene" | "structure" | "confidence";
  taxonomy_id: string | null;
  legal_basis: string | null;
  is_priority: boolean;
}

interface Classification {
  rating_before: number | null;
  scores_before: { hygiene: number | null; structure: number | null; confidence: number | null };
  scores_are_stated: boolean;
  items: ClassifiedItem[];
  hard_stops: Array<{ id: string; original_text: string }>;
  out_of_scope: string | null;
}

const AREA_LABELS: Record<ClassifiedItem["area"], string> = {
  hygiene: "Hygienic food handling",
  structure: "Cleanliness and condition of facilities and building",
  confidence: "Management of food safety",
};

/** The hero. Paste or upload the report, and the three bars appear as it is read. */
export function ReportReader({ price }: { price: number }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Classification | null>(null);

  async function read() {
    setStatus("reading");
    setMessage(null);
    setResult(null);
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(body.error ?? "We could not read that report. Try pasting the text of the letter.");
        return;
      }
      setResult(body as Classification);
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("We could not reach the reader. Check your connection and try again.");
    }
  }

  const scores: AreaScores | null =
    result &&
    result.scores_before.hygiene !== null &&
    result.scores_before.structure !== null &&
    result.scores_before.confidence !== null
      ? {
          hygiene: result.scores_before.hygiene,
          structure: result.scores_before.structure,
          confidence: result.scores_before.confidence,
        }
      : null;

  return (
    <section>
      <div className="panel">
        <label htmlFor="report" className="archivo" style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
          Upload the inspection report and the officer&apos;s letter
        </label>
        <textarea
          id="report"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the text of your inspection report and the officer's letter here."
          aria-describedby="report-help"
        />
        <p id="report-help" className="small" style={{ marginTop: 8 }}>
          PDF or photos. Nothing is stored until you start a case.
        </p>
        <button type="button" onClick={read} disabled={status === "reading" || text.trim().length < 40}>
          {status === "reading" ? "Reading your report" : "Read my report"}
        </button>
      </div>

      {status === "error" && message ? (
        <p className="item-open" role="alert">
          {message}
        </p>
      ) : null}

      {result ? (
        <div style={{ marginTop: "2rem" }}>
          {result.out_of_scope ? (
            <div className="panel">
              <h2>This one is outside what Rescore covers</h2>
              <p>{result.out_of_scope}</p>
            </div>
          ) : null}

          {result.hard_stops.length > 0 ? (
            <div className="panel" style={{ borderColor: "var(--open)" }}>
              <h2 className="item-open">Read this first</h2>
              <p>
                Some of this needs to be fixed before any paperwork matters, and some of it may need a
                specialist. Here is what the report says must happen first, and where to get help. Come back
                when it is done; your case will be waiting.
              </p>
              <ul>
                {result.hard_stops.map((stop) => (
                  <li key={stop.id}>{stop.original_text}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="layout">
            <div>
              <h2>
                {result.items.length} item{result.items.length === 1 ? "" : "s"} from your report
              </h2>
              {(["confidence", "hygiene", "structure"] as const).map((area) => {
                const areaItems = result.items.filter((item) => item.area === area);
                if (areaItems.length === 0) return null;
                return (
                  <div key={area}>
                    <h3 className="archivo" style={{ fontSize: 17 }}>
                      {AREA_LABELS[area]}
                    </h3>
                    <ul>
                      {areaItems.map((item, index) => (
                        <li key={`${area}-${index}`}>
                          {item.original_text}
                          {item.legal_basis ? <span className="muted"> ({item.legal_basis})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {scores ? <AreaSentences scores={scores} /> : null}
              {!result.scores_are_stated ? (
                <p className="small">
                  Your report did not give the three scores. We have listed the items the officer wrote down.
                  The scores are on the letter that came with the rating, if you have it.
                </p>
              ) : null}
              <p>
                <a className="button" href="/pricing">
                  Build my re-rating pack, GBP {price}
                </a>
              </p>
            </div>
            {scores ? <ScorePanel scores={scores} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
