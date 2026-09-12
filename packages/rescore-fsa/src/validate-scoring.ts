/**
 * Checks the scoring model in @rescore/content against real published ratings.
 *
 * The FSA publishes the three element scores alongside the rating the officer gave, so
 * every establishment with scores is a test case for the Brand Standard mapping. Run this
 * after any change to thresholds.json.
 *
 * node dist/validate-scoring.js --authority 112 --authority 99
 */
import { pathToFileURL } from "node:url";
import { ratingFor, type AreaScores } from "@rescore/content/scoring";
import { FsaClient } from "./client.js";

export interface Mismatch {
  fhrsid: number;
  name: string;
  authority: string;
  scores: AreaScores;
  published: number;
  calculated: number;
}

export interface ValidationResult {
  checked: number;
  skippedNoScores: number;
  skippedUnrated: number;
  mismatches: Mismatch[];
  rejected: Array<{ fhrsid: number; reason: string }>;
}

export async function validateAuthority(
  client: FsaClient,
  authorityId: number,
  ratingKeys: readonly string[],
  into: ValidationResult,
): Promise<void> {
  for (const ratingKey of ratingKeys) {
    const establishments = await client.allEstablishments(authorityId, ratingKey);
    for (const e of establishments) {
      const published = Number.parseInt(e.RatingValue, 10);
      if (!Number.isFinite(published)) {
        into.skippedUnrated += 1;
        continue;
      }
      const s = e.scores;
      if (!s || s.Hygiene === null || s.Structural === null || s.ConfidenceInManagement === null) {
        into.skippedNoScores += 1;
        continue;
      }
      const scores: AreaScores = {
        hygiene: s.Hygiene,
        structure: s.Structural,
        confidence: s.ConfidenceInManagement,
      };
      try {
        const calculated = ratingFor(scores).rating;
        into.checked += 1;
        if (calculated !== published) {
          into.mismatches.push({
            fhrsid: e.FHRSID,
            name: e.BusinessName,
            authority: e.LocalAuthorityName,
            scores,
            published,
            calculated,
          });
        }
      } catch (error) {
        // A score the Brand Standard does not permit. Worth seeing, not a model failure.
        into.rejected.push({ fhrsid: e.FHRSID, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }
}

async function main(): Promise<void> {
  const ids = process.argv
    .map((value, index) => (value === "--authority" ? process.argv[index + 1] : null))
    .filter((v): v is string => Boolean(v))
    .map((v) => Number.parseInt(v, 10))
    .filter(Number.isFinite);

  const client = new FsaClient();
  const authorityIds = ids.length > 0 ? ids : (await client.fhrsAuthorities()).slice(0, 3).map((a) => a.LocalAuthorityId);
  const ratingKeys = ["0", "1", "2", "3", "4", "5"] as const;

  const result: ValidationResult = { checked: 0, skippedNoScores: 0, skippedUnrated: 0, mismatches: [], rejected: [] };
  for (const authorityId of authorityIds) {
    await validateAuthority(client, authorityId, ratingKeys, result);
    console.log(`Authority ${authorityId}: ${result.checked} checked so far, ${result.mismatches.length} mismatches.`);
  }

  console.log(
    `\nChecked ${result.checked} published ratings. ${result.mismatches.length} mismatches, ` +
      `${result.rejected.length} with scores the Brand Standard does not permit, ` +
      `${result.skippedNoScores} with no scores published, ${result.skippedUnrated} not yet rated.`,
  );

  for (const m of result.mismatches.slice(0, 20)) {
    console.log(
      `MISMATCH ${m.fhrsid} ${m.name} (${m.authority}): H ${m.scores.hygiene} S ${m.scores.structure} CiM ${m.scores.confidence} published ${m.published}, calculated ${m.calculated}`,
    );
  }
  for (const r of result.rejected.slice(0, 10)) {
    console.log(`REJECTED ${r.fhrsid}: ${r.reason}`);
  }

  process.exit(result.mismatches.length === 0 ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
