/**
 * A typed client for the Food Standards Agency ratings API.
 *
 * https://api.ratings.food.gov.uk - open data under the Open Government Licence v3.0.
 * Every page that shows data from here carries the attribution line in @rescore/content.
 */

export const FSA_API = "https://api.ratings.food.gov.uk";

/** SchemeType 1 is FHRS (England, Wales, Northern Ireland). 2 is Scotland's FHIS. */
export const SCHEME_FHRS = 1;
export const SCHEME_FHIS = 2;

export interface FsaScores {
  Hygiene: number | null;
  Structural: number | null;
  ConfidenceInManagement: number | null;
}

export interface FsaEstablishment {
  FHRSID: number;
  BusinessName: string;
  BusinessType: string;
  BusinessTypeID: number;
  AddressLine1: string | null;
  AddressLine2: string | null;
  AddressLine3: string | null;
  AddressLine4: string | null;
  PostCode: string | null;
  RatingValue: string;
  RatingKey: string;
  RatingDate: string | null;
  LocalAuthorityCode: string;
  LocalAuthorityName: string;
  NewRatingPending: boolean;
  RightToReply: string | null;
  scores: FsaScores | null;
}

export interface FsaAuthorityBasic {
  LocalAuthorityId: number;
  LocalAuthorityIdCode: string;
  Name: string;
  EstablishmentCount: number;
  SchemeType: number;
}

export interface FsaPageMeta {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
}

export interface ClientOptions {
  /** Requests per second. The FSA asks for reasonable use; a few a second is reasonable. */
  requestsPerSecond?: number;
  timeoutMs?: number;
  /** Retries on a network error or a 5xx. */
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULTS = { requestsPerSecond: 3, timeoutMs: 30000, maxRetries: 3 } as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class FsaClient {
  private readonly minimumGapMs: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private lastRequestAt = 0;

  constructor(options: ClientOptions = {}) {
    const rate = options.requestsPerSecond ?? DEFAULTS.requestsPerSecond;
    this.minimumGapMs = Math.ceil(1000 / Math.max(1, rate));
    this.timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
    this.maxRetries = options.maxRetries ?? DEFAULTS.maxRetries;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** Keeps requests to the configured rate, whatever calls in. */
  private async throttle(): Promise<void> {
    const wait = this.lastRequestAt + this.minimumGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();
  }

  private async get<T>(path: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      await this.throttle();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(`${FSA_API}${path}`, {
          headers: { "x-api-version": "2", Accept: "application/json" },
          signal: controller.signal,
        });
        if (response.status >= 500 || response.status === 429) {
          lastError = new Error(`FSA ${path} returned ${response.status}`);
        } else if (!response.ok) {
          throw new Error(`FSA ${path} returned ${response.status}`);
        } else {
          return (await response.json()) as T;
        }
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
      // Back off: 1s, 2s, 4s.
      if (attempt < this.maxRetries) await sleep(1000 * 2 ** attempt);
    }
    throw lastError instanceof Error ? lastError : new Error(`FSA ${path} failed`);
  }

  async authorities(): Promise<FsaAuthorityBasic[]> {
    const body = await this.get<{ authorities: FsaAuthorityBasic[] }>("/Authorities/basic");
    return body.authorities;
  }

  /** The FHRS authorities only. Scotland runs the pass/fail FHIS scheme, which v1 does not cover. */
  async fhrsAuthorities(): Promise<FsaAuthorityBasic[]> {
    const all = await this.authorities();
    return all.filter((a) => a.SchemeType === SCHEME_FHRS);
  }

  async businessTypes(): Promise<Array<{ BusinessTypeId: number; BusinessTypeName: string }>> {
    const body = await this.get<{ businessTypes: Array<{ BusinessTypeId: number; BusinessTypeName: string }> }>(
      "/BusinessTypes/basic",
    );
    return body.businessTypes;
  }

  /** One page of establishments for an authority at one rating. */
  async establishments(input: {
    localAuthorityId: number;
    ratingKey: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ establishments: FsaEstablishment[]; meta: FsaPageMeta }> {
    const params = new URLSearchParams({
      localAuthorityId: String(input.localAuthorityId),
      ratingKey: input.ratingKey,
      schemeTypeKey: "FHRS",
      pageSize: String(input.pageSize ?? 5000),
      pageNumber: String(input.pageNumber ?? 1),
    });
    return this.get<{ establishments: FsaEstablishment[]; meta: FsaPageMeta }>(
      `/Establishments?${params.toString()}`,
    );
  }

  /** Every establishment for an authority at one rating, following the paging. */
  async allEstablishments(localAuthorityId: number, ratingKey: string): Promise<FsaEstablishment[]> {
    const out: FsaEstablishment[] = [];
    let pageNumber = 1;
    for (;;) {
      const page = await this.establishments({ localAuthorityId, ratingKey, pageNumber });
      out.push(...page.establishments);
      const totalPages = Number(page.meta?.totalPages ?? 1);
      if (pageNumber >= totalPages || page.establishments.length === 0) break;
      pageNumber += 1;
    }
    return out;
  }
}

export function fullAddress(establishment: FsaEstablishment): string {
  return [
    establishment.AddressLine1,
    establishment.AddressLine2,
    establishment.AddressLine3,
    establishment.AddressLine4,
    establishment.PostCode,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim())
    .join(", ");
}
