/**
 * The daily low-rating watcher, per spec 4.6.
 *
 * For every FHRS authority, fetch the establishments rated 0, 1 and 2, upsert them into the
 * leads store keyed on FHRS ID, and mark a lead new where its rating date has changed. New
 * leads post to #rescore-leads in Slack. In production this runs as a Netlify scheduled
 * function so it is versioned; the n8n workflow in /workflows is the manual override.
 */
import { FsaClient, fullAddress, type FsaEstablishment } from "./client.js";

export const LOW_RATING_KEYS = ["0", "1", "2"] as const;
export const GET_TO_FIVE_KEYS = ["3", "4"] as const;

export type LeadStatus = "new" | "posted" | "visited" | "converted" | "declined";

export interface Lead {
  fhrsid: number;
  name: string;
  type: string;
  address: string;
  postcode: string | null;
  authorityId: number;
  authorityName: string;
  rating: string;
  ratingDate: string | null;
  scores: { hygiene: number | null; structure: number | null; confidence: number | null } | null;
  newRatingPending: boolean;
  rightToReply: string | null;
  fsaUrl: string;
  firstSeen: string;
  status: LeadStatus;
  caseId: string | null;
}

/** The leads table, behind an interface so the watcher runs against Supabase or memory. */
export interface LeadStore {
  get(fhrsid: number): Promise<Lead | null>;
  upsert(lead: Lead): Promise<void>;
}

export class InMemoryLeadStore implements LeadStore {
  private readonly rows = new Map<number, Lead>();

  async get(fhrsid: number): Promise<Lead | null> {
    return this.rows.get(fhrsid) ?? null;
  }

  async upsert(lead: Lead): Promise<void> {
    this.rows.set(lead.fhrsid, lead);
  }

  all(): Lead[] {
    return [...this.rows.values()];
  }
}

export function toLead(establishment: FsaEstablishment, authorityId: number, seenAt: string): Lead {
  return {
    fhrsid: establishment.FHRSID,
    name: establishment.BusinessName,
    type: establishment.BusinessType,
    address: fullAddress(establishment),
    postcode: establishment.PostCode?.trim() || null,
    authorityId,
    authorityName: establishment.LocalAuthorityName,
    rating: establishment.RatingValue,
    ratingDate: establishment.RatingDate ? establishment.RatingDate.slice(0, 10) : null,
    scores: establishment.scores
      ? {
          hygiene: establishment.scores.Hygiene,
          structure: establishment.scores.Structural,
          confidence: establishment.scores.ConfidenceInManagement,
        }
      : null,
    newRatingPending: Boolean(establishment.NewRatingPending),
    rightToReply: establishment.RightToReply?.trim() || null,
    fsaUrl: `https://ratings.food.gov.uk/business/${establishment.FHRSID}`,
    firstSeen: seenAt,
    status: "new",
    caseId: null,
  };
}

/**
 * True where this is a lead we have not acted on at this rating date.
 *
 * A business that was already in the table at the same rating date is not new, however many
 * times the watcher runs. A new inspection gives a new rating date, which makes it new again.
 */
export function isNewLead(existing: Lead | null, incoming: Lead): boolean {
  if (!existing) return true;
  return existing.ratingDate !== incoming.ratingDate;
}

export interface WatchResult {
  authoritiesScanned: number;
  establishmentsSeen: number;
  newLeads: Lead[];
  errors: Array<{ authorityId: number; ratingKey: string; message: string }>;
}

export interface WatchOptions {
  client?: FsaClient;
  store: LeadStore;
  /** Restrict to these authority ids. Omit for every FHRS authority. */
  authorityIds?: number[];
  ratingKeys?: readonly string[];
  now?: () => Date;
  onNewLead?: (lead: Lead) => void;
}

export async function runWatch(options: WatchOptions): Promise<WatchResult> {
  const client = options.client ?? new FsaClient();
  const now = options.now ?? (() => new Date());
  const ratingKeys = options.ratingKeys ?? LOW_RATING_KEYS;

  const authorities = options.authorityIds
    ? options.authorityIds.map((id) => ({ LocalAuthorityId: id }))
    : (await client.fhrsAuthorities()).map((a) => ({ LocalAuthorityId: a.LocalAuthorityId }));

  const result: WatchResult = {
    authoritiesScanned: 0,
    establishmentsSeen: 0,
    newLeads: [],
    errors: [],
  };

  for (const authority of authorities) {
    result.authoritiesScanned += 1;
    for (const ratingKey of ratingKeys) {
      try {
        const establishments = await client.allEstablishments(authority.LocalAuthorityId, ratingKey);
        result.establishmentsSeen += establishments.length;
        for (const establishment of establishments) {
          const seenAt = now().toISOString();
          const incoming = toLead(establishment, authority.LocalAuthorityId, seenAt);
          const existing = await options.store.get(incoming.fhrsid);
          if (isNewLead(existing, incoming)) {
            // Keep the date we first saw this business, and keep its outreach status.
            const lead: Lead = existing
              ? { ...incoming, firstSeen: existing.firstSeen, status: "new", caseId: existing.caseId }
              : incoming;
            await options.store.upsert(lead);
            result.newLeads.push(lead);
            options.onNewLead?.(lead);
          } else if (existing) {
            await options.store.upsert({ ...existing, ...incoming, firstSeen: existing.firstSeen, status: existing.status, caseId: existing.caseId });
          }
        }
      } catch (error) {
        result.errors.push({
          authorityId: authority.LocalAuthorityId,
          ratingKey,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return result;
}

/** One Slack line per lead, in the same shape as the n8n workflow posts. */
export function slackMessage(lead: Lead): string {
  const scores = lead.scores
    ? ` | H ${lead.scores.hygiene ?? "?"} / S ${lead.scores.structure ?? "?"} / CiM ${lead.scores.confidence ?? "?"}`
    : "";
  const pending = lead.newRatingPending ? " | re-rating pending" : "";
  return [
    `*${lead.rating}* | ${lead.name} (${lead.type})`,
    lead.address,
    `${lead.authorityName} | inspected ${lead.ratingDate ?? "date not published"}${scores}${pending}`,
    lead.fsaUrl,
  ].join("\n");
}

export async function postToSlack(webhookUrl: string, lead: Lead, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const response = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: slackMessage(lead) }),
  });
  return response.ok;
}
