/** What Rescore knows about one local authority that runs the FHRS. */
export interface Council {
  /** The FSA's LocalAuthorityId. Stable, and what the Establishments endpoint takes. */
  id: number;
  /** The FSA's LocalAuthorityIdCode, which appears in the open data file names. */
  code: string;
  name: string;
  /** Our own URL slug, from the FSA's FriendlyName where there is one. */
  slug: string;
  region: string;
  /** The authority's own website. */
  url: string | null;
  /** The authority's food hygiene page, where the FSA records one. */
  schemeUrl: string | null;
  email: string | null;
  establishmentCount: number;
  lastPublishedDate: string | null;
  /** True for the 59 councils whose landing pages ship at launch. */
  isLaunch: boolean;
  revisit: CouncilRevisit;
}

/**
 * The re-visit facts for one authority.
 *
 * Every field starts unknown. Nothing here is guessed: an unenriched council shows
 * "check with [council]" and the Brand Standard's general rules instead.
 */
export interface CouncilRevisit {
  /** True where a fee is charged, false where re-visits are free, null where we do not know. */
  charges: boolean | null;
  /** The fee in pounds, where the council publishes one. */
  feeGbp: number | null;
  /** "form" | "email" | "post" | "phone", where the council publishes one. */
  requestRoute: RequestRoute | null;
  /** The page or form the operator sends the request to. */
  requestUrl: string | null;
  /** The wait the council itself states, in the council's own words. */
  statedWait: string | null;
  /** Where the council says to send a right to reply. */
  rightToReplyUrl: string | null;
  /** The page these facts were read from. */
  sourceUrl: string | null;
  /** ISO date the facts were last checked. Null means never enriched. */
  checkedOn: string | null;
}

export type RequestRoute = "form" | "email" | "post" | "phone";
