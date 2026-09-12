import thresholds from "./thresholds.json" with { type: "json" };

export type AreaKey = "hygiene" | "structure" | "confidence";
export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

/** The three intervention rating scores an officer records. Lower is better. */
export type AreaScores = Record<AreaKey, number>;

export interface RatingBand {
  rating: Rating;
  descriptor: string;
  totalMin: number;
  totalMax: number;
  /** The additional scoring factor: no individual score may be greater than this. Null at rating 0. */
  maxIndividual: number | null;
}

export interface AreaDefinition {
  key: AreaKey;
  label: string;
  shortLabel: string;
  permittedScores: number[];
  worst: number;
  covers: string;
  movedBy: string;
}

export const AREA_KEYS: readonly AreaKey[] = ["hygiene", "structure", "confidence"] as const;

export const areas = thresholds.areas as AreaDefinition[];
export const ratingBands = thresholds.ratingBands as RatingBand[];
export const revisitRules = thresholds.revisit;
export const rightToReplyRules = thresholds.rightToReply;
export const fsaAttribution = thresholds.attribution;
export const thresholdSource = thresholds.source;

export function area(key: AreaKey): AreaDefinition {
  const found = areas.find((a) => a.key === key);
  if (!found) throw new Error(`Unknown area: ${key}`);
  return found;
}

export function band(rating: Rating): RatingBand {
  const found = ratingBands.find((b) => b.rating === rating);
  if (!found) throw new Error(`Unknown rating: ${rating}`);
  return found;
}

/** Plain-English meaning of a single area score, as published in the Brand Standard's descriptions. */
export function scoreMeaning(key: AreaKey, score: number): string | null {
  const table = thresholds.scoreMeanings[key] as Record<string, string>;
  return table[String(score)] ?? null;
}

export function isPermittedScore(key: AreaKey, score: number): boolean {
  return area(key).permittedScores.includes(score);
}

/** Throws if any score is not one of the values an officer is allowed to record. */
export function assertPermittedScores(scores: AreaScores): void {
  for (const key of AREA_KEYS) {
    const value = scores[key];
    if (!isPermittedScore(key, value)) {
      throw new Error(
        `${area(key).label} cannot be scored ${value}. Permitted: ${area(key).permittedScores.join(", ")}.`,
      );
    }
  }
}

export function total(scores: AreaScores): number {
  return AREA_KEYS.reduce((sum, key) => sum + scores[key], 0);
}

export function highest(scores: AreaScores): number {
  return Math.max(...AREA_KEYS.map((key) => scores[key]));
}

export interface RatingResult {
  rating: Rating;
  descriptor: string;
  total: number;
  highest: number;
  /** The band the total alone would have produced, before the additional scoring factor was applied. */
  bandFromTotal: Rating;
  /** True where a single area pulled the rating below what the total alone would have given. */
  cappedByWorstArea: boolean;
  /** The area holding the rating down, where one does. */
  limitingArea: AreaKey | null;
}

/**
 * Maps the three intervention rating scores to a food hygiene rating.
 *
 * Brand Standard Table 3: the total decides the band, then the additional scoring factor
 * drops the rating until no individual score exceeds the factor for that rating.
 */
export function ratingFor(scores: AreaScores): RatingResult {
  assertPermittedScores(scores);
  const sum = total(scores);
  const worst = highest(scores);

  const fromTotal = ratingBands.find((b) => sum >= b.totalMin && sum <= b.totalMax);
  if (!fromTotal) throw new Error(`No rating band covers a total of ${sum}.`);

  let result = fromTotal;
  while (result.maxIndividual !== null && worst > result.maxIndividual) {
    const next = ratingBands.find((b) => b.rating === result.rating - 1);
    if (!next) throw new Error(`No band below rating ${result.rating}.`);
    result = next;
  }

  const capped = result.rating !== fromTotal.rating;
  const limiting = capped
    ? (AREA_KEYS.find((key) => scores[key] === worst) ?? null)
    : null;

  return {
    rating: result.rating,
    descriptor: result.descriptor,
    total: sum,
    highest: worst,
    bandFromTotal: fromTotal.rating,
    cappedByWorstArea: capped,
    limitingArea: limiting,
  };
}

