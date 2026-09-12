import data from "./platforms.json" with { type: "json" };

export type PlatformSlug = "deliveroo" | "uber-eats" | "just-eat";

export interface Platform {
  slug: PlatformSlug;
  name: string;
  policyName: string | null;
  sourceUrl: string | null;
  /** Only "first_party" is ever stated as the platform's position. */
  sourceType: "first_party" | "secondary";
  verified: boolean;
  checkedOn: string;
  minimumRating: number | null;
  statedPosition: string;
  belowMinimum: string;
  partnerContact: string;
  whatToSend: string;
  needsFirstPartyCheck?: boolean;
}

export const platforms = data.platforms as Platform[];

export function platformBySlug(slug: string): Platform | undefined {
  return platforms.find((p) => p.slug === slug);
}

/** The line the platform page and the evidence pack both carry. */
export const platformDisclaimer =
  "Platforms set their own rules and we cannot speak for them. Fixing the rating is what keeps you listed.";

/** What the page may say about a platform, given how well sourced it is. */
export function platformClaim(platform: Platform): string {
  if (platform.verified && platform.minimumRating !== null) {
    return `${platform.name}'s own ${platform.policyName ?? "partner policy"}, read on ${platform.checkedOn}, requires a rating of at least ${platform.minimumRating}.`;
  }
  return `We could not confirm ${platform.name}'s minimum rating from their own partner policy on ${platform.checkedOn}. Ask your partner manager what applies to your listing.`;
}
