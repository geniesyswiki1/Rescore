import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type AreaKey, areas } from "@rescore/content/scoring";
import { FIX_SLUGS, fixPage } from "@rescore/content/landing";
import { Attribution } from "@/components/Attribution";

const BY_SLUG = Object.fromEntries(
  Object.entries(FIX_SLUGS).map(([key, slug]) => [slug, key as AreaKey]),
) as Record<string, AreaKey>;

export function generateStaticParams() {
  return areas.map((area) => ({ area: FIX_SLUGS[area.key] }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const key = BY_SLUG[area];
  if (!key) return {};
  const page = fixPage(key);
  return { title: page.title, description: page.description };
}

export default async function FixLandingPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const key = BY_SLUG[area];
  if (!key) notFound();
  const page = fixPage(key);
  const definition = areas.find((a) => a.key === key);

  return (
    <>
      <h1>{page.title}</h1>
      <p style={{ maxWidth: "62ch" }}>{page.body}</p>

      <h2>What the officer scores here</h2>
      <p>
        This area can be scored {definition?.permittedScores.join(", ")}. Lower is better, and a single area
        above the cap for a rating pulls the whole rating down to where it fits.
      </p>

      <h2>The items that come up</h2>
      <ul>
        {page.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p>
        <Link className="button" href="/">
          Read my report
        </Link>
      </p>

      <Attribution />
    </>
  );
}
