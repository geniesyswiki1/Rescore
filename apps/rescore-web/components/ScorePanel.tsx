import {
  type AreaScores,
  type Rating,
  areas,
  gapTo,
  heroSentence,
  ratingFor,
} from "@rescore/content/scoring";

/**
 * The three bars: what each area scored, and the cap it has to sit under for the target.
 *
 * Lower is better in this scheme, so a full bar is a bad score. The bar runs from 0 to the
 * worst score the area can be given, and the marker is the cap for the target rating.
 */
export function ScorePanel({
  scores,
  target,
}: {
  scores: AreaScores;
  target?: Rating;
}) {
  const result = ratingFor(scores);
  const goal: Rating = target ?? (result.rating >= 3 ? 5 : 3);
  const gap = gapTo(scores, goal);

  return (
    <aside className="panel score-panel" aria-label="Your three area scores">
      <p className="small" style={{ marginTop: 0 }}>
        Rating {result.rating}, {result.descriptor.toLowerCase()}. {result.total} points in total.
      </p>

      {areas.map((area) => {
        const value = scores[area.key];
        const areaGap = gap.areas.find((a) => a.key === area.key);
        const cap = areaGap?.cap ?? null;
        const width = Math.round((value / area.worst) * 100);
        const capLeft = cap === null ? null : Math.round((cap / area.worst) * 100);
        const inside = cap === null || value <= cap;

        return (
          <div className="score-row" key={area.key}>
            <span className="score-label">
              <span>{area.shortLabel}</span>
              <span className={inside ? "item-done" : "item-open"}>
                {value}
                {cap === null ? "" : ` to ${cap}`}
              </span>
            </span>
            <div
              className="bar"
              role="img"
              aria-label={`${area.label}: ${value} points out of a worst possible ${area.worst}${cap === null ? "" : `, needs to be ${cap} or below for a ${goal}`}`}
            >
              <div className={`bar-fill${inside ? " good" : ""}`} style={{ width: `${width}%` }} />
              {capLeft === null ? null : <div className="bar-target" style={{ left: `${capLeft}%` }} />}
            </div>
          </div>
        );
      })}

      {result.cappedByWorstArea && result.limitingArea ? (
        <p className="small" style={{ marginTop: "1.25rem" }}>
          One area is holding the whole rating down. Your total alone would have given a{" "}
          {result.bandFromTotal}.
        </p>
      ) : null}

      <p className="small">
        {gap.alreadyThere
          ? `You are already at a ${goal} or better.`
          : `For a ${goal}: total ${gap.totalMax} or below, no single area above ${gap.areas[0]?.cap ?? "the cap"}.`}
      </p>
    </aside>
  );
}

/** One sentence per area, in Archivo, as the hero shows after the report is read. */
export function AreaSentences({ scores }: { scores: AreaScores }) {
  return (
    <div>
      {areas.map((area) => (
        <p className="archivo" key={area.key} style={{ fontSize: 17, fontWeight: 500 }}>
          {heroSentence(scores, area.key)}
        </p>
      ))}
    </div>
  );
}
