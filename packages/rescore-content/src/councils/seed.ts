/**
 * Seeds councils.json from the FSA Authorities endpoint.
 *
 * Run with: npm run seed --workspace @rescore/content
 *
 * Only the identity and contact fields come from the FSA. Every re-visit field is left
 * unknown for the enrichment script to fill from the council's own page, because the FSA
 * does not publish re-visit fees and Rescore never guesses one.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Council } from "./types.js";

const FSA_API = "https://api.ratings.food.gov.uk";
/** SchemeType 1 is FHRS (England, Wales, Northern Ireland). 2 is Scotland's FHIS. */
const FHRS_SCHEME_TYPE = 1;
/** 33 London authorities plus the 26 next largest by establishment count. */
const LAUNCH_COUNCIL_COUNT = 59;

interface FsaAuthority {
  LocalAuthorityId: number;
  LocalAuthorityIdCode: string;
  Name: string;
  FriendlyName: string | null;
  Url: string | null;
  SchemeUrl: string | null;
  Email: string | null;
  RegionName: string | null;
  EstablishmentCount: number;
  LastPublishedDate: string | null;
  SchemeType: number;
}

export function slugify(name: string, friendlyName: string | null): string {
  const base = friendlyName && friendlyName.trim() ? friendlyName : name;
  return base
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyRevisit() {
  return {
    charges: null,
    feeGbp: null,
    requestRoute: null,
    requestUrl: null,
    statedWait: null,
    rightToReplyUrl: null,
    sourceUrl: null,
    checkedOn: null,
  };
}

/** The 59 launch councils: every London authority, then the largest elsewhere. */
export function pickLaunchCouncils(authorities: FsaAuthority[]): Set<number> {
  const london = authorities.filter((a) => a.RegionName === "London");
  const rest = authorities
    .filter((a) => a.RegionName !== "London")
    .sort((a, b) => b.EstablishmentCount - a.EstablishmentCount)
    .slice(0, Math.max(0, LAUNCH_COUNCIL_COUNT - london.length));
  return new Set([...london, ...rest].map((a) => a.LocalAuthorityId));
}

export async function fetchAuthorities(): Promise<FsaAuthority[]> {
  const response = await fetch(`${FSA_API}/Authorities?pageSize=1000&pageNumber=1`, {
    headers: { "x-api-version": "2", Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`FSA Authorities returned ${response.status}`);
  }
  const body = (await response.json()) as { authorities: FsaAuthority[] };
  return body.authorities;
}

export function toCouncils(authorities: FsaAuthority[]): Council[] {
  const fhrs = authorities.filter((a) => a.SchemeType === FHRS_SCHEME_TYPE);
  const launch = pickLaunchCouncils(fhrs);
  const slugs = new Set<string>();

  return fhrs
    .map((a) => {
      let slug = slugify(a.Name, a.FriendlyName);
      while (slugs.has(slug)) slug = `${slug}-${a.LocalAuthorityIdCode}`;
      slugs.add(slug);
      return {
        id: a.LocalAuthorityId,
        code: a.LocalAuthorityIdCode,
        name: a.Name,
        slug,
        region: a.RegionName ?? "",
        url: a.Url || null,
        schemeUrl: a.SchemeUrl || null,
        email: a.Email || null,
        establishmentCount: a.EstablishmentCount,
        lastPublishedDate: a.LastPublishedDate,
        isLaunch: launch.has(a.LocalAuthorityId),
        revisit: emptyRevisit(),
      } satisfies Council;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function main(): Promise<void> {
  const authorities = await fetchAuthorities();
  const councils = toCouncils(authorities);
  const here = dirname(fileURLToPath(import.meta.url));
  // Write back to source, not to dist, because councils.json is committed data.
  const target = join(here, "..", "..", "src", "councils", "councils.json");
  await writeFile(target, `${JSON.stringify(councils, null, 2)}\n`, "utf8");
  const launchCount = councils.filter((c) => c.isLaunch).length;
  console.log(`Wrote ${councils.length} FHRS councils, ${launchCount} of them launch councils, to ${target}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
