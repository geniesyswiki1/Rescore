/**
 * Page content for the 70 landing pages, from spec sections 5.1, 5.2 and 8.1.
 *
 * 5 rating pages, 3 fix pages, 3 platform pages and 59 council pages.
 */
import { areas, band, requirementsFor, type AreaKey, type Rating } from "./scoring/index.js";
import { itemsForArea } from "./items/index.js";
import { launchCouncils } from "./councils/index.js";
import { platforms } from "./platforms/index.js";

export const PRICE = { r01: 149, r2: 99, r34: 49, premises: 79 } as const;

export const home = {
  headline: "Rated 0, 1 or 2? Here is exactly what to fix, prove and send back.",
  sub:
    "Upload your inspection report. See what each area cost you in points, what the officer wants to see next time, " +
    "and get the paperwork and evidence pack built from your kitchen. Free to read. Paid when you build.",
  upload: {
    label: "Upload the inspection report and the officer's letter",
    formats: "PDF or photos",
    privacy: "Nothing is stored until you start a case.",
    cta: "Read my report",
  },
  whatTheOfficerScores: areas.map((a) => ({ label: a.label, body: a.covers })),
  whatYouGet: [
    "An action plan, item by item from your report, with the evidence each one needs.",
    "Your food safety management system, written for your kitchen and equipment, not a blank template.",
    "A readiness check against the officer's list before you pay the council for a re-visit.",
    "Your right to reply, your re-visit request with your council's fee and form, and an evidence pack for Deliveroo, Uber Eats and Just Eat.",
  ],
  whatThisIsAndIsNot:
    "Rescore builds the paperwork and the evidence. It does not clean, repair or train, and it cannot promise a rating. " +
    "What it can do is make sure that when the officer comes back, everything they asked for is done, recorded and provable.",
  faq: [
    {
      q: "Is reading my report really free?",
      a: "Yes. Upload it and see the items and the points. You pay only to build the pack.",
    },
    {
      q: "How long until the re-visit?",
      a:
        "Your council sets that. Where no fee is charged there is a 3 month standstill from the inspection and then up to 3 months more, " +
        "so up to 6 months in all. Where a fee is charged there is no standstill and the visit should happen within 3 months of your request or payment. " +
        "The pack is ready the same day, and the sooner you request, the sooner they come.",
    },
    {
      q: "What does the council charge?",
      a: "It depends on the council. Each authority decides whether to charge and sets its own fee. Your case shows what we know for yours.",
    },
    {
      q: "Will this keep me on Deliveroo?",
      a:
        "Platforms set their own rules and we cannot speak for them. The evidence pack gives your partner manager what they need to see improvement. " +
        "Fixing the rating is what keeps you listed.",
    },
    {
      q: "Do you fill in the allergen matrix for me?",
      a: "Only from ingredients you confirm dish by dish. We never guess an allergen.",
    },
    {
      q: "What happens to my documents?",
      a: "Used only for your case, kept for 12 months so you can keep using your food safety pack, then deleted. Export everything any time.",
    },
  ],
};

export const microcopy = {
  upload: "Read my report",
  pay: (price: number) => `Build my re-rating pack, GBP ${price}`,
  itemStates: {
    open: "Open",
    doneNeedsEvidence: "Done, needs evidence",
    evidenced: "Evidenced",
    mismatch: "Evidence doesn't show it",
  },
  readiness: {
    open: (n: number) => `${n} item${n === 1 ? "" : "s"} still open`,
    ready: "Ready to request a re-visit",
  },
  outcome: {
    newRating: "New rating",
    waiting: "Waiting for the visit",
    moreItems: "Officer found more items, upload the letter",
  },
};

export const RATING_PAGES: Rating[] = [0, 1, 2, 3, 4];

export function priceForRating(rating: Rating): number {
  if (rating <= 1) return PRICE.r01;
  if (rating === 2) return PRICE.r2;
  return PRICE.r34;
}

export interface RatingPage {
  rating: Rating;
  slug: string;
  title: string;
  description: string;
  descriptor: string;
  meansBody: string;
  movesBody: string;
  price: number;
  commonItems: string[];
}

