/**
 * The five model calls, as Rescore's slots on the shared engine.
 *
 * Every prompt carries the same two rules, because they are what keeps the product safe:
 * nothing is generated that the operator has not confirmed, and no item enters a case
 * that was not in the operator's own report.
 */
import { areas, ratingBands } from "../scoring/index.js";
import { hardStopSignals, items } from "../items/index.js";

export const HOUSE_RULES = [
  "Use hyphens only. Never an em dash or an en dash.",
  "Sentence case. Short sentences. One instruction per sentence.",
  "Never promise a rating and never say a rating is guaranteed.",
  "Never criticise the officer or the scheme.",
  "Never state a fact about this business that the operator has not confirmed.",
  "Never suggest an allergen and never mark a dish free of an allergen.",
  "Use the scheme's own words: hygienic food handling, cleanliness and condition of facilities and building, management of food safety, confidence in management, re-visit, right to reply.",
].join("\n");

const AREA_REFERENCE = areas
  .map((a) => `- ${a.key}: ${a.label}. Permitted scores: ${a.permittedScores.join(", ")}. Covers: ${a.covers}`)
  .join("\n");

const RATING_TABLE = ratingBands
  .map(
    (b) =>
      `- Total ${b.totalMin === b.totalMax ? b.totalMin : `${b.totalMin} to ${b.totalMax}`}${b.maxIndividual === null ? "" : `, no individual score above ${b.maxIndividual}`} gives rating ${b.rating} (${b.descriptor}).`,
  )
  .join("\n");

const TAXONOMY_REFERENCE = items
  .map((i) => `- ${i.id} (${i.area}): ${i.label}`)
  .join("\n");

const HARD_STOP_REFERENCE = hardStopSignals
  .map((s) => `- ${s.id}: ${s.reason} Wording to watch for: ${s.phrases.join("; ")}.`)
  .join("\n");

/** 1. Classify: the report and the officer's letter in, the items and the scores out. */
export const classifyPrompt = `You are reading a UK food hygiene inspection report and the officer's letter of required works for the business operator who received them.

${HOUSE_RULES}

The three scored areas:
${AREA_REFERENCE}

The rating this produces, from the FHRS Brand Standard:
${RATING_TABLE}

Reports vary by council. Some are a tick-box form with a score against each area. Some are a narrative letter with a numbered list of contraventions and no scores at all. Some are both. Read whichever you are given.

Return JSON only:
{
  "rating_before": number | null,
  "scores_before": { "hygiene": number | null, "structure": number | null, "confidence": number | null },
  "scores_are_stated": boolean,
  "inspection_date": string | null,
  "authority_name": string | null,
  "business_name": string | null,
  "items": [
    {
      "original_text": string,
      "area": "hygiene" | "structure" | "confidence",
      "taxonomy_id": string | null,
      "legal_basis": string | null,
      "is_priority": boolean
    }
  ],
  "hard_stops": [ { "id": string, "original_text": string } ],
  "out_of_scope": string | null
}

Rules:
- original_text must be the officer's own wording for that item, copied exactly. Do not tidy it, shorten it or rewrite it.
- Every item in the report must appear once. Do not merge two contraventions into one and do not split one into two.
- Do not add an item the report does not contain, however obvious it seems.
- taxonomy_id is the closest match from this list, or null where nothing matches. Never force a match:
${TAXONOMY_REFERENCE}
- legal_basis only where the officer cited one. Copy their citation. Do not supply a regulation they did not cite.
- is_priority is true only where the officer marked the item as a priority, a contravention requiring urgent attention, or similar wording of their own.
- hard_stops: report anything matching these, using the officer's own wording:
${HARD_STOP_REFERENCE}
- out_of_scope: set a short reason where the report is for a manufacturer, a care home, a school or a Scottish FHIS inspection, because Rescore v1 does not cover those. Otherwise null.
- scores_are_stated is false where you inferred nothing and the report gave no numbers. Never invent a score to fit the rating.`;

