/**
 * Enriches councils.json with re-visit facts from each council's own food hygiene page.
 *
 * Run with: node dist/councils/enrich.js [--launch-only] [--limit N] [--delay MS]
 *
 * The script is deliberately cautious. It records a fee or a fee-free position only where
 * the page states it next to re-visit language. Anything less certain is left null, which
 * makes the council page fall back to "check with [council]" and the Brand Standard rules.
 * Refresh quarterly, per spec 3.4.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Council, RequestRoute } from "./types.js";

const USER_AGENT = "RescoreCouncilEnrichment/0.1 (+https://rescore.app; desk@rescore.app)";
const REVISIT_WORDS = /(re-?visit|re-?rating|re-?inspection|re-?score)/i;
const FEE_NEAR_REVISIT = /(re-?visit|re-?rating|re-?inspection)[^.]{0,180}?£\s?(\d{1,4}(?:\.\d{2})?)/i;
const FEE_BEFORE_REVISIT = /£\s?(\d{1,4}(?:\.\d{2})?)[^.]{0,180}?(re-?visit|re-?rating|re-?inspection)/i;
const FREE_NEAR_REVISIT =
  /(re-?visit|re-?rating|re-?inspection)[^.]{0,120}?\b(free of charge|no charge|free|do not charge|does not charge)\b/i;

export interface EnrichmentFinding {
  charges: boolean | null;
  feeGbp: number | null;
  requestRoute: RequestRoute | null;
  requestUrl: string | null;
  sourceUrl: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&pound;/g, "£")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reads a council page and returns only what it actually says about a re-visit. */
export function readPage(html: string, url: string): EnrichmentFinding {
  const text = stripHtml(html);
  const finding: EnrichmentFinding = {
    charges: null,
    feeGbp: null,
    requestRoute: null,
    requestUrl: null,
    sourceUrl: REVISIT_WORDS.test(text) ? url : null,
  };

  if (FREE_NEAR_REVISIT.test(text)) {
    finding.charges = false;
    return finding;
  }

  const priced = FEE_NEAR_REVISIT.exec(text) ?? FEE_BEFORE_REVISIT.exec(text);
  if (priced) {
    const amount = Number.parseFloat(priced[2] && /^\d/.test(priced[2]) ? priced[2] : (priced[1] as string));
    if (Number.isFinite(amount) && amount > 0 && amount < 2000) {
      finding.charges = true;
      finding.feeGbp = amount;
    }
  }
  return finding;
}

/** Candidate pages to read for one council, most specific first. */
export function candidateUrls(council: Council): string[] {
  const urls: string[] = [];
  if (council.schemeUrl) urls.push(council.schemeUrl);
  if (council.url) {
    const base = council.url.replace(/\/$/, "");
    urls.push(`${base}/food-hygiene-rating`, `${base}/food-hygiene-ratings`, `${base}/food-safety`);
  }
  return urls;
}

async function fetchText(url: string, timeoutMs = 15000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("html")) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function enrichCouncil(council: Council): Promise<EnrichmentFinding | null> {
  for (const url of candidateUrls(council)) {
    const html = await fetchText(url);
    if (!html) continue;
    const finding = readPage(html, url);
    if (finding.sourceUrl) return finding;
  }
  return null;
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const target = join(here, "..", "..", "src", "councils", "councils.json");
  const all = JSON.parse(await readFile(target, "utf8")) as Council[];

  const launchOnly = process.argv.includes("--launch-only");
  const limit = Number.parseInt(arg("limit") ?? "0", 10);
  const delay = Number.parseInt(arg("delay") ?? "1000", 10);

  let queue = launchOnly ? all.filter((c) => c.isLaunch) : all;
  if (limit > 0) queue = queue.slice(0, limit);

  const today = new Date().toISOString().slice(0, 10);
  let read = 0;
  let priced = 0;

  for (const council of queue) {
    const finding = await enrichCouncil(council);
    if (finding) {
      read += 1;
      if (finding.charges !== null) priced += 1;
      council.revisit = {
        ...council.revisit,
        charges: finding.charges,
        feeGbp: finding.feeGbp,
        requestRoute: finding.requestRoute,
        requestUrl: finding.requestUrl,
        sourceUrl: finding.sourceUrl,
        checkedOn: finding.charges !== null ? today : council.revisit.checkedOn,
      };
    }
    console.log(
      `${council.name}: ${finding?.charges === true ? `fee GBP ${finding.feeGbp}` : finding?.charges === false ? "no fee" : "not found, falls back to check with the council"}`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  await writeFile(target, `${JSON.stringify(all, null, 2)}\n`, "utf8");
  console.log(`Read ${read} of ${queue.length} council pages; ${priced} stated a fee position.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