export function ratingPage(rating: Rating): RatingPage {
  const b = band(rating);
  const target: Rating = rating <= 2 ? 3 : 5;
  const req = requirementsFor(target);
  const common = areas.flatMap((a) => itemsForArea(a.key).slice(0, 2).map((i) => i.label));

  return {
    rating,
    slug: String(rating),
    title: `Food hygiene rating ${rating}: what it means and what moves it`,
    description: `What a food hygiene rating of ${rating} means, the points behind it, and the route to a re-visit.`,
    descriptor: b.descriptor,
    meansBody:
      rating === 0
        ? "A 0 means the officer recorded a total above 50 points across the three areas. It is the scheme's 'urgent improvement necessary'. Everything on the report has to be addressed, and some of it may need doing before any paperwork matters."
        : `A ${rating} means the officer's three scores totalled ${b.totalMin === b.totalMax ? b.totalMin : `${b.totalMin} to ${b.totalMax}`} points${b.maxIndividual === null ? "" : `, with no single area above ${b.maxIndividual}`}. The scheme calls it '${b.descriptor.toLowerCase()}'.`,
    movesBody: `To reach a ${target}, the total has to come down to ${req.totalMax} or below${req.individualMax === null ? "" : ` and no single area may be above ${req.individualMax}`}. A single bad area holds the whole rating down, so the area scoring worst is the one to work on first.`,
    price: priceForRating(rating),
    commonItems: common,
  };
}

export interface FixPage {
  area: AreaKey;
  slug: string;
  title: string;
  description: string;
  body: string;
  items: string[];
}

const FIX_SLUGS: Record<AreaKey, string> = {
  hygiene: "hygiene",
  structure: "structure",
  confidence: "confidence-in-management",
};

export function fixPage(areaKey: AreaKey): FixPage {
  const a = areas.find((x) => x.key === areaKey);
  if (!a) throw new Error(`Unknown area ${areaKey}`);
  return {
    area: areaKey,
    slug: FIX_SLUGS[areaKey],
    title:
      areaKey === "confidence"
        ? "Confidence in management: why it costs the most points and how to fix it"
        : `${a.label}: what the officer scores and how to fix it`,
    description: `${a.covers} What it scores, and what moves it.`,
    body:
      areaKey === "confidence"
        ? "Management of food safety is the only area that can be scored 30, so it is the one most likely to be holding your rating down on its own. It is scored on whether there is a documented food safety management system, whether the records in it are actually being filled in, and whether staff can explain what they do. That is paperwork and training, which is the part Rescore does the most with."
        : `${a.covers} This area is moved by ${a.movedBy}.`,
    items: itemsForArea(areaKey).map((i) => i.label),
  };
}

export function platformPage(slug: string) {
  const platform = platforms.find((p) => p.slug === slug);
  if (!platform) throw new Error(`Unknown platform ${slug}`);
  return {
    slug: platform.slug,
    title: `${platform.name} and your food hygiene rating: what their policy says and what to send them`,
    description: `What ${platform.name}'s own partner policy says about food hygiene ratings, and the evidence pack to send your partner manager.`,
    platform,
  };
}

export function councilPage(slug: string) {
  const council = launchCouncils.find((c) => c.slug === slug) ?? null;
  if (!council) return null;
  return {
    slug: council.slug,
    title: `Food hygiene re-visit in ${council.name}: the fee, the form and the wait`,
    description: `How to request a food hygiene re-visit from ${council.name}, and what happens next.`,
    council,
  };
}

/** Every URL in the sitemap: 70 landing pages plus pricing, help, privacy and terms. */
export function allPaths(): string[] {
  return [
    "/",
    ...RATING_PAGES.map((r) => `/rating/${r}`),
    ...areas.map((a) => `/fix/${FIX_SLUGS[a.key]}`),
    ...platforms.map((p) => `/platform/${p.slug}`),
    ...launchCouncils.map((c) => `/council/${c.slug}`),
    "/pricing",
    "/help",
    "/privacy",
    "/terms",
  ];
}

export { FIX_SLUGS };