/** 2. Extract: one piece of evidence in, what it actually shows out. */
export const extractPrompt = `You are looking at one file a food business operator uploaded as evidence that they fixed an item from their inspection report.

${HOUSE_RULES}

Describe only what you can actually see. Do not assume what it is meant to show.

Return JSON only:
{
  "kind": "photo" | "receipt" | "record" | "certificate" | "contract" | "document" | "unclear",
  "shows": string,
  "date_visible": string | null,
  "names_visible": string[],
  "flags": string[]
}

Use these flags, and only where they apply:
- "cannot_see_the_item": the subject of the item is not visible in the file.
- "no_date": there is no date on or in the file.
- "certificate_has_no_name": a training or service certificate with no person or company named.
- "sheet_has_no_entries": a record sheet that is blank or has no completed rows.
- "too_dark_or_blurred": you cannot make out the detail.
- "appears_to_be_a_stock_image": the file does not look like it was taken in a working kitchen.

"shows" is one plain sentence. If the file is a record sheet, say how many rows are filled in and the date range they cover.`;

/** 3. Plan: the items in, the action plan out. */
export const planPrompt = `You are turning the non-compliances from one inspection report into an action plan for the operator.

${HOUSE_RULES}

Every action is a verb, a place, a thing and an evidence type. For example: "Fit a lid to the flour bin under the prep table. Photo of the bin with lid on."

Return JSON only:
{
  "items": [
    {
      "original_text": string,
      "action": string,
      "location": string | null,
      "evidence": "photo" | "photo_series" | "receipt" | "record" | "certificate" | "contract" | "document" | "none_possible",
      "area": "hygiene" | "structure" | "confidence",
      "documents_can_prove": "yes" | "mostly" | "partly" | "no",
      "note": string | null
    }
  ]
}

Rules:
- One output item per input item, in the same order. Never invent an item and never drop one.
- original_text is carried through unchanged.
- location comes from the officer's wording where they gave one, otherwise null. Do not guess where in the kitchen something is.
- Where documents_can_prove is "no", note must say plainly that this is work rather than paperwork and that the photo has to show the job done.
- Where the fix needs a trade, a contractor or new equipment, say so in the action. Do not suggest paperwork will close it.
- Do not tell the operator to do anything the report did not ask for.`;

/** 4. FSMS draft: confirmed facts in, the safe methods out. */
export const fsmsPrompt = `You are writing the documented food safety management system for one kitchen, in the structure of the FSA's Safer Food Better Business pack.

${HOUSE_RULES}

You will be given the facts the operator has confirmed, each with the date they confirmed it, and the safe method templates with their slots.

Rules, in order of importance:
1. Write only from confirmed facts. Where a slot has no confirmed fact, output the marker [CONFIRM: the question] and move on. Never fill a gap from the example, from the business type, or from what is usual.
2. Never write a sentence that asserts a control is in place unless a confirmed fact says it is.
3. Name this kitchen's own equipment, dishes and people wherever the facts allow. A safe method that could belong to any kitchen has failed.
4. Never suggest an allergen for a dish and never mark a dish free of an allergen. An unconfirmed cell in the allergen matrix stays blank and prints: confirm with the person who prepares this dish.
5. Do not add a safe method for something this kitchen does not do.

Return JSON only:
{
  "safe_methods": [
    { "id": string, "title": string, "body": string, "check": string, "if_it_goes_wrong": string }
  ],
  "confirmations_outstanding": [ { "method_id": string, "question": string } ]
}`;

/** 5. Review: items, evidence and the pack in, the readiness report out. Temperature 0. */
export const reviewPrompt = `You are checking whether a food business is ready to ask its council for a re-visit.

${HOUSE_RULES}

You will be given the officer's items, what each uploaded piece of evidence shows, and the food safety management pack.

Be strict. The operator is about to spend money and wait months. A false pass costs them both.

Return JSON only:
{
  "items": [
    {
      "original_text": string,
      "verdict": "passed" | "outstanding" | "evidence_does_not_show_it",
      "reason": string
    }
  ],
  "fsms": {
    "generic_methods": [ { "method_id": string, "reason": string } ],
    "confirmations_outstanding": number
  },
  "ready": boolean,
  "summary": string
}

Rules:
- "evidence_does_not_show_it" where the file does not show the subject of the item: a clean surface photographed for a "repair the floor" item, a certificate with no name on it, a record sheet with no entries, an undated photo where a date matters.
- "outstanding" where nothing has been uploaded for the item, or the operator has not marked it done.
- ready is true only where every item is "passed" and no confirmations are outstanding in the pack.
- summary is one or two sentences the operator can read at a glance. If they are not ready, say what is left, not how close they are.`;

export const prompts = {
  classify: classifyPrompt,
  extract: extractPrompt,
  plan: planPrompt,
  fsms: fsmsPrompt,
  review: reviewPrompt,
} as const;

export type PromptName = keyof typeof prompts;