export interface TargetRequirement {
  /** The total must be at or below this. */
  totalMax: number;
  /** No single area may be above this. */
  individualMax: number | null;
}

/** What the three scores have to look like to reach a target rating or better. */
export function requirementsFor(target: Rating): TargetRequirement {
  const b = band(target);
  return { totalMax: b.totalMax, individualMax: b.maxIndividual };
}

export interface AreaGap {
  key: AreaKey;
  label: string;
  shortLabel: string;
  current: number;
  /** The highest this area may score at the target rating. */
  cap: number | null;
  /** Points that must come off this area on the individual cap alone. */
  mustLose: number;
  movedBy: string;
}

export interface Gap {
  target: Rating;
  targetDescriptor: string;
  currentRating: Rating;
  alreadyThere: boolean;
  total: number;
  totalMax: number;
  /** Points that must come off across all three areas once the individual caps are met. */
  totalMustLose: number;
  areas: AreaGap[];
}

/**
 * What has to change to reach a target rating.
 *
 * Returns the cap for each area and the further reduction the total needs once every
 * area is inside its cap, so the score panel can say "20 to 10 needed for a 3".
 */
export function gapTo(scores: AreaScores, target: Rating): Gap {
  assertPermittedScores(scores);
  const current = ratingFor(scores);
  const req = requirementsFor(target);

  const areaGaps: AreaGap[] = AREA_KEYS.map((key) => {
    const def = area(key);
    const value = scores[key];
    const cap = req.individualMax;
    return {
      key,
      label: def.label,
      shortLabel: def.shortLabel,
      current: value,
      cap,
      mustLose: cap === null ? 0 : Math.max(0, value - cap),
      movedBy: def.movedBy,
    };
  });

  // Once every area sits at or below its cap, this is the total that remains.
  const cappedTotal = areaGaps.reduce((sum, g) => sum + (g.current - g.mustLose), 0);

  return {
    target,
    targetDescriptor: band(target).descriptor,
    currentRating: current.rating,
    alreadyThere: current.rating >= target,
    total: current.total,
    totalMax: req.totalMax,
    totalMustLose: Math.max(0, cappedTotal - req.totalMax),
    areas: areaGaps,
  };
}

/** The next rating up from where the business is now, or null at a 5. */
export function nextRatingUp(scores: AreaScores): Rating | null {
  const current = ratingFor(scores).rating;
  return current >= 5 ? null : ((current + 1) as Rating);
}

/**
 * One sentence per area for the hero, in the product voice.
 *
 * "Management of food safety: 20 points. You need this at 10 or below for a 3,
 *  5 or below for a 5. That is your paperwork, not your kitchen."
 */
export function heroSentence(scores: AreaScores, key: AreaKey): string {
  const def = area(key);
  const value = scores[key];
  const forThree = requirementsFor(3).individualMax;
  const forFive = requirementsFor(5).individualMax;
  if (value === 0) {
    return `${def.label}: 0 points. Nothing to take off here.`;
  }
  return (
    `${def.label}: ${value} points. ` +
    `You need this at ${forThree} or below for a 3, ${forFive} or below for a 5. ` +
    `That is ${def.movedBy}.`
  );
}

/** Every combination of permitted scores, used by the tests and by the content checks. */
export function allPermittedCombinations(): AreaScores[] {
  const out: AreaScores[] = [];
  for (const h of area("hygiene").permittedScores) {
    for (const s of area("structure").permittedScores) {
      for (const c of area("confidence").permittedScores) {
        out.push({ hygiene: h, structure: s, confidence: c });
      }
    }
  }
  return out;
}
