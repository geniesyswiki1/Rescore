import { revisitRules, fsaAttribution } from "../scoring/index.js";
import councilsData from "./councils.json" with { type: "json" };
import overridesData from "./overrides.json" with { type: "json" };
import type { Council, CouncilRevisit } from "./types.js";

export type { Council, CouncilRevisit, RequestRoute } from "./types.js";

const overrides = (overridesData as { councils: Record<string, Partial<CouncilRevisit>> }).councils;

/**
 * Councils as seeded from the FSA, with any hand-checked re-visit facts merged on top.
 *
 * A council with no override keeps every re-visit field null, which is what makes the
 * page say "check with [council]" instead of inventing a fee.
 */
export const councils: Council[] = (councilsData as Council[]).map((council) => {
  const override = overrides[council.slug];
  return override ? { ...council, revisit: { ...council.revisit, ...override } } : council;
});

export const launchCouncils: Council[] = councils.filter((c) => c.isLaunch);

const bySlugIndex = new Map(councils.map((c) => [c.slug, c]));
const byIdIndex = new Map(councils.map((c) => [c.id, c]));

export function councilBySlug(slug: string): Council | undefined {
  return bySlugIndex.get(slug);
}

export function councilById(id: number): Council | undefined {
  return byIdIndex.get(id);
}

export function searchCouncils(query: string): Council[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return councils.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 20);
}

export interface RevisitFacts {
  /** True where this council's own page has been read and the fee position is known. */
  known: boolean;
  /** What Rescore can say about the fee, in the council's terms or the scheme's. */
  fee: string;
  /** How to send the request. */
  route: string;
  /** How long the wait should be, from the council or from the Brand Standard. */
  wait: string;
  /** Where the operator should check for themselves. */
  checkWith: string;
  sourceUrl: string | null;
  checkedOn: string | null;
}

/**
 * What the case and the council landing page may say about a re-visit.
 *
 * Where the council's own page has not been read, this falls back to the Brand Standard's
 * general rules and tells the operator to check with the council. It never invents a fee.
 */
export function revisitFacts(council: Council): RevisitFacts {
  const r = council.revisit;
  const checkWith = `Check with ${council.name} before you pay anything.`;

  if (r.checkedOn === null || r.charges === null) {
    return {
      known: false,
      fee: `We do not have a published fee for ${council.name}. Each authority decides whether to charge for a requested re-visit and sets its own amount.`,
      route: council.schemeUrl
        ? `Send the request through the food hygiene pages at ${council.schemeUrl}.`
        : council.email
          ? `Send the request to ${council.email}.`
          : `Ask ${council.name} where to send the request.`,
      wait: `Where no fee is charged, the re-visit cannot happen until ${revisitRules.noFee.standstillMonths} months have passed since the inspection, and should happen within ${revisitRules.noFee.visitWithinMonthsOfStandstillEnd} months after that, so up to ${revisitRules.noFee.maximumWaitMonths} months in all. Where a fee is charged there is no standstill and the visit should happen within ${revisitRules.withFee.visitWithinMonthsOfRequestOrPayment} months of your request or payment.`,
      checkWith,
      sourceUrl: null,
      checkedOn: null,
    };
  }

  const fee = r.charges
    ? r.feeGbp !== null
      ? `${council.name} charges GBP ${r.feeGbp} for a requested re-visit.`
      : `${council.name} charges for a requested re-visit but does not publish the amount.`
    : `${council.name} does not charge for a requested re-visit.`;

  const route =
    r.requestUrl !== null
      ? `Send the request through ${r.requestUrl}.`
      : council.email
        ? `Send the request to ${council.email}.`
        : `Ask ${council.name} where to send the request.`;

  const wait =
    r.statedWait ??
    (r.charges
      ? `No standstill period applies where a fee is charged. The visit should happen within ${revisitRules.withFee.visitWithinMonthsOfRequestOrPayment} months of your request or your payment, whichever is later.`
      : `A ${revisitRules.noFee.standstillMonths} month standstill applies from the inspection, then the visit should happen within ${revisitRules.noFee.visitWithinMonthsOfStandstillEnd} months, so up to ${revisitRules.noFee.maximumWaitMonths} months in all. Where no fee is charged you get one requested re-visit for each planned inspection.`);

  return { known: true, fee, route, wait, checkWith, sourceUrl: r.sourceUrl, checkedOn: r.checkedOn };
}

/** Every page that shows FSA-derived data carries this line. */
export const attribution = fsaAttribution;
