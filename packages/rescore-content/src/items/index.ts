import taxonomy from "./taxonomy.json" with { type: "json" };
import type { AreaKey } from "../scoring/index.js";

export type EvidenceType =
  | "photo"
  | "photo_series"
  | "receipt"
  | "record"
  | "certificate"
  | "contract"
  | "document"
  | "none_possible";

/** How much of this item paperwork can actually prove. Used to keep the plan honest. */
export type DocumentsCanProve = "yes" | "mostly" | "partly" | "no";

export interface TaxonomyItem {
  id: string;
  area: AreaKey;
  label: string;
  /** Wording officers commonly use, so classify can match an item without inventing one. */
  officerPhrases: string[];
  typicalFix: string;
  evidence: EvidenceType[];
  legalBasis: string;
  documentsCanProve: DocumentsCanProve;
  /** Where this item can indicate a hard stop, the condition that triggers it. */
  hardStopIf?: string;
}

export interface HardStopSignal {
  id: string;
  phrases: string[];
  reason: string;
}

export const items = taxonomy.items as TaxonomyItem[];
export const hardStopSignals = taxonomy.hardStopSignals as HardStopSignal[];
export const evidenceTypes = taxonomy.evidenceTypes as Record<EvidenceType, string>;

export function itemsForArea(area: AreaKey): TaxonomyItem[] {
  return items.filter((i) => i.area === area);
}

export function itemById(id: string): TaxonomyItem | undefined {
  return items.find((i) => i.id === id);
}

/**
 * Suggests taxonomy items whose officer wording appears in a line of the report.
 *
 * This is a lookup to keep the plan consistent, never a source of items. An item only
 * reaches a case because the operator's own report contained it.
 */
export function matchItems(officerText: string): TaxonomyItem[] {
  const text = officerText.toLowerCase();
  return items.filter((item) =>
    item.officerPhrases.some((phrase) => text.includes(phrase.toLowerCase())) ||
    text.includes(item.label.toLowerCase()),
  );
}

/** Hard stops the report's own wording indicates, per spec 3.7. */
export function hardStopsIn(reportText: string): HardStopSignal[] {
  const text = reportText.toLowerCase();
  return hardStopSignals.filter((signal) =>
    signal.phrases.some((phrase) => text.includes(phrase.toLowerCase())),
  );
}

export const HARD_STOP_COPY =
  "Some of this needs to be fixed before any paperwork matters, and some of it may need a specialist. " +
  "Here is what the report says must happen first, and where to get help. " +
  "Come back when it is done; your case will be waiting.";

/** The line every item carries when paperwork alone cannot close it. */
export function workNotPaperworkNote(item: TaxonomyItem): string | null {
  if (item.documentsCanProve !== "no") return null;
  return "This one is work, not paperwork. The photo has to show the job done.";
}
